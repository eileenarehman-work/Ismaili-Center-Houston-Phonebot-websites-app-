import React from 'react';
import { Logo } from './Logo.tsx';
import { NavigationTab } from '../types.ts';
import { ExternalLink, MapPin, Calendar, Clock } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';

interface FooterProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-slate-200/80 dark:border-slate-800 bg-[#f7f6f2] dark:bg-[#080d17] text-slate-600 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200/60 dark:border-slate-800">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Logo size="md" />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mt-2">
              {t('footer.mission', 'An ambassadorial civic, cultural, and spiritual hub in Houston, Texas. Designed by Farshid Moussavi with Persian-inspired charbagh gardens by Nelson Byrd Woltz.')}
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#007ba8]" />
              <span>Montrose Boulevard &amp; Allen Parkway, Houston, TX 77019</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              {t('footer.guide', 'Interactive Guide')}
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('hotline')}
                  className="hover:text-[#007ba8] dark:hover:text-teal-400 transition-colors"
                >
                  {t('tab.hotline', 'AI Phonebot Hotline')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('assistant')}
                  className="hover:text-[#007ba8] dark:hover:text-teal-400 transition-colors"
                >
                  {t('tab.assistant', 'AI Assistant')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('schedule')}
                  className="hover:text-[#007ba8] dark:hover:text-teal-400 transition-colors"
                >
                  {t('tab.schedule', 'Jamatkhana Schedule')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('visitor')}
                  className="hover:text-[#007ba8] dark:hover:text-teal-400 transition-colors"
                >
                  {t('tab.visitor', 'Visitor Info')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('videos')}
                  className="hover:text-[#007ba8] dark:hover:text-teal-400 transition-colors"
                >
                  {t('tab.videos', 'Videos & Media')}
                </button>
              </li>
            </ul>
          </div>

          {/* Visitor Hours & Official Links */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              {t('footer.hours_title', 'Public Hours')}
            </h4>
            <div className="space-y-1 text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {t('footer.days', 'Tues, Thu, Sat & Sun')}
              </p>
              <p className="flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-[#007ba8]" />
                <span>{t('visitor.building_hours', 'Building: 10:00 AM – 4:00 PM')}</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-[#007ba8]" />
                <span>{t('visitor.gardens_hours', 'Gardens: 8:00 AM – 4:00 PM')}</span>
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://ismailicenter.org/tour-booking/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-[#007ba8] dark:text-teal-400 hover:underline font-semibold"
              >
                <span>{t('footer.official_tours', 'Official Tour Reservations')}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Copyright notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
          <p>© {new Date().getFullYear()} Ismaili Center Houston Guide. {t('footer.free_resource', 'Free public resource.')}</p>
          <p className="font-mono">{t('footer.central_time', 'Central Time (Houston, TX)')}</p>
        </div>
      </div>
    </footer>
  );
};
