import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogOut, 
  History, 
  Layers, 
  Inbox, 
  Calendar, 
  Megaphone, 
  Cpu, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  MessageSquare, 
  Settings, 
  ExternalLink, 
  AlertTriangle,
  FileSpreadsheet,
  Activity,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  PhoneForwarded,
  Bot,
  Compass,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  Link as LinkIcon
} from 'lucide-react';
import { 
  LifespanEvent, 
  LifespanEventType, 
  CallerMessage, 
  TourReservation, 
  PhonebotCallMetrics, 
  TelephonyPipelineTelemetry,
  AdminAnnouncement,
  AnonymousCallRecord,
  CallTranscriptTurn,
  CenterExperience
} from '../types.ts';
import { 
  getCenterExperiences, 
  saveCenterExperience, 
  addCenterExperience, 
  deleteCenterExperience, 
  toggleExperienceActive, 
  resetExperiencesToDefault, 
  OFFICIAL_TOUR_URL 
} from '../utils/experiencesStorage.ts';
import { ExperienceEditorModal } from './ExperienceEditorModal.tsx';
import { 
  getUserLifespanHistory, 
  clearLifespanHistory, 
  resetToDefaultLifespanHistory, 
  exportLifespanHistoryCSV, 
  exportLifespanHistoryJSON,
  logLifespanEvent 
} from '../utils/userHistoryStorage.ts';
import { 
  getCallerMessages, 
  updateMessageStatus, 
  deleteCallerMessage, 
  getTourReservations, 
  getPhonebotMetrics,
  generateTwilioTwiML,
  generateVapiAgentConfig
} from '../utils/phonebotStorage.ts';
import { 
  getAdminAnnouncement, 
  saveAdminAnnouncement, 
  setAdminAuth 
} from '../utils/adminAuth.ts';
import { 
  getAnonymousCalls, 
  deleteAnonymousCall, 
  clearAnonymousCalls, 
  exportAuditReportTXT, 
  exportAuditReportJSON 
} from '../utils/callLogStorage.ts';
import { formatRelativeCentralTimestamp } from '../utils/time.ts';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenPipelineInspector: () => void;
  telemetry: TelephonyPipelineTelemetry;
  initialTab?: 'calls' | 'experiences' | 'history' | 'pipeline' | 'messages' | 'announcements' | 'telephony';
  embedded?: boolean;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  onOpenPipelineInspector,
  telemetry,
  initialTab = 'calls',
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'calls' | 'experiences' | 'history' | 'pipeline' | 'messages' | 'announcements' | 'telephony'>(initialTab);
  
  // Synchronize initialTab whenever modal opens or changes
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Center Experiences State
  const [experiences, setExperiences] = useState<CenterExperience[]>(() => getCenterExperiences());
  const [experienceSearch, setExperienceSearch] = useState('');
  const [experienceCategoryFilter, setExperienceCategoryFilter] = useState<string>('all');
  const [editingExperience, setEditingExperience] = useState<CenterExperience | null>(null);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [experienceSuccessMsg, setExperienceSuccessMsg] = useState<string | null>(null);
  
  // Anonymous Calls & Direct Verbatim Transcripts for Higher-Up Admins
  const [anonymousCalls, setAnonymousCalls] = useState<AnonymousCallRecord[]>([]);
  const [callSearchQuery, setCallSearchQuery] = useState('');
  const [callOutcomeFilter, setCallOutcomeFilter] = useState<'all' | 'completed' | 'escalated_to_staff'>('all');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [copiedTranscriptId, setCopiedTranscriptId] = useState<string | null>(null);
  const [confirmClearCalls, setConfirmClearCalls] = useState(false);

  // Lifespan history state
  const [historyEvents, setHistoryEvents] = useState<LifespanEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<LifespanEventType | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<LifespanEvent | null>(null);

  // Storage data
  const [messages, setMessages] = useState<CallerMessage[]>([]);
  const [reservations, setReservations] = useState<TourReservation[]>([]);
  const [metrics, setMetrics] = useState<PhonebotCallMetrics>(getPhonebotMetrics());
  
  // Announcement state
  const [announcement, setAnnouncement] = useState<AdminAnnouncement>(getAdminAnnouncement());
  const [announcementSaved, setAnnouncementSaved] = useState(false);

  // Copied code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshData = () => {
    setAnonymousCalls(getAnonymousCalls());
    setHistoryEvents(getUserLifespanHistory());
    setMessages(getCallerMessages());
    setReservations(getTourReservations());
    setMetrics(getPhonebotMetrics());
    setAnnouncement(getAdminAnnouncement());
    setExperiences(getCenterExperiences());
  };

  const handleSaveExperience = (exp: CenterExperience) => {
    const updated = saveCenterExperience(exp);
    setExperiences(updated);
    setEditingExperience(null);
    setExperienceSuccessMsg(`Experience "${exp.title}" updated successfully!`);
    setTimeout(() => setExperienceSuccessMsg(null), 3500);
  };

  const handleCreateExperience = (expData: any) => {
    const updated = addCenterExperience(expData);
    setExperiences(updated);
    setIsAddingExperience(false);
    setExperienceSuccessMsg(`New experience "${expData.title}" created successfully!`);
    setTimeout(() => setExperienceSuccessMsg(null), 3500);
  };

  const handleDeleteExperience = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove "${title}"?`)) {
      const updated = deleteCenterExperience(id);
      setExperiences(updated);
      setExperienceSuccessMsg(`Experience "${title}" removed.`);
      setTimeout(() => setExperienceSuccessMsg(null), 3000);
    }
  };

  const handleToggleActiveExperience = (id: string) => {
    const updated = toggleExperienceActive(id);
    setExperiences(updated);
  };

  const handleResetExperiences = () => {
    if (window.confirm('Reset all experiences to the official Ismaili Center defaults?')) {
      const defs = resetExperiencesToDefault();
      setExperiences(defs);
      setExperienceSuccessMsg('Experiences reset to official Ismaili Center defaults.');
      setTimeout(() => setExperienceSuccessMsg(null), 3500);
    }
  };

  const handleCopyTranscript = (call: AnonymousCallRecord) => {
    let text = `========================================================================\n`;
    text += `ISMAILI CENTER HOUSTON — VERBATIM CALL TRANSCRIPT AUDIT\n`;
    text += `CALL RECORD: #${String(call.callNumber).padStart(3, '0')} | ${call.anonymousCallerId}\n`;
    text += `Timestamp: ${call.startTime} to ${call.endTime}\n`;
    text += `Duration: ${call.formattedDuration} (${call.durationSeconds}s) | Outcome: ${call.outcomeLabel}\n`;
    text += `Final Intent: ${call.finalIntent} | Topics: ${call.topicsDetected.join(', ')}\n`;
    text += `Telephony Codec: ${call.telemetry?.telephonyCodec || 'G.711 / WebRTC Opus'} | Latency: ~${call.telemetry?.roundtripLatencyMs || 120}ms\n`;
    text += `========================================================================\n\n`;
    call.transcript.forEach((turn) => {
      text += `[${turn.timestamp}] ${turn.speaker}:\n"${turn.text}"\n`;
      if (turn.intent) {
        text += `  ↳ Recognized Intent: ${turn.intent}\n`;
      }
      text += `\n`;
    });
    navigator.clipboard.writeText(text);
    setCopiedTranscriptId(call.id);
    setTimeout(() => setCopiedTranscriptId(null), 2500);
  };

  const handleDeleteCall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAnonymousCall(id);
    refreshData();
  };

  const handleClearAllCalls = () => {
    clearAnonymousCalls();
    setConfirmClearCalls(false);
    refreshData();
  };

  useEffect(() => {
    if (isOpen || embedded) {
      refreshData();
      if (!embedded) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, embedded]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !embedded) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, embedded, onClose]);

  if (!isOpen && !embedded) return null;

  // Filter anonymous calls (Verbatim call transcripts)
  const filteredCalls = anonymousCalls.filter((call) => {
    const matchesOutcome = callOutcomeFilter === 'all' || call.outcome === callOutcomeFilter;
    const q = callSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      call.anonymousCallerId.toLowerCase().includes(q) ||
      call.finalIntent.toLowerCase().includes(q) ||
      call.outcomeLabel.toLowerCase().includes(q) ||
      call.topicsDetected.some((t) => t.toLowerCase().includes(q)) ||
      call.transcript.some((t) => t.text.toLowerCase().includes(q));
    return matchesOutcome && matchesSearch;
  });

  // Filter history events
  const filteredEvents = historyEvents.filter((evt) => {
    const matchesType = typeFilter === 'all' || evt.type === typeFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      !query ||
      evt.title.toLowerCase().includes(query) ||
      evt.summary.toLowerCase().includes(query) ||
      (evt.userIdentifier && evt.userIdentifier.toLowerCase().includes(query)) ||
      (evt.status && evt.status.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  const handleUpdateMessageStatus = (id: string, status: 'pending' | 'reviewed' | 'resolved') => {
    const updated = updateMessageStatus(id, status);
    setMessages(updated);
    logLifespanEvent({
      type: 'admin_action',
      title: 'Caller Message Status Updated',
      summary: `Administrator marked voicemail #${id} as "${status}".`,
      userIdentifier: 'Administrator',
      status: 'completed',
    });
    setHistoryEvents(getUserLifespanHistory());
  };

  const handleDeleteMessage = (id: string) => {
    const updated = deleteCallerMessage(id);
    setMessages(updated);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminAnnouncement(announcement);
    setAnnouncementSaved(true);
    setTimeout(() => setAnnouncementSaved(false), 2500);

    logLifespanEvent({
      type: 'admin_action',
      title: 'Center Announcement Banner Updated',
      summary: `Admin updated broadcast banner (${announcement.enabled ? 'Enabled' : 'Disabled'}): "${announcement.message.slice(0, 60)}..."`,
      userIdentifier: 'Administrator',
      status: 'active',
    });
    setHistoryEvents(getUserLifespanHistory());
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all lifespan history? This cannot be undone.')) {
      clearLifespanHistory();
      setHistoryEvents([]);
      setSelectedEvent(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getEventIcon = (type: LifespanEventType) => {
    switch (type) {
      case 'voice_call':
        return <PhoneCall className="w-4 h-4 text-rose-500" />;
      case 'ai_chat':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case 'tour_booking':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'caller_message':
        return <Inbox className="w-4 h-4 text-purple-500" />;
      case 'setting_change':
        return <Settings className="w-4 h-4 text-amber-500" />;
      case 'admin_action':
        return <Activity className="w-4 h-4 text-indigo-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const dashboardContent = (
    <div className={`w-full ${embedded ? 'border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl' : 'max-w-6xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[94vh]'} bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}>
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="admin-dashboard-title" className="text-lg font-bold font-cinzel text-white">
                  Ismaili Center Houston Admin Console
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Admin Signed In
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tour schedules, call logs, voicemails, and center notices
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/50 text-xs font-semibold transition-colors cursor-pointer"
              title="Sign out of admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close admin dashboard"
              title={embedded ? 'Exit to visitor view' : 'Close admin dashboard'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'calls'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-emerald-500" />
            <span>Call Transcripts</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
              {anonymousCalls.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity History</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
              {historyEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'pipeline'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-rose-500" />
            <span>System Speed & AI</span>
            <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold">
              ~{telemetry.roundtripLatencyMs}ms
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'messages'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4 text-purple-500" />
            <span>Messages & Voicemails</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-mono">
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experiences')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'experiences'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>Manage Tours & Events</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
              {experiences.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'announcements'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4 text-blue-500" />
            <span>Notice Banner</span>
            {announcement.enabled && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telephony')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'telephony'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-slate-500" />
            <span>Phone Setup</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: DIRECT VERBATIM CALL TRANSCRIPTS & AUDIT (ZERO DATA FABRICATION) */}
          {activeTab === 'calls' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Call Transcripts Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Call Transcripts & Phone Records
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Accurate Call Logs
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Every call below is a real conversation handled by the phone assistant. Calls are recorded word-for-word without saving any personal names or phone numbers to protect caller privacy.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={exportAuditReportTXT}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Export text report"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Export Text (.TXT)</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportAuditReportJSON}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Export JSON data file"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Top Executive KPI Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Calls Taken
                  </span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    {anonymousCalls.length}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Direct hotline sessions
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Verbatim Transcripts
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {anonymousCalls.filter(c => c.transcript.length > 0).length}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    100% full dialogue saved
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20">
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                    Self-Service Resolved
                  </span>
                  <span className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1 block">
                    {anonymousCalls.filter(c => c.outcome === 'completed').length}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {anonymousCalls.length > 0 
                      ? `${Math.round((anonymousCalls.filter(c => c.outcome === 'completed').length / anonymousCalls.length) * 100)}% resolution rate`
                      : 'No calls taken yet'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Escalated to Staff
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                    {anonymousCalls.filter(c => c.outcome === 'escalated_to_staff').length}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Transferred to 713-522-2026
                  </span>
                </div>
              </div>

              {/* Search, Filter & Log Management Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={callSearchQuery}
                      onChange={(e) => setCallSearchQuery(e.target.value)}
                      placeholder="Search verbatim speech, caller words, or topic..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Outcome filter pills */}
                  <div className="flex items-center gap-1">
                    {(['all', 'completed', 'escalated_to_staff'] as const).map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        onClick={() => setCallOutcomeFilter(outcome)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          callOutcomeFilter === outcome
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {outcome === 'all' && 'All Calls'}
                        {outcome === 'completed' && 'Completed'}
                        {outcome === 'escalated_to_staff' && 'Transferred'}
                      </button>
                    ))}
                  </div>

                  {anonymousCalls.length > 0 && (
                    confirmClearCalls ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Clear audit log?</span>
                        <button
                          type="button"
                          onClick={handleClearAllCalls}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Yes, Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearCalls(false)}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClearCalls(true)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Clear call archive for new review period"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Calls List & Direct Verbatim Transcripts */}
              <div className="space-y-3">
                {filteredCalls.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-3 text-emerald-600 dark:text-emerald-400">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {anonymousCalls.length === 0 ? 'No Calls Taken Yet (0 Calls Logged)' : 'No Calls Match Your Filter'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                      {anonymousCalls.length === 0
                        ? 'All calls initiated via the Voice Hotline are automatically captured with verbatim, turn-by-turn dialogue and strict caller anonymity. Zero data is fabricated or simulated for higher-up admins.'
                        : 'Try searching for a different phrase or reset the outcome filter to view all calls.'}
                    </p>
                    {anonymousCalls.length === 0 ? (
                      <button
                        type="button"
                        onClick={onClose}
                        className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Close & Place a Hotline Call to Test</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setCallSearchQuery(''); setCallOutcomeFilter('all'); }}
                        className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Reset search & filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredCalls.map((call) => {
                    const isExpanded = expandedCallId === call.id;
                    const isCopied = copiedTranscriptId === call.id;

                    return (
                      <div
                        key={call.id}
                        className={`rounded-2xl border transition-all ${
                          isExpanded
                            ? 'border-emerald-500/80 bg-white dark:bg-slate-850 shadow-md ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Call Summary Header Card */}
                        <div
                          className="p-4 cursor-pointer flex items-start justify-between gap-4"
                          onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                        >
                          <div className="flex items-start space-x-3.5">
                            <div className={`mt-0.5 p-2.5 rounded-xl ${
                              call.outcome === 'escalated_to_staff'
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {call.outcome === 'escalated_to_staff' ? (
                                <PhoneForwarded className="w-4 h-4" />
                              ) : (
                                <PhoneCall className="w-4 h-4" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                                  #{String(call.callNumber).padStart(3, '0')}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {call.anonymousCallerId}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                                  {formatRelativeCentralTimestamp(call.startTime)}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                                  {call.formattedDuration}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  call.outcome === 'escalated_to_staff'
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                }`}>
                                  {call.outcomeLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                                <span>{call.turnsCount} dialogue turns</span>
                                <span>•</span>
                                <span>Final intent: <strong className="text-slate-700 dark:text-slate-200">{call.finalIntent}</strong></span>
                                {call.topicsDetected.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Topics: {call.topicsDetected.join(', ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyTranscript(call);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                              title="Copy verbatim transcript to clipboard"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteCall(call.id, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Delete this record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="p-1 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Verbatim Dialogue & Telemetry */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                            {/* Dialogue Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                  Verbatim Dialogue Transcript (Turn by Turn)
                                </h5>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Unedited • Direct from speech & DTMF logs
                              </span>
                            </div>

                            {/* Dialogue Turns */}
                            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                              {call.transcript.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">
                                  No dialogue turns recorded for this call.
                                </p>
                              ) : (
                                call.transcript.map((turn, idx) => {
                                  const isCaller = turn.speaker.toLowerCase().includes('caller') || turn.speaker.toLowerCase().includes('you');
                                  const isSystem = turn.speaker.toLowerCase().includes('system');

                                  if (isSystem) {
                                    return (
                                      <div key={turn.id || idx} className="text-center py-1">
                                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 font-mono">
                                          {turn.text} ({turn.timestamp})
                                        </span>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={turn.id || idx}
                                      className={`p-3.5 rounded-2xl border ${
                                        isCaller
                                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                                          : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/40'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center space-x-2">
                                          <div className={`p-1 rounded-lg ${
                                            isCaller
                                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                              : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200'
                                          }`}>
                                            {isCaller ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                                          </div>
                                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                                            {turn.speaker}
                                          </span>
                                          {turn.intent && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                              {turn.intent}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400">
                                          {turn.timestamp}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed pl-6">
                                        "{turn.text}"
                                      </p>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Technical Telemetry Snapshot */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 block font-medium">Codec</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {call.telemetry?.telephonyCodec || 'G.711 / Opus'}
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 block font-medium">Latency</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  ~{call.telemetry?.roundtripLatencyMs || 120}ms
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 block font-medium">STT Model</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                                  {call.telemetry?.sttEngine || 'Web Speech API'}
                                </span>
                              </div>
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <span className="text-slate-400 block font-medium">LLM Reasoning</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                                  Gemini 2.5 Flash
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 1: ACTIVITY HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Top Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Logged Interactions
                  </span>
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                    {historyEvents.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20">
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                    Phonebot Voice Calls
                  </span>
                  <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1 block">
                    {anonymousCalls.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/20">
                  <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                    AI Chat Inquiries
                  </span>
                  <span className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1 block">
                    {historyEvents.filter(e => e.type === 'ai_chat').length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Tour Bookings Recorded
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {reservations.length}
                  </span>
                </div>
              </div>

              {/* Filters & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search user query, caller, or event..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Event Type Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'voice_call', 'ai_chat', 'tour_booking', 'caller_message', 'setting_change'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTypeFilter(type)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                        typeFilter === type
                          ? 'bg-amber-500 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {type === 'all' && 'All Types'}
                      {type === 'voice_call' && 'Calls'}
                      {type === 'ai_chat' && 'AI Chat'}
                      {type === 'tour_booking' && 'Tours'}
                      {type === 'caller_message' && 'Messages'}
                      {type === 'setting_change' && 'Display'}
                    </button>
                  ))}
                </div>

                {/* Export & Reset Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportLifespanHistoryCSV}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                    title="Export CSV spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportLifespanHistoryJSON}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
                    title="Export JSON payload"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* History Events Feed */}
              <div className="space-y-2.5">
                {filteredEvents.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-semibold">No lifespan events match your current filter or search.</p>
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
                      className="mt-3 text-xs text-amber-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear search filters
                    </button>
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const isExpanded = selectedEvent?.id === evt.id;
                    return (
                      <div
                        key={evt.id}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          isExpanded
                            ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-950/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                        onClick={() => setSelectedEvent(isExpanded ? null : evt)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                              {getEventIcon(evt.type)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {evt.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                                  {formatRelativeCentralTimestamp(evt.timestamp)}
                                </span>
                                {evt.duration && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-mono">
                                    {evt.duration}
                                  </span>
                                )}
                                {evt.status && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold capitalize">
                                    {evt.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {evt.summary}
                              </p>
                              {evt.userIdentifier && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{evt.userIdentifier}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expanded Details JSON / Metadata */}
                        {isExpanded && evt.details && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
                              Event Payload & Technical Audit
                            </span>
                            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] overflow-x-auto">
                              {JSON.stringify(evt.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM SPEED & AI PIPELINE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white border border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                    <Layers className="w-4 h-4" />
                    <span>Voice & AI Speed Breakdown</span>
                  </div>
                  <h3 className="text-xl font-bold font-cinzel text-white">
                    Phone Assistant Speed & AI
                  </h3>
                  <p className="text-xs text-slate-300 max-w-xl">
                    See response speeds for microphone audio, voice recognition, AI logic, and speech synthesis.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenPipelineInspector}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  <Layers className="w-4 h-4" />
                  <span>Open Full Speed Inspector</span>
                </button>
              </div>

              {/* 5-Layer Waterfall Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Layer 1 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Layer 1</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Audio Capture & VAD</h4>
                  <p className="text-[11px] text-slate-500">16kHz PCM WebRTC with Silero Voice Activity Detector.</p>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold block w-fit">
                    ~18ms latency
                  </span>
                </div>

                {/* Layer 2 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Layer 2</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Deepgram Nova-2</h4>
                  <p className="text-[11px] text-slate-500">Streaming ASR with custom Houston and Ismaili terminology.</p>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold block w-fit">
                    ~{telemetry.sttLatencyMs}ms latency
                  </span>
                </div>

                {/* Layer 3 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Layer 3</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Gemini 2.5 Flash</h4>
                  <p className="text-[11px] text-slate-500">Intent classifier, tour booker, and conversation generator.</p>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold block w-fit">
                    ~{telemetry.llmLatencyMs}ms latency
                  </span>
                </div>

                {/* Layer 4 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Layer 4</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">11Labs Neural TTS</h4>
                  <p className="text-[11px] text-slate-500">British conversational voice with zero-shot streaming synthesis.</p>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold block w-fit">
                    ~{telemetry.ttsLatencyMs}ms latency
                  </span>
                </div>

                {/* Layer 5 */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Layer 5</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Twilio & SIP Trunk</h4>
                  <p className="text-[11px] text-slate-500">G.711u / Opus telephony gateway with staff transfer to +1 (713) 522-2026.</p>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono text-[10px] font-bold block w-fit">
                    G.711u Ready
                  </span>
                </div>
              </div>

              {/* Real-time Telemetry Waterfall */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    LIVE ROUNDTRIP LATENCY BREAKDOWN
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    Total: ~{telemetry.roundtripLatencyMs}ms
                  </span>
                </div>

                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div style={{ width: '22%' }} className="bg-amber-500" title="STT: ~62ms" />
                  <div style={{ width: '42%' }} className="bg-emerald-500" title="LLM: ~118ms" />
                  <div style={{ width: '28%' }} className="bg-sky-500" title="TTS: ~75ms" />
                  <div style={{ width: '8%' }} className="bg-purple-500" title="Audio Buffer: ~18ms" />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Deepgram STT (22%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Gemini 2.5 Flash (42%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> ElevenLabs TTS (28%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> WebRTC Buffering (8%)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VOICEMAILS & CALLER MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Voicemails & Caller Messages
                  </h3>
                  <p className="text-xs text-slate-500">
                    Messages left by callers through the automated phone assistant
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {messages.length} recorded
                </span>
              </div>

              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">No messages recorded in mailbox.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{msg.callerName}</span>
                            <span className="font-mono text-xs text-slate-500">{msg.callerPhone}</span>
                            {msg.urgency === 'urgent' && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                                Urgent
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold block">
                            Department: {msg.department}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={msg.status}
                            onChange={(e) => handleUpdateMessageStatus(msg.id, e.target.value as any)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                        "{msg.messageText}"
                      </p>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Received: {formatRelativeCentralTimestamp(msg.createdAt)}</span>
                        <a 
                          href={`tel:${msg.callerPhone}`}
                          className="text-[#007ba8] font-bold hover:underline"
                        >
                          Call back
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE EXPERIENCES & OFFICIAL TOUR REDIRECTS */}
          {activeTab === 'experiences' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Experiences Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-500" />
                    <span>Tours & Visitor Experiences</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update tour schedules, 11-acre gardens, and exhibitions. All tour registrations link to the official website.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetExperiences}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Reset all experiences to verified official defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingExperience(null);
                      setIsAddingExperience(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tour or Event</span>
                  </button>
                </div>
              </div>

              {/* Feedback Banner */}
              {experienceSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in duration-150">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {experienceSuccessMsg}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExperienceSuccessMsg(null)}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={experienceSearch}
                    onChange={(e) => setExperienceSearch(e.target.value)}
                    placeholder="Search experiences by title, schedule, or highlights..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                  {experienceSearch && (
                    <button
                      type="button"
                      onClick={() => setExperienceSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'tour', label: 'Tours' },
                    { id: 'garden', label: 'Gardens' },
                    { id: 'spiritual', label: 'Spiritual' },
                    { id: 'exhibition', label: 'Exhibitions' },
                    { id: 'cultural', label: 'Cultural' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setExperienceCategoryFilter(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        experienceCategoryFilter === cat.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experiences Cards List */}
              <div className="space-y-3.5">
                {experiences
                  .filter(exp => {
                    const matchesCategory = experienceCategoryFilter === 'all' || exp.category === experienceCategoryFilter;
                    const matchesSearch = !experienceSearch.trim() || 
                      exp.title.toLowerCase().includes(experienceSearch.toLowerCase()) ||
                      exp.shortDescription.toLowerCase().includes(experienceSearch.toLowerCase()) ||
                      exp.schedule.toLowerCase().includes(experienceSearch.toLowerCase()) ||
                      exp.highlights.some(h => h.toLowerCase().includes(experienceSearch.toLowerCase()));
                    return matchesCategory && matchesSearch;
                  })
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        exp.isActive
                          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-emerald-500/50'
                          : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/60 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          {/* Header row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {exp.title}
                            </span>
                            {exp.badge && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                {exp.badge}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-wider font-semibold">
                              {exp.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              exp.isActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}>
                              {exp.isActive ? 'Active (Public)' : 'Hidden (Draft)'}
                            </span>
                          </div>

                          {/* Schedule & Duration */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <strong className="font-semibold">{exp.schedule}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{exp.duration}</span>
                            </span>
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                              <span>{exp.admission}</span>
                            </span>
                          </div>

                          {/* Short Description */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {exp.shortDescription}
                          </p>

                          {/* Highlights pills */}
                          {exp.highlights && exp.highlights.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {exp.highlights.map((h, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 font-medium"
                                >
                                  • {h}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Official Redirect URL notice */}
                          <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Registration Portal:</span>
                            <a
                              href={exp.officialBookingUrl || OFFICIAL_TOUR_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[#007ba8] dark:text-teal-400 hover:underline flex items-center gap-1"
                            >
                              <span>{exp.officialBookingUrl || OFFICIAL_TOUR_URL}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2 shrink-0 self-end lg:self-start pt-2 lg:pt-0">
                          {/* Toggle Active Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleActiveExperience(exp.id)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                              exp.isActive
                                ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'
                            }`}
                            title={exp.isActive ? 'Click to hide this experience from visitors' : 'Click to display this experience to visitors'}
                          >
                            {exp.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{exp.isActive ? 'Visible' : 'Hidden'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExperience(exp);
                              setIsAddingExperience(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(exp.id, exp.title)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete this experience"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: NOTICE BANNER */}
          {activeTab === 'announcements' && (
            <form onSubmit={handleSaveAnnouncement} className="space-y-5 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Notice Banner at Top of Site
                </h3>
                <p className="text-xs text-slate-500">
                  Show urgent notices, holiday prayer changes, or special tour hours at the top of the website for all visitors.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Show Banner on Website
                  </label>
                  <input
                    type="checkbox"
                    checked={announcement.enabled}
                    onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Notice Message
                  </label>
                  <textarea
                    value={announcement.message}
                    onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500"
                    placeholder="Enter message to display at the top of the site..."
                    required
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Notice Type:
                  </label>
                  <select
                    value={announcement.type}
                    onChange={(e) => setAnnouncement({ ...announcement, type: e.target.value as any })}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="info">Informational (Blue)</option>
                    <option value="alert">Important Alert (Amber)</option>
                    <option value="event">Special Event (Emerald)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer active:scale-95"
                >
                  Save Notice Banner
                </button>

                {announcementSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Notice banner saved successfully!
                  </span>
                )}
              </div>
            </form>
          )}

          {/* TAB 6: PHONE SYSTEM SETUP */}
          {activeTab === 'telephony' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Phone Connection &amp; Setup
                </h3>
                <p className="text-xs text-slate-500">
                  Connect live phone lines (+1 713-522-2026) to the automated phone assistant
                </p>
              </div>

              {/* Twilio TwiML */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Twilio Voice Webhook TwiML XML
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generateTwilioTwiML(), 'twiml')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    {copiedCode === 'twiml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'twiml' ? 'Copied!' : 'Copy XML'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-black/60 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-48">
                  {generateTwilioTwiML()}
                </pre>
              </div>

              {/* Vapi JSON */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    Vapi.ai / Retell AI Agent JSON Manifest
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generateVapiAgentConfig(), 'vapi')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    {copiedCode === 'vapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'vapi' ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-black/60 text-sky-300 text-[11px] font-mono overflow-x-auto max-h-48">
                  {generateVapiAgentConfig()}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Admin Signed In • Password: 298402384</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer active:scale-95 transition-all"
          >
            Close Console
          </button>
        </div>
        {/* Experience Editor / Creator Modal */}
        <ExperienceEditorModal
          isOpen={isAddingExperience || !!editingExperience}
          onClose={() => {
            setIsAddingExperience(false);
            setEditingExperience(null);
          }}
          experience={editingExperience}
          onSave={editingExperience ? handleSaveExperience : handleCreateExperience}
        />
      </div>
  );

  if (embedded) {
    return dashboardContent;
  }

  return (
    <div
      id="admin-dashboard-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dashboard-title"
    >
      {dashboardContent}
    </div>
  );
};
