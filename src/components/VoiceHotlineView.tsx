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
  MapPin
} from 'lucide-react';
import { telecomAudio } from '../utils/telecomAudio.ts';
import { formatCentralTimestamp } from '../utils/time.ts';
import { getSmartAssistantResponse, cleanSpokenPhoneText } from '../utils/smartAssistant.ts';
import { 
  getGoogleUKEnglishMaleVoice, 
  humanizeSpokenText 
} from '../utils/naturalVoice.ts';

interface KeypadItem {
  digit: string;
  sub: string;
  label: string;
  handler: () => void;
}

export const VoiceHotlineView: React.FC = () => {
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Hotline Ready • Click Call Hotline to Connect');
  const [operatorSpeaking, setOperatorSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([]);
  const [userInterimSpeech, setUserInterimSpeech] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const callActiveRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const operatorSpeakingRef = useRef<boolean>(false);
  const speakingCooldownUntilRef = useRef<number>(0);
  const lastBotSpeechTextRef = useRef<string>('');
  const lastBotSpeechTimeRef = useRef<number>(0);

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

  const addTranscriptEntry = (speaker: string, text: string) => {
    const time = formatCentralTimestamp();
    setTranscript((prev) => [...prev, { speaker, text, time }]);
  };

  // Safe Speech Recognition control for talking to the AI phonebot
  const startListening = () => {
    // CRITICAL ANTI-LOOPBACK: Never start listening while the bot is speaking or during echo cooldown
    if (!callActiveRef.current || operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current || !isMicActive) {
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
        // Double check loopback lock
        if (!callActiveRef.current || operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current) {
          try { recog.abort(); } catch (e) {}
          setIsListening(false);
          return;
        }
        setIsListening(true);
        setStatusText('AI Phonebot is listening... Speak your question now');
      };

      recog.onresult = (event: any) => {
        // CRITICAL ANTI-LOOPBACK: Discard any audio input if caller disconnected, operator is speaking, or within echo cooldown
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
        if (callActiveRef.current && !operatorSpeakingRef.current) {
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
    // If call was hung up, cut off immediately
    if (!callActiveRef.current) return;

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
    utterance.lang = 'en-GB';

    // Strictly assign Google UK English Male (en-GB) voice
    const ukVoice = getGoogleUKEnglishMaleVoice();
    if (ukVoice) {
      utterance.voice = ukVoice;
    }

    utterance.pitch = 1.0;
    utterance.rate = 0.95;

    utterance.onstart = () => {
      if (!callActiveRef.current) {
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
      // Cooldown buffer of 700ms prevents speaker room echo from re-entering the microphone
      speakingCooldownUntilRef.current = Date.now() + 700;
      lastBotSpeechTimeRef.current = Date.now();

      if (!callActiveRef.current) return;
      setStatusText('Line Active • Listening... Speak now');

      setTimeout(() => {
        if (callActiveRef.current && !operatorSpeakingRef.current && isMicActive) {
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

      if (!callActiveRef.current) return;
      setStatusText('Line Active • Ready for your voice...');

      setTimeout(() => {
        if (callActiveRef.current && !operatorSpeakingRef.current && isMicActive) {
          startListening();
        }
        if (onDone) onDone();
      }, 700);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Process caller voice input via smart assistant engine and respond aloud with phone-catered manner
  const handleUserVoiceInput = async (query: string) => {
    if (!callActiveRef.current) return;

    // ANTI-LOOPBACK: Discard voice input if operator was speaking or still within room echo cooldown
    if (operatorSpeakingRef.current || Date.now() < speakingCooldownUntilRef.current) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) return;

    // Filter out acoustic loopback: if caller's mic picked up a snippet of what the bot just said
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

    setIsProcessingVoice(true);
    setStatusText('AI Phonebot is thinking...');
    stopListening();

    addTranscriptEntry('You (Voice)', trimmed);
    const personaSpeaker = 'AI Phonebot';

    try {
      const response = await getSmartAssistantResponse(trimmed, [], { mode: 'phone' });
      if (!callActiveRef.current) return;

      const reply = response.reply || "I am sorry, I do not know the answer to that question. Please call our human staff at the official Information Line at +1 (713) 522-2026. They will be happy to assist you. You can also press 1 to ask me another question.";
      addTranscriptEntry(personaSpeaker, reply);
      speakText(reply);
    } catch (_err) {
      if (!callActiveRef.current) return;
      const fallbackReply = "I am sorry, I do not know the answer to that question. Please call our human staff at the official Information Line at +1 (713) 522-2026. They will be happy to assist you. You can also press 1 to ask me another question.";
      addTranscriptEntry(personaSpeaker, fallbackReply);
      speakText(fallbackReply);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Start call: play ringback tone, then immediately greet caller via AI Phonebot
  const startCall = () => {
    callActiveRef.current = true;
    setCallState('ringing');
    setIsPaused(false);
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

      // Simple, honest AI Phonebot Greeting
      const phonebotGreeting = 
        "Hello! Welcome to the Ismaili Center Houston AI Phonebot. I am an automated computer helper, not a human. To talk with me, press 1. For visiting hours, press 2. For prayer times, press 3. For free tours, press 4. For directions and parking, press 5. If the AI cannot answer your question, call our human staff at 713-522-2026.";

      addTranscriptEntry('AI Phonebot', phonebotGreeting);
      speakText(phonebotGreeting);
    });
  };

  // End call: IMMEDIATELY cut off phonebot speech and all telecom audio
  const endCall = () => {
    callActiveRef.current = false;
    operatorSpeakingRef.current = false;
    setCallState('ended');
    setIsPaused(false);
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

    setStatusText('Call Ended • Total time ' + formatTimer(callSeconds));
  };

  // Handle keypad digit presses with genuine DTMF audio
  const handleKeypadPress = (digit: string, responseText: string, menuTitle: string) => {
    telecomAudio.playDTMF(digit);

    if (callState !== 'connected') {
      return;
    }

    addTranscriptEntry(`You (Keypad [${digit}])`, menuTitle);
    addTranscriptEntry('AI Phonebot', responseText);
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
          'Option 1: Talk with AI'
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
          'Option 2: Visiting Hours'
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
          'Option 3: Prayer Times'
        ),
    },
    {
      digit: '4',
      sub: 'TOURS',
      label: 'Free Guided Tours',
      handler: () =>
        handleKeypadPress(
          '4',
          "Free Tours: We offer 45-minute guided tours on Tuesdays, Thursdays, Saturdays, and Sundays. You can sign up online for free at ismailicenter.org/tour-booking. Walk-ins are also welcome if space allows. Press 1 to ask me another question.",
          'Option 4: Free Guided Tours'
        ),
    },
    {
      digit: '5',
      sub: 'PARKING',
      label: 'Directions & Parking',
      handler: () =>
        handleKeypadPress(
          '5',
          "Directions and Parking: We are located in Houston at Montrose Boulevard and Allen Parkway, right next to Buffalo Bayou Park. We have free parking for visitors in our parking lot. Press 1 to ask me another question.",
          'Option 5: Directions & Free Parking'
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
          'Option 6: Building & 11-Acre Gardens'
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
          'Option 7: About the Aga Khan'
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
          'Option 8: What to Wear'
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
          'Option 9: Repeat Menu'
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
          'Option *: Start Over'
        ),
    },
    {
      digit: '0',
      sub: 'STAFF',
      label: 'Human Staff Line',
      handler: () => {
        telecomAudio.playDTMF('0');
        const lineNotice = "If the AI cannot answer your question, or if you need to speak with human staff, please call our official staff phone line at +1 (713) 522-2026. You can also press 1 to keep talking with me.";
        addTranscriptEntry('You (Keypad [0])', 'Call Human Staff (+1 713-522-2026)');
        addTranscriptEntry('AI Phonebot', lineNotice);
        speakText(lineNotice);
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* 1. Clear Distinction & Human Staff Hotline Reassurance Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/70 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
              <span>Notice: Automated Computer Assistant (Not Human Staff)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-cinzel">
              This is an AI Phonebot — Not the Human Hotline
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              This webpage is an automated computer helper. Please do not confuse this with our real staff telephone number. If the computer cannot answer your questions, or if you need personal help, please call our real human staff directly on the official Information Line:
            </p>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto">
            <a
              href="tel:+17135222026"
              className="w-full md:w-auto inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Call Human Staff: +1 (713) 522-2026</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Page Header with Clean Flow */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Automated Voice Helper</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white">
          Ismaili Center Houston AI Phonebot
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Ask questions using your voice or tap the telephone keypad numbers below. Simple, easy answers about hours, prayer times, free tours, and directions.
        </p>
      </div>

      {/* 3. Telephone Console & Touch-Tone Keypad (Spacious Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Virtual Phone Console (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-[#0e1726] to-slate-950 text-white shadow-xl border border-slate-800 space-y-7">
          
          {/* Phone Top Status Header */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-4 font-mono">
            <span className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${callState === 'connected' ? 'bg-emerald-400 animate-pulse' : callState === 'ringing' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="font-semibold text-slate-300 tracking-wider">
                {callState === 'connected' ? 'AI CALL ACTIVE' : callState === 'ringing' ? 'CONNECTING...' : 'STANDBY'}
              </span>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-bold">
              {callState === 'connected' ? formatTimer(callSeconds) : '00:00'}
            </span>
          </div>

          {/* Caller Identification Centerpiece */}
          <div className="text-center space-y-2 py-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold text-rose-400 uppercase tracking-widest bg-rose-950/40 border border-rose-800/50">
              Automated Computer Assistant
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel">
              Ismaili Center Houston
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Virtual Voice Assistant (Not a Human)
            </p>
            
            {/* Dynamic Status Text */}
            <div className="pt-2">
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700">
                {statusText}
              </span>
            </div>
          </div>

          {/* Reactive Telephony Sound Visualizer */}
          <div className="w-full py-2 flex items-center justify-center">
            <div className="flex items-center space-x-2 h-14 px-8 py-3 rounded-2xl bg-black/50 border border-slate-800">
              {[18, 32, 44, 26, 48, 38, 22, 42, 34, 46, 28, 16].map((height, i) => {
                const isAnimated = (callState === 'connected' && operatorSpeaking) || callState === 'ringing';
                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isAnimated 
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

          {/* Call State Main Controls */}
          <div className="w-full pt-2 flex flex-col items-center justify-center space-y-4">
            {callState === 'idle' || callState === 'ended' ? (
              <div className="w-full flex flex-col items-center space-y-2">
                <button
                  type="button"
                  onClick={startCall}
                  className="w-full max-w-sm py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center space-x-3 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-5 h-5 fill-current" />
                  <span>Start AI Voice Helper</span>
                </button>
                <p className="text-xs text-slate-400 text-center">
                  Tap above to begin speaking or pressing keypad buttons
                </p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {/* Push to talk / Mic button */}
                  <button
                    type="button"
                    onClick={() => setIsMicActive(!isMicActive)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isMicActive
                        ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border-rose-800'
                    }`}
                    title={isMicActive ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
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
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      !isMuted
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border-rose-800'
                    }`}
                    title={isMuted ? 'Turn Sound On' : 'Mute Assistant Sound'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={endCall}
                    className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <PhoneOff className="w-5 h-5 fill-current" />
                    <span>Hang Up</span>
                  </button>
                </div>

                {/* Two-Way Voice Communication Section */}
                <div className="pt-4 border-t border-slate-800 w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-rose-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>Live Voice Helper</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      MICROPHONE READY
                    </span>
                  </div>

                  {/* Interactive Voice Talk Station */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    {/* Live speech feedback if hearing words */}
                    {userInterimSpeech && (
                      <div className="w-full text-center px-4 py-2 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs italic animate-pulse">
                        Hearing: "{userInterimSpeech}..."
                      </div>
                    )}

                    {/* Talk to Phonebot Primary Button */}
                    <button
                      type="button"
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
                      className={`w-full py-3.5 px-5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer shadow-md active:scale-95 ${
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
                          <span>AI is Speaking (Tap to Interrupt & Talk)</span>
                        </>
                      ) : isListening ? (
                        <>
                          <Mic className="w-4 h-4 animate-pulse text-white" />
                          <span>Listening to your voice... Speak now</span>
                        </>
                      ) : isProcessingVoice ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
                          <span>AI is thinking...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Tap to Talk to AI Phonebot</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                      Speak normally into your microphone. The AI helper will listen and reply by voice.
                    </p>
                  </div>

                  {/* Spoken Voice Shortcuts */}
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Or tap a quick question:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'What are the visiting hours?',
                        'How do I book a free tour?',
                        'What time is evening prayer?',
                        'Where is the free parking?',
                        'Can anyone visit the gardens?',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            addTranscriptEntry('You (Voice Prompt)', prompt);
                            handleUserVoiceInput(prompt);
                          }}
                          disabled={operatorSpeaking || isProcessingVoice}
                          className="px-3 py-1.5 rounded-xl text-xs bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/60 transition-all cursor-pointer text-left active:scale-95 disabled:opacity-50"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Touch-Tone Telephone Keypad (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-[#131d2e] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-rose-600" />
                <span>Touch-Tone Keypad</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Press any number below to hear information
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider">
              KEYPAD READY
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

          {/* Clean Keypad Directory Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
            <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Touch-Tone Menu Directory:
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium"><strong className="text-rose-600 font-mono">[1]</strong> Talk with AI</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[2]</strong> Visiting Hours</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[3]</strong> Prayer Times</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[4]</strong> Free Tours</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[5]</strong> Free Parking</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[6]</strong> Gardens & Building</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[7]</strong> Aga Khan Info</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[8]</strong> What to Wear</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[9]</strong> Repeat Menu</span>
              <span className="font-medium"><strong className="text-rose-600 font-mono">[*]</strong> Start Over</span>
              <span className="font-medium col-span-2 text-amber-700 dark:text-amber-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                <strong className="font-mono">[0]</strong> Human Staff (+1 713-522-2026)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Real-time Call Transcript */}
      <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Call Conversation History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Read what you and the AI Phonebot said during this call
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Houston Central Time (CT)
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
                Press <strong>"Start AI Voice Helper"</strong> above. Once connected, what you say and the AI answers will show here like a text conversation.
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
                    <span className={isUser ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white font-bold'}>
                      {entry.speaker}
                    </span>
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

      {/* 5. Reassurance & Real Human Staff Contact Card */}
      <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>Have questions not answered by the AI bot?</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Our real staff members are available on the official phone line to help you with visiting information, special group tours, accessibility, or any other inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="tel:+17135222026"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Call +1 (713) 522-2026</span>
            </a>
            <a
              href="https://ismailicenter.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <span>Visit ismailicenter.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
