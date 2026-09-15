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
  AlertCircle
} from 'lucide-react';
import { saveTourReservation, saveCallerMessage } from '../utils/phonebotStorage.ts';

// 1. TOUR RESERVATION MODAL
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
  const [visitorName, setVisitorName] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [preferredDay, setPreferredDay] = useState('Saturday');
  const [timeSlot, setTimeSlot] = useState('10:30 AM CT');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) return;

    setIsSubmitting(true);
    const dateStr = `${preferredDay}, upcoming public day`;
    const saved = saveTourReservation({
      visitorName: visitorName.trim(),
      partySize,
      tourDate: dateStr,
      timeSlot,
      contactEmailOrPhone: contact.trim() || 'Not provided',
    });

    setIsSubmitting(false);
    onSuccess(
      saved.confirmationCode, 
      `Reservation confirmed for ${saved.visitorName}, party of ${saved.partySize} on ${saved.tourDate} at ${saved.timeSlot}. Confirmation code: ${saved.confirmationCode}.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131d2e] border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Book Architectural Tour
              </h3>
              <p className="text-xs text-slate-500">Free 45-minute guided docent tour</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Your Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Party Size
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visiting Day
              </label>
              <select
                value={preferredDay}
                onChange={(e) => setPreferredDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
              >
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Thursday">Thursday</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot (CT)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
                >
                  <option value="10:30 AM CT">10:30 AM CT</option>
                  <option value="1:30 PM CT">1:30 PM CT</option>
                  <option value="3:00 PM CT">3:00 PM CT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone / Email
              </label>
              <input
                type="text"
                placeholder="For text confirmation"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Admission is 100% free. The AI Phonebot will confirm your reservation code aloud.</span>
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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md cursor-pointer active:scale-95"
            >
              Confirm Tour Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


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
