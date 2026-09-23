import React, { useState, useEffect } from 'react';
import { 
  X, 
  Compass, 
  Sparkles, 
  ExternalLink, 
  Calendar, 
  Clock, 
  DollarSign, 
  Check, 
  Tag, 
  AlignLeft, 
  Layers,
  Info
} from 'lucide-react';
import { CenterExperience } from '../types.ts';
import { OFFICIAL_TOUR_URL } from '../utils/experiencesStorage.ts';

interface ExperienceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience: CenterExperience | null;
  onSave: (experienceData: any) => void;
}

export const ExperienceEditorModal: React.FC<ExperienceEditorModalProps> = ({
  isOpen,
  onClose,
  experience,
  onSave,
}) => {
  const isEditing = !!experience;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CenterExperience['category']>('tour');
  const [badge, setBadge] = useState('');
  const [schedule, setSchedule] = useState('');
  const [duration, setDuration] = useState('');
  const [admission, setAdmission] = useState('Free / Complimentary');
  const [officialBookingUrl, setOfficialBookingUrl] = useState(OFFICIAL_TOUR_URL);
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (experience) {
      setTitle(experience.title);
      setCategory(experience.category);
      setBadge(experience.badge || '');
      setSchedule(experience.schedule);
      setDuration(experience.duration);
      setAdmission(experience.admission);
      setOfficialBookingUrl(experience.officialBookingUrl || OFFICIAL_TOUR_URL);
      setShortDescription(experience.shortDescription);
      setFullDescription(experience.fullDescription);
      setHighlightsText(experience.highlights.join('\n'));
      setIsActive(experience.isActive);
    } else {
      // New experience template
      setTitle('');
      setCategory('tour');
      setBadge('Official Docent Led');
      setSchedule('Tuesdays, Thursdays, Saturdays & Sundays • 10:30 AM & 2:00 PM CT');
      setDuration('45 minutes');
      setAdmission('Free / Complimentary (Advance registration required)');
      setOfficialBookingUrl(OFFICIAL_TOUR_URL);
      setShortDescription('');
      setFullDescription('');
      setHighlightsText('Architectural insight\nFarshid Moussavi design\nGuided docent walkthrough');
      setIsActive(true);
    }
    setErrorMsg('');
  }, [experience, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Experience title is required.');
      return;
    }
    if (!shortDescription.trim()) {
      setErrorMsg('Short description is required.');
      return;
    }

    const highlights = highlightsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const payload = {
      ...(experience ? { id: experience.id } : {}),
      title: title.trim(),
      category,
      badge: badge.trim() || undefined,
      schedule: schedule.trim() || 'Schedule by appointment',
      duration: duration.trim() || '30–45 minutes',
      admission: admission.trim() || 'Free',
      officialBookingUrl: officialBookingUrl.trim() || OFFICIAL_TOUR_URL,
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim() || shortDescription.trim(),
      highlights: highlights.length > 0 ? highlights : ['Ismaili Center Houston visitor program'],
      isActive,
      updatedAt: 'Just now',
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="experience-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 id="experience-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? `Update Experience: ${experience.title}` : 'Add New Center Experience'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure tour details, visiting schedule, highlights, and official booking redirect
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Official Tour Redirect Notice */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-3">
            <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-bold block">Official Tour Registration Policy</span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Tour reservations are not collected or booked internally on this site. Visitors clicking tour actions are redirected to the official Ismaili Center portal at <code className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px]">https://the.ismaili/us/ismaili-center-houston</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Experience Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Guided Architectural Tour"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="tour">Guided Architectural Tour</option>
                <option value="garden">Persian Charbagh Gardens</option>
                <option value="spiritual">Jamatkhana & Spiritual Sanctuary</option>
                <option value="exhibition">Exhibition & Gallery</option>
                <option value="architecture">Architecture Walk & Design</option>
                <option value="cultural">Civic & Cultural Dialogue</option>
              </select>
            </div>

            {/* Badge */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Badge / Tag Label
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Official Docent Led, Outdoor Oasis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Schedule */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Schedule & Visiting Days
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="e.g. Tuesdays, Thursdays, Saturdays & Sundays • 10:30 AM & 2:00 PM CT"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 45 minutes, Self-guided"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Admission */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Admission
              </label>
              <input
                type="text"
                value={admission}
                onChange={(e) => setAdmission(e.target.value)}
                placeholder="e.g. Free / Complimentary"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Official Booking / Redirect URL */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                Official Registration Redirect Portal URL
              </label>
              <input
                type="url"
                value={officialBookingUrl}
                onChange={(e) => setOfficialBookingUrl(e.target.value)}
                placeholder="https://the.ismaili/us/ismaili-center-houston"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Short Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Short Description (Summary Card) *
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One sentence summary of the experience"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Full Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Full Description & Details
              </label>
              <textarea
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                rows={3}
                placeholder="In-depth narrative explaining architectural significance, visitor expectations, and guidelines..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 resize-y"
              />
            </div>

            {/* Highlights */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Key Highlights (Enter one bullet point per line)
              </label>
              <textarea
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                rows={3}
                placeholder="Farshid Moussavi architectural design&#10;Triangular shaded verandas&#10;Docent walkthrough"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 resize-y font-mono text-[11px]"
              />
            </div>

            {/* Active Status Toggle */}
            <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Public Visibility
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isActive ? 'Active — Shown in public visitor guide & AI queries' : 'Hidden / Inactive — Saved as draft for staff review'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isActive ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isActive ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Experience'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
