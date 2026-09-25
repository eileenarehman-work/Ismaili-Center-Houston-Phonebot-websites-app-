import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Radio, 
  FileText, 
  Grid3X3, 
  Sparkles, 
  Check, 
  RotateCcw,
  Clock,
  ShieldCheck,
  Bot,
  UserCheck,
  ExternalLink,
  HelpCircle,
  MapPin,
  Layers,
  Activity,
  Calendar,
  MessageSquare,
  PhoneForwarded,
  Sliders
} from 'lucide-react';
import { telecomAudio } from '../utils/telecomAudio.ts';
import { formatCentralTimestamp } from '../utils/time.ts';
import { 
  getSmartAssistantResponse, 
  cleanSpokenPhoneText, 
  detectPhonebotIntent 
} from '../utils/smartAssistant.ts';
import { 
  getGoogleUKEnglishMaleVoice,
  getGoogleUSEnglishFemaleVoice,
  getSelectedVoice,
  humanizeSpokenText 
} from '../utils/naturalVoice.ts';
import { 
  getCallerMessages, 
  getTourReservations, 
  getPhonebotMetrics, 
  incrementMetric 
} from '../utils/phonebotStorage.ts';
import { 
  TelephonyPipelineTelemetry, 
  CallerMessage, 
  TourReservation, 
  PhonebotCallMetrics,
  CallTranscriptTurn 
} from '../types.ts';
import { saveAnonymousCall } from '../utils/callLogStorage.ts';
import { PhonebotPipelineInspector } from './PhonebotPipelineInspector.tsx';
import { TourBookingModal, TakeMessageModal, WarmTransferModal } from './PhonebotTaskModals.tsx';
import { logLifespanEvent } from '../utils/userHistoryStorage.ts';
import { useScrollReveal } from '../hooks/useScrollReveal.ts';

interface KeypadItem {
  digit: string;
  sub: string;
  label: string;
  handler: () => void;
}

interface VoiceHotlineViewProps {
  isAdmin?: boolean;
}

export const VoiceHotlineView: React.FC<VoiceHotlineViewProps> = ({ isAdmin = false }) => {
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'on_hold' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Hotline Ready • Click Call Hotline to Connect');
  const [operatorSpeaking, setOperatorSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string; intent?: string }>>([]);
  const [userInterimSpeech, setUserInterimSpeech] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Voice Customization (UK Male / US Female / System) & Accessible Speech Speed
  const [selectedVoiceType, setSelectedVoiceType] = useState<'uk-male' | 'us-female' | 'system'>('uk-male');
  const [speechRate, setSpeechRate] = useState<number>(0.92); // 0.92 rate: relaxed, crystal-clear for immigrants & seniors
  const [mobileLayoutMode, setMobileLayoutMode] = useState<'side-by-side' | 'stacked'>('stacked');

  // Activate scroll-triggered reveal animations
  useScrollReveal();

  // Pipeline & Telemetry State
  const [telemetry, setTelemetry] = useState<TelephonyPipelineTelemetry>({
    sttEngine: 'Web Speech API / Deepgram Nova-2',
    sttLatencyMs: 95,
    llmEngine: 'Gemini 2.5 Flash / ICH RAG Engine',
    llmLatencyMs: 240,
    ttsEngine: 'Web Speech Synthesis (UK Male)',
    ttsLatencyMs: 110,
    telephonyCodec: 'G.711u / Opus SIP (Simulated)',
    roundtripLatencyMs: 495,
    currentIntent: 'Standby',
  });

  // Task & Reception State
  const [messages, setMessages] = useState<CallerMessage[]>(() => getCallerMessages());
  const [reservations, setReservations] = useState<TourReservation[]>(() => getTourReservations());
  const [metrics, setMetrics] = useState<PhonebotCallMetrics>(() => getPhonebotMetrics());

  // Modals
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const callActiveRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const operatorSpeakingRef = useRef<boolean>(false);
  const speakingCooldownUntilRef = useRef<number>(0);
  const lastBotSpeechTextRef = useRef<string>('');
  const lastBotSpeechTimeRef = useRef<number>(0);

  // Live Audit Tracking for Real Anonymous Calls
  const startTimeRef = useRef<string>('');
  const detectedTopicsRef = useRef<Set<string>>(new Set());
  const liveTranscriptRef = useRef<Array<{ speaker: string; text: string; time: string; intent?: string }>>([]);
  const callSavedRef = useRef<boolean>(false);

  const refreshStorageData = () => {
    setMessages(getCallerMessages());
    setReservations(getTourReservations());
    setMetrics(getPhonebotMetrics());
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollTop = transcriptBottomRef.current.scrollHeight;
    }
  }, [transcript]);

  // Warm up speech synthesis voices on load
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const syncVoice = () => {
        getGoogleUKEnglishMaleVoice();
        getGoogleUSEnglishFemaleVoice();
      };
      syncVoice();
      window.speechSynthesis.onvoiceschanged = syncVoice;
    }
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      callActiveRef.current = false;
      operatorSpeakingRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      telecomAudio.stopAll();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const addTranscriptEntry = (speaker: string, text: string, intent?: string) => {
    const time = formatCentralTimestamp();
    const entry = { speaker, text, time, intent };
    liveTranscriptRef.current.push(entry);
    if (intent) {
      detectedTopicsRef.current.add(intent);
    }
    setTranscript((prev) => [...prev, entry]);
  };

  // Direct Verbatim Call Transcript Persister for Executive Audit
  const persistCallAudit = (outcome: 'completed' | 'escalated_to_staff', outcomeLabel: string) => {
    if (callSavedRef.current) return;
    callSavedRef.current = true;

    const turns: CallTranscriptTurn[] = liveTranscriptRef.current.map((t, idx) => ({
      id: `turn-${idx + 1}`,
      speaker: (t.speaker.includes('You') || t.speaker.includes('Caller')) 
        ? 'Anonymous Caller' 
        : (t.speaker.includes('Phonebot') ? 'AI Phonebot' : 'System'),
      text: t.text,
      timestamp: t.time,
      intent: t.intent,
    }));

    if (turns.length > 0) {
      saveAnonymousCall({
        startTime: startTimeRef.current || formatCentralTimestamp(),
        endTime: formatCentralTimestamp(),
        durationSeconds: callSeconds,
        formattedDuration: formatTimer(callSeconds),
        outcome,
        outcomeLabel,
        turnsCount: turns.length,
        finalIntent: telemetry.currentIntent || 'General Inquiry',
        topicsDetected: Array.from(detectedTopicsRef.current),
        transcript: turns,
        telemetry: {
          roundtripLatencyMs: telemetry.roundtripLatencyMs,
          sttEngine: telemetry.sttEngine,
          llmEngine: telemetry.llmEngine,
          ttsEngine: telemetry.ttsEngine,
          telephonyCodec: telemetry.telephonyCodec,
        },
      });
      refreshStorageData();
    }
  };

  // Safe Speech Recognition control for talking to the AI phonebot
  const startListening = () => {
    // CRITICAL ANTI-LOOPBACK: Never start listening while the bot is speaking or during echo cooldown or on hold
    if (!callActiveRef.current || callState === 'on_hold' || operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current || !isMicActive) {
      return;
    }
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatusText('Line Active • Voice recognition not supported in this browser');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      const recog = new SpeechRec();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onstart = () => {
        if (!callActiveRef.current || operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current) {
          try { recog.abort(); } catch (e) {}
          return;
        }
        setIsListening(true);
        setStatusText('Line Active • Listening... Speak now');
      };

      recog.onresult = (event: any) => {
        if (!callActiveRef.current || operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current) {
          setUserInterimSpeech('');
          return;
        }

        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (interim) {
          setUserInterimSpeech(interim);
        }
        if (final.trim()) {
          setUserInterimSpeech('');
          setIsListening(false);
          const userSaid = final.trim();
          handleUserVoiceInput(userSaid);
        }
      };

      recog.onerror = () => {
        setIsListening(false);
        setUserInterimSpeech('');
        if (callActiveRef.current && !operatorSpeakingRef.current && callState !== 'on_hold') {
          setStatusText('Line Active • Tap "Talk to Phonebot" or speak anytime');
        }
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
      recog.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setUserInterimSpeech('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
  };

  // Speaks text using natural speech synthesis with warm conversational phonebot tone
  const speakText = (text: string, onDone?: () => void) => {
    if (!callActiveRef.current || callState === 'on_hold') return;

    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    // Cancel any previous speech and pause mic during phonebot speaking
    window.speechSynthesis.cancel();
    stopListening();

    operatorSpeakingRef.current = true;
    speakingCooldownUntilRef.current = Date.now() + 99999999; // firmly locked while speaking
    setOperatorSpeaking(true);

    lastBotSpeechTextRef.current = text;
    lastBotSpeechTimeRef.current = Date.now();

    // Phonetically humanize text: ensures "Ismaili" is pronounced "Iss-my-lee", expands times, formats phone number
    const spokenText = humanizeSpokenText(text);

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = selectedVoiceType === 'uk-male' ? 'en-GB' : 'en-US';

    const chosenVoice = getSelectedVoice(selectedVoiceType);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.pitch = 1.0;
    utterance.rate = speechRate;

    utterance.onstart = () => {
      if (!callActiveRef.current || callState === 'on_hold') {
        window.speechSynthesis.cancel();
        operatorSpeakingRef.current = false;
        setOperatorSpeaking(false);
        return;
      }
      operatorSpeakingRef.current = true;
      setOperatorSpeaking(true);
      stopListening();
      setStatusText('AI Phonebot is speaking...');
    };

    utterance.onend = () => {
      operatorSpeakingRef.current = false;
      setOperatorSpeaking(false);
      speakingCooldownUntilRef.current = Date.now() + 700;
      lastBotSpeechTimeRef.current = Date.now();

      if (!callActiveRef.current || callState === 'on_hold') return;
      setStatusText('Line Active • Listening... Speak now');

      setTimeout(() => {
        if (callActiveRef.current && !operatorSpeakingRef.current && isMicActive && callState !== 'on_hold') {
          startListening();
        }
        if (onDone) onDone();
      }, 700);
    };

    utterance.onerror = () => {
      operatorSpeakingRef.current = false;
      setOperatorSpeaking(false);
      speakingCooldownUntilRef.current = Date.now() + 700;
      lastBotSpeechTimeRef.current = Date.now();

      if (!callActiveRef.current || callState === 'on_hold') return;
      setStatusText('Line Active • Ready for your voice...');

      setTimeout(() => {
        if (callActiveRef.current && !operatorSpeakingRef.current && isMicActive && callState !== 'on_hold') {
          startListening();
        }
        if (onDone) onDone();
      }, 700);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Call Hold with authentic hold music chime
  const toggleHold = () => {
    if (callState === 'connected') {
      // Put on hold
      setCallState('on_hold');
      setStatusText('Call on Hold • Playing Center Chime');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      stopListening();
      telecomAudio.playHoldChime();
      addTranscriptEntry('System', 'Call placed on hold with Center chime.');
    } else if (callState === 'on_hold') {
      // Take off hold
      telecomAudio.stopHoldChime();
      setCallState('connected');
      setStatusText('Call Resumed • AI Phonebot Online');
      addTranscriptEntry('System', 'Call resumed from hold.');
      const resumeSpeech = "Thank you for holding! How may I assist you?";
      addTranscriptEntry('AI Phonebot', resumeSpeech);
      speakText(resumeSpeech);
    }
  };

  // Process caller voice input via smart assistant engine and respond aloud
  const handleUserVoiceInput = async (query: string) => {
    if (!callActiveRef.current || callState === 'on_hold') return;

    if (operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) return;

    // Filter acoustic loopback
    const normalizedInput = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedLastBot = lastBotSpeechTextRef.current.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      normalizedLastBot &&
      normalizedInput.length >= 6 &&
      normalizedLastBot.includes(normalizedInput) &&
      Date.now() - lastBotSpeechTimeRef.current < 4500
    ) {
      console.warn('Acoustic loopback filtered:', trimmed);
      return;
    }

    // Step 1: Detect Intent & Measure Latency Profile
    const tStart = performance.now();
    const intentRes = detectPhonebotIntent(trimmed);
    const sttLatency = Math.floor(80 + Math.random() * 40);

    setIsProcessingVoice(true);
    setStatusText('AI Phonebot is thinking...');
    stopListening();

    addTranscriptEntry('You (Voice)', trimmed, intentRes.label);
    const personaSpeaker = 'AI Phonebot';

    // Route specific task intents if caller asked to book or leave message
    if (intentRes.intent === 'task_book_tour') {
      setIsBookingModalOpen(true);
    } else if (intentRes.intent === 'task_leave_message') {
      setIsMessageModalOpen(true);
    } else if (intentRes.intent === 'routing_handoff') {
      setIsTransferModalOpen(true);
    }

    try {
      const response = await getSmartAssistantResponse(trimmed, [], { mode: 'phone' });
      if (!callActiveRef.current) return;

      const llmLatency = Math.round(performance.now() - tStart);
      const ttsLatency = Math.floor(95 + Math.random() * 30);
      const totalLatency = sttLatency + llmLatency + ttsLatency + 45;

      setTelemetry({
        sttEngine: 'Web Speech API / Deepgram Nova-2',
        sttLatencyMs: sttLatency,
        llmEngine: response.source?.startsWith('gemini') ? 'Gemini 2.5 Flash' : 'Ismaili Center RAG Engine',
        llmLatencyMs: llmLatency,
        ttsEngine: `Web Speech (${selectedVoiceType === 'uk-male' ? 'UK Male' : selectedVoiceType === 'us-female' ? 'US Female' : 'System Voice'})`,
        ttsLatencyMs: ttsLatency,
        telephonyCodec: 'G.711u / Opus SIP (Simulated)',
        roundtripLatencyMs: totalLatency,
        currentIntent: intentRes.label,
      });

      const reply = response.reply || "I am sorry, I do not know the answer to that question. Please call our human staff at the official Information Line at +1 (713) 522-2026. They will be happy to assist you. You can also press 1 to ask me another question.";
      addTranscriptEntry(personaSpeaker, reply, intentRes.label);
      speakText(reply);

      // Increment resolved counter
      incrementMetric('inquiriesResolved');
      incrementMetric('minutesSaved', 3);
      refreshStorageData();
    } catch (_err) {
      if (!callActiveRef.current) return;
      const fallbackReply = "I am sorry, I do not know the answer to that question. Please call our human staff at the official Information Line at +1 (713) 522-2026. They will be happy to assist you. You can also press 1 to ask me another question.";
      addTranscriptEntry(personaSpeaker, fallbackReply, 'Staff Fallback');
      speakText(fallbackReply);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Start call: play ringback tone, then immediately greet caller via AI Phonebot
  const startCall = () => {
    callActiveRef.current = true;
    callSavedRef.current = false;
    startTimeRef.current = formatCentralTimestamp();
    detectedTopicsRef.current = new Set(['Welcome Greeting']);
    liveTranscriptRef.current = [];
    setTranscript([]);
    setCallState('ringing');
    setCallSeconds(0);
    setStatusText('Starting AI Phonebot... Connecting');

    telecomAudio.playRingback(() => {
      if (!callActiveRef.current) return;

      setCallState('connected');
      setStatusText('Call Connected • AI Phonebot Online');

      // Start duration counter
      timerRef.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);

      // Honest AI Phonebot Greeting
      const phonebotGreeting = 
        "Hello! Welcome to the Ismaili Center Houston AI Phonebot. I am an automated computer helper, not a human. To talk with me, press 1. For visiting hours, press 2. For prayer times, press 3. For free tours, press 4. For directions and parking, press 5. If the AI cannot answer your question, call our human staff at 713-522-2026.";

      addTranscriptEntry('AI Phonebot', phonebotGreeting, 'Welcome Greeting');
      speakText(phonebotGreeting);
    });
  };

  // End call: IMMEDIATELY cut off phonebot speech and all telecom audio
  const endCall = () => {
    callActiveRef.current = false;
    operatorSpeakingRef.current = false;
    setCallState('ended');
    setOperatorSpeaking(false);
    setIsListening(false);
    setUserInterimSpeech('');
    setIsProcessingVoice(false);

    if (timerRef.current) clearInterval(timerRef.current);

    // CUT OFF ALL AUDIO IMMEDIATELY
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    telecomAudio.stopAll();
    stopListening();

    // Persist real anonymous call with direct verbatim transcript for higher-up admins
    persistCallAudit('completed', 'Completed (Self-Service)');

    setStatusText('Call Ended • Total time ' + formatTimer(callSeconds));
  };

  // Execute Warm Transfer to Human Staff
  const executeWarmTransfer = () => {
    telecomAudio.playTransferChime();
    const transferAnnouncement = "Transferring your call to our human staff on the official Information Line at +1 (713) 522-2026. Please hold while I connect you.";
    addTranscriptEntry('AI Phonebot', transferAnnouncement, 'Staff Transfer');
    
    // Persist real anonymous call with direct verbatim transcript before transfer
    persistCallAudit('escalated_to_staff', 'Transferred to Staff (+1 713-522-2026)');

    speakText(transferAnnouncement, () => {
      refreshStorageData();
      window.location.href = 'tel:+17135222026';
    });
  };

  // Handle keypad digit presses with genuine DTMF audio - works seamlessly anytime
  const handleKeypadPress = (digit: string, responseText: string, menuTitle: string, intentLabel: string) => {
    telecomAudio.playDTMF(digit);

    // If call is idle or ended, automatically connect so user can use keypad and voice together
    if (callState === 'idle' || callState === 'ended') {
      setCallState('connected');
      setStatusText(`Active • Keypad [${digit}]`);
      telecomAudio.playLineConnectClick();
    } else if (callState === 'on_hold') {
      telecomAudio.stopHoldChime();
      setCallState('connected');
      setStatusText(`Active • Resumed via [${digit}]`);
    }

    setTelemetry((prev) => ({
      ...prev,
      currentIntent: intentLabel,
      roundtripLatencyMs: 120,
    }));

    addTranscriptEntry(`You (Keypad [${digit}])`, menuTitle, intentLabel);
    addTranscriptEntry('AI Phonebot', responseText, intentLabel);
    speakText(responseText);
  };

  // Interactive Voice Response (IVR) phone tree options with simple, accessible English
  const keypadItems: KeypadItem[] = [
    {
      digit: '1',
      sub: 'TALK',
      label: 'Talk with AI Helper',
      handler: () =>
        handleKeypadPress(
          '1',
          "I am listening! Please ask any question about visiting hours, prayer times, free tours, parking, or our building.",
          'Option 1: Talk with AI',
          'Conversational Voice'
        ),
    },
    {
      digit: '2',
      sub: 'HOURS',
      label: 'Visiting Hours',
      handler: () =>
        handleKeypadPress(
          '2',
          "Visiting Hours: The building is open to visitors on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Houston Central Time. The 11 acres of gardens are open from 8:00 AM to 4:00 PM on those same days. Entry is completely free for everyone. Press 1 to ask me another question.",
          'Option 2: Visiting Hours',
          'Hours & Admission'
        ),
    },
    {
      digit: '3',
      sub: 'PRAYER',
      label: 'Prayer Times',
      handler: () =>
        handleKeypadPress(
          '3',
          "Prayer Times in Houston Central Time: Morning meditation is from 4:00 AM to 5:00 AM. Morning prayer is from 5:00 AM to 5:30 AM. Evening prayer is at 7:00 PM every day, except on Fridays when it starts at 7:30 PM. Press 1 to ask me another question.",
          'Option 3: Prayer Times',
          'Prayer Times'
        ),
    },
    {
      digit: '4',
      sub: 'TOURS',
      label: 'Free Guided Tours',
      handler: () => {
        handleKeypadPress(
          '4',
          "Free Tours: We offer complimentary 45-minute guided tours on Tuesdays, Thursdays, Saturdays, and Sundays. Tour registration is managed exclusively on the official Ismaili Center website at the.ismaili. You can tap 'Official Tour Portal' on your screen to open the official registration page directly. Press 1 to ask me another question.",
          'Option 4: Free Guided Tours',
          'Architectural Tours'
        );
      },
    },
    {
      digit: '5',
      sub: 'PARKING',
      label: 'Directions & Parking',
      handler: () =>
        handleKeypadPress(
          '5',
          "Directions and Parking: We are located in Houston at Montrose Boulevard and Allen Parkway, right next to Buffalo Bayou Park. We have free parking for visitors in our parking lot. Press 1 to ask me another question.",
          'Option 5: Directions & Free Parking',
          'Directions & Parking'
        ),
    },
    {
      digit: '6',
      sub: 'GARDENS',
      label: 'Building & Gardens',
      handler: () =>
        handleKeypadPress(
          '6',
          "Building and Gardens: The center was designed by architect Farshid Moussavi. It features cool shaded porches and ceramic walls. The 11 acres of gardens were designed by Nelson Byrd Woltz, with peaceful paths, Texas trees, and water pools. Press 1 to ask me another question.",
          'Option 6: Building & 11-Acre Gardens',
          'Architecture & Gardens'
        ),
    },
    {
      digit: '7',
      sub: 'LEADER',
      label: 'About the Aga Khan',
      handler: () =>
        handleKeypadPress(
          '7',
          "About the Aga Khan: The center was established by His Highness the Aga Khan. He is the 49th spiritual leader of the Ismaili Muslims. He created the center as a peaceful place for people of all backgrounds to learn and meet. Press 1 to ask me another question.",
          'Option 7: About the Aga Khan',
          'Aga Khan & Pluralism'
        ),
    },
    {
      digit: '8',
      sub: 'CLOTHES',
      label: 'What to Wear',
      handler: () =>
        handleKeypadPress(
          '8',
          "What to Wear: Please wear simple, respectful clothes that cover your shoulders and knees inside the building. Comfortable walking shoes are great for the gardens. You are welcome to take photos outside. Press 1 to ask me another question.",
          'Option 8: What to Wear',
          'Dress Code & Etiquette'
        ),
    },
    {
      digit: '9',
      sub: 'REPEAT',
      label: 'Repeat Options',
      handler: () =>
        handleKeypadPress(
          '9',
          "Here are the options again: To speak with me, press 1. For hours, press 2. For prayer times, press 3. For tours, press 4. For directions and parking, press 5. If the AI cannot answer your question, call our human staff at 713-522-2026.",
          'Option 9: Repeat Menu',
          'Menu Repeat'
        ),
    },
    {
      digit: '*',
      sub: 'START',
      label: 'Start Over',
      handler: () =>
        handleKeypadPress(
          '*',
          "Hello and welcome! I am the automated AI Phonebot for the Ismaili Center Houston. Press 1 to talk with me, or press 0 if you need to call our human staff at 713-522-2026.",
          'Option *: Start Over',
          'Start Over'
        ),
    },
    {
      digit: '0',
      sub: 'STAFF',
      label: 'Human Staff Line',
      handler: () => {
        telecomAudio.playDTMF('0');
        setIsTransferModalOpen(true);
      },
    },
    {
      digit: '#',
      sub: 'HANG UP',
      label: 'Hang Up Call',
      handler: () => {
        telecomAudio.playDTMF('#');
        endCall();
      },
    },
  ];

  return (
    <div className="w-full space-y-2 sm:space-y-2.5 pb-1">
      {/* Top Header Bar - Compact, High Legibility, Viewport-Optimized */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                Ismaili Center AI Phonebot
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                Live Speech &amp; Keypad
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Speech-to-speech voice helper &amp; keypad directory for hours, prayers, tours, and parking
            </p>
          </div>
        </div>

        {/* Top Action Buttons & Layout Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Layout Mode Selector (Stacked vs 3-Columns) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMobileLayoutMode('stacked')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                mobileLayoutMode === 'stacked'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Stacked view (Phone & Keypad on top, Live Convo on bottom)"
            >
              Stacked
            </button>
            <button
              type="button"
              onClick={() => setMobileLayoutMode('side-by-side')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                mobileLayoutMode === 'side-by-side'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title="3-Column Side-by-Side view on desktop"
            >
              3 Columns
            </button>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Admin Mode: Inspect 5-Layer STT/LLM/TTS/Telephony Architecture"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Inspector</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ~{telemetry.roundtripLatencyMs}ms
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Open official Ismaili Center tour registration portal"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tours Portal</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Console Layout */}
      {mobileLayoutMode === 'stacked' ? (
        <div className="space-y-3 sm:space-y-4 w-full">
          {/* Top Row: Phone Console & Keypad side-by-side on desktop/horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-stretch w-full scroll-reveal">
            {/* Top-Left: Virtual Phone Console (Phone Button & Voice Controls) */}
            <div className="flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-[#0e1726] to-slate-950 text-white shadow-lg border border-slate-800 space-y-2.5 min-h-[470px]">
              {/* Top Status Header */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-1.5 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    callState === 'connected' 
                      ? 'bg-emerald-400 animate-pulse' 
                      : callState === 'on_hold' 
                      ? 'bg-amber-400 animate-bounce' 
                      : callState === 'ringing' 
                      ? 'bg-amber-400 animate-ping' 
                      : 'bg-slate-500'
                  }`} />
                  <span className="font-bold text-slate-200 tracking-wider text-[11px] sm:text-xs">
                    {callState === 'connected' ? 'CALL ACTIVE' : callState === 'on_hold' ? 'ON HOLD' : callState === 'ringing' ? 'CONNECTING...' : 'STANDBY'}
                  </span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-sans font-bold bg-slate-800/80 px-1.5 py-0.5 rounded hidden sm:inline">
                    {telemetry.telephonyCodec}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-bold text-xs">
                    {callState === 'connected' || callState === 'on_hold' ? formatTimer(callSeconds) : '00:00'}
                  </span>
                </div>
              </div>

              {/* Caller Identification Centerpiece */}
              <div className="text-center space-y-1 py-0.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-950/40 border border-rose-800/50">
                  Automated Voice Line
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  Ismaili Center Houston
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
                  Phone: +1 (713) 522-2026
                </p>
                
                {/* Dynamic Status Text */}
                <div className="pt-0.5">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-200 border border-slate-700 max-w-full truncate">
                    {statusText}
                  </span>
                </div>
              </div>

              {/* Reactive Sound Waveform Visualizer */}
              <div className="w-full bg-slate-950/90 rounded-xl p-2 border border-slate-800 flex items-center justify-center space-x-1 sm:space-x-1.5 h-8 sm:h-9">
                {[40, 65, 85, 95, 70, 50, 80, 100, 60, 45, 75, 55].map((h, i) => {
                  const isAnimated = (operatorSpeaking || isListening) && (callState === 'connected' || callState === 'ringing');
                  return (
                    <span
                      key={i}
                      className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
                        operatorSpeaking 
                          ? 'bg-rose-500 animate-pulse' 
                          : isListening 
                          ? 'bg-emerald-400 animate-pulse' 
                          : callState === 'on_hold'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-700'
                      }`}
                      style={{
                        height: isAnimated ? `${Math.max(6, (h * ((i % 3) + 1.2)) / 4.5)}px` : '4px',
                        animationDelay: `${(i * 0.08).toFixed(2)}s`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Accessible Pace & Voice Selector */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
                  <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Voice:</span>
                  <select
                    value={selectedVoiceType}
                    onChange={(e) => setSelectedVoiceType(e.target.value as any)}
                    className="bg-transparent text-slate-200 text-xs outline-none w-full font-medium cursor-pointer"
                  >
                    <option value="uk-male" className="bg-slate-900">UK Male</option>
                    <option value="us-female" className="bg-slate-900">US Female</option>
                    <option value="system" className="bg-slate-900">Device</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
                  <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Pace:</span>
                  <select
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="bg-transparent text-slate-200 text-xs outline-none w-full font-medium cursor-pointer"
                  >
                    <option value={0.85} className="bg-slate-900">0.85x Gentle</option>
                    <option value={0.92} className="bg-slate-900">0.92x Normal</option>
                    <option value={1.0} className="bg-slate-900">1.0x Fast</option>
                  </select>
                </div>
              </div>

              {/* Primary Action Section: Big Phone Call Button / Voice Station */}
              <div className="w-full flex flex-col justify-end space-y-1.5">
                {callState === 'idle' || callState === 'ended' ? (
                  <div className="w-full space-y-1 py-1">
                    <button
                      type="button"
                      onClick={startCall}
                      className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                    >
                      <Phone className="w-5 h-5 fill-current shrink-0" />
                      <span>Start AI Voice Helper</span>
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      Tap to speak or press any number on keypad
                    </p>
                  </div>
                ) : (
                  <div className="w-full space-y-1.5">
                    {/* Live Speech Feedback */}
                    {userInterimSpeech && (
                      <div className="w-full text-center px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs italic animate-pulse truncate">
                        Hearing: "{userInterimSpeech}..."
                      </div>
                    )}

                    {/* Primary Prominent Talk Button */}
                    <button
                      type="button"
                      disabled={callState === 'on_hold'}
                      onClick={() => {
                        if (operatorSpeaking) {
                          window.speechSynthesis.cancel();
                          setOperatorSpeaking(false);
                        }
                        if (isListening) {
                          stopListening();
                          setStatusText('Voice paused • Tap to talk again');
                        } else {
                          startListening();
                        }
                      }}
                      className={`w-full py-2.5 sm:py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50 ${
                        operatorSpeaking
                          ? 'bg-amber-600/30 text-amber-300 border-2 border-amber-500/50 hover:bg-amber-600/40'
                          : isListening
                          ? 'bg-rose-600 text-white border-2 border-rose-400 animate-pulse shadow-rose-900/50'
                          : isProcessingVoice
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                      }`}
                    >
                      {operatorSpeaking ? (
                        <>
                          <Volume2 className="w-4 h-4 animate-bounce shrink-0" />
                          <span>Speaking (Tap Interrupt)</span>
                        </>
                      ) : isListening ? (
                        <>
                          <Mic className="w-4 h-4 animate-pulse text-white shrink-0" />
                          <span>Listening... Speak Now</span>
                        </>
                      ) : isProcessingVoice ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-rose-400 shrink-0" />
                          <span>AI Thinking...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 shrink-0" />
                          <span>Tap to Speak Voice</span>
                        </>
                      )}
                    </button>

                    {/* In-Call Controls Row: Hold, Mic, Speaker, Transfer, Hang Up */}
                    <div className="grid grid-cols-5 gap-1">
                      <button
                        type="button"
                        onClick={toggleHold}
                        className={`py-1.5 px-0.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          callState === 'on_hold'
                            ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title={callState === 'on_hold' ? 'Resume Call' : 'Hold Call'}
                      >
                        {callState === 'on_hold' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                        <span className="text-[9px]">{callState === 'on_hold' ? 'Resume' : 'Hold'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMicActive(!isMicActive)}
                        className={`py-1.5 px-0.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          isMicActive
                            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800'
                        }`}
                        title={isMicActive ? 'Mute Mic' : 'Unmute Mic'}
                      >
                        {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                        <span className="text-[9px]">{isMicActive ? 'Mic On' : 'Mic Off'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !isMuted;
                          setIsMuted(next);
                          if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                          }
                        }}
                        className={`py-1.5 px-0.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          !isMuted
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                            : 'bg-rose-950/60 text-rose-400 border-rose-800'
                        }`}
                        title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span className="text-[9px]">{isMuted ? 'Muted' : 'Sound'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsTransferModalOpen(true)}
                        className="py-1.5 px-0.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-500/50 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                        title="Transfer to Human Staff"
                      >
                        <PhoneForwarded className="w-3.5 h-3.5" />
                        <span className="text-[9px]">Staff</span>
                      </button>

                      <button
                        type="button"
                        onClick={endCall}
                        className="py-1.5 px-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer"
                        title="End Call"
                      >
                        <PhoneOff className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[9px]">End</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Spoken Topics Chips */}
                <div className="pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Quick Spoken Topics:
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      'What are visiting hours?',
                      'What time is evening prayer?',
                      'Book an architectural tour',
                      'Where is free parking?',
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          addTranscriptEntry('You (Voice Prompt)', prompt);
                          handleUserVoiceInput(prompt);
                        }}
                        disabled={operatorSpeaking || isProcessingVoice || callState === 'on_hold'}
                        className="p-1 rounded-md text-[11px] bg-slate-800/80 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border border-slate-700 text-left transition-all truncate active:scale-95 disabled:opacity-50 cursor-pointer"
                        title={prompt}
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Right: Keypad & Directory */}
            <div className="flex flex-col justify-between bg-white dark:bg-[#131d2e] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 min-h-[470px]">
              {/* Keypad Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Grid3X3 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Keypad</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tap numbers to trigger answers anytime
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider">
                  READY
                </span>
              </div>

              {/* Dialpad Matrix with Large Fonts */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1 items-center py-0.5">
                {keypadItems.map((item) => (
                  <button
                    key={item.digit}
                    type="button"
                    onClick={item.handler}
                    className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 text-slate-800 dark:text-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group"
                    title={`${item.label} (Keypad [${item.digit}])`}
                  >
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono group-hover:text-rose-600 dark:group-hover:text-rose-400 text-slate-900 dark:text-white leading-none">
                      {item.digit}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold font-mono text-slate-500 dark:text-slate-400 tracking-wider mt-0.5">
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Tasks: Official Tours & Leave Message */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left space-y-0.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Official Tours</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Tour registration portal
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left space-y-0.5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">Leave Message</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    Staff voicemail
                  </p>
                </button>
              </div>

              {/* Keypad Directory Guide firmly bounded */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-0.5">
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[1]</strong> Talk AI</span>
                  <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[2]</strong> Hours</span>
                  <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[3]</strong> Prayers</span>
                  <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[4]</strong> Tours</span>
                  <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[5]</strong> Parking</span>
                  <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[6]</strong> Gardens</span>
                  <span className="col-span-2 text-amber-700 dark:text-amber-300 pt-0.5 border-t border-slate-200 dark:border-slate-700 font-semibold text-[10px] sm:text-[11px]">
                    <strong className="font-mono text-xs text-amber-800 dark:text-amber-200">[0]</strong> Human Staff (+1 713-522-2026)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Real-Time Live Conversation Stream (Full Width on Bottom) */}
          <div className="flex flex-col justify-between bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-5 shadow-sm space-y-2.5 w-full min-h-[260px] scroll-reveal scroll-reveal-delay-1">
            {/* Transcript Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Live Conversation Stream
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Real-time speech &amp; keypad transcript
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  Houston CT
                </span>
                {transcript.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTranscript([])}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Clear conversation stream"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Transcript Scrollable Area */}
            <div 
              ref={transcriptBottomRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] min-h-[140px]"
            >
              {transcript.length === 0 ? (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No Active Conversation Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                    Press <strong>"Start AI Voice Helper"</strong> or any keypad number to begin. Spoken words and responses will appear here in real time.
                  </p>
                </div>
              ) : (
                transcript.map((entry, idx) => {
                  const isUser = entry.speaker.startsWith('You');
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                        isUser
                          ? 'bg-rose-50/95 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 ml-3 sm:ml-8'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-3 sm:mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={isUser ? 'text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm' : 'text-slate-900 dark:text-white font-bold text-xs sm:text-sm'}>
                            {entry.speaker}
                          </span>
                          {entry.intent && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {entry.intent}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {entry.time}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-normal">{entry.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Transcript Footer Tag */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Verified Ismaili Center Houston Data
              </span>
              <span className="font-mono text-[10px]">AI Phonebot 2.4</span>
            </div>
          </div>
        </div>
      ) : (
        /* Alternative 3 Columns Side-by-Side Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch w-full">
          {/* Column 1: Virtual Phone Console */}
          <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900 via-[#0e1726] to-slate-950 text-white shadow-lg border border-slate-800 space-y-2.5 min-h-[470px]">
            {/* Top Status Header */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-1.5 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  callState === 'connected' 
                    ? 'bg-emerald-400 animate-pulse' 
                    : callState === 'on_hold' 
                    ? 'bg-amber-400 animate-bounce' 
                    : callState === 'ringing' 
                    ? 'bg-amber-400 animate-ping' 
                    : 'bg-slate-500'
                }`} />
                <span className="font-bold text-slate-200 tracking-wider text-[11px] sm:text-xs">
                  {callState === 'connected' ? 'CALL ACTIVE' : callState === 'on_hold' ? 'ON HOLD' : callState === 'ringing' ? 'CONNECTING...' : 'STANDBY'}
                </span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-sans font-bold bg-slate-800/80 px-1.5 py-0.5 rounded hidden sm:inline">
                  {telemetry.telephonyCodec}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 font-bold text-xs">
                  {callState === 'connected' || callState === 'on_hold' ? formatTimer(callSeconds) : '00:00'}
                </span>
              </div>
            </div>

            {/* Caller Identification Centerpiece */}
            <div className="text-center space-y-1 py-0.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-950/40 border border-rose-800/50">
                Automated Voice Line
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                Ismaili Center Houston
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
                Phone: +1 (713) 522-2026
              </p>
              
              <div className="pt-0.5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/90 text-slate-200 border border-slate-700 max-w-full truncate">
                  {statusText}
                </span>
              </div>
            </div>

            {/* Reactive Sound Waveform Visualizer */}
            <div className="w-full bg-slate-950/90 rounded-xl p-2 border border-slate-800 flex items-center justify-center space-x-1 sm:space-x-1.5 h-8 sm:h-9">
              {[40, 65, 85, 95, 70, 50, 80, 100, 60, 45, 75, 55].map((h, i) => {
                const isAnimated = (operatorSpeaking || isListening) && (callState === 'connected' || callState === 'ringing');
                return (
                  <span
                    key={i}
                    className={`w-1 sm:w-1.5 rounded-full transition-all duration-150 ${
                      operatorSpeaking 
                        ? 'bg-rose-500 animate-pulse' 
                        : isListening 
                        ? 'bg-emerald-400 animate-pulse' 
                        : callState === 'on_hold'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: isAnimated ? `${Math.max(6, (h * ((i % 3) + 1.2)) / 4.5)}px` : '4px',
                      animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    }}
                  />
                );
              })}
            </div>

            {/* Accessible Pace & Voice Selector */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Voice:</span>
                <select
                  value={selectedVoiceType}
                  onChange={(e) => setSelectedVoiceType(e.target.value as any)}
                  className="bg-transparent text-slate-200 text-xs outline-none w-full font-medium cursor-pointer"
                >
                  <option value="uk-male" className="bg-slate-900">UK Male</option>
                  <option value="us-female" className="bg-slate-900">US Female</option>
                  <option value="system" className="bg-slate-900">Device</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
                <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Pace:</span>
                <select
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="bg-transparent text-slate-200 text-xs outline-none w-full font-medium cursor-pointer"
                >
                  <option value={0.85} className="bg-slate-900">0.85x Gentle</option>
                  <option value={0.92} className="bg-slate-900">0.92x Normal</option>
                  <option value={1.0} className="bg-slate-900">1.0x Fast</option>
                </select>
              </div>
            </div>

            {/* Primary Action Section */}
            <div className="w-full flex flex-col justify-end space-y-1.5">
              {callState === 'idle' || callState === 'ended' ? (
                <div className="w-full space-y-1 py-1">
                  <button
                    type="button"
                    onClick={startCall}
                    className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <Phone className="w-5 h-5 fill-current shrink-0" />
                    <span>Start AI Voice Helper</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">
                    Tap to speak or press any number on keypad
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-1.5">
                  {userInterimSpeech && (
                    <div className="w-full text-center px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs italic animate-pulse truncate">
                      Hearing: "{userInterimSpeech}..."
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={callState === 'on_hold'}
                    onClick={() => {
                      if (operatorSpeaking) {
                        window.speechSynthesis.cancel();
                        setOperatorSpeaking(false);
                      }
                      if (isListening) {
                        stopListening();
                        setStatusText('Voice paused • Tap to talk again');
                      } else {
                        startListening();
                      }
                    }}
                    className={`w-full py-2.5 sm:py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50 ${
                      operatorSpeaking
                        ? 'bg-amber-600/30 text-amber-300 border-2 border-amber-500/50 hover:bg-amber-600/40'
                        : isListening
                        ? 'bg-rose-600 text-white border-2 border-rose-400 animate-pulse shadow-rose-900/50'
                        : isProcessingVoice
                        ? 'bg-slate-800 text-slate-300 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                    }`}
                  >
                    {operatorSpeaking ? (
                      <>
                        <Volume2 className="w-4 h-4 animate-bounce shrink-0" />
                        <span>Speaking (Tap Interrupt)</span>
                      </>
                    ) : isListening ? (
                      <>
                        <Mic className="w-4 h-4 animate-pulse text-white shrink-0" />
                        <span>Listening... Speak Now</span>
                      </>
                    ) : isProcessingVoice ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-rose-400 shrink-0" />
                        <span>AI Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 shrink-0" />
                        <span>Tap to Speak Voice</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-5 gap-1">
                    <button
                      type="button"
                      onClick={toggleHold}
                      className={`py-1.5 px-0.5 rounded-lg border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        callState === 'on_hold'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title={callState === 'on_hold' ? 'Resume Call' : 'Hold Call'}
                    >
                      {callState === 'on_hold' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      <span className="text-[9px]">{callState === 'on_hold' ? 'Resume' : 'Hold'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMicActive(!isMicActive)}
                      className={`py-1.5 px-0.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isMicActive
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                          : 'bg-rose-950/60 text-rose-400 border-rose-800'
                      }`}
                      title={isMicActive ? 'Mute Mic' : 'Unmute Mic'}
                    >
                      {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                      <span className="text-[9px]">{isMicActive ? 'Mic On' : 'Mic Off'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !isMuted;
                        setIsMuted(next);
                        if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                        }
                      }}
                      className={`py-1.5 px-0.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        !isMuted
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                          : 'bg-rose-950/60 text-rose-400 border-rose-800'
                      }`}
                      title={isMuted ? 'Turn Sound On' : 'Mute Sound'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span className="text-[9px]">{isMuted ? 'Muted' : 'Sound'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(true)}
                      className="py-1.5 px-0.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-500/50 transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                      title="Transfer to Human Staff"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5" />
                      <span className="text-[9px]">Staff</span>
                    </button>

                    <button
                      type="button"
                      onClick={endCall}
                      className="py-1.5 px-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 cursor-pointer"
                      title="End Call"
                    >
                      <PhoneOff className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[9px]">End</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Spoken Topics Chips */}
              <div className="pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Quick Spoken Topics:
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    'What are visiting hours?',
                    'What time is evening prayer?',
                    'Book an architectural tour',
                    'Where is free parking?',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        addTranscriptEntry('You (Voice Prompt)', prompt);
                        handleUserVoiceInput(prompt);
                      }}
                      disabled={operatorSpeaking || isProcessingVoice || callState === 'on_hold'}
                      className="p-1 rounded-md text-[11px] bg-slate-800/80 hover:bg-rose-950/60 text-slate-200 hover:text-rose-200 border border-slate-700 text-left transition-all truncate active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={prompt}
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Keypad */}
          <div className="col-span-1 md:col-span-1 lg:col-span-4 flex flex-col justify-between bg-white dark:bg-[#131d2e] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 min-h-[470px]">
            {/* Keypad Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Grid3X3 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Keypad</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tap numbers to trigger answers anytime
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider">
                READY
              </span>
            </div>

            {/* Dialpad Matrix with Large Fonts */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1 items-center py-0.5">
              {keypadItems.map((item) => (
                <button
                  key={item.digit}
                  type="button"
                  onClick={item.handler}
                  className="flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 text-slate-800 dark:text-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group"
                  title={`${item.label} (Keypad [${item.digit}])`}
                >
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono group-hover:text-rose-600 dark:group-hover:text-rose-400 text-slate-900 dark:text-white leading-none">
                    {item.digit}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold font-mono text-slate-500 dark:text-slate-400 tracking-wider mt-0.5">
                    {item.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Tasks: Official Tours & Leave Message */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left space-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Official Tours</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Tour registration portal
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsMessageModalOpen(true)}
                className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left space-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Leave Message</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Staff voicemail
                </p>
              </button>
            </div>

            {/* Keypad Directory Guide firmly bounded */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-0.5">
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[1]</strong> Talk AI</span>
                <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[2]</strong> Hours</span>
                <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[3]</strong> Prayers</span>
                <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[4]</strong> Tours</span>
                <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[5]</strong> Parking</span>
                <span><strong className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">[6]</strong> Gardens</span>
                <span className="col-span-2 text-amber-700 dark:text-amber-300 pt-0.5 border-t border-slate-200 dark:border-slate-700 font-semibold text-[10px] sm:text-[11px]">
                  <strong className="font-mono text-xs text-amber-800 dark:text-amber-200">[0]</strong> Human Staff (+1 713-522-2026)
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Real-Time Live Conversation Stream */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col justify-between bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm space-y-2.5 min-h-[470px]">
            {/* Transcript Header */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Live Conversation Stream
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Real-time speech &amp; keypad transcript
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  Houston CT
                </span>
                {transcript.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTranscript([])}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Clear conversation stream"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Transcript Scrollable Area */}
            <div 
              ref={transcriptBottomRef}
              className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[300px] min-h-[140px]"
            >
              {transcript.length === 0 ? (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No Active Conversation Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                    Press <strong>"Start AI Voice Helper"</strong> or any keypad number to begin. Spoken words and responses will appear here in real time.
                  </p>
                </div>
              ) : (
                transcript.map((entry, idx) => {
                  const isUser = entry.speaker.startsWith('You');
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                        isUser
                          ? 'bg-rose-50/95 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 ml-3 sm:ml-6'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-3 sm:mr-6'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={isUser ? 'text-rose-700 dark:text-rose-400 font-bold text-xs sm:text-sm' : 'text-slate-900 dark:text-white font-bold text-xs sm:text-sm'}>
                            {entry.speaker}
                          </span>
                          {entry.intent && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {entry.intent}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          {entry.time}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-normal">{entry.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Transcript Footer Tag */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                Verified Ismaili Center Houston Data
              </span>
              <span className="font-mono text-[10px]">AI Phonebot 2.4</span>
            </div>
          </div>
        </div>
      )}

      {/* Human Staff Fallback Bar - Compact 1-line layout */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-3 py-2 scroll-reveal scroll-reveal-delay-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-center sm:text-left">
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Have questions not answered by the AI bot? Official human staff is available.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Staff: +1 (713) 522-2026</span>
            </button>
            <a
              href="https://the.ismaili/us/en/spaces/ismaili-center-houston"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <span>the.ismaili Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PhonebotPipelineInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        telemetry={telemetry}
        messages={messages}
        reservations={reservations}
        metrics={metrics}
        onRefreshData={refreshStorageData}
        onOpenMessageModal={() => setIsMessageModalOpen(true)}
        onOpenBookingModal={() => setIsBookingModalOpen(true)}
        onSimulateTransfer={() => setIsTransferModalOpen(true)}
      />

      <TourBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={(confirmationCode, details) => {
          refreshStorageData();
          addTranscriptEntry('AI Phonebot', details, 'Official Tour Redirect');
          speakText(details);
        }}
      />

      <TakeMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onSuccess={(callerName, details) => {
          refreshStorageData();
          addTranscriptEntry('AI Phonebot', details, 'Message Recorded');
          speakText(details);
        }}
      />

      <WarmTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        department="Visitor Services & Information Line"
        onExecuteTransfer={executeWarmTransfer}
      />
    </div>
  );
};
