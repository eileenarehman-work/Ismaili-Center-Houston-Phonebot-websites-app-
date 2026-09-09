import React, { useState, useEffect } from 'react';
import { NavigationTab } from './types.ts';
import { Header } from './components/Header.tsx';
import { AIAssistantView } from './components/AIAssistantView.tsx';
import { VoiceHotlineView } from './components/VoiceHotlineView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { VisitorInfoView } from './components/VisitorInfoView.tsx';
import { VideosView } from './components/VideosView.tsx';
import { Footer } from './components/Footer.tsx';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('assistant');
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

  // Real-time calculation of Jamatkhana prayer session countdown
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const bandagiStart = 4 * 60; // 4:00 AM
      const bandagiEnd = 5 * 60;   // 5:00 AM
      const morningStart = 5 * 60; // 5:00 AM
      const morningEnd = 5 * 60 + 30; // 5:30 AM
      const isFriday = now.getDay() === 5;
      const eveningStart = isFriday ? 19 * 60 + 30 : 19 * 60; // 7:30 PM on Fri, 7:00 PM other days
      const eveningEnd = eveningStart + 45; // ~45 mins assembly

      let name = '';
      let diffMinutes = 0;
      let isActive = false;

      if (currentMinutes < bandagiStart) {
        name = 'Bandagi';
        diffMinutes = bandagiStart - currentMinutes;
      } else if (currentMinutes >= bandagiStart && currentMinutes < bandagiEnd) {
        name = 'Bandagi';
        diffMinutes = bandagiEnd - currentMinutes;
        isActive = true;
      } else if (currentMinutes < morningStart) {
        name = 'Morning Dua';
        diffMinutes = morningStart - currentMinutes;
      } else if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
        name = 'Morning Dua';
        diffMinutes = morningEnd - currentMinutes;
        isActive = true;
      } else if (currentMinutes < eveningStart) {
        name = 'Evening Prayer';
        diffMinutes = eveningStart - currentMinutes;
      } else if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
        name = 'Evening Prayer';
        diffMinutes = eveningEnd - currentMinutes;
        isActive = true;
      } else {
        name = "Tomorrow's Bandagi";
        diffMinutes = 24 * 60 - currentMinutes + bandagiStart;
      }

      const hrs = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      let text = isActive ? 'Active (Ends in ' : 'Starts in ';
      if (hrs > 0) text += `${hrs}h `;
      text += `${mins}m`;
      if (isActive) text += ')';

      setUpcomingSessionName(name);
      setUpcomingSessionText(text);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts (1-5 for instant desktop navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '1') setCurrentTab('assistant');
      else if (e.key === '2') setCurrentTab('hotline');
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
