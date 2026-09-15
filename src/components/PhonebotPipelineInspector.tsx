import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Mic, 
  Volume2, 
  PhoneCall, 
  Database, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Calendar, 
  MessageSquare, 
  PhoneForwarded, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Layers,
  X
} from 'lucide-react';
import { 
  CallerMessage, 
  TourReservation, 
  PhonebotCallMetrics, 
  TelephonyPipelineTelemetry 
} from '../types.ts';
import { 
  generateTwilioTwiML, 
  generateVapiAgentConfig, 
  updateMessageStatus 
} from '../utils/phonebotStorage.ts';

interface PhonebotPipelineInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: TelephonyPipelineTelemetry;
  messages: CallerMessage[];
  reservations: TourReservation[];
  metrics: PhonebotCallMetrics;
  onRefreshData: () => void;
  onOpenMessageModal: () => void;
  onOpenBookingModal: () => void;
  onSimulateTransfer: () => void;
}

export const PhonebotPipelineInspector: React.FC<PhonebotPipelineInspectorProps> = ({
  isOpen,
  onClose,
  telemetry,
  messages,
  reservations,
  metrics,
  onRefreshData,
  onOpenMessageModal,
  onOpenBookingModal,
  onSimulateTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tasks' | 'telephony' | 'metrics'>('pipeline');
  const [copiedType, setCopiedType] = useState<'twilio' | 'vapi' | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'twilio' | 'vapi') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleResolveMessage = (id: string) => {
    updateMessageStatus(id, 'resolved');
    onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#111c2e] border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/60">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  AI Phonebot Architecture & Telephony Pipeline
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speech-to-Speech Processing Engine, Task Execution & Telephony Standards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 px-6 pt-2 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pipeline'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>5-Layer Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Task Execution ({messages.length + reservations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('telephony')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'telephony'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Telephony Deploy (Twilio / Vapi)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'metrics'
                ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Workload Reduction</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: 5-LAYER PIPELINE ARCHITECTURE */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white font-semibold">Speech-to-Speech Flow:</strong> Converts incoming caller audio to text, processes through intent detection and the RAG knowledge engine, humanizes phonetic pronunciation, and streams synthesized speech back into the telephone line with under 600ms total latency.
              </div>

              {/* Pipeline Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                
                {/* 1. STT */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{telemetry.sttLatencyMs}ms</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-xs">
                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                    <span>Speech-to-Text</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {telemetry.sttEngine}
                  </p>
                  <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                    Real-time audio streaming
                  </div>
                </div>

                {/* 2. Conversational Logic / LLM */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 text-xs font-bold flex items-center justify-center">2</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{telemetry.llmLatencyMs}ms</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-xs">
                    <Cpu className="w-3.5 h-3.5 text-purple-600" />
                    <span>Conversational Logic</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {telemetry.llmEngine}
                  </p>
                  <div className="pt-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium border-t border-slate-100 dark:border-slate-700/60 truncate">
                    Intent: {telemetry.currentIntent}
                  </div>
                </div>

                {/* 3. Knowledge Base & Rules */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold flex items-center justify-center">3</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">0ms Local</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-xs">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Knowledge & Rules</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    ICH Verified RAG & Guidelines
                  </p>
                  <div className="pt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium border-t border-slate-100 dark:border-slate-700/60">
                    Guarded Terminology
                  </div>
                </div>

                {/* 4. Text-to-Speech (TTS) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-xs font-bold flex items-center justify-center">4</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{telemetry.ttsLatencyMs}ms</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-xs">
                    <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Voice Synthesis</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {telemetry.ttsEngine}
                  </p>
                  <div className="pt-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium border-t border-slate-100 dark:border-slate-700/60">
                    Phonetic "Iss-my-lee"
                  </div>
                </div>

                {/* 5. Telephony Layer */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 text-xs font-bold flex items-center justify-center">5</span>
                    <span className="text-[10px] font-mono text-slate-400">PSTN/VoIP</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-900 dark:text-white font-bold text-xs">
                    <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                    <span>Telephony Ingress</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Codec: {telemetry.telephonyCodec}
                  </p>
                  <div className="pt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium border-t border-slate-100 dark:border-slate-700/60">
                    DTMF & Audio Chimes
                  </div>
                </div>
              </div>

              {/* End-to-end Telemetry Benchmarks */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live End-to-End Latency Profile
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Total: ~{telemetry.roundtripLatencyMs}ms (Under 1.0s Benchmark)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div style={{ width: '22%' }} className="bg-blue-500" title="STT: ~110ms" />
                  <div style={{ width: '48%' }} className="bg-purple-500" title="LLM: ~240ms" />
                  <div style={{ width: '20%' }} className="bg-rose-500" title="TTS: ~100ms" />
                  <div style={{ width: '10%' }} className="bg-amber-500" title="Telephony / SIP: ~50ms" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> STT ({telemetry.sttLatencyMs}ms)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> LLM Reasoning ({telemetry.llmLatencyMs}ms)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> TTS Audio ({telemetry.ttsLatencyMs}ms)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> SIP Buffer (50ms)</span>
                </div>
              </div>

              {/* Guardrails Check */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-emerald-900 dark:text-emerald-300">Sanitized Terminology Guardrail</h5>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400 mt-0.5">
                      "Subha Jo Niyaz" and "Sanjhi Dua" are systematically filtered from all responses. Clean terms "Morning Dua" and "Evening Prayer" are enforced.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-blue-900 dark:text-blue-300">Human Handoff Fallback</h5>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-400 mt-0.5">
                      Strict protocol: when an inquiry cannot be answered with high confidence, the system redirects to human staff at +1 (713) 522-2026.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASK EXECUTION & RECEPTION LOGS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Task Trigger Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenBookingModal}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Register Free Tour Reservation</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenMessageModal}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Take Caller Voicemail / Message</span>
                </button>

                <button
                  type="button"
                  onClick={onSimulateTransfer}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <PhoneForwarded className="w-4 h-4" />
                  <span>Simulate Warm Staff Transfer</span>
                </button>
              </div>

              {/* Tour Bookings Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>Registered Tour Reservations ({reservations.length})</span>
                </h4>

                <div className="space-y-2">
                  {reservations.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                      No tour reservations logged yet. Tap "Register Free Tour Reservation" above.
                    </div>
                  ) : (
                    reservations.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {res.visitorName}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                              {res.confirmationCode}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Party of {res.partySize} • {res.tourDate} at {res.timeSlot}
                          </p>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Contact: {res.contactEmailOrPhone} • Logged: {res.createdAt}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 self-start sm:self-center">
                          {res.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Caller Messages / Voicemail Log */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Front-Desk Caller Messages & Voicemails ({messages.length})</span>
                </h4>

                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                      No caller messages logged yet. Tap "Take Caller Voicemail / Message" above.
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {msg.callerName}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-mono">
                              ({msg.callerPhone})
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {msg.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {msg.urgency === 'urgent' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 uppercase">
                                Urgent
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              msg.status === 'resolved' 
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}>
                              {msg.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                          "{msg.messageText}"
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Recorded: {msg.createdAt}</span>
                          {msg.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => handleResolveMessage(msg.id)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer"
                            >
                              Mark as Called Back & Resolved
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEPHONY INTEGRATION (TWILIO & VAPI) */}
          {activeTab === 'telephony' && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 leading-relaxed">
                To connect this AI Phonebot prototype to a real public telephone number (PSTN), developers can deploy these ready-to-run webhook configurations directly to <strong>Twilio Voice</strong> or <strong>Vapi.ai / Retell AI</strong>.
              </div>

              {/* Twilio TwiML Configuration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Twilio Voice TwiML Webhook (XML)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(generateTwilioTwiML(), 'twilio')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
                  >
                    {copiedType === 'twilio' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'twilio' ? 'Copied XML!' : 'Copy TwiML XML'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-56">
                  {generateTwilioTwiML()}
                </pre>
              </div>

              {/* Vapi.ai / Retell Agent Config */}
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Vapi.ai / Retell AI Agent Schema (JSON)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy(generateVapiAgentConfig(), 'vapi')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-all cursor-pointer"
                  >
                    {copiedType === 'vapi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'vapi' ? 'Copied JSON!' : 'Copy Vapi JSON'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-56">
                  {generateVapiAgentConfig()}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: WORKLOAD REDUCTION METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
                    {metrics.totalCalls}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Calls Handled</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {metrics.inquiriesResolved}
                  </span>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Resolved by AI (No Staff)</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-center space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400">
                    {metrics.toursBooked}
                  </span>
                  <p className="text-xs text-rose-700 dark:text-rose-300">Tours Reserved</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-center space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {metrics.messagesRecorded}
                  </span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Voicemails Taken</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {metrics.handoffsEscalated}
                  </span>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Warm Staff Transfers</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-center space-y-1">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-purple-600 dark:text-purple-400">
                    {Math.round(metrics.minutesSaved / 60)} hrs
                  </span>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Front-Desk Hours Saved</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <h5 className="font-bold text-slate-900 dark:text-white">How This Reduces Staff Workload:</h5>
                <ul className="list-disc pl-5 space-y-1">
                  <li>87% of callers seek routine information (visiting hours, prayer schedules, parking, tour booking).</li>
                  <li>The phonebot answers questions instantly 24 hours a day without requiring human reception staff.</li>
                  <li>Automated tour reservation pass generation saves ~8 minutes of manual data entry per party.</li>
                  <li>Structured message triage ensures staff only return calls with full context and caller briefing notes.</li>
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            GitHub-Compatible • 100% Client-Side Engine Ready
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
