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
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  upcomingSessionText,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, shortcut: '1' },
    { id: 'hotline', label: 'Voice Hotline', icon: <PhoneCall className="w-4 h-4" />, shortcut: '2' },
    { id: 'schedule', label: 'Jamatkhana Schedule', icon: <Clock className="w-4 h-4" />, shortcut: '3' },
    { id: 'visitor', label: 'Visitor Info', icon: <Info className="w-4 h-4" />, shortcut: '4' },
    { id: 'videos', label: 'Videos & Media', icon: <Tv className="w-4 h-4" />, shortcut: '5' },
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

          {/* Quick status pill - desktop only */}
          <div className="hidden lg:flex items-center space-x-3">
            <div 
              onClick={() => onSelectTab('schedule')}
              className="cursor-pointer px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-2 text-xs hover:border-[#007ba8] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Next Session:</span>
              <span className="text-[#007ba8] dark:text-teal-400 font-semibold">{upcomingSessionText}</span>
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

        {/* Desktop Navigation Tabs with Keyboard Shortcuts */}
        <nav className="hidden md:flex items-center space-x-1.5 py-2 border-t border-slate-200/60 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#007ba8] text-white shadow-sm ring-1 ring-[#007ba8]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Appearance:</span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 shadow-xs"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Switch to Dark Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Next Prayer:</span>
            <span className="text-[#007ba8] dark:text-teal-400 font-bold">{upcomingSessionText}</span>
          </div>

          <div className="space-y-1">
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
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#007ba8] text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  <span className="text-xs opacity-60 font-mono">[{tab.shortcut}]</span>
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
