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
  Wifi, 
  Check, 
  RotateCcw,
  Clock,
  ShieldCheck
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

      const reply = response.reply || "I'm sorry, I couldn't find an answer to that. Please call our dedicated Information Line at +1 (713) 522-2026 for further assistance. You can also press 1 to speak directly with me, or ask about our visiting hours, prayer times, or tours.";
      addTranscriptEntry(personaSpeaker, reply);
      speakText(reply);
    } catch (_err) {
      if (!callActiveRef.current) return;
      const fallbackReply = "I'm sorry, I couldn't find an answer to that. Please call our dedicated Information Line at +1 (713) 522-2026 for further assistance. You can also press 1 to speak directly with me, or ask about our visiting hours, prayer times, or tours.";
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
    setStatusText('Connecting to +1 (713) 522-2026... Dialing');

    telecomAudio.playRingback(() => {
      if (!callActiveRef.current) return;

      setCallState('connected');
      setStatusText('Call Connected • AI Phonebot Online');

      // Start duration counter
      timerRef.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);

      // Authentic IVR Telephone Greeting
      const phonebotGreeting = 
        "Thank you for reaching the Ismaili Center Houston's Official Phonebot. To speak directly with me press 1, for hours press 2, for prayer press 3, for tours press 4, for directions and parking press 5, or press 0 for our dedicated Information Line at 713-522-2026.";

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

    setStatusText('Call Ended • Audio Cut Off • Duration ' + formatTimer(callSeconds));
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

  // Interactive Voice Response (IVR) phone tree options
  const keypadItems: KeypadItem[] = [
    {
      digit: '1',
      sub: 'TALK',
      label: 'Speak Directly with Me',
      handler: () =>
        handleKeypadPress(
          '1',
          "I am speaking directly with you! Please ask me any question about visiting hours, Jamatkhana prayer schedules, architectural tours, or the Center.",
          'Selection 1: Speak Directly with Me'
        ),
    },
    {
      digit: '2',
      sub: 'HOURS',
      label: 'Visitor Hours & Admission',
      handler: () =>
        handleKeypadPress(
          '2',
          "Visitor Hours and Admission: The Ismaili Center Houston building and exhibition spaces are open to the public on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time. The 11 acres of gardens open at 8:00 AM to 4:00 PM. Admission is completely free. Guided architectural tours can be booked at ismailicenter.org. Press 1 to speak directly with me.",
          'Selection 2: Visitor Hours & Admission'
        ),
    },
    {
      digit: '3',
      sub: 'PRAYER',
      label: 'Prayer Times (Central Time)',
      handler: () =>
        handleKeypadPress(
          '3',
          "Jamatkhana Prayer Schedule in US Central Time: Daily silent meditation is from 4:00 AM to 5:00 AM, followed by morning prayer from 5:00 AM to 5:30 AM. Evening prayer takes place at 7:00 PM Monday through Thursday, Saturday, and Sunday, and at 7:30 PM on Fridays. While the prayer hall is reserved for congregational worship, our civic spaces are open on visiting days. Press 1 to speak directly with me.",
          'Selection 3: Jamatkhana Prayer Times (CT)'
        ),
    },
    {
      digit: '4',
      sub: 'TOURS',
      label: 'Guided Tour Booking',
      handler: () =>
        handleKeypadPress(
          '4',
          "Guided Architectural Tours: 45-minute guided tours are offered on Tuesdays, Thursdays, Saturdays, and Sundays. Tours explore Farshid Moussavi's architecture and the 11-acre gardens. Pre-booking is recommended at ismailicenter.org/tour-booking. Walk-ins are accommodated based on availability. Press 1 to speak directly with me.",
          'Selection 4: Architectural Tour Booking'
        ),
    },
    {
      digit: '5',
      sub: 'MAPS',
      label: 'Location & Parking',
      handler: () =>
        handleKeypadPress(
          '5',
          "Location and Directions: The Ismaili Center Houston is located in the Montrose district at the corner of Montrose Boulevard and Allen Parkway, Houston, Texas 77019, right next to Buffalo Bayou Park. Complimentary on-site visitor parking and bicycle racks are provided. Press 1 to speak directly with me.",
          'Selection 5: Location, Address & Parking'
        ),
    },
    {
      digit: '6',
      sub: 'DESIGN',
      label: 'Architecture & Gardens',
      handler: () =>
        handleKeypadPress(
          '6',
          "Architecture and Design: Designed by celebrated architect Farshid Moussavi, the building features shaded triangular verandahs, ceramic screens, and sustainable environmental engineering. The 11 acres of Persian-inspired gardens were landscaped by Nelson Byrd Woltz, featuring native Texas trees and reflection pools. Press 1 to speak directly with me.",
          'Selection 6: Farshid Moussavi Design & Gardens'
        ),
    },
    {
      digit: '7',
      sub: 'LEAD',
      label: 'Aga Khan & Heritage',
      handler: () =>
        handleKeypadPress(
          '7',
          "Leadership and Community: The Center was commissioned by His Highness the Aga Khan, 49th hereditary Imam of the Shia Imami Ismaili Muslims and founder of the Aga Khan Development Network, to serve as a permanent ambassadorial bridge of understanding, pluralism, and civil dialogue. Press 1 to speak directly with me.",
          'Selection 7: His Highness the Aga Khan'
        ),
    },
    {
      digit: '8',
      sub: 'DRESS',
      label: 'Visitor Etiquette & Attire',
      handler: () =>
        handleKeypadPress(
          '8',
          "Visitor Guidelines: Modest clothing is recommended with shoulders and knees covered when entering indoor community spaces. Comfortable walking shoes are advised for the outdoor gardens. Photography is welcomed in public gardens and outdoor verandas. Press 1 to speak directly with me.",
          'Selection 8: Visitor Etiquette & Attire'
        ),
    },
    {
      digit: '9',
      sub: 'MENU',
      label: 'Repeat Phonebot Menu',
      handler: () =>
        handleKeypadPress(
          '9',
          "Thank you for reaching the Ismaili Center Houston's Official Phonebot. To speak directly with me press 1, for hours press 2, for prayer press 3, for tours press 4, for directions and parking press 5, or press 0 for our dedicated Information Line at 713-522-2026.",
          'Selection 9: Repeat Menu'
        ),
    },
    {
      digit: '*',
      sub: 'REPLAY',
      label: 'Replay Greeting',
      handler: () =>
        handleKeypadPress(
          '*',
          "Thank you for reaching the Ismaili Center Houston's Official Phonebot. To speak directly with me press 1, for hours press 2, for prayer press 3, for tours press 4, for directions and parking press 5, or press 0 for our dedicated Information Line at 713-522-2026.",
          'Selection *: Replay Welcome'
        ),
    },
    {
      digit: '0',
      sub: 'LINE',
      label: 'Dedicated Information Line',
      handler: () => {
        telecomAudio.playDTMF('0');
        const lineNotice = "You can contact our dedicated Information Line directly at +1 (713) 522-2026 for personalized assistance. You can also press 1 to continue speaking directly with me.";
        addTranscriptEntry('You (Keypad [0])', 'Dedicated Information Line (+1 713-522-2026)');
        addTranscriptEntry('AI Phonebot', lineNotice);
        speakText(lineNotice);
      },
    },
    {
      digit: '#',
      sub: 'END',
      label: 'Disconnect Call',
      handler: () => {
        telecomAudio.playDTMF('#');
        endCall();
      },
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Interactive Voice Telephony Hotline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white mt-1">
              Ismaili Center Houston Voice Hotline
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <span>Dedicated Information Line: <strong>+1 (713) 522-2026</strong></span>
              <span>&bull;</span>
              <span>Houston Central Time (CT)</span>
            </p>
          </div>

          {/* Carrier & Signal Quality Badge */}
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs">
            <div className="flex items-end space-x-0.5 h-4">
              <span className="w-1 h-1.5 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-2.5 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-3.5 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-4 bg-emerald-500 rounded-xs" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Network Status
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                HD VoLTE &bull; Low Latency
              </span>
            </div>
          </div>
        </div>

        {/* Telephone Call Console */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Realistic Phone Display & Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-between p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-[#0e1726] to-slate-950 text-white shadow-lg border border-slate-800 space-y-6">
            
            {/* Phone Screen Top Header */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-emerald-400 animate-pulse' : callState === 'ringing' ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
                {callState === 'connected' ? 'CALL ACTIVE (CENTRAL TIME)' : callState === 'ringing' ? 'DIALING...' : 'STANDBY'}
              </span>
              <span>{callState === 'connected' ? formatTimer(callSeconds) : '00:00'}</span>
            </div>

            {/* Caller Identification Centerpiece */}
            <div className="text-center space-y-1.5 py-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block">
                Official Information System
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-cinzel">
                Ismaili Center Houston
              </h3>
              <p className="text-sm font-mono text-slate-300">
                +1 (713) 522-2026 &bull; Montrose, TX
              </p>
              
              {/* Dynamic Status Text */}
              <div className="pt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700">
                  {statusText}
                </span>
              </div>
            </div>

            {/* Reactive Telephony Sound Visualizer */}
            <div className="w-full py-2 flex items-center justify-center">
              <div className="flex items-center space-x-1.5 h-12 px-6 py-2 rounded-2xl bg-black/40 border border-slate-800/80">
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
            <div className="w-full pt-2 flex items-center justify-center gap-4">
              {callState === 'idle' || callState === 'ended' ? (
                <button
                  type="button"
                  onClick={startCall}
                  className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center space-x-2.5 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-5 h-5 fill-current" />
                  <span>Call Hotline (+1 713-522-2026)</span>
                </button>
              ) : (
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
                    title={isMuted ? 'Turn Sound On' : 'Mute Operator Sound'}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  {/* Toggle Keypad */}
                  <button
                    type="button"
                    onClick={() => setShowKeypad(!showKeypad)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      showKeypad
                        ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Toggle Touch Tone Keypad"
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={endCall}
                    className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95 cursor-pointer"
                  >
                    <PhoneOff className="w-5 h-5 fill-current" />
                    <span>End Call</span>
                  </button>
                </div>
              )}

              {/* Two-Way Voice Communication Section (Strictly Voice - No Text Input) */}
              {callState === 'connected' && (
                <div className="mt-4 pt-4 border-t border-slate-700/60 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-rose-300 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>Live Voice Communication</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      VOICE ONLY
                    </span>
                  </div>

                  {/* Interactive Voice Talk Station */}
                  <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    {/* Live speech feedback if hearing words */}
                    {userInterimSpeech && (
                      <div className="w-full text-center px-3 py-1.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-200 text-xs italic animate-pulse">
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
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md active:scale-95 ${
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
                          <span>AI Phonebot is Speaking (Tap to Talk)</span>
                        </>
                      ) : isListening ? (
                        <>
                          <Mic className="w-4 h-4 animate-pulse text-white" />
                          <span>Listening to Your Voice... Speak Now</span>
                        </>
                      ) : isProcessingVoice ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-rose-400" />
                          <span>AI Phonebot Thinking...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Tap to Talk to AI Phonebot</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-slate-400 text-center">
                      Speak naturally into your microphone. The AI Phonebot will listen and respond by voice.
                    </p>
                  </div>

                  {/* Spoken Voice Shortcuts */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Spoken Question Shortcuts:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Are you open today?',
                        'How do I book a tour?',
                        "Tonight's prayer time in CT?",
                        'Who is the architect?',
                        'Is parking free?',
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => {
                            addTranscriptEntry('You (Voice Prompt)', prompt);
                            handleUserVoiceInput(prompt);
                          }}
                          disabled={operatorSpeaking || isProcessingVoice}
                          className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-500/60 transition-all cursor-pointer text-left active:scale-95 disabled:opacity-50"
                        >
                          Ask: "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Realistic Interactive DTMF Keypad (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Grid3X3 className="w-4 h-4 text-rose-600" />
                  <span>Interactive Telephone Keypad</span>
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  DTMF Dual-Tone Frequencies Enabled
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold">
                IVR ACTIVE
              </span>
            </div>

            {/* Dialpad Matrix */}
            <div className="grid grid-cols-3 gap-2.5 py-4">
              {keypadItems.map((item) => (
                <button
                  key={item.digit}
                  type="button"
                  onClick={item.handler}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 text-slate-800 dark:text-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group"
                >
                  <span className="text-xl font-bold font-mono group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    {item.digit}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">
                    {item.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Keypad Legend Guide */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Menu Directory:
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span>[1] Speak Directly</span>
                <span>[2] Visitor Hours</span>
                <span>[3] Jamatkhana Prayer (CT)</span>
                <span>[4] Book Tour</span>
                <span>[5] Directions & Parking</span>
                <span>[6] Architecture</span>
                <span>[7] Aga Khan & AKDN</span>
                <span>[8] Visitor Etiquette</span>
                <span>[9] Repeat Menu</span>
                <span>[0] Information Line</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Call Transcript */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Hotline Call Transcript
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            All times recorded in Houston Central Time (CT)
          </span>
        </div>

        <div 
          ref={transcriptBottomRef}
          className="h-56 overflow-y-auto space-y-3 pr-2 text-xs"
        >
          {transcript.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Radio className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-slate-400 dark:text-slate-500 italic">
                Press "Call Hotline" above to connect. Once connected, your speech and the automated operator responses will be transcribed here live.
              </p>
            </div>
          ) : (
            transcript.map((entry, idx) => {
              const isUser = entry.speaker.startsWith('You');
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isUser
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50 text-rose-950 dark:text-rose-100 ml-6'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className={isUser ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-900 dark:text-white font-bold'}>
                      {entry.speaker}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      {entry.time}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
