import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles,
  Settings,
  KeyRound,
  ChevronDown,
  Compass,
  FileText,
  Inbox,
  Megaphone,
  Layers,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  onOpenAdmin: (tab?: 'calls' | 'experiences' | 'history' | 'pipeline' | 'messages' | 'announcements' | 'telephony') => void;
  onLogoutAdmin?: () => void;
  isAdmin?: boolean;
  activeAccessibilityCount?: number;
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
  onOpenSettings,
  onOpenAdmin,
  onLogoutAdmin,
  isAdmin = false,
  activeAccessibilityCount = 0,
  upcomingSessionText,
  centralTimeDisplay,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setIsAdminDropdownOpen(false);
      }
    };
    if (isAdminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAdminDropdownOpen]);

  // Each tab configured with concise labels and distinct signature colors for maximum viewport efficiency
  const tabs: TabConfig[] = [
    {
      id: 'hotline',
      label: 'AI Phonebot',
      icon: <PhoneCall className="w-4 h-4" />,
      shortcut: '1',
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
      id: 'assistant',
      label: 'AI Assistant',
      icon: <Bot className="w-4 h-4" />,
      shortcut: '2',
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
      id: 'schedule',
      label: 'Timings',
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
      label: 'Visitor',
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
      label: 'Media',
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
    ...(isAdmin ? [{
      id: 'admin' as NavigationTab,
      label: 'Admin',
      icon: <ShieldCheck className="w-4 h-4" />,
      shortcut: '6',
      colorName: 'Amber Gold',
      activeClass: 'bg-amber-600 text-white shadow-md shadow-amber-600/25 ring-2 ring-amber-500',
      inactiveClass: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60',
      inactiveHoverClass: 'hover:bg-amber-100/80 dark:hover:bg-amber-900/50 hover:border-amber-400',
      iconColorClass: 'text-amber-600 dark:text-amber-400',
      badgeActiveClass: 'bg-white/20 text-white',
      badgeInactiveClass: 'bg-amber-200/70 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200',
      dotColorClass: 'bg-amber-500',
    }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#f7f6f2]/95 dark:bg-[#0b1320]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12">
        {/* Main top bar - compact height to preserve viewport */}
        <div className="py-2 sm:py-2.5 flex items-center justify-between gap-3">
          
          {/* Brand Logo matching user screenshot */}
          <div 
            onClick={() => onSelectTab('hotline')} 
            className="cursor-pointer group flex items-center shrink-0"
            title="Ismaili Center Houston Guide"
          >
            <Logo size="md" />
          </div>

          {/* Quick status pills - Central Time & Next Session (desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Central Time indicator */}
            {centralTimeDisplay && (
              <div 
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300"
                title="Current time in Houston (Central Time)"
              >
                <Clock className="w-4 h-4 text-[#007ba8] dark:text-teal-400" />
                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">
                  {centralTimeDisplay}
                </span>
              </div>
            )}

            {/* Next prayer countdown pill */}
            <div 
              onClick={() => onSelectTab('schedule')}
              className="cursor-pointer px-4 py-1.5 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center space-x-2 text-sm hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
              title="Next congregational prayer in Houston Central Time"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">Next:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{upcomingSessionText}</span>
            </div>

            <a
              href="https://the.ismaili/us/en/spaces/ismaili-center-houston/tours"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#007ba8]/10 hover:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 dark:bg-teal-950/40 text-sm font-bold transition-all border border-[#007ba8]/30"
              title="Official Ismaili Center Houston Portal - Guided Architectural Tours"
            >
              <span>Book Tour</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Organized Admin Key Button & Navigation Hub */}
            <div className="relative" ref={adminDropdownRef}>
              {isAdmin ? (
                <div className="inline-flex items-center rounded-full border border-amber-500/70 bg-amber-500/15 dark:bg-amber-500/25 shadow-xs ring-1 ring-amber-500/40 text-xs font-semibold">
                  {/* Main Admin Console trigger */}
                  <button
                    id="header-admin-key-btn"
                    type="button"
                    onClick={() => onOpenAdmin('calls')}
                    className="flex items-center space-x-1.5 pl-3 pr-2 py-1.5 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 transition-colors cursor-pointer rounded-l-full"
                    title="Open Admin Console"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span className="font-bold">Admin Active</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  </button>

                  {/* Dropdown toggle for quick navigation */}
                  <button
                    type="button"
                    onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                    className="px-2 py-1.5 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 border-l border-amber-500/40 transition-colors cursor-pointer rounded-r-full"
                    title="Admin Quick Navigation Menu"
                    aria-expanded={isAdminDropdownOpen}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ) : (
                <button
                  id="header-admin-key-btn"
                  type="button"
                  onClick={() => onOpenAdmin('calls')}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:border-amber-500/60 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer active:scale-95 group"
                  title="Staff & Lead Access"
                  aria-label="Open Lead & Admin Login"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:rotate-45 group-hover:text-amber-500 transition-transform duration-200" />
                  <span className="font-bold">Admin Key</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Staff
                  </span>
                </button>
              )}

              {/* Organized Admin Dropdown Popover Menu */}
              {isAdmin && isAdminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Admin Quick Navigation</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Session Active
                    </span>
                  </div>

                  <div className="space-y-1">
                    {/* Primary Highlighted: Manage Experiences */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        onOpenAdmin('experiences');
                      }}
                      className="w-full text-left p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-slate-800 dark:text-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            Manage Experiences
                          </span>
                          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white text-[9px] font-bold">
                            Update
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Tours, 11-acre gardens & schedules
                        </p>
                      </div>
                    </button>

                    {/* Anonymous Call Transcripts */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        onOpenAdmin('calls');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                          Call Transcripts (Audit)
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Verbatim anonymous phone transcripts
                        </p>
                      </div>
                    </button>

                    {/* Voicemails & Messages */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        onOpenAdmin('messages');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                        <Inbox className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                          Caller Messages & Voicemails
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Visitor callback requests
                        </p>
                      </div>
                    </button>

                    {/* Broadcast Announcements */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        onOpenAdmin('announcements');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                          Center Announcements
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Top banner broadcast override
                        </p>
                      </div>
                    </button>

                    {/* Lifespan History */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        onOpenAdmin('history');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                          Activity History
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Verified calls, voicemails, and tour logs
                        </p>
                      </div>
                    </button>

                    {/* Telephony Pipeline */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminDropdownOpen(false);
                        onOpenAdmin('telephony');
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 transition-colors flex items-center space-x-2.5 cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold block text-slate-900 dark:text-slate-100">
                          Telephony Gateway & Carrier
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Twilio TwiML & SIP routing
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Sign out footer */}
                  {onLogoutAdmin && (
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdminDropdownOpen(false);
                          onLogoutAdmin();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out of Admin Console</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accessibility & Display Settings Button (Replaces the Light/Dark Mode button) */}
            <button
              id="header-settings-btn"
              type="button"
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:border-[#007ba8] dark:hover:border-teal-400 hover:text-[#007ba8] dark:hover:text-teal-300 transition-all cursor-pointer active:scale-95 group"
              title="Display & Accessibility Settings"
              aria-label="Open display and accessibility settings"
            >
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:rotate-45 transition-transform duration-300 group-hover:text-[#007ba8] dark:group-hover:text-teal-300" />
              <span className="hidden sm:inline">Settings</span>
              {activeAccessibilityCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#007ba8] dark:bg-teal-400 animate-pulse" />
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

        {/* Desktop Navigation Tabs - Full Horizontal Tab Bar with High Legibility & Compact Padding */}
        <nav 
          className="hidden md:grid gap-2 py-1.5 sm:py-2 border-t border-slate-200/60 dark:border-slate-800 w-full"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                title={`${tab.label} (Press ${tab.shortcut})`}
                className={`w-full flex items-center justify-center space-x-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer select-none text-center ${
                  isActive
                    ? `${tab.activeClass} shadow-md`
                    : `${tab.inactiveClass} ${tab.inactiveHoverClass}`
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white' : tab.dotColorClass}`} />
                <span className={`shrink-0 ${isActive ? 'text-white' : tab.iconColorClass}`}>
                  {tab.icon}
                </span>
                <span className="whitespace-nowrap font-bold text-sm sm:text-base">{tab.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${
                    isActive ? tab.badgeActiveClass : tab.badgeInactiveClass
                  }`}
                >
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Horizontal Quick-Tab Strip - View all full tab names directly on mobile without scrolling */}
        <nav className="flex md:hidden overflow-x-auto py-1.5 px-0 gap-1.5 scrollbar-none border-t border-slate-200/60 dark:border-slate-800 w-full">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? `${tab.activeClass} shadow-sm`
                    : `${tab.inactiveClass} ${tab.inactiveHoverClass}`
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : tab.dotColorClass}`} />
                <span>{tab.label}</span>
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
            {/* Mobile Admin Navigation */}
            {isAdmin ? (
              <div className="p-3 rounded-2xl border border-amber-500/60 bg-amber-500/10 dark:bg-amber-500/15 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                    <span>Admin Console Active</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-bold">
                    Lead Authorized
                  </span>
                </div>

                {/* Direct shortcut to Manage Experiences */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdmin('experiences');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4" />
                    <span>Manage Experiences & Tours</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">
                    Update
                  </span>
                </button>

                {/* Quick links grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdmin('calls');
                    }}
                    className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate">Call Transcripts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdmin('messages');
                    }}
                    className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <Inbox className="w-3.5 h-3.5 text-purple-500" />
                    <span className="truncate">Voicemails</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdmin('calls');
                    }}
                    className="text-amber-800 dark:text-amber-300 font-bold hover:underline"
                  >
                    Open Full Console
                  </button>
                  {onLogoutAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogoutAdmin();
                      }}
                      className="text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin('calls');
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-500 text-xs font-semibold cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="font-bold">Admin Login (Key Access)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Authorized Leads
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer hover:border-[#007ba8]"
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 text-[#007ba8] dark:text-teal-400" />
                <span>Display & Accessibility Settings</span>
              </div>
              {activeAccessibilityCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#007ba8]/15 text-[#007ba8] dark:text-teal-300 font-mono text-[10px]">
                  {activeAccessibilityCount} active
                </span>
              )}
            </button>

            <a
              href="https://the.ismaili/us/en/spaces/ismaili-center-houston/tours"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-[#007ba8] text-white text-xs font-semibold shadow-sm"
              title="Official Ismaili Center Houston Portal - Guided Architectural Tours"
            >
              <span>Book Tour (Official Website)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
