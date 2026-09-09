import React, { useState } from 'react';
import { 
  Clock, 
  Sun, 
  Moon, 
  Heart, 
  Info, 
  Copy, 
  Check, 
  MapPin, 
  Calendar,
  Hourglass
} from 'lucide-react';

interface ScheduleViewProps {
  upcomingSessionText: string;
  upcomingSessionName: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  upcomingSessionText,
  upcomingSessionName,
}) => {
  const [copied, setCopied] = useState(false);

  const copySchedule = () => {
    const text = `Ismaili Center Houston - Jamatkhana Prayer Schedule:\n- Bandagi: 4:00 AM – 5:00 AM daily\n- Morning Dua: 5:00 AM – 5:30 AM daily\n- Evening Prayer: 7:00 PM (Mon-Thu, Sat, Sun); 7:30 PM (Fridays)\n\nVisitor Hours: Tuesdays, Thursdays, Saturdays, and Sundays (Building: 10:00 AM – 4:00 PM; Gardens: 8:00 AM – 4:00 PM). Tours: https://ismailicenter.org/tour-booking/`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card with Countdown */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#007ba8] dark:text-teal-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Congregational Timings</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white mt-1">
              Jamatkhana Prayer Schedule
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Ismaili Center Houston &bull; Central Time (CT)</span>
            </p>
          </div>

          {/* Real-time upcoming countdown pill */}
          <div className="flex items-center space-x-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/50 rounded-2xl p-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#007ba8] text-white flex items-center justify-center shadow-xs">
              <Hourglass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {upcomingSessionName}
              </span>
              <span className="text-lg font-bold text-[#007ba8] dark:text-teal-300 font-mono">
                {upcomingSessionText}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Main Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          
          {/* 1. Bandagi Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/20 dark:to-slate-900/40 border border-amber-200/80 dark:border-amber-900/40 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Early Morning
              </span>
              <h3 className="text-xl font-cinzel font-bold text-slate-900 dark:text-white">
                Bandagi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Quiet meditative morning contemplation
              </p>
            </div>
            <div className="pt-3 border-t border-amber-200/60 dark:border-amber-800/40">
              <p className="text-2xl font-bold font-serif text-slate-800 dark:text-slate-100">
                4:00 AM – 5:00 AM
              </p>
              <span className="text-[11px] text-slate-400 font-medium">Daily</span>
            </div>
          </div>

          {/* 2. Morning Dua Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-teal-50/70 to-white dark:from-teal-950/20 dark:to-slate-900/40 border border-teal-200/80 dark:border-teal-900/40 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#007ba8]/15 text-[#007ba8] dark:text-teal-400 flex items-center justify-center">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#007ba8] dark:text-teal-400 uppercase tracking-wider block">
                Morning Assembly
              </span>
              <h3 className="text-xl font-cinzel font-bold text-slate-900 dark:text-white">
                Morning Dua
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dawn congregational morning prayer
              </p>
            </div>
            <div className="pt-3 border-t border-teal-200/60 dark:border-teal-800/40">
              <p className="text-2xl font-bold font-serif text-slate-800 dark:text-slate-100">
                5:00 AM – 5:30 AM
              </p>
              <span className="text-[11px] text-slate-400 font-medium">Daily</span>
            </div>
          </div>

          {/* 3. Evening Prayer Card */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-indigo-50/70 to-white dark:from-indigo-950/20 dark:to-slate-900/40 border border-indigo-200/80 dark:border-indigo-900/40 space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Evening Assembly
              </span>
              <h3 className="text-xl font-cinzel font-bold text-slate-900 dark:text-white">
                Evening Prayer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sunset congregational evening worship
              </p>
            </div>
            <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Fridays:</span>
                <span className="text-lg font-bold font-serif text-slate-800 dark:text-slate-100">7:30 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Mon – Thu, Sat & Sun:</span>
                <span className="text-lg font-bold font-serif text-slate-800 dark:text-slate-100">7:00 PM</span>
              </div>
            </div>
          </div>

        </div>

        {/* Copy and Actions toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Timings observe local Houston Central Time. Access doors open 30 minutes prior to assemblies.
          </p>
          <button
            type="button"
            onClick={copySchedule}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Access Information & Protocol Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2.5 text-[#007ba8] dark:text-teal-400">
            <Info className="w-5 h-5" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-base">
              Sanctuary Access Guidelines
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            The Jamatkhana prayer hall is reserved for congregational worship by members of the Ismaili Muslim community. Modest attire and shoe removal prior to entering the prayer hall are customary.
          </p>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-5 h-5" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-base">
              Public Visitor Hours
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            All civic spaces, exhibition galleries, amphitheater, and the 11 acres of gardens are open to visitors on <strong>Tuesdays, Thursdays, Saturdays, and Sundays</strong> (Building: 10:00 AM – 4:00 PM; Gardens: 8:00 AM – 4:00 PM). Admission is free.
          </p>
        </div>
      </div>
    </div>
  );
};
