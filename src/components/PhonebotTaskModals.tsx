import React, { useState } from 'react';
import { 
  Calendar, 
  MessageSquare, 
  PhoneForwarded, 
  CheckCircle2, 
  X, 
  Phone, 
  User, 
  Users, 
  Clock, 
  Building,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { saveCallerMessage } from '../utils/phonebotStorage.ts';
import { logLifespanEvent } from '../utils/userHistoryStorage.ts';
import { OFFICIAL_TOUR_URL } from '../utils/experiencesStorage.ts';

// 1. OFFICIAL TOUR WEBSITE REDIRECT (ZERO EMBEDDED / INTERNAL REGISTRATION)
interface TourBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (confirmationCode: string, details: string) => void;
}

export const TourBookingModal: React.FC<TourBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  const handleProceedToOfficialSite = () => {
    logLifespanEvent({
      type: 'navigation',
      title: 'Caller Directed to Official Tour Registration',
      summary: 'Caller was redirected to the official Ismaili Center website (the.ismaili) for complimentary tour registration.',
      userIdentifier: 'Caller',
      status: 'completed',
    });

    onSuccess(
      'OFFICIAL-PORTAL',
      'Caller was directed to the official tour website at the.ismaili to register for their complimentary 45-minute guided architectural tour.'
    );

    window.open(OFFICIAL_TOUR_URL, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official Tour Registration
              </h3>
              <p className="text-xs text-slate-500">Redirecting to the official Ismaili Center portal</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct Link to the Official Ismaili Center Portal</span>
            </div>
            <p className="leading-relaxed">
              To guarantee verified availability and accurate docent scheduling, all tour registrations are hosted exclusively on the official Ismaili Center website (<strong>the.ismaili</strong>).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Public Tour Days &amp; Hours:</strong>
                <span>Tuesdays, Thursdays, Saturdays &amp; Sundays • 10:30 AM &amp; 2:00 PM Central Time</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Free Admission:</strong>
                <span>Guided architectural walkthroughs are complimentary. Advance registration secures your entry pass.</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Registration opens in a new tab on the official portal.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceedToOfficialSite}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <span>Go to Official Tour Website</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfficialTourRedirectModal = TourBookingModal;


// 2. TAKE CALLER MESSAGE / VOICEMAIL MODAL
interface TakeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (callerName: string, details: string) => void;
}

export const TakeMessageModal: React.FC<TakeMessageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [department, setDepartment] = useState('Front Desk & Visitor Services');
  const [messageText, setMessageText] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerName.trim() || !messageText.trim()) return;

    saveCallerMessage({
      callerName: callerName.trim(),
      callerPhone: callerPhone.trim() || '+1 (713) 522-2026',
      department,
      messageText: messageText.trim(),
      urgency,
    });

    onSuccess(
      callerName.trim(),
      `Thank you ${callerName.trim()}. I have recorded your message for ${department}. Our front-desk team will review it and return your call.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Leave Message for Staff
              </h3>
              <p className="text-xs text-slate-500">Automated voicemail & callback logging</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Callback Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 (713) 555-0199"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="Visitor Services & Tours">Visitor Services & Tours</option>
                <option value="Community & Interfaith">Community & Interfaith</option>
                <option value="Facilities & Auditorium">Facilities & Auditorium</option>
                <option value="General Information">General Information</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              >
                <option value="routine">Routine Inquiry</option>
                <option value="urgent">Urgent Callback</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Message *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Please provide details regarding your question or request..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer active:scale-95"
            >
              Submit Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// 3. WARM HANDOFF / CALL TRANSFER MODAL
interface WarmTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  onExecuteTransfer: () => void;
}

export const WarmTransferModal: React.FC<WarmTransferModalProps> = ({
  isOpen,
  onClose,
  department,
  onExecuteTransfer,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <PhoneForwarded className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Human Staff Transfer
              </h3>
              <p className="text-xs text-slate-500">Connecting to Information Line</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Transfer Destination:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {department || 'Information Line & Visitor Services'}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +1 (713) 522-2026
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] pt-1">
              The AI Phonebot will announce the warm transfer, play the switchboard connection tone, and open direct phone dialing.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Center staff are available during regular business hours (Houston Central Time).</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer text-xs"
          >
            Stay on AI Bot
          </button>
          <button
            type="button"
            onClick={() => {
              onExecuteTransfer();
              onClose();
            }}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer active:scale-95 text-xs"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Confirm Transfer (+1 713-522-2026)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
