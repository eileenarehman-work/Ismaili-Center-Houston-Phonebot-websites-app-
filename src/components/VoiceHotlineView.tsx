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
import { useTranslation } from '../context/LanguageContext.tsx';

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
  const { t, language } = useTranslation();
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'on_hold' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [statusText, setStatusText] = useState(() => t('hotline.ready_status', 'Hotline Ready • Click Call Hotline to Connect'));
  const [operatorSpeaking, setOperatorSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string; intent?: string }>>([]);
  const [userInterimSpeech, setUserInterimSpeech] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  useEffect(() => {
    if (callState === 'idle') {
      setStatusText(t('hotline.ready_status', 'Hotline Ready • Click Call Hotline to Connect'));
    }
  }, [language, t, callState]);

  // Voice Customization (UK Male / US Female / System) & Accessible Speech Speed
  const [selectedVoiceType, setSelectedVoiceType] = useState<'uk-male' | 'us-female' | 'system'>('uk-male');
  const [speechRate, setSpeechRate] = useState<number>(0.92); // 0.92 rate: relaxed, crystal-clear for immigrants & seniors

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
      const langCodeMap: Record<string, string> = {
        es: 'es-US',
        ur: 'ur-PK',
        hi: 'hi-IN',
        fr: 'fr-FR',
        pt: 'pt-BR',
        ar: 'ar-SA',
        fa: 'fa-IR',
        tl: 'fil-PH',
      };
      recog.lang = langCodeMap[language] || 'en-US';

      recog.onstart = () => {
        if (!callActiveRef.current || operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current) {
          try { recog.abort(); } catch (e) {}
          return;
        }
        setIsListening(true);
        setStatusText(t('hotline.listening_status', 'Line Active • Listening... Speak now'));
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
    const langVoiceMap: Record<string, string> = {
      es: 'es-ES',
      ur: 'ur-PK',
      hi: 'hi-IN',
      fr: 'fr-FR',
      pt: 'pt-BR',
      ar: 'ar-SA',
      fa: 'fa-IR',
      tl: 'fil-PH',
    };
    utterance.lang = langVoiceMap[language] || (selectedVoiceType === 'uk-male' ? 'en-GB' : 'en-US');

    const chosenVoice = getSelectedVoice(selectedVoiceType, language);
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
      setStatusText(t('hotline.speaking_status', 'AI Phonebot is speaking...'));
    };

    utterance.onend = () => {
      operatorSpeakingRef.current = false;
      setOperatorSpeaking(false);
      speakingCooldownUntilRef.current = Date.now() + 700;
      lastBotSpeechTimeRef.current = Date.now();

      if (!callActiveRef.current || callState === 'on_hold') return;
      setStatusText(t('hotline.listening_status', 'Line Active • Listening... Speak now'));

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
      setStatusText(t('hotline.hold_status', 'Call on Hold • Playing Center Chime'));
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
      setStatusText(t('hotline.resumed_status', 'Call Resumed • AI Phonebot Online'));
      addTranscriptEntry('System', 'Call resumed from hold.');
      const resumeSpeech =
        language === 'es'
          ? "¡Gracias por esperar! ¿En qué puedo ayudarle hoy?"
          : language === 'ur'
          ? "انتظار کرنے کا شکریہ! میں آج آپ کی کس طرح مدد کر سکتا ہوں؟"
          : language === 'hi'
          ? "प्रतीक्षा करने के लिए धन्यवाद! मैं आज आपकी क्या सहायता कर सकता हूँ?"
          : "Thank you for holding! How may I assist you?";
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
    setStatusText(t('hotline.ai_thinking', 'AI Phonebot is thinking...'));
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
      const response = await getSmartAssistantResponse(trimmed, [], { mode: 'phone', language });
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

      const fallbackReply =
        language === 'es'
          ? "Lo siento, no sé la respuesta a esa pregunta. Por favor llame a nuestro personal en la línea oficial de información al +1 (713) 522-2026. Con gusto le atenderán."
          : language === 'ur'
          ? "معذرت، مجھے اس سوال کا جواب معلوم نہیں ہے۔ براہ کرم سرکاری معلوماتی لائن +1 (713) 522-2026 پر ہمارے عملے سے رابطہ کریں۔ وہ خوشی سے آپ کی رہنمائی کریں گے۔"
          : language === 'hi'
          ? "क्षमा करें, मुझे इस प्रश्न का उत्तर ज्ञात नहीं है। कृपया आधिकारिक सूचना लाइन +1 (713) 522-2026 पर हमारे स्टाफ को कॉल करें। वे आपकी सहायता करने में प्रसन्न होंगे।"
          : "I am sorry, I do not know the answer to that question. Please call our human staff at the official Information Line at +1 (713) 522-2026. They will be happy to assist you.";
      const reply = response.reply || fallbackReply;
      addTranscriptEntry(personaSpeaker, reply, intentRes.label);
      speakText(reply);

      // Increment resolved counter
      incrementMetric('inquiriesResolved');
      incrementMetric('minutesSaved', 3);
      refreshStorageData();
    } catch (_err) {
      if (!callActiveRef.current) return;
      const fallbackReply =
        language === 'es'
          ? "Lo siento, no sé la respuesta a esa pregunta. Por favor llame a nuestro personal en la línea oficial de información al +1 (713) 522-2026. Con gusto le atenderán."
          : language === 'ur'
          ? "معذرت، مجھے اس سوال کا جواب معلوم نہیں ہے۔ براہ کرم سرکاری معلوماتی لائن +1 (713) 522-2026 پر ہمارے عملے سے رابطہ کریں۔ وہ خوشی سے آپ کی رہنمائی کریں گے۔"
          : language === 'hi'
          ? "क्षमा करें, मुझे इस प्रश्न का उत्तर ज्ञात नहीं है। कृपया आधिकारिक सूचना लाइन +1 (713) 522-2026 पर हमारे स्टाफ को कॉल करें। वे आपकी सहायता करने में प्रसन्न होंगे।"
          : "I am sorry, I do not know the answer to that question. Please call our human staff at the official Information Line at +1 (713) 522-2026. They will be happy to assist you.";
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
    setStatusText(t('hotline.connecting_status', 'Starting AI Phonebot... Connecting'));

    telecomAudio.playRingback(() => {
      if (!callActiveRef.current) return;

      setCallState('connected');
      setStatusText(t('hotline.call_connected_status', 'Call Connected • AI Phonebot Online'));

      // Start duration counter
      timerRef.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);

      // Honest AI Phonebot Greeting
      const phonebotGreeting =
        language === 'es'
          ? "¡Hola! Bienvenido al asistente telefónico con IA del Ismaili Center Houston. Soy un ayudante informático automatizado, no un humano. Para hablar conmigo, presione 1. Para horarios de visita, presione 2. Para horarios de oración, presione 3. Para visitas guiadas gratuitas, presione 4. Para direcciones y estacionamiento, presione 5. Si la IA no puede responder su pregunta, llame a nuestro personal al 713-522-2026."
          : language === 'ur'
          ? "ہیلو! اسماعیلی سینٹر ہیوسٹن کے اے آئی فون بوٹ میں خوش آمدید۔ میں ایک خودکار کمپیوٹر اسسٹنٹ ہوں، انسان نہیں۔ مجھ سے بات کرنے کے لیے 1 دبائیں۔ ملاقات کے اوقات کے لیے 2 دبائیں۔ نماز کے اوقات کے لیے 3 دبائیں۔ مفت ٹورز کے لیے 4 دبائیں۔ راستے اور پارکنگ کے لیے 5 دبائیں۔ اگر اے آئی جواب نہ دے سکے تو ہمارے عملے کو 713-522-2026 پر کال کریں۔"
          : language === 'hi'
          ? "नमस्ते! इस्माइली सेंटर ह्यूस्टन एआई फोनबॉट में आपका स्वागत है। मैं एक स्वचालित कंप्यूटर सहायक हूँ, इंसान नहीं। मुझसे बात करने के लिए 1 दबाएं। आने के समय के लिए 2 दबाएं। प्रार्थना समय के लिए 3 दबाएं। निःशुल्क टूर के लिए 4 दबाएं। दिशा-निर्देश और पार्किंग के लिए 5 दबाएं। यदि एआई उत्तर न दे सके, तो हमारे स्टाफ को 713-522-2026 पर कॉल करें।"
          : "Hello! Welcome to the Ismaili Center Houston AI Phonebot. I am an automated computer helper, not a human. To talk with me, press 1. For visiting hours, press 2. For prayer times, press 3. For free tours, press 4. For directions and parking, press 5. If the AI cannot answer your question, call our human staff at 713-522-2026.";

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

    setStatusText(t('hotline.ended_status', 'Call Ended • Total time') + ' ' + formatTimer(callSeconds));
  };

  // Execute Warm Transfer to Human Staff
  const executeWarmTransfer = () => {
    telecomAudio.playTransferChime();
    const transferAnnouncement =
      language === 'es'
        ? "Transfiriendo su llamada a nuestro personal humano en la línea oficial de información al +1 (713) 522-2026. Por favor espere mientras le conecto."
        : language === 'ur'
        ? "آپ کی کال سرکاری معلوماتی لائن +1 (713) 522-2026 پر ہمارے عملے کو ٹرانسفر کی جا رہی ہے۔ رابطہ قائم ہونے تک انتظار فرمائیں۔"
        : language === 'hi'
        ? "आपकी कॉल को आधिकारिक सूचना लाइन +1 (713) 522-2026 पर हमारे मानव स्टाफ को ट्रांसफर किया जा रहा है। कृपया कनेक्ट होने तक प्रतीक्षा करें।"
        : "Transferring your call to our human staff on the official Information Line at +1 (713) 522-2026. Please hold while I connect you.";
    addTranscriptEntry('AI Phonebot', transferAnnouncement, 'Staff Transfer');
    
    // Persist real anonymous call with direct verbatim transcript before transfer
    persistCallAudit('escalated_to_staff', 'Transferred to Staff (+1 713-522-2026)');

    speakText(transferAnnouncement, () => {
      refreshStorageData();
      window.location.href = 'tel:+17135222026';
    });
  };

  // Handle keypad digit presses with genuine DTMF audio
  const handleKeypadPress = (digit: string, responseText: string, menuTitle: string, intentLabel: string) => {
    telecomAudio.playDTMF(digit);

    if (callState !== 'connected' && callState !== 'on_hold') {
      return;
    }

    if (callState === 'on_hold') {
      telecomAudio.stopHoldChime();
      setCallState('connected');
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

  // Interactive Voice Response (IVR) phone tree options with localized speech and labels
  const getKeypadResponse = (digit: string): { speech: string; label: string; intent: string } => {
    switch (digit) {
      case '1':
        return {
          speech:
            language === 'es'
              ? "¡Le estoy escuchando! Por favor haga cualquier pregunta sobre horarios de visita, tiempos de oración, visitas guiadas gratuitas, estacionamiento o nuestra arquitectura."
              : language === 'ur'
              ? "میں سن رہا ہوں! براہ کرم ملاقات کے اوقات، نماز کے اوقات، مفت ٹورز، پارکنگ یا عمارت کے بارے میں کوئی بھی سوال پوچھیں۔"
              : language === 'hi'
              ? "मैं सुन रहा हूँ! कृपया आने के समय, प्रार्थना समय, निःशुल्क टूर, पार्किंग या इमारत के बारे में कोई भी प्रश्न पूछें।"
              : "I am listening! Please ask any question about visiting hours, prayer times, free tours, parking, or our building.",
          label: t('hotline.menu_1', 'Talk with AI'),
          intent: 'Conversational Voice',
        };
      case '2':
        return {
          speech:
            language === 'es'
              ? "Horarios de Visita: El edificio está abierto a visitantes los martes, jueves, sábados y domingos de 10:00 AM a 4:00 PM, hora central de Houston. Los 11 acres de jardines abren de 8:00 AM a 4:00 PM los mismos días. La entrada es completamente gratuita. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "ملاقات کے اوقات: عمارت منگل، جمعرات، ہفتہ اور اتوار کو صبح 10:00 بجے سے شام 4:00 بجے تک کھلی رہتی ہے۔ 11 ایکڑ باغات انہی دنوں صبح 8:00 بجے سے شام 4:00 بجے تک کھلے رہتے ہیں۔ داخلہ بالکل مفت ہے۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "आने का समय: इमारत मंगलवार, गुरुवार, शनिवार और रविवार को सुबह 10:00 बजे से शाम 4:00 बजे तक खुली रहती है। 11 एकड़ के बगीचे सुबह 8:00 बजे से शाम 4:00 बजे तक खुले रहते हैं। प्रवेश बिल्कुल मुफ्त है। अन्य प्रश्न के लिए 1 दबाएं।"
              : "Visiting Hours: The building is open to visitors on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Houston Central Time. The 11 acres of gardens are open from 8:00 AM to 4:00 PM on those same days. Entry is completely free for everyone. Press 1 to ask me another question.",
          label: t('hotline.menu_2', 'Visiting Hours'),
          intent: 'Hours & Admission',
        };
      case '3':
        return {
          speech:
            language === 'es'
              ? "Horarios de Oración en Tiempo Central de Houston: Bandagi o meditación matutina es de 4:00 AM a 5:00 AM. La oración matutina es de 5:00 AM a 5:30 AM. La oración vespertina es a las 7:00 PM todos los días, excepto los viernes que comienza a las 7:30 PM. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "ہیوسٹن سینٹرل ٹائم میں نماز کے اوقات: صبح کی بندگی صبح 4:00 سے 5:00 بجے تک ہے۔ صبح کی دعا صبح 5:00 سے 5:30 بجے تک ہے۔ شام کی دعا روزانہ شام 7:00 بجے ہے، سوائے جمعہ کے جب یہ 7:30 بجے ہوتی ہے۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "ह्यूस्टन सेंट्रल टाइम में प्रार्थना का समय: सुबह का ध्यान सुबह 4:00 से 5:00 बजे तक है। सुबह की प्रार्थना सुबह 5:00 से 5:30 बजे तक है। शाम की प्रार्थना रोजाना शाम 7:00 बजे होती है, शुक्रवार को शाम 7:30 बजे। अन्य प्रश्न के लिए 1 दबाएं।"
              : "Prayer Times in Houston Central Time: Morning meditation is from 4:00 AM to 5:00 AM. Morning prayer is from 5:00 AM to 5:30 AM. Evening prayer is at 7:00 PM every day, except on Fridays when it starts at 7:30 PM. Press 1 to ask me another question.",
          label: t('hotline.menu_3', 'Prayer Times'),
          intent: 'Prayer Times',
        };
      case '4':
        return {
          speech:
            language === 'es'
              ? "Visitas Guiadas Gratuitas: Ofrecemos recorridos guiados complementarios de 45 minutos los martes, jueves, sábados y domingos. La inscripción se gestiona exclusivamente en el portal oficial en the.ismaili. Puede tocar Portal Oficial de Visitas en su pantalla. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "مفت گائیڈڈ ٹور: ہم منگل، جمعرات، ہفتہ اور اتوار کو 45 منٹ کے مفت گائیڈڈ ٹور پیش کرتے ہیں۔ رجسٹریشن the.ismaili پر کی جاتی ہے۔ آپ اپنی اسکرین پر 'سرکاری ٹور پورٹل' ٹچ کر سکتے ہیں۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "निःशुल्क गाइडेड टूर: हम मंगलवार, गुरुवार, शनिवार और रविवार को 45 मिनट के मानार्थ गाइडेड टूर प्रदान करते हैं। पंजीकरण the.ismaili पर होता है। आप स्क्रीन पर 'आधिकारिक टूर पोर्टल' टैप कर सकते हैं। अन्य प्रश्न के लिए 1 दबाएं।"
              : "Free Tours: We offer complimentary 45-minute guided tours on Tuesdays, Thursdays, Saturdays, and Sundays. Tour registration is managed exclusively on the official Ismaili Center website at the.ismaili. You can tap 'Official Tour Portal' on your screen to open the official registration page directly. Press 1 to ask me another question.",
          label: t('hotline.menu_4', 'Free Tours'),
          intent: 'Architectural Tours',
        };
      case '5':
        return {
          speech:
            language === 'es'
              ? "Direcciones y Estacionamiento: Estamos ubicados en Montrose Boulevard y Allen Parkway en Houston, junto a Buffalo Bayou Park. Disponemos de estacionamiento gratuito para visitantes en nuestras instalaciones. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "راستے اور پارکنگ: ہم ہیوسٹن میں مونٹروس بولیوارڈ اور ایلن پارک وے پر، بفیلو بائیو پارک کے ساتھ واقع ہیں۔ زائرین کے لیے احاطے میں مفت پارکنگ دستیاب ہے۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "दिशा-निर्देश और पार्किंग: हम ह्यूस्टन में मॉन्ट्रोस बुलेवार्ड और एलन पार्कवे पर बफ़ेलो बायू पार्क के पास स्थित हैं। हमारे पास आगंतुकों के लिए निःशुल्क पार्किंग है। अन्य प्रश्न के लिए 1 दबाएं।"
              : "Directions and Parking: We are located in Houston at Montrose Boulevard and Allen Parkway, right next to Buffalo Bayou Park. We have free parking for visitors in our parking lot. Press 1 to ask me another question.",
          label: t('hotline.menu_5', 'Free Parking'),
          intent: 'Directions & Parking',
        };
      case '6':
        return {
          speech:
            language === 'es'
              ? "Edificio y Jardines: El centro fue diseñado por la arquitecta Farshid Moussavi, con porches sombreados y celosías cerámicas. Los 11 acres de jardines fueron diseñados por Nelson Byrd Woltz, con senderos, árboles y fuentes. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "عمارت اور باغات: یہ سینٹر نامور ماہر تعمیرات فرشد موسوی نے ڈیزائن کیا ہے جس میں خوبصورت برآمدے اور جالی دار اسکرینیں ہیں۔ 11 ایکڑ باغات نیلسن برڈ ولٹز نے ڈیزائن کیے ہیں۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "इमारत और बगीचे: केंद्र को वास्तुकार फर्शिन मूसवी द्वारा डिजाइन किया गया था। इसमें छायादार बरामदे हैं। 11 एकड़ के बगीचे नेल्सन बर्ड वोल्ट्ज़ द्वारा डिजाइन किए गए हैं। अन्य प्रश्न के लिए 1 दबाएं।"
              : "Building and Gardens: The center was designed by architect Farshid Moussavi. It features cool shaded porches and ceramic walls. The 11 acres of gardens were designed by Nelson Byrd Woltz, with peaceful paths, Texas trees, and water pools. Press 1 to ask me another question.",
          label: t('hotline.menu_6', 'Gardens & Building'),
          intent: 'Architecture & Gardens',
        };
      case '7':
        return {
          speech:
            language === 'es'
              ? "Acerca de Su Alteza el Aga Khan: El Centro fue fundado por Su Alteza el Aga Khan, el 49º Imán espiritual hereditario de los musulmanes chiitas ismailíes. Creó el centro como un espacio de diálogo pluralista y entendimiento. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "آغا خان کے متعلق: یہ سینٹر عالی جاہ آغا خان نے قائم کیا ہے جو اسماعیلی مسلمانوں کے 49 ویں روحانی امام ہیں۔ انہوں نے اس مرکز کو کثرتیت اور باہمی افہام و تفہیم کے پل کے طور پر بنایا ہے۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "आगा खान के बारे में: केंद्र की स्थापना महामहिम आगा खान द्वारा की गई थी। वे इस्माइली मुसलमानों के 49वें आध्यात्मिक नेता हैं। उन्होंने इस केंद्र को ज्ञान और संवाद के लिए बनाया है। अन्य प्रश्न के लिए 1 दबाएं।"
              : "About the Aga Khan: The center was established by His Highness the Aga Khan. He is the 49th spiritual leader of the Ismaili Muslims. He created the center as a peaceful place for people of all backgrounds to learn and meet. Press 1 to ask me another question.",
          label: t('hotline.menu_7', 'Aga Khan Info'),
          intent: 'Aga Khan & Pluralism',
        };
      case '8':
        return {
          speech:
            language === 'es'
              ? "Qué Vestir: Por favor vista ropa respetuosa que cubra hombros y rodillas dentro del edificio. Se recomiendan zapatos cómodos para los jardines. Se permite tomar fotos en exteriores. Presione 1 para hacerme otra pregunta."
              : language === 'ur'
              ? "لباس کے آداب: عمارت کے اندر کندھوں اور گھٹنوں کو ڈھانپنے والا باوقار لباس پہنیں۔ باغات کی سیر کے لیے آرام دہ جوتے مناسب ہیں۔ باہر تصاویر لینے کی اجازت ہے۔ مزید سوال کے لیے 1 دبائیں۔"
              : language === 'hi'
              ? "पहनावा: इमारत के अंदर कंधे और घुटने ढके हुए शालीन कपड़े पहनें। बगीचों में टहलने के लिए आरामदायक जूते पहनें। बाहर तस्वीरें लेने की अनुमति है। अन्य प्रश्न के लिए 1 दबाएं।"
              : "What to Wear: Please wear simple, respectful clothes that cover your shoulders and knees inside the building. Comfortable walking shoes are great for the gardens. You are welcome to take photos outside. Press 1 to ask me another question.",
          label: t('hotline.menu_8', 'What to Wear'),
          intent: 'Dress Code & Etiquette',
        };
      case '9':
        return {
          speech:
            language === 'es'
              ? "Aquí tiene las opciones de nuevo: Para hablar conmigo presione 1. Para horarios presione 2. Para oración presione 3. Para visitas guiadas presione 4. Para direcciones y estacionamiento presione 5. Para llamar al personal llame al 713-522-2026."
              : language === 'ur'
              ? "یہ مینو کے اختیارات دوبارہ ہیں: بات کرنے کے لیے 1 دبائیں۔ اوقات کے لیے 2 دبائیں۔ نماز کے لیے 3 دبائیں۔ ٹورز کے لیے 4 دبائیں۔ پارکنگ کے لیے 5 دبائیں۔ عملے سے بات کے لیے 713-522-2026 پر کال کریں۔"
              : language === 'hi'
              ? "विकल्प फिर से: बात करने के लिए 1 दबाएं। समय के लिए 2 दबाएं। प्रार्थना के लिए 3 दबाएं। टूर के लिए 4 दबाएं। पार्किंग के लिए 5 दबाएं। स्टाफ से बात करने के लिए 713-522-2026 पर कॉल करें।"
              : "Here are the options again: To speak with me, press 1. For hours, press 2. For prayer times, press 3. For tours, press 4. For directions and parking, press 5. If the AI cannot answer your question, call our human staff at 713-522-2026.",
          label: t('hotline.menu_9', 'Repeat Menu'),
          intent: 'Menu Repeat',
        };
      case '*':
        return {
          speech:
            language === 'es'
              ? "¡Hola y bienvenido! Soy el asistente telefónico con IA del Ismaili Center Houston. Presione 1 para hablar conmigo, o presione 0 para llamar al personal al 713-522-2026."
              : language === 'ur'
              ? "خوش آمدید! میں اسماعیلی سینٹر ہیوسٹن کا اے آئی فون بوٹ ہوں۔ بات کرنے کے لیے 1 دبائیں، یا عملے سے بات کے لیے 0 دبائیں۔"
              : language === 'hi'
              ? "नमस्ते और स्वागत है! मैं इस्माइली सेंटर ह्यूस्टन का एआई फोनबॉट हूँ। बात करने के लिए 1 दबाएं, या स्टाफ को कॉल करने के लिए 0 दबाएं।"
              : "Hello and welcome! I am the automated AI Phonebot for the Ismaili Center Houston. Press 1 to talk with me, or press 0 if you need to call our human staff at 713-522-2026.",
          label: t('hotline.menu_star', 'Start Over'),
          intent: 'Start Over',
        };
      default:
        return { speech: '', label: '', intent: '' };
    }
  };

  const keypadItems: KeypadItem[] = [
    {
      digit: '1',
      sub: t('hotline.key_talk', 'TALK'),
      label: t('hotline.menu_1', 'Talk with AI'),
      handler: () => {
        const item = getKeypadResponse('1');
        handleKeypadPress('1', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '2',
      sub: t('hotline.key_hours', 'HOURS'),
      label: t('hotline.menu_2', 'Visiting Hours'),
      handler: () => {
        const item = getKeypadResponse('2');
        handleKeypadPress('2', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '3',
      sub: t('hotline.key_prayer', 'PRAYER'),
      label: t('hotline.menu_3', 'Prayer Times'),
      handler: () => {
        const item = getKeypadResponse('3');
        handleKeypadPress('3', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '4',
      sub: t('hotline.key_tours', 'TOURS'),
      label: t('hotline.menu_4', 'Free Tours'),
      handler: () => {
        const item = getKeypadResponse('4');
        handleKeypadPress('4', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '5',
      sub: t('hotline.key_parking', 'PARKING'),
      label: t('hotline.menu_5', 'Free Parking'),
      handler: () => {
        const item = getKeypadResponse('5');
        handleKeypadPress('5', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '6',
      sub: t('hotline.key_gardens', 'GARDENS'),
      label: t('hotline.menu_6', 'Gardens & Building'),
      handler: () => {
        const item = getKeypadResponse('6');
        handleKeypadPress('6', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '7',
      sub: t('hotline.key_leader', 'LEADER'),
      label: t('hotline.menu_7', 'Aga Khan Info'),
      handler: () => {
        const item = getKeypadResponse('7');
        handleKeypadPress('7', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '8',
      sub: t('hotline.key_dress', 'CLOTHES'),
      label: t('hotline.menu_8', 'What to Wear'),
      handler: () => {
        const item = getKeypadResponse('8');
        handleKeypadPress('8', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '9',
      sub: t('hotline.key_repeat', 'REPEAT'),
      label: t('hotline.menu_9', 'Repeat Menu'),
      handler: () => {
        const item = getKeypadResponse('9');
        handleKeypadPress('9', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '*',
      sub: t('hotline.key_start', 'START'),
      label: t('hotline.menu_star', 'Start Over'),
      handler: () => {
        const item = getKeypadResponse('*');
        handleKeypadPress('*', item.speech, item.label, item.intent);
      },
    },
    {
      digit: '0',
      sub: t('hotline.key_staff', 'STAFF'),
      label: t('hotline.menu_0', 'Human Staff (+1 713-522-2026)'),
      handler: () => {
        telecomAudio.playDTMF('0');
        setIsTransferModalOpen(true);
      },
    },
    {
      digit: '#',
      sub: t('hotline.key_end', 'HANG UP'),
      label: t('hotline.end_btn', 'End Call'),
      handler: () => {
        telecomAudio.playDTMF('#');
        endCall();
      },
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-12">
      {/* Top Header & Phonebot Pipeline Quick-Inspector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Automated AI Receptionist & Telephony Agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white">
            Ismaili Center Houston AI Phonebot
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Speech-to-Speech natural conversational voice agent with instant inquiry resolution, tour bookings, message intake, and warm staff handoff.
          </p>
        </div>

        {/* Top Action Buttons: Pipeline Inspector (Admin Only) & Task Execution */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Admin Mode: Inspect 5-Layer STT/LLM/TTS/Telephony Architecture"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Pipeline Inspector</span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/60 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-200">
                Admin
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                ~{telemetry.roundtripLatencyMs}ms
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Redirects to the official Ismaili Center tour registration portal"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Official Tour Portal</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Telephone Console & Touch-Tone Keypad (Spacious Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Virtual Phone Console (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0e1726] to-slate-950 text-white shadow-xl border border-slate-800 space-y-6">
          
          {/* Phone Top Status Header */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 font-mono">
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                callState === 'connected' 
                  ? 'bg-emerald-400 animate-pulse' 
                  : callState === 'on_hold' 
                  ? 'bg-amber-400 animate-bounce' 
                  : callState === 'ringing' 
                  ? 'bg-amber-400 animate-ping' 
                  : 'bg-slate-500'
              }`} />
              <span className="font-semibold text-slate-300 tracking-wider">
                {callState === 'connected' ? t('hotline.call_active', 'CALL ACTIVE') : callState === 'on_hold' ? t('hotline.on_hold', 'ON HOLD') : callState === 'ringing' ? t('hotline.connecting', 'CONNECTING...') : t('hotline.standby', 'STANDBY')}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-sans font-bold bg-slate-800/60 px-2 py-0.5 rounded">
                {telemetry.telephonyCodec}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-bold">
                {callState === 'connected' || callState === 'on_hold' ? formatTimer(callSeconds) : '00:00'}
              </span>
            </div>
          </div>

          {/* Caller Identification Centerpiece */}
          <div className="text-center space-y-2 py-1">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-rose-400 uppercase tracking-widest bg-rose-950/40 border border-rose-800/50">
              {t('hotline.bot_badge', 'Automated Voice Helper (Not a Human)')}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel">
              {t('hotline.center_name', 'Ismaili Center Houston')}
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              {t('hotline.center_phone', 'Information Line: +1 (713) 522-2026')}
            </p>
            
            {/* Dynamic Status Text */}
            <div className="pt-1.5">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700">
                {statusText}
              </span>
            </div>
          </div>

          {/* Reactive Telephony Sound Visualizer */}
          <div className="w-full py-1 flex items-center justify-center">
            <div className="flex items-center space-x-2 h-14 px-8 py-3 rounded-2xl bg-black/50 border border-slate-800">
              {[18, 32, 44, 26, 48, 38, 22, 42, 34, 46, 28, 16].map((height, i) => {
                const isAnimated = (callState === 'connected' && operatorSpeaking) || callState === 'ringing' || callState === 'on_hold';
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      callState === 'on_hold'
                        ? 'bg-amber-400 animate-pulse'
                        : isAnimated 
                        ? 'bg-rose-500 animate-pulse' 
                        : callState === 'connected'
                        ? 'bg-emerald-500/80'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: isAnimated ? `${Math.max(8, (height * ((i % 3) + 1)) % 40)}px` : '6px',
                      animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Telephony Voice & Audio Controls Bar */}
          <div className="w-full bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Voice Persona Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">{t('hotline.voice_label', 'Voice:')}</span>
              <select
                value={selectedVoiceType}
                onChange={(e) => setSelectedVoiceType(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-rose-500"
              >
                <option value="uk-male">{t('hotline.voice_uk', 'UK English Male (Polite)')}</option>
                <option value="us-female">{t('hotline.voice_us', 'US English Female (Friendly)')}</option>
                <option value="system">{t('hotline.voice_device', 'Device Default')}</option>
              </select>
            </div>

            {/* Accessible Speed for Immigrants / Seniors */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">{t('hotline.pace_label', 'Pace:')}</span>
              <select
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-rose-500"
              >
                <option value={0.85}>{t('hotline.pace_slow', '0.8x (Slower Pace)')}</option>
                <option value={0.92}>{t('hotline.pace_normal', '0.92x (Relaxed & Clear)')}</option>
                <option value={1.0}>{t('hotline.pace_standard', '1.0x (Standard)')}</option>
                <option value={1.15}>{t('hotline.pace_brisk', '1.15x (Brisk)')}</option>
              </select>
            </div>
          </div>

          {/* Call State Main Controls */}
          <div className="w-full pt-1 flex flex-col items-center justify-center space-y-4">
            {callState === 'idle' || callState === 'ended' ? (
              <div className="w-full flex flex-col items-center space-y-2">
                <button
                  type="button"
                  onClick={startCall}
                  className="w-full max-w-sm py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center space-x-3 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-5 h-5 fill-current" />
                  <span>{t('hotline.call_btn', 'Start AI Voice Helper')}</span>
                </button>
                <p className="text-xs text-slate-400 text-center">
                  {t('hotline.tap_to_begin', 'Tap above to begin speaking or pressing keypad buttons')}
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  {/* Hold / Resume Call button */}
                  <button
                    type="button"
                    onClick={toggleHold}
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      callState === 'on_hold'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title={callState === 'on_hold' ? t('hotline.resume', 'Resume Call') : t('hotline.hold', 'Place on Hold with Music')}
                  >
                    {callState === 'on_hold' ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                    <span>{callState === 'on_hold' ? t('hotline.resume', 'Resume') : t('hotline.hold', 'Hold')}</span>
                  </button>

                  {/* Push to talk / Mic button */}
                  <button
                    type="button"
                    onClick={() => setIsMicActive(!isMicActive)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isMicActive
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border-rose-800'
                    }`}
                    title={isMicActive ? t('hotline.mute', 'Mute Mic') : t('hotline.unmute', 'Unmute Mic')}
                  >
                    {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  {/* Speaker Mute button */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      !isMuted
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border-rose-800'
                    }`}
                    title={isMuted ? t('hotline.unmute_sound', 'Turn Sound On') : t('hotline.mute_sound', 'Mute Assistant Sound')}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Warm Transfer to Human Staff */}
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-500/50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title={t('hotline.transfer_staff', 'Warm Transfer to Human Line')}
                  >
                    <PhoneForwarded className="w-4 h-4" />
                    <span>{t('hotline.transfer_staff', 'Transfer to Staff')}</span>
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={endCall}
                    className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4 fill-current" />
                    <span>{t('hotline.end_btn', 'End Call')}</span>
                  </button>
                </div>

                {/* Two-Way Voice Communication Section */}
                <div className="pt-3 border-t border-slate-800 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-rose-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>{t('hotline.live_helper', 'Live Voice Helper')}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {callState === 'on_hold' ? t('hotline.paused_hold', 'PAUSED ON HOLD') : t('hotline.mic_active', 'MIC ACTIVE')}
                    </span>
                  </div>

                  {/* Interactive Voice Talk Station */}
                  <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                    {/* Live speech feedback if hearing words */}
                    {userInterimSpeech && (
                      <div className="w-full text-center px-4 py-2 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs italic animate-pulse">
                        {t('hotline.hearing', 'Hearing:')} "{userInterimSpeech}..."
                      </div>
                    )}

                    {/* Talk to Phonebot Primary Button */}
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
                          setStatusText(t('hotline.voice_paused_status', 'Voice paused • Tap to talk again'));
                        } else {
                          startListening();
                        }
                      }}
                      className={`w-full py-3.5 px-5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer shadow-md active:scale-95 disabled:opacity-50 ${
                        operatorSpeaking
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/40'
                          : isListening
                          ? 'bg-rose-600 text-white border border-rose-500 animate-pulse shadow-rose-900/50'
                          : isProcessingVoice
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 shadow-emerald-950/40'
                      }`}
                    >
                      {operatorSpeaking ? (
                        <>
                          <Volume2 className="w-4 h-4 animate-bounce" />
                          <span>{t('hotline.interrupt_speak', 'AI is Speaking (Tap to Interrupt & Talk)')}</span>
                        </>
                      ) : isListening ? (
                        <>
                          <Mic className="w-4 h-4 animate-pulse text-white" />
                          <span>{t('hotline.listening_speak_now', 'Listening to your voice... Speak now')}</span>
                        </>
                      ) : isProcessingVoice ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
                          <span>{t('hotline.ai_thinking', 'AI is thinking...')}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>{t('hotline.tap_to_talk', 'Tap to Talk to AI Phonebot')}</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                      {t('hotline.voice_help_desc', 'Speak normally into your microphone. The AI helper will listen and reply by voice.')}
                    </p>
                  </div>

                  {/* Spoken Voice Shortcuts */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      {t('hotline.quick_questions', 'Or tap a quick question:')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: 'prompt_hours', text: t('hotline.prompt_hours', 'What are the visiting hours?') },
                        { key: 'prompt_tour', text: t('hotline.prompt_tour', 'Book an architectural tour') },
                        { key: 'prompt_evening_prayer', text: t('hotline.prompt_evening_prayer', 'What time is evening prayer?') },
                        { key: 'prompt_parking', text: t('hotline.prompt_parking', 'Where is the free parking?') },
                        { key: 'prompt_dress', text: t('hotline.prompt_dress', 'What is the dress code?') },
                        { key: 'prompt_message', text: t('hotline.prompt_message', 'Leave a message for staff') },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            addTranscriptEntry(t('hotline.speaker_user_prompt', 'You (Voice Prompt)'), item.text);
                            handleUserVoiceInput(item.text);
                          }}
                          disabled={operatorSpeaking || isProcessingVoice || callState === 'on_hold'}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/60 transition-all cursor-pointer text-left active:scale-95 disabled:opacity-50"
                        >
                          "{item.text}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Touch-Tone Telephone Keypad & Reception Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-[#131d2e] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-rose-600" />
                <span>{t('hotline.keypad_title', 'Touch-Tone Dialpad')}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('hotline.keypad_desc', 'Press any number below to hear information')}
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider">
              {t('hotline.keypad_ready', 'KEYPAD READY')}
            </span>
          </div>

          {/* Dialpad Matrix with generous button sizing */}
          <div className="grid grid-cols-3 gap-3">
            {keypadItems.map((item) => (
              <button
                key={item.digit}
                type="button"
                onClick={item.handler}
                className="flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 text-slate-800 dark:text-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group"
              >
                <span className="text-2xl font-bold font-mono group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  {item.digit}
                </span>
                <span className="text-[10px] font-semibold font-mono text-slate-400 dark:text-slate-500 tracking-wider mt-0.5">
                  {item.sub}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Reception Tasks: Tour Booking & Voicemail Intake */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              {t('hotline.reception_tasks', 'Automated Reception Tasks:')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-left space-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('hotline.official_tour_portal', 'Official Tour Portal')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {t('hotline.register_official', 'Register on official website')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsMessageModalOpen(true)}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-left space-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('hotline.leave_message', 'Leave Message')}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {t('hotline.voicemail_intake', 'Front-desk voicemail intake')}
                </p>
              </button>
            </div>
          </div>

          {/* Clean Keypad Directory Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
            <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              {t('hotline.menu_directory', 'Touch-Tone Menu Directory:')}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium"><strong className="text-rose-600 font-mono">[1]</strong> {t('hotline.menu_1', 'Talk with AI')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[2]</strong> {t('hotline.menu_2', 'Visiting Hours')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[3]</strong> {t('hotline.menu_3', 'Prayer Times')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[4]</strong> {t('hotline.menu_4', 'Free Tours')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[5]</strong> {t('hotline.menu_5', 'Free Parking')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[6]</strong> {t('hotline.menu_6', 'Gardens & Building')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[7]</strong> {t('hotline.menu_7', 'Aga Khan Info')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[8]</strong> {t('hotline.menu_8', 'What to Wear')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[9]</strong> {t('hotline.menu_9', 'Repeat Menu')}</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[*]</strong> {t('hotline.menu_star', 'Start Over')}</span>
              <span className="font-medium col-span-2 text-amber-700 dark:text-amber-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                <strong className="font-mono">[0]</strong> {t('hotline.menu_0', 'Human Staff (+1 713-522-2026)')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Call Transcript with Intent Recognition Badges */}
      <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('hotline.transcript_title', 'Live Phone Call Transcript')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('hotline.transcript_sub', 'Live transcript with speech-to-text decoding and classified intent tags')}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {t('schedule.houston_time', 'Houston Central Time')}
          </span>
        </div>

        <div 
          ref={transcriptBottomRef}
          className="h-64 overflow-y-auto space-y-3.5 pr-2 text-xs"
        >
          {transcript.length === 0 ? (
            <div className="text-center py-12 space-y-3 max-w-md mx-auto">
              <Radio className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                {t('hotline.transcript_empty', 'Start a call to see live speech-to-text transcript.')}
              </p>
            </div>
          ) : (
            transcript.map((entry, idx) => {
              const isUser = entry.speaker.startsWith('You');
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUser
                      ? 'bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100 ml-6 sm:ml-12'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-6 sm:mr-12'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={isUser ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white font-bold'}>
                        {entry.speaker}
                      </span>
                      {entry.intent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {entry.intent}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      {entry.time}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap text-sm">{entry.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Human Staff Fallback & Contact Card */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>{t('hotline.unanswered_title', 'Have questions not answered by the AI bot?')}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('hotline.unanswered_desc', 'Our human staff members are available on the official phone line to assist with visiting arrangements, special group tours, accessibility needs, or community inquiries.')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>{t('hotline.call_staff_btn', 'Call +1 (713) 522-2026')}</span>
            </button>
            <a
              href="https://ismailicenter.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <span>{t('hotline.visit_website_btn', 'Visit ismailicenter.org')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
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
