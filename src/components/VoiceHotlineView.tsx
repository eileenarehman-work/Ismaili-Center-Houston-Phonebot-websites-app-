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
import { getSmartAssistantResponse } from '../utils/smartAssistant.ts';

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
  const [showKeypad, setShowKeypad] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Hotline Ready • Click Start Call to Connect');
  const [operatorSpeaking, setOperatorSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([]);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollTop = transcriptBottomRef.current.scrollHeight;
    }
  }, [transcript]);

  // Setup Speech Recognition for hands-free natural voice interaction
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recog = new SpeechRec();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          if (event?.results?.[0]?.[0]?.transcript) {
            const userSaid = event.results[0][0].transcript.trim();
            if (userSaid) {
              addTranscriptEntry('You (Voice)', userSaid);
              handleUserVoiceInput(userSaid);
            }
          }
        };

        recog.onerror = () => {
          if (callState === 'connected' && !operatorSpeaking) {
            setStatusText('Line Active • Listening for your question...');
          }
        };

        recog.onend = () => {
          // Restart recognition if call is active, mic enabled, and operator is not speaking
          if (callState === 'connected' && isMicActive && !operatorSpeaking) {
            try {
              recog.start();
            } catch (e) {
              // already active
            }
          }
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [callState, isMicActive, operatorSpeaking]);

  const formatTimer = (totalSec: number) => {
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const addTranscriptEntry = (speaker: string, text: string) => {
    const time = formatCentralTimestamp();
    setTranscript((prev) => [...prev, { speaker, text, time }]);
  };

  // Speaks text using natural speech synthesis
  const speakText = (text: string, onDone?: () => void) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    window.speechSynthesis.cancel();
    setOperatorSpeaking(true);

    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/https?:\/\/[^\s]+/g, 'on the official website ismailicenter.org')
      .replace(/[-*#]\s+/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Daniel')) &&
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setStatusText('Automated Operator Speaking...');
      // Pause mic while operator is speaking to prevent acoustic feedback
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };

    utterance.onend = () => {
      setOperatorSpeaking(false);
      setStatusText('Line Active • Listening or press any keypad number...');
      if (onDone) onDone();
      // Resume listening
      if (callState === 'connected' && isMicActive && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };

    utterance.onerror = () => {
      setOperatorSpeaking(false);
      setStatusText('Line Active • Ready for input...');
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start realistic call with ringback tone
  const startCall = () => {
    setCallState('ringing');
    setIsPaused(false);
    setCallSeconds(0);
    setStatusText('Connecting to +1 (713) 522-2026... Dialing');

    // Play authentic ringback tone (1.8s) followed by connect click
    telecomAudio.playRingback(() => {
      setCallState('connected');
      setStatusText('Call Connected • HD VoLTE Audio Active');

      // Start duration counter
      timerRef.current = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);

      const ivrGreeting = 
        "Thank you for calling the Ismaili Center Houston automated information line. All timings are provided in Central Time. For visitor hours and free admission, press 1. For Jamatkhana prayer times, press 2. For guided architectural tour booking, press 3. For location, directions, and parking, press 4. For architectural design and gardens, press 5. For His Highness the Aga Khan and community information, press 6. Or speak your inquiry at any time.";

      addTranscriptEntry('Automated Operator', ivrGreeting);
      speakText(ivrGreeting);
    });
  };

  // End call
  const endCall = () => {
    setCallState('ended');
    setIsPaused(false);
    setOperatorSpeaking(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Play hangup tone
    telecomAudio.playHangupTone();
    setStatusText('Call Ended • Duration ' + formatTimer(callSeconds));
  };

  // Handle keypad digit presses with genuine DTMF audio
  const handleKeypadPress = (digit: string, responseText: string, menuTitle: string) => {
    telecomAudio.playDTMF(digit);

    if (callState !== 'connected') {
      return;
    }

    addTranscriptEntry(`You (Keypad [${digit}])`, menuTitle);
    addTranscriptEntry('Automated Operator', responseText);
    speakText(responseText);
  };

  // Process natural spoken questions via backend chat or smart assistant engine
  const handleUserVoiceInput = async (query: string) => {
    setStatusText('Processing your inquiry...');
    try {
      const response = await getSmartAssistantResponse(query);
      const reply = response.reply || "I am happy to assist you with visitor hours, prayer times, or architectural tours.";
      addTranscriptEntry('Automated Operator', reply);
      
      // Clean markdown tags for natural speech synthesis
      const speechClean = reply
        .replace(/###?\s*/g, '')
        .replace(/\*\*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/- /g, '')
        .replace(/---/g, '');
      speakText(speechClean);
    } catch (_e) {
      const fallbackReply = "The Ismaili Center Houston welcomes visitors on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time. Guided architectural tours are free of charge.";
      addTranscriptEntry('Automated Operator', fallbackReply);
      speakText(fallbackReply);
    }
  };

  // Interactive Voice Response (IVR) phone tree options
  const keypadItems: KeypadItem[] = [
    {
      digit: '1',
      sub: 'HOURS',
      label: 'Visitor Hours & Admission',
      handler: () =>
        handleKeypadPress(
          '1',
          "Visitor Hours and Admission: The Ismaili Center Houston building and exhibition spaces are open to the public on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time. The 11 acres of gardens open at 8:00 AM to 4:00 PM. Admission is completely free. Guided architectural tours can be booked at ismailicenter.org.",
          'Selection 1: Visitor Hours & Admission'
        ),
    },
    {
      digit: '2',
      sub: 'PRAYER',
      label: 'Prayer Times (Central Time)',
      handler: () =>
        handleKeypadPress(
          '2',
          "Jamatkhana Prayer Schedule in US Central Time: Bandagi is from 4:00 AM to 5:00 AM daily. Morning Dua is from 5:00 AM to 5:30 AM daily. Evening Prayer is at 7:00 PM Monday through Thursday, Saturday, and Sunday, and at 7:30 PM on Fridays. Prayer halls are reserved for congregational worship, while civic spaces are open on visiting days.",
          'Selection 2: Jamatkhana Prayer Times (CT)'
        ),
    },
    {
      digit: '3',
      sub: 'TOURS',
      label: 'Tour Booking Info',
      handler: () =>
        handleKeypadPress(
          '3',
          "Guided Architectural Tours: 45-minute guided tours are offered on Tuesdays, Thursdays, Saturdays, and Sundays. Tours explore Farshid Moussavi's architecture and the 11-acre gardens. Pre-booking is recommended at ismailicenter.org/tour-booking. Walk-ins are accommodated based on availability.",
          'Selection 3: Architectural Tour Booking'
        ),
    },
    {
      digit: '4',
      sub: 'MAPS',
      label: 'Location & Parking',
      handler: () =>
        handleKeypadPress(
          '4',
          "Location and Directions: The Ismaili Center Houston is located in the Montrose district at the corner of Montrose Boulevard and Allen Parkway, Houston, Texas 77019, right next to Buffalo Bayou Park. Complimentary on-site visitor parking and bicycle racks are provided.",
          'Selection 4: Location, Address & Parking'
        ),
    },
    {
      digit: '5',
      sub: 'DESIGN',
      label: 'Architecture & Gardens',
      handler: () =>
        handleKeypadPress(
          '5',
          "Architecture and Design: Designed by celebrated architect Farshid Moussavi, the building features shaded triangular verandahs, ceramic screens, and sustainable environmental engineering. The 11 acres of Persian-inspired gardens were landscaped by Nelson Byrd Woltz, featuring native Texas trees and reflection pools.",
          'Selection 5: Farshid Moussavi Design & Gardens'
        ),
    },
    {
      digit: '6',
      sub: 'LEAD',
      label: 'Aga Khan & Heritage',
      handler: () =>
        handleKeypadPress(
          '6',
          "Leadership and Community: The Center was commissioned by His Highness the Aga Khan, 49th hereditary Imam of the Shia Imami Ismaili Muslims and founder of the Aga Khan Development Network, to serve as a permanent ambassadorial bridge of understanding, pluralism, and civil dialogue.",
          'Selection 6: His Highness the Aga Khan'
        ),
    },
    {
      digit: '7',
      sub: 'DRESS',
      label: 'Visitor Etiquette & Attire',
      handler: () =>
        handleKeypadPress(
          '7',
          "Visitor Guidelines: Modest clothing is recommended with shoulders and knees covered when entering indoor community spaces. Comfortable walking shoes are advised for the outdoor gardens. Photography is welcomed in public gardens and outdoor verandas.",
          'Selection 7: Visitor Etiquette & Attire'
        ),
    },
    {
      digit: '8',
      sub: 'INFO',
      label: 'Ismaili Shia Tradition',
      handler: () =>
        handleKeypadPress(
          '8',
          "About the Ismaili Tradition: Ismailis belong to the Shia branch of Islam, emphasizing intellectual inquiry, compassion, voluntary community service, gender equity, and universal ethics.",
          'Selection 8: About Ismaili Tradition'
        ),
    },
    {
      digit: '9',
      sub: 'MENU',
      label: 'Repeat Menu Options',
      handler: () =>
        handleKeypadPress(
          '9',
          "Repeating options: Press 1 for visitor hours. Press 2 for Jamatkhana prayer times in Central Time. Press 3 for tour reservations. Press 4 for directions and parking. Press 5 for architecture and gardens. Press 6 for the Aga Khan. Press 0 for the AI voice operator.",
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
          "Welcome to the Ismaili Center Houston voice hotline. The building is open to visitors Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time.",
          'Selection *: Replay Welcome'
        ),
    },
    {
      digit: '0',
      sub: 'OPER',
      label: 'Live AI Operator',
      handler: () =>
        handleKeypadPress(
          '0',
          "Connecting you to the live AI ambassador operator. You can now speak any question naturally into your microphone, and I will answer directly.",
          'Selection 0: Connect to AI Operator'
        ),
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
                <span>[1] Visitor Hours</span>
                <span>[2] Prayer Times (CT)</span>
                <span>[3] Book Tour</span>
                <span>[4] Montrose Address</span>
                <span>[5] Architecture</span>
                <span>[6] Aga Khan & AKDN</span>
                <span>[7] Etiquette</span>
                <span>[0] AI Operator Voice</span>
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
