import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types.ts';
import { formatCentralTimestamp } from '../utils/time.ts';
import { getSmartAssistantResponse, queryKnowledgeEngine } from '../utils/smartAssistant.ts';
import { humanizeSpokenText, getGoogleUKEnglishMaleVoice } from '../utils/naturalVoice.ts';
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
  Info,
  Cpu
} from 'lucide-react';

interface AIAssistantViewProps {
  onNavigateToTab?: (tab: 'schedule' | 'visitor' | 'videos') => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Welcome to the **Ismaili Center Houston AI Assistant**! I am an automated computer helper, not human staff. Ask me about visiting hours, free guided tours, prayer times in Houston Central Time, or our gardens and building. If I cannot answer your question, please call our official human staff line at **+1 (713) 522-2026**.",
      timestamp: formatCentralTimestamp(),
      source: 'knowledge-engine',
      suggestedFollowUps: [
        'What are the visitor hours?',
        'How do I book a free tour?',
        'What is the prayer schedule?',
        'Where is the free parking?',
      ],
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
    { label: 'Location', query: 'Where is the Ismaili Center located in Houston?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: formatCentralTimestamp(),
    };

    const currentHistory = messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await getSmartAssistantResponse(query, currentHistory);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: formatCentralTimestamp(),
        source: response.source,
        suggestedFollowUps: response.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (_err) {
      // Local knowledge engine backup guaranteed to never fail
      const localResponse = queryKnowledgeEngine(query);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: localResponse.reply,
        timestamp: formatCentralTimestamp(),
        source: 'knowledge-engine',
        suggestedFollowUps: localResponse.suggestedFollowUps,
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
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

    // Humanize text with natural pauses, phonetic 'Ismaili' correction and symbol removal
    const cleanSpoken = humanizeSpokenText(text);

    const utterance = new SpeechSynthesisUtterance(cleanSpoken);
    utterance.lang = 'en-GB';

    const ukVoice = getGoogleUKEnglishMaleVoice();
    if (ukVoice) {
      utterance.voice = ukVoice;
    }

    utterance.pitch = 1.0;
    utterance.rate = 0.95;

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
        timestamp: formatCentralTimestamp(),
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
                Ismaili Center AI Assistant
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Computer Helper
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated answers for visiting hours, prayer times, free tours, and directions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="tel:+17135222026"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
            title="Call the real human staff phone line"
          >
            <span>Staff: +1 (713) 522-2026</span>
          </a>

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

                {/* Suggested follow-up query chips */}
                {!isUser && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center">
                      <Sparkles className="w-2.5 h-2.5 mr-1 text-[#007ba8]" />
                      Suggested Follow-ups:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-700/90 hover:bg-[#007ba8] hover:text-white dark:hover:bg-[#007ba8] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all font-medium cursor-pointer shadow-2xs hover:shadow-xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer metadata & Audio speak control */}
                <div
                  className={`mt-2 pt-1.5 flex items-center justify-between text-[11px] border-t ${
                    isUser
                      ? 'border-white/20 text-white/80'
                      : 'border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">{msg.timestamp}</span>
                    {!isUser && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                        {msg.source === 'gemini-server' || msg.source === 'gemini'
                          ? 'Gemini Cloud'
                          : msg.source === 'gemini-client'
                          ? 'Gemini Client'
                          : 'Smart Knowledge Base'}
                      </span>
                    )}
                  </div>

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
