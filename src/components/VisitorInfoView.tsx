import React from 'react';
import { 
  Compass, 
  MapPin, 
  Clock, 
  Calendar, 
  ExternalLink, 
  TreePine, 
  Layers, 
  Landmark, 
  CheckCircle2, 
  Car, 
  Users, 
  HeartHandshake
} from 'lucide-react';

export const VisitorInfoView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#007ba8] dark:text-teal-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Civic &amp; Cultural Landmark</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 dark:text-white mt-1">
            Visitor Information &amp; Official Portals
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            A comprehensive guide to visiting the Ismaili Center Houston, booking architectural tours, exploring the 11-acre gardens, and accessing official resources.
          </p>
        </div>

        {/* Primary Visiting Hours Callout Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Public Visitor Opening Days</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-slate-900 dark:text-white">
              Tuesdays, Thursdays, Saturdays &amp; Sundays
            </h3>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span><strong>Building:</strong> 10:00 AM – 4:00 PM</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <TreePine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span><strong>Gardens:</strong> 8:00 AM – 4:00 PM</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                Admission is Free
              </span>
            </div>
          </div>

          <a
            href="https://ismailicenter.org/tour-booking/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-md self-start md:self-center flex-shrink-0 active:scale-95"
          >
            <span>Book Guided Tour</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Feature Hero Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-[#004e6c] to-slate-950 text-white shadow-lg space-y-4">
          <span className="text-xs font-bold tracking-widest uppercase text-teal-300">
            FIRST PURPOSE-BUILT ISMAILI CENTER IN THE UNITED STATES
          </span>
          <h3 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide">
            AN ARCHITECTURAL BEACON IN MONTROSE
          </h3>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
            Designed by celebrated Iranian-British architect Farshid Moussavi with landscape design by Nelson Byrd Woltz. The center serves as an ambassadorial building that bridges cultures, fosters pluralism, and provides an open forum for intellectual exchange.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <div className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 backdrop-blur-sm flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-teal-300" />
              <span>Farshid Moussavi Architecture</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 backdrop-blur-sm flex items-center space-x-2">
              <TreePine className="w-3.5 h-3.5 text-emerald-400" />
              <span>11 Acres of Persian Charbagh Gardens</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 backdrop-blur-sm flex items-center space-x-2">
              <Landmark className="w-3.5 h-3.5 text-amber-300" />
              <span>Triangular Shaded Verandahs</span>
            </div>
          </div>
        </div>

        {/* Purpose & Mission */}
        <div className="p-6 rounded-2xl bg-[#007ba8]/10 dark:bg-slate-800/80 border border-[#007ba8]/20 dark:border-slate-700 space-y-3">
          <div className="flex items-center space-x-2 text-[#007ba8] dark:text-teal-300 font-semibold">
            <HeartHandshake className="w-5 h-5" />
            <h4 className="text-lg font-cinzel font-bold">What is the Ismaili Center For?</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            The <strong>Ismaili Center Houston</strong> represents an ambassadorial civic, cultural, and spiritual hub established to promote mutual understanding, foster intellectual exchange, and showcase pluralistic Islamic architecture and heritage. It serves both as a spiritual sanctuary for the Ismaili Shia Muslim community and an open venue for civic dialogue, performance art, and educational programs for Houstonians and global visitors alike.
          </p>
        </div>

        {/* Action Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <a
            href="https://ismailicenter.org/tour-booking/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-[#007ba8] text-white hover:bg-[#006185] transition-all flex items-center justify-between group shadow-md"
          >
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider opacity-80 font-bold block">
                Guided 45-Minute Visit
              </span>
              <h4 className="text-base sm:text-lg font-bold font-cinzel">Book an Architectural Tour</h4>
              <p className="text-xs opacity-90">Official reservation portal on ismailicenter.org</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>

          <a
            href="https://ismailicenter.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-between group"
          >
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#007ba8] font-bold block">
                Main Global Portal
              </span>
              <h4 className="text-base sm:text-lg font-bold font-cinzel">Official Ismaili Center Website</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Explore centers in London, Lisbon, Dubai &amp; Toronto</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#007ba8]/10 text-[#007ba8] flex items-center justify-center group-hover:translate-x-1 transition-transform flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>
        </div>
      </div>

      {/* Location, Parking & Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-[#007ba8] dark:text-teal-400 font-semibold">
            <MapPin className="w-5 h-5" />
            <h4 className="font-cinzel font-bold text-slate-900 dark:text-white text-base">Location</h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Montrose Boulevard &amp; Allen Parkway, Houston, Texas 77019. Situated adjacent to Buffalo Bayou Park.
          </p>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Car className="w-5 h-5" />
            <h4 className="font-cinzel font-bold text-slate-900 dark:text-white text-base">Parking &amp; Transit</h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Complimentary on-site surface and garage parking is available for registered tour visitors and congregants.
          </p>
        </div>

        <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Users className="w-5 h-5" />
            <h4 className="font-cinzel font-bold text-slate-900 dark:text-white text-base">Accessibility</h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Fully ADA-compliant with ramp access across all garden paths, elevator service to all floors, and wheelchair accessibility.
          </p>
        </div>
      </div>
    </div>
  );
};
