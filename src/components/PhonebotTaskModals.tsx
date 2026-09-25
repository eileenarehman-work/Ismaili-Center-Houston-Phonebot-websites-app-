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
import { useTranslation } from '../context/LanguageContext.tsx';

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
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto overscroll-contain p-2 sm:p-4 flex flex-col justify-start items-center">
      <div className="my-auto w-full max-w-lg bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden animate-fadeIn shrink-0">
        <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('modal.tour_title', 'Official Tour Registration')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('modal.tour_sub', 'Redirecting to the official Ismaili Center portal')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 overscroll-contain">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('modal.tour_direct_link', 'Direct Link to the Official Ismaili Center Portal')}</span>
            </div>
            <p className="leading-relaxed text-xs">
              {t('modal.tour_desc', 'To guarantee verified availability and accurate docent scheduling, all tour registrations are hosted exclusively on the official Ismaili Center website (the.ismaili).')}
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block">
                  {t('modal.tour_days_hours', 'Public Tour Days & Hours:')}
                </strong>
                <span>
                  {t('modal.tour_days_val', 'Tuesdays, Thursdays, Saturdays & Sundays • 10:30 AM & 2:00 PM Central Time')}
                </span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block">
                  {t('modal.free_admission_title', 'Free Admission:')}
                </strong>
                <span>
                  {t('modal.free_admission_val', 'Guided architectural walkthroughs are complimentary. Advance registration secures your entry pass.')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('modal.tour_notice', 'Registration opens in a new tab on the official portal.')}</span>
          </div>
        </div>

        <div className="modal-sticky-footer shrink-0 sticky bottom-0 z-30 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#131d2e]/95 backdrop-blur-md flex items-center justify-end gap-2.5 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer text-xs sm:text-sm"
          >
            {t('modal.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            id="tour-confirm-btn"
            onClick={handleProceedToOfficialSite}
            className="modal-ok-btn inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer active:scale-95 transition-all text-xs sm:text-sm min-h-[44px]"
          >
            <span>{t('modal.go_to_tour', 'Go to Official Tour Website')}</span>
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
  const { t } = useTranslation();
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [department, setDepartment] = useState('Visitor Services & Tours');
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto overscroll-contain p-2 sm:p-4 flex flex-col justify-start items-center">
      <div className="my-auto w-full max-w-lg bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden animate-fadeIn shrink-0">
        <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('modal.msg_title', 'Leave Message for Staff')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('modal.msg_sub', 'Automated voicemail & callback logging')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm overscroll-contain">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('modal.your_name', 'Your Name *')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('modal.callback_phone', 'Callback Phone *')}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (713) 555-0199"
                  value={callerPhone}
                  onChange={(e) => setCallerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('modal.department', 'Department')}
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs sm:text-sm"
                >
                  <option value="Visitor Services & Tours">{t('modal.dept_visitor', 'Visitor Services & Tours')}</option>
                  <option value="Community & Interfaith">{t('modal.dept_community', 'Community & Interfaith')}</option>
                  <option value="Facilities & Auditorium">{t('modal.dept_facilities', 'Facilities & Auditorium')}</option>
                  <option value="General Information">{t('modal.dept_general', 'General Information')}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('modal.urgency', 'Urgency')}
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs sm:text-sm"
                >
                  <option value="routine">{t('modal.routine', 'Routine Inquiry')}</option>
                  <option value="urgent">{t('modal.urgent', 'Urgent Callback')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('modal.your_message', 'Your Message *')}
              </label>
              <textarea
                required
                rows={3}
                placeholder={t('modal.message_placeholder', 'Please provide details regarding your question or request...')}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-blue-500 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="modal-sticky-footer shrink-0 sticky bottom-0 z-30 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#131d2e]/95 backdrop-blur-md flex items-center justify-end gap-2.5 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer text-xs sm:text-sm"
            >
              {t('modal.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="modal-ok-btn px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md cursor-pointer active:scale-95 text-xs sm:text-sm min-h-[44px]"
            >
              {t('modal.submit_message', 'Submit Message')}
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
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto overscroll-contain p-2 sm:p-4 flex flex-col justify-start items-center">
      <div className="my-auto w-full max-w-md bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] overflow-hidden animate-fadeIn shrink-0">
        <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {t('modal.transfer_title', 'Human Staff Transfer')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('modal.transfer_sub', 'Connecting to Information Line')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-3 text-xs sm:text-sm overscroll-contain">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t('modal.transfer_dest', 'Transfer Destination:')}
            </span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {department || t('modal.dept_visitor', 'Visitor Services & Tours')}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +1 (713) 522-2026
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xs pt-1">
              {t('modal.transfer_desc', 'The AI Phonebot will announce the warm transfer, play the switchboard connection tone, and open direct phone dialing.')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{t('modal.transfer_hours', 'Center staff are available during regular business hours (Houston Central Time).')}</span>
          </div>
        </div>

        <div className="modal-sticky-footer shrink-0 sticky bottom-0 z-30 p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#131d2e]/95 backdrop-blur-md flex items-center justify-end gap-2.5 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer text-xs sm:text-sm"
          >
            {t('modal.stay_on_bot', 'Stay on AI Bot')}
          </button>
          <button
            type="button"
            id="transfer-confirm-btn"
            onClick={() => {
              onExecuteTransfer();
              onClose();
            }}
            className="modal-ok-btn inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer active:scale-95 text-xs sm:text-sm min-h-[44px]"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span>{t('modal.confirm_transfer', 'Confirm Transfer (+1 713-522-2026)')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

