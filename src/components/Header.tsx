import React, { useState } from 'react';
import { Logo } from './Logo.tsx';
import { NavigationTab } from '../types.ts';
import { 
  Bot, 
  PhoneCall, 
  Clock, 
  Info, 
  Tv, 
  Sun, 
  Moon, 
  Menu, 
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  upcomingSessionText: string;
  centralTimeDisplay?: string;
}

interface TabConfig {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  activeClass: string;
  inactiveClass: string;
  inactiveHoverClass: string;
  iconColorClass: string;
  badgeActiveClass: string;
  badgeInactiveClass: string;
  dotColorClass: string;
  colorName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  upcomingSessionText,
  centralTimeDisplay,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Each tab configured with distinct signature colors for enhanced usability and engagement
  const tabs: TabConfig[] = [
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: <Bot className="w-4 h-4" />,
      shortcut: '1',
      colorName: 'Sky Blue',
      activeClass: 'bg-sky-600 text-white shadow-md shadow-sky-600/25 ring-2 ring-sky-500',
      inactiveClass: 'bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border border-sky-200/80 dark:border-sky-800/60',
      inactiveHoverClass: 'hover:bg-sky-100/80 dark:hover:bg-sky-900/50 hover:border-sky-400',
      iconColorClass: 'text-sky-600 dark:text-sky-400',
      badgeActiveClass: 'bg-white/20 text-white',
      badgeInactiveClass: 'bg-sky-200/70 dark:bg-sky-800/60 text-sky-800 dark:text-sky-200',
      dotColorClass: 'bg-sky-500',
    },
    {
      id: 'hotline',
      label: 'Voice Hotline',
      icon: <PhoneCall className="w-4 h-4" />,
      shortcut: '2',
      colorName: 'Rose Coral',
      activeClass: 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500',
      inactiveClass: 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/60',
      inactiveHoverClass: 'hover:bg-rose-100/80 dark:hover:bg-rose-900/50 hover:border-rose-400',
      iconColorClass: 'text-rose-600 dark:text-rose-400',
      badgeActiveClass: 'bg-white/20 text-white',
      badgeInactiveClass: 'bg-rose-200/70 dark:bg-rose-800/60 text-rose-800 dark:text-rose-200',
      dotColorClass: 'bg-rose-500',
    },
    {
      id: 'schedule',
      label: 'Jamatkhana Schedule',
      icon: <Clock className="w-4 h-4" />,
      shortcut: '3',
      colorName: 'Emerald Green',
      activeClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500',
      inactiveClass: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60',
      inactiveHoverClass: 'hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 hover:border-emerald-400',
      iconColorClass: 'text-emerald-600 dark:text-emerald-400',
      badgeActiveClass: 'bg-white/20 text-white',
      badgeInactiveClass: 'bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200',
      dotColorClass: 'bg-emerald-500',
    },
    {
      id: 'visitor',
      label: 'Visitor Info',
      icon: <Info className="w-4 h-4" />,
      shortcut: '4',
      colorName: 'Warm Amber',
      activeClass: 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-500',
      inactiveClass: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60',
      inactiveHoverClass: 'hover:bg-amber-100/80 dark:hover:bg-amber-900/50 hover:border-amber-400',
      iconColorClass: 'text-amber-600 dark:text-amber-400',
      badgeActiveClass: 'bg-white/20 text-white',
      badgeInactiveClass: 'bg-amber-200/70 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200',
      dotColorClass: 'bg-amber-500',
    },
    {
      id: 'videos',
      label: 'Videos & Media',
      icon: <Tv className="w-4 h-4" />,
      shortcut: '5',
      colorName: 'Royal Purple',
      activeClass: 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-500',
      inactiveClass: 'bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border border-purple-200/80 dark:border-purple-800/60',
      inactiveHoverClass: 'hover:bg-purple-100/80 dark:hover:bg-purple-900/50 hover:border-purple-400',
      iconColorClass: 'text-purple-600 dark:text-purple-400',
      badgeActiveClass: 'bg-white/20 text-white',
      badgeInactiveClass: 'bg-purple-200/70 dark:bg-purple-800/60 text-purple-800 dark:text-purple-200',
      dotColorClass: 'bg-purple-500',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#f7f6f2]/95 dark:bg-[#0b1320]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main top bar */}
        <div className="py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand Logo matching user screenshot */}
          <div 
            onClick={() => onSelectTab('assistant')} 
            className="cursor-pointer group flex items-center"
            title="Ismaili Center Houston Guide"
          >
            <Logo size="md" />
          </div>

          {/* Quick status pills - Central Time & Next Session (desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Central Time indicator */}
            {centralTimeDisplay && (
              <div 
                className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300"
                title="Current time in Houston (Central Time)"
              >
                <Clock className="w-3.5 h-3.5 text-[#007ba8] dark:text-teal-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-100 font-mono">
                  {centralTimeDisplay}
                </span>
              </div>
            )}

            {/* Next prayer countdown pill */}
            <div 
              onClick={() => onSelectTab('schedule')}
              className="cursor-pointer px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-2 text-xs hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
              title="Next congregational prayer in Houston Central Time"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Next:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{upcomingSessionText}</span>
            </div>

            <a
              href="https://ismailicenter.org/tour-booking/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#007ba8]/10 hover:bg-[#007ba8]/15 text-[#007ba8] dark:text-teal-300 dark:bg-teal-950/40 text-xs font-semibold transition-all border border-[#007ba8]/20"
            >
              <span>Book Tour</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2.5">
            {/* Dark / Light Mode Toggle Pill */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:border-[#007ba8] dark:hover:border-teal-400 transition-all cursor-pointer active:scale-95"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs with Unique Signature Colors for Usability & Engagement */}
        <nav className="hidden md:flex items-center space-x-2 py-2 border-t border-slate-200/60 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? tab.activeClass
                    : `${tab.inactiveClass} ${tab.inactiveHoverClass}`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : tab.dotColorClass}`} />
                <span className={isActive ? 'text-white' : tab.iconColorClass}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive ? tab.badgeActiveClass : tab.badgeInactiveClass
                  }`}
                >
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-[#f7f6f2] dark:bg-[#0b1320] px-4 pt-3 pb-6 space-y-3 shadow-xl">
          {/* Central Time in Mobile Drawer */}
          {centralTimeDisplay && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#007ba8]" />
                Houston Central Time:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {centralTimeDisplay}
              </span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Next Prayer:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{upcomingSessionText}</span>
          </div>

          <div className="space-y-1.5">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? tab.activeClass
                      : `${tab.inactiveClass} ${tab.inactiveHoverClass}`
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : tab.dotColorClass}`} />
                    <span className={isActive ? 'text-white' : tab.iconColorClass}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${
                      isActive ? tab.badgeActiveClass : tab.badgeInactiveClass
                    }`}
                  >
                    {tab.shortcut}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-2">
            <a
              href="https://ismailicenter.org/tour-booking/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-[#007ba8] text-white text-xs font-semibold shadow-sm"
            >
              <span>Book an Architectural Tour</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
