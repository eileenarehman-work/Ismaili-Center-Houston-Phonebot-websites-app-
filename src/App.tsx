import React, { useState, useEffect } from 'react';
import { NavigationTab } from './types.ts';
import { Header } from './components/Header.tsx';
import { AIAssistantView } from './components/AIAssistantView.tsx';
import { VoiceHotlineView } from './components/VoiceHotlineView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { VisitorInfoView } from './components/VisitorInfoView.tsx';
import { VideosView } from './components/VideosView.tsx';
import { Footer } from './components/Footer.tsx';
import { calculateCentralPrayerCountdown, getCentralTimeInfo } from './utils/time.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('hotline');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [upcomingSessionName, setUpcomingSessionName] = useState<string>('Upcoming Session');
  const [upcomingSessionText, setUpcomingSessionText] = useState<string>('Calculating...');
  const [centralTimeDisplay, setCentralTimeDisplay] = useState<string>('');

  // Theme synchronization with HTML and Body class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Real-time calculation of Jamatkhana prayer session countdown catered to Central Time (Houston, TX)
  useEffect(() => {
    const calculateCountdown = () => {
      const countdown = calculateCentralPrayerCountdown();
      const timeInfo = getCentralTimeInfo();

      setUpcomingSessionName(countdown.name);
      setUpcomingSessionText(countdown.timeText);
      setCentralTimeDisplay(timeInfo.displayTime);
    };

    calculateCountdown();
    // Update every 5 seconds for real-time accuracy and ticking clock
    const interval = setInterval(calculateCountdown, 5000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts (1-5 for instant desktop navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '1') setCurrentTab('hotline');
      else if (e.key === '2') setCurrentTab('assistant');
      else if (e.key === '3') setCurrentTab('schedule');
      else if (e.key === '4') setCurrentTab('visitor');
      else if (e.key === '5') setCurrentTab('videos');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen flex flex-col bg-[#f7f6f2] dark:bg-[#0b1320] text-slate-800 dark:text-slate-100 transition-colors duration-200 selection:bg-[#007ba8]/20 selection:text-[#007ba8]`}>
      {/* Header with Navigation & Live countdown */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        upcomingSessionText={upcomingSessionText}
        centralTimeDisplay={centralTimeDisplay}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'assistant' && (
          <AIAssistantView onNavigateToTab={setCurrentTab} />
        )}
        {currentTab === 'hotline' && <VoiceHotlineView />}
        {currentTab === 'schedule' && (
          <ScheduleView
            upcomingSessionText={upcomingSessionText}
            upcomingSessionName={upcomingSessionName}
            centralTimeDisplay={centralTimeDisplay}
          />
        )}
        {currentTab === 'visitor' && <VisitorInfoView />}
        {currentTab === 'videos' && <VideosView />}
      </main>

      {/* Footer */}
      <Footer onSelectTab={setCurrentTab} />
    </div>
  );
}
