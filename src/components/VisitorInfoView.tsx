import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  Calendar, 
  ExternalLink, 
  TreePine, 
  Car, 
  HeartHandshake,
  Sparkles,
  Ticket,
  Navigation,
  Plane,
  Bus,
  Copy,
  Check,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { getCenterExperiences, OFFICIAL_TOUR_URL } from '../utils/experiencesStorage.ts';
import { CenterExperience, NavigationTab } from '../types.ts';
import { useScrollReveal } from '../hooks/useScrollReveal.ts';
import { getSmartAssistantResponse, extractSuggestedFollowUps } from '../utils/smartAssistant.ts';
import { humanizeSpokenText, getGoogleUKEnglishMaleVoice } from '../utils/naturalVoice.ts';
import { getLatestSyncedData, subscribeToSyncUpdates, SyncedIsmailiPayload } from '../utils/syncData.ts';

interface VisitorInfoViewProps {
  activeTab?: 'navigations' | 'events';
  onSelectTab?: (tab: NavigationTab) => void;
}

export const VisitorInfoView: React.FC<VisitorInfoViewProps> = ({
  activeTab = 'navigations',
  onSelectTab,
}) => {
  const [internalTab, setInternalTab] = useState<'navigations' | 'events'>(activeTab);

  // Sync internalTab when activeTab prop changes
  useEffect(() => {
    setInternalTab(activeTab);
  }, [activeTab]);

  const currentSection = activeTab || internalTab;

  const handleSwitchTab = (newTab: 'navigations' | 'events') => {
    setInternalTab(newTab);
    if (onSelectTab) {
      onSelectTab(newTab);
    }
  };

  const [experiences, setExperiences] = useState<CenterExperience[]>(() => getCenterExperiences());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [syncedData, setSyncedData] = useState<SyncedIsmailiPayload>(() => getLatestSyncedData());

  // Interactive Navigation & Google Maps Guide State
  const [navQuery, setNavQuery] = useState('');
  const [navResponse, setNavResponse] = useState<{
    text: string;
    followUps: string[];
  }>({
    text: `**[Navigation Guide]**
The Ismaili Center Houston is located at the intersection of Montrose Boulevard and Allen Parkway. When arriving, enter the visitor driveway directly from Montrose Boulevard, where free on-site parking and accessible spaces are available for all guests. Clear highway exits from I-10, I-45, and I-69 lead smoothly into Allen Parkway.

[Open in Google Maps](https://www.google.com/maps/search/?api=1&query=Ismaili+Center+Houston+Montrose+Blvd)`,
    followUps: [
      'What are the public visiting hours?',
      'How far is the center from Hobby Airport (HOU)?',
      'Where is the free visitor parking entrance?',
      'How do I book a free guided architectural tour?',
    ],
  });
  const [isNavLoading, setIsNavLoading] = useState(false);
  const [isNavSpeaking, setIsNavSpeaking] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Activate professional scroll-triggered reveal animations
  useScrollReveal([experiences, currentSection]);

  useEffect(() => {
    const handleStorageChange = () => {
      setExperiences(getCenterExperiences());
      setSyncedData(getLatestSyncedData());
    };
    const unsub = subscribeToSyncUpdates((data) => setSyncedData(data));
    window.addEventListener('storage', handleStorageChange);
    return () => {
      unsub();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAskNav = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isNavLoading) return;
    setIsNavLoading(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsNavSpeaking(false);
    }
    try {
      const res = await getSmartAssistantResponse(cleanQuery, undefined, { mode: 'text' });
      const { reply, suggestedFollowUps } = extractSuggestedFollowUps(res.reply);
      setNavResponse({
        text: reply,
        followUps: suggestedFollowUps && suggestedFollowUps.length > 0 ? suggestedFollowUps : [
          'What are the public visiting hours?',
          'Where is the visitor parking entrance?',
          'How do I book a free tour?',
        ],
      });
      setNavQuery('');
    } catch (_err) {
      // fallback
    } finally {
      setIsNavLoading(false);
    }
  };

  const toggleSpeakNav = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isNavSpeaking) {
      window.speechSynthesis.cancel();
      setIsNavSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanSpoken = humanizeSpokenText(navResponse.text);
    const utterance = new SpeechSynthesisUtterance(cleanSpoken);
    utterance.lang = 'en-GB';
    const voice = getGoogleUKEnglishMaleVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onend = () => setIsNavSpeaking(false);
    utterance.onerror = () => setIsNavSpeaking(false);
    setIsNavSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText('Montrose Boulevard & Allen Parkway, Houston, TX 77019');
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2200);
  };

  const activeExperiences = experiences.filter(e => e.isActive);

  // Filter experiences by category & search term
  const filteredExperiences = activeExperiences.filter((exp) => {
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesSearch = 
      !searchFilter.trim() ||
      exp.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      exp.shortDescription.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (exp.badge && exp.badge.toLowerCase().includes(searchFilter.toLowerCase())) ||
      exp.highlights.some(h => h.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector Header: Smoothly Toggle Between Navigations and Events */}
      <div className="scroll-reveal flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleSwitchTab('navigations')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentSection === 'navigations'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 ring-1 ring-teal-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4 shrink-0" />
            <span className="truncate">Navigations</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${currentSection === 'navigations' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              4
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('events')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentSection === 'events'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 ring-1 ring-amber-500'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="truncate">Events &amp; Tours</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${currentSection === 'events' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              5
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Free Public Admission</span>
          </span>
          <span className="hidden sm:inline-block text-slate-400 dark:text-slate-600">•</span>
          <span className="hidden sm:inline-block font-medium">
            Montrose Blvd &amp; Allen Pkwy
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: NAVIGATIONS TAB CONTENT                            */}
      {/* ============================================================== */}
      {currentSection === 'navigations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Official Navigation & Google Maps Visitor Guide Card */}
          <div className="scroll-reveal bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm space-y-5 sm:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  <Navigation className="w-4 h-4" />
                  <span>Visitor &amp; Architecture Navigation</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Official Navigation &amp; Directions Guide
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                  Montrose Boulevard &amp; Allen Parkway, Houston, TX 77019. Turn-by-turn driving directions, free visitor parking entrance, airport drive times, and live Google Maps GPS.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                <button
                  type="button"
                  onClick={copyAddressToClipboard}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                  title="Copy official address to clipboard"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span className="text-teal-600 dark:text-teal-400 font-bold">Address Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Ismaili+Center+Houston+Montrose+Blvd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 group cursor-pointer"
                  title="Launch GPS in Google Maps"
                >
                  <MapPin className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-90 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Interactive Navigation Guide Assistant Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-teal-50/70 via-emerald-50/50 to-sky-50/60 dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/40 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Navigation &amp; Arrival Assistant</span>
                      <span className="px-2 py-0.5 rounded-md bg-teal-200/60 dark:bg-teal-800/60 text-teal-800 dark:text-teal-200 text-[10px] font-bold">
                        Official Guide
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Ask for driving steps, airport times, METRO transit, or multilingual arrival guidance
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleSpeakNav}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    isNavSpeaking
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-500'
                  }`}
                  title={isNavSpeaking ? 'Stop voice readout' : 'Listen to arrival guidance'}
                >
                  {isNavSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4 animate-pulse" />
                      <span className="hidden sm:inline">Stop Audio</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="hidden sm:inline">Listen Aloud</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Nav Inquiry Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center mr-1">
                  <Sparkles className="w-3 h-3 mr-1 text-teal-600 dark:text-teal-400" />
                  Quick Inquiries:
                </span>
                {[
                  { label: 'Driving & Parking Entrance', query: 'How do I get there by car and where do I park?' },
                  { label: 'Hobby & Bush Airport Times', query: 'Which airport is closest and how long does it take to drive here?' },
                  { label: 'METRO Bus Transit Routes', query: 'What public transit or METRO bus routes go to the center?' },
                  { label: 'اردو میں رہنمائی (Urdu)', query: 'اسماعیلی سینٹر کا پتہ کیا ہے اور گاڑی کہاں پارک کر سکتے ہیں؟' },
                  { label: 'ગુજરાતી માર્ગદર્શન (Gujarati)', query: 'ઇસ્માઇલી સેન્ટરનું સરનામું શું છે અને પાર્કિંગ ક્યાં છે?' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskNav(chip.query)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Response Container */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/60 dark:border-slate-800 space-y-3">
                {isNavLoading ? (
                  <div className="flex items-center space-x-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Consulting official Google Maps and navigation database...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                      {navResponse.text.split('\n').map((line, lIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;

                        // Standalone Google Maps link
                        if (/^\[Open in Google Maps\]/i.test(trimmed)) {
                          return (
                            <div key={lIdx} className="pt-2">
                              <a
                                href="https://www.google.com/maps/search/?api=1&query=Ismaili+Center+Houston+Montrose+Blvd"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 group cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-teal-100 group-hover:scale-110 transition-transform" />
                                <span>Open in Google Maps</span>
                                <ExternalLink className="w-3 h-3 opacity-90" />
                              </a>
                            </div>
                          );
                        }

                        if (trimmed.startsWith('**[Navigation Guide]**') || trimmed === '[Navigation Guide]') {
                          return (
                            <div key={lIdx} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider">
                              <Navigation className="w-3 h-3" />
                              <span>Navigation Guide</span>
                            </div>
                          );
                        }

                        if (trimmed.startsWith('**[Suggested Follow-ups]**') || trimmed === '[Suggested Follow-ups]') {
                          return null;
                        }

                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                          return null;
                        }

                        return <p key={lIdx}>{trimmed}</p>;
                      })}
                    </div>

                    {/* Follow-up Question Chips */}
                    {navResponse.followUps && navResponse.followUps.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block flex items-center">
                          <Sparkles className="w-2.5 h-2.5 mr-1 text-teal-600 dark:text-teal-400" />
                          Suggested Follow-ups:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {navResponse.followUps.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => handleAskNav(chip)}
                              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all font-medium cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Custom Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskNav(navQuery);
                  }}
                  className="flex items-center gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={navQuery}
                    onChange={(e) => setNavQuery(e.target.value)}
                    placeholder="Ask specific directions (e.g. from I-10, Hobby airport, visitor parking entrance)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                  <button
                    type="submit"
                    disabled={!navQuery.trim() || isNavLoading}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Ask</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* 4-Card Navigational Specification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Driving & GPS */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  Driving &amp; Highway Exits
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Accessible via <strong>I-10</strong>, <strong>I-45</strong>, or <strong>I-69/US-59</strong> leading directly to Allen Parkway or Montrose Boulevard. Primary visitor driveway entrance is located on Montrose Boulevard.
                </p>
              </div>

              {/* Card 2: Parking Access & ADA */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  Free On-Site Parking &amp; ADA
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>100% Free</strong> on-site parking is provided for all registered visitors and tour attendees. Includes dedicated ADA-compliant spaces and passenger drop-off turnaround zones.
                </p>
              </div>

              {/* Card 3: Airports & Transit Times */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                  <Plane className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  Airport Transfers &amp; Drive Times
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Hobby (HOU):</strong> ~12 miles south (~20–25 mins via I-45 N).<br />
                  <strong>Bush (IAH):</strong> ~25 miles north (~30–35 mins via I-69/US-59 S or I-45 S).
                </p>
              </div>

              {/* Card 4: Public Transit */}
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Bus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  Public Transit &amp; Trails
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Served by Houston METRO Bus <strong>Route 27</strong> (Montrose) and <strong>Route 40</strong>. Paved walkways connect directly to Buffalo Bayou Park hike and bike trails.
                </p>
              </div>
            </div>

            {/* Embedded Interactive Google Maps Frame */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative group bg-slate-100 dark:bg-slate-900">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>Montrose Blvd &amp; Allen Parkway, Houston, TX 77019</span>
                </div>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Ismaili+Center+Houston+Montrose+Blvd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-teal-600 dark:text-teal-400 hover:underline font-bold"
                >
                  <span>Full Screen Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="w-full h-72 sm:h-80 relative">
                <iframe
                  title="Ismaili Center Houston Map Location"
                  src="https://maps.google.com/maps?q=Ismaili+Center+Houston+Montrose+Blvd&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Quick Actions & Switch to Events Tab */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Looking for upcoming tours and weekly visitor hours?</span>
              </div>
              <button
                type="button"
                onClick={() => handleSwitchTab('events')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <span>View Events &amp; Tours</span>
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: EVENTS & GUIDED TOURS TAB CONTENT                   */}
      {/* ============================================================== */}
      {currentSection === 'events' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Title Banner */}
          <div className="scroll-reveal bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 md:p-8 shadow-sm space-y-5 sm:space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                <Compass className="w-3.5 h-3.5" />
                <span>Civic &amp; Cultural Landmark</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
                Visitor Events, Guided Tours &amp; Hours
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                A comprehensive guide to public opening hours, booking architectural tours, exploring the 11-acre gardens, and attending public civic programs.
              </p>
            </div>

            {/* Primary Visiting Hours Callout Card */}
            <div className="scroll-reveal scroll-reveal-delay-1 p-6 rounded-2xl bg-gradient-to-r from-amber-50/70 via-emerald-50/50 to-teal-50/50 dark:from-amber-950/30 dark:via-emerald-950/20 dark:to-teal-950/20 border border-amber-200/80 dark:border-amber-800/50 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Public Visitor Opening Days</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {syncedData.centerData.visitingHours.days.join(', ')}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span><strong>Building:</strong> {syncedData.centerData.visitingHours.buildingHours}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <TreePine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span><strong>Gardens:</strong> {syncedData.centerData.visitingHours.gardensHours}</span>
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                    {syncedData.centerData.visitingHours.admission || 'Admission is Free'}
                  </span>
                </div>
              </div>

              <a
                href={syncedData.centerData.visitingHours.officialTourPortal || OFFICIAL_TOUR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all shadow-md self-start md:self-center flex-shrink-0 active:scale-95 cursor-pointer"
                title="Official Ismaili Center Houston Portal - Guided Architectural Tours"
              >
                <span>Book Guided Tour</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Public Experiences & Guided Tours Header with Search and Filter */}
            <div className="scroll-reveal scroll-reveal-delay-1 space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Featured Experiences &amp; Guided Tours</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Docent-guided tours, garden walks, and cultural exhibitions. All registrations direct to the official portal.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-center">
                  {filteredExperiences.length} of {activeExperiences.length} Available
                </span>
              </div>

              {/* Category Filter Pills & Search Bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {[
                    { id: 'all', label: 'All Activities' },
                    { id: 'tour', label: 'Tours' },
                    { id: 'garden', label: 'Gardens' },
                    { id: 'architecture', label: 'Architecture' },
                    { id: 'cultural', label: 'Cultural' },
                    { id: 'spiritual', label: 'Spiritual' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-amber-600 text-white shadow-xs font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search tours & activities..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Experiences Cards Grid */}
              {filteredExperiences.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No experiences match your filter
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSelectedCategory('all'); setSearchFilter(''); }}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold underline cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExperiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            {exp.badge || exp.category.toUpperCase()}
                          </span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                            {exp.admission}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          {exp.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {exp.shortDescription}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exp.schedule}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exp.duration}</span>
                          </span>
                        </div>

                        {exp.highlights && exp.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {exp.highlights.slice(0, 3).map((h, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <a
                        href={exp.officialBookingUrl || OFFICIAL_TOUR_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center space-x-2 shadow-2xs group cursor-pointer"
                      >
                        <span>{exp.category === 'tour' ? 'Book Tour (Official Portal)' : 'Official Center Information'}</span>
                        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purpose & Mission */}
            <div className="scroll-reveal scroll-reveal-delay-2 p-6 rounded-2xl bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-700 space-y-3">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 font-semibold">
                <HeartHandshake className="w-5 h-5" />
                <h4 className="text-lg font-bold tracking-tight">What is the Ismaili Center For?</h4>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                The <strong>Ismaili Center Houston</strong> represents an ambassadorial civic, cultural, and spiritual hub established to promote mutual understanding, foster intellectual exchange, and showcase pluralistic Islamic architecture and heritage. It serves both as a spiritual sanctuary for the Ismaili Shia Muslim community and an open venue for civic dialogue, performance art, and educational programs for Houstonians and global visitors alike.
              </p>
            </div>

            {/* Action Portals */}
            <div className="scroll-reveal scroll-reveal-delay-3 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <a
                href={OFFICIAL_TOUR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-amber-600 text-white hover:bg-amber-700 transition-all flex items-center justify-between group shadow-md cursor-pointer"
                title="Official Ismaili Center Houston Portal - Guided Architectural Tours"
              >
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider opacity-90 font-bold block">
                    Guided 45-Minute Visit
                  </span>
                  <h4 className="text-base sm:text-lg font-bold tracking-tight">Book an Architectural Tour</h4>
                  <p className="text-xs opacity-90">Official reservation portal on the.ismaili</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>

              <a
                href="https://the.ismaili/us/ismaili-center-houston"
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block">
                    Official Center Portal
                  </span>
                  <h4 className="text-base sm:text-lg font-bold tracking-tight">Official Ismaili Center Website</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Explore events, architecture, and civic programs</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center group-hover:translate-x-1 transition-transform flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </a>
            </div>

            {/* Quick Actions & Switch to Navigations Tab */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Need driving directions, parking entrance or transit info?</span>
              </div>
              <button
                type="button"
                onClick={() => handleSwitchTab('navigations')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <span>View Navigations &amp; Directions</span>
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
