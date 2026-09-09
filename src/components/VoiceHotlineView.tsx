import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Pause, 
  Play, 
  Volume2, 
  VolumeX, 
  Headphones,
  Radio,
  FileText
} from 'lucide-react';

export const VoiceHotlineView: React.FC = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Line Ready (Click Start Call)');
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: string }>>([]);

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Setup Speech Recognition
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
            const userSaid = event.results[0][0].transcript;
            addTranscriptEntry('You', userSaid);
            processHotlineVoiceQuery(userSaid);
          }
        };

        recog.onerror = () => {
          if (isCalling) {
            setStatusText('Line Active - Listening...');
          }
        };

        recog.onend = () => {
          // If still calling and not speaking, restart listening
          if (isCalling && !window.speechSynthesis.speaking) {
            try {
              recog.start();
            } catch (e) {
              // already active or permission issue
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
  }, [isCalling]);

  const formatTimer = (totalSec: number) => {
    const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const addTranscriptEntry = (speaker: string, text: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTranscript((prev) => [...prev, { speaker, text, time }]);
  };

  const speakText = (text: string, onDone?: () => void) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onDone) onDone();
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/https?:\/\/[^\s]+/g, 'on the official website ismailicenter.org');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setStatusText('Assistant Speaking...');
    };

    utterance.onend = () => {
      setStatusText('Line Active - Listening for your question...');
      if (onDone) onDone();
    };

    utterance.onerror = () => {
      setStatusText('Line Active - Listening...');
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  };

  const processHotlineVoiceQuery = (query: string) => {
    const q = query.toLowerCase();
    let reply = '';

    if (q.includes('tour') || q.includes('visit') || q.includes('open') || q.includes('hour')) {
      reply = 'The Ismaili Center Houston is open to visitors on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM. The gardens open at 8:00 AM on those days. Admission is completely free, and you can reserve guided tours on ismailicenter.org.';
    } else if (q.includes('prayer') || q.includes('schedule') || q.includes('time') || q.includes('dua')) {
      reply = 'The Jamatkhana schedule is: Bandagi at 4:00 AM, Morning Dua at 5:00 AM, and Evening Prayer at 7:00 PM Monday through Thursday, Saturday, and Sunday, and 7:30 PM on Fridays.';
    } else if (q.includes('architect') || q.includes('moussavi')) {
      reply = 'The building was designed by world-renowned architect Farshid Moussavi, with 11 acres of Persian-inspired gardens landscaped by Nelson Byrd Woltz.';
    } else if (q.includes('aga khan')) {
      reply = 'His Highness the Aga Khan is the 49th hereditary Imam of the Shia Imami Ismaili Muslims and founder of the Aga Khan Development Network.';
    } else {
      reply = 'The Ismaili Center Houston is located in Montrose, Houston. It is an ambassadorial civic and cultural center open to visitors four days a week with free admission.';
    }

    addTranscriptEntry('Assistant', reply);
    speakText(reply, () => {
      if (isCalling && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    });
  };

  const startCall = () => {
    setIsCalling(true);
    setIsPaused(false);
    setCallSeconds(0);
    setStatusText('Connecting to Hotline...');

    timerRef.current = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);

    const greeting =
      'Hello! Welcome to the Ismaili Center Houston automated voice hotline. The building is open to visitors on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM. How can I help you today?';
    addTranscriptEntry('Assistant', greeting);

    speakText(greeting, () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    });
  };

  const endCall = () => {
    setIsCalling(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setStatusText('Line Ended (Click Start Call to reconnect)');
  };

  const togglePause = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        if (isPaused) {
          window.speechSynthesis.resume();
          setIsPaused(false);
          setStatusText('Assistant Resumed Speaking...');
        } else {
          window.speechSynthesis.pause();
          setIsPaused(true);
          setStatusText('Call Audio Paused');
        }
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/50 text-[#007ba8] dark:text-teal-300 text-xs font-semibold uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Computer Voice Hotline</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white">
          Interactive Voice Assistant
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Experience conversational voice guidance. Speak naturally through your computer microphone to receive spoken information about schedules, visitor hours, and architectural tours.
        </p>
      </div>

      {/* Main Calling Box */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center space-y-6">
        
        {/* Animated Visual Avatar & Sound Waves */}
        <div className="relative flex flex-col items-center justify-center pt-4">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl shadow-xl transition-all duration-300 ${
              isCalling ? 'bg-[#007ba8] ring-8 ring-[#007ba8]/20 scale-105' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <Headphones className="w-12 h-12" />
          </div>

          {/* Sound wave bars */}
          <div
            className={`flex items-center space-x-1.5 mt-5 h-8 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 transition-opacity duration-300 ${
              isCalling && !isPaused ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <div className={`w-1 bg-[#007ba8] rounded-full ${isCalling && !isPaused ? 'animate-wave-bar' : 'h-2'}`} style={{ animationDelay: '0.1s' }} />
            <div className={`w-1 bg-[#007ba8] rounded-full ${isCalling && !isPaused ? 'animate-wave-bar' : 'h-2'}`} style={{ animationDelay: '0.3s' }} />
            <div className={`w-1 bg-[#007ba8] rounded-full ${isCalling && !isPaused ? 'animate-wave-bar' : 'h-2'}`} style={{ animationDelay: '0.5s' }} />
            <div className={`w-1 bg-[#007ba8] rounded-full ${isCalling && !isPaused ? 'animate-wave-bar' : 'h-2'}`} style={{ animationDelay: '0.2s' }} />
            <div className={`w-1 bg-[#007ba8] rounded-full ${isCalling && !isPaused ? 'animate-wave-bar' : 'h-2'}`} style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {/* Status and Timer */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
            {statusText}
          </h3>
          <p className="text-sm font-mono text-slate-400 dark:text-slate-500 mt-1">
            Call Duration: {formatTimer(callSeconds)}
          </p>
        </div>

        {/* Call Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isCalling ? (
            <button
              type="button"
              onClick={startCall}
              className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Start Call</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm transition-all flex items-center space-x-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm transition-all flex items-center space-x-2"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                type="button"
                onClick={endCall}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Transcript Box */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[#007ba8]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Live Call Transcript
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {transcript.length} {transcript.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div className="h-44 overflow-y-auto space-y-3 pr-2 font-sans text-xs">
          {transcript.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 italic py-4 text-center">
              [Transcript will appear here in real-time once you start the call...]
            </p>
          ) : (
            transcript.map((entry, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl ${
                  entry.speaker === 'You'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 text-teal-950 dark:text-teal-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className={entry.speaker === 'You' ? 'text-[#007ba8] font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                    {entry.speaker}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    {entry.time}
                  </span>
                </div>
                <p className="leading-relaxed">{entry.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
