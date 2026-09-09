import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types.ts';
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Sparkles,
  ExternalLink,
  Info
} from 'lucide-react';

interface AIAssistantViewProps {
  onNavigateToTab?: (tab: 'schedule' | 'visitor' | 'videos') => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Welcome to the **Ismaili Center Houston Guide**! How may I assist you today? You can inquire about visitor hours, book architectural tours, check prayer timings, learn about architect Farshid Moussavi's design, or explore official media.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'offline',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recog = new SpeechRecognitionClass();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onresult = (event: any) => {
          if (event?.results?.[0]?.[0]?.transcript) {
            const transcript = event.results[0][0].transcript;
            setInputValue(transcript);
            handleSendMessage(transcript);
          }
          setIsListening(false);
        };

        recog.onerror = () => {
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recog;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const quickQueries = [
    { label: 'Visitor Hours', query: 'When is the Ismaili Center Houston open to visitors?' },
    { label: 'Book a Tour', query: 'How do I book a guided tour of the center?' },
    { label: 'Prayer Schedule', query: 'What is the Jamatkhana prayer schedule?' },
    { label: 'Architecture & Gardens', query: 'Who designed the building and gardens?' },
    { label: 'Who is the Aga Khan?', query: 'Who is His Highness the Aga Khan?' },
    { label: 'About the Ismaili Faith', query: 'What is the Ismaili Shia Muslim faith and tradition?' },
    { label: 'Location & Montrose', query: 'Where is the Ismaili Center located in Houston?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      // Local fallback in case network call fails
      const fallbackText = getOfflineFallback(query);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'offline-fallback',
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getOfflineFallback = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('tour') || q.includes('book') || q.includes('visit') || q.includes('hour') || q.includes('open')) {
      return "The Ismaili Center Houston is open to visitors on **Tuesdays, Thursdays, Saturdays, and Sundays** from **10:00 AM to 4:00 PM** (Gardens open 8:00 AM to 4:00 PM). Admission is free! You can reserve a guided architectural tour at: https://ismailicenter.org/tour-booking/";
    }
    if (q.includes('schedule') || q.includes('prayer') || q.includes('dua') || q.includes('bandagi')) {
      return "The Jamatkhana schedule is:\n- **Bandagi**: 4:00 AM – 5:00 AM\n- **Morning Dua**: 5:00 AM – 5:30 AM\n- **Evening Prayer**: 7:30 PM on Fridays; 7:00 PM on Mon–Thu, Sat & Sun.\n\nPlease note: Prayer halls are reserved for congregational worship. All civic and exhibition spaces are open to the public.";
    }
    if (q.includes('architect') || q.includes('moussavi') || q.includes('garden')) {
      return "The building was designed by celebrated architect **Farshid Moussavi** (FMA), and the 11 acres of Persian-inspired gardens were landscaped by **Nelson Byrd Woltz**. It is the first purpose-built Ismaili Center in the United States.";
    }
    return "The Ismaili Center Houston is located in Montrose, Houston. The building is open to visitors on **Tuesdays, Thursdays, Saturdays, and Sundays** from 10:00 AM to 4:00 PM. Book guided tours at https://ismailicenter.org/tour-booking/";
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const speakText = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown for text to speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/https?:\/\/[^\s]+/g, 'on the official website')
      .replace(/[-*]\s+/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: "Chat cleared. What else would you like to know about the Ismaili Center Houston?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'offline',
      },
    ]);
  };

  // Render markdown helper (bold, links, lists)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Check for bullet list item
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Parse bold **text** and URLs
      const parts = cleanLine.split(/(\*\*.*?\*\*|https?:\/\/[^\s]+)/g);

      const parsedElements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('http://') || part.startsWith('https://')) {
          return (
            <a
              key={pIdx}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#007ba8] dark:text-teal-400 hover:underline font-medium break-all"
            >
              <span>{part}</span>
              <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
            </a>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm my-1">
            {parsedElements}
          </li>
        );
      }

      return (
        <p key={idx} className="my-1 text-sm leading-relaxed">
          {parsedElements}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[560px] max-h-[820px] bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#007ba8]/10 dark:bg-teal-950/50 flex items-center justify-center text-[#007ba8] dark:text-teal-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Ismaili Center Assistant
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Active Guide
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inquiries regarding hours, tours, architecture, and prayer times
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearChat}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Suggested Quick Inquiries Chip Bar */}
      <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex-shrink-0 flex items-center">
          <Sparkles className="w-3 h-3 mr-1 text-[#007ba8]" />
          Topics:
        </span>
        {quickQueries.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(item.query)}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/70 hover:border-[#007ba8] hover:bg-[#007ba8] hover:text-white dark:hover:bg-[#007ba8] dark:hover:text-white transition-all shadow-xs font-medium"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeaking = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#007ba8] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm shadow-xs ${
                  isUser
                    ? 'bg-[#007ba8] text-white rounded-tr-xs'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {/* Content */}
                <div className="space-y-1">
                  {renderFormattedContent(msg.text)}
                </div>

                {/* Footer metadata & Audio speak control */}
                <div
                  className={`mt-2 pt-1.5 flex items-center justify-between text-[11px] border-t ${
                    isUser
                      ? 'border-white/20 text-white/80'
                      : 'border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-400'
                  }`}
                >
                  <span className="font-mono">{msg.timestamp}</span>

                  {!isUser && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => speakText(msg.id, msg.text)}
                        className={`p-1 rounded-md transition-colors ${
                          isSpeaking
                            ? 'text-[#007ba8] dark:text-teal-300 font-bold bg-[#007ba8]/10'
                            : 'hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#007ba8] text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-3.5 rounded-2xl rounded-tl-xs text-xs flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#007ba8] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#007ba8] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#007ba8] animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-slate-500 dark:text-slate-400 pl-1 font-medium">Preparing guide response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-500 text-white border-red-600 animate-pulse'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-[#007ba8] hover:border-[#007ba8]'
          }`}
          title={isListening ? 'Stop listening' : 'Voice Input (Microphone)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question (e.g., 'What are the visiting hours?' or 'How do I book a tour?')"
          className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#007ba8] focus:border-transparent transition-all placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          className="px-5 py-2.5 rounded-xl bg-[#007ba8] hover:bg-[#006185] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
