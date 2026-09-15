import React, { useState, useEffect } from 'react';
import { NavigationTab, AccessibilitySettings } from './types.ts';
import { Header } from './components/Header.tsx';
import { AIAssistantView } from './components/AIAssistantView.tsx';
import { VoiceHotlineView } from './components/VoiceHotlineView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { VisitorInfoView } from './components/VisitorInfoView.tsx';
import { VideosView } from './components/VideosView.tsx';
import { Footer } from './components/Footer.tsx';
import { AccessibilitySettingsModal } from './components/AccessibilitySettingsModal.tsx';
import { ReadingGuide } from './components/ReadingGuide.tsx';
import { calculateCentralPrayerCountdown, getCentralTimeInfo } from './utils/time.ts';
import { 
  getStoredAccessibilitySettings, 
  saveAccessibilitySettings, 
  applyAccessibilityToDOM 
} from './utils/accessibility.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('hotline');
  
  // Accessibility & Display Settings State
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    return getStoredAccessibilitySettings();
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [upcomingSessionName, setUpcomingSessionName] = useState<string>('Upcoming Session');
  const [upcomingSessionText, setUpcomingSessionText] = useState<string>('Calculating...');
  const [centralTimeDisplay, setCentralTimeDisplay] = useState<string>('');

  // Synchronize accessibility settings with DOM and persistent storage
  useEffect(() => {
    applyAccessibilityToDOM(accessibilitySettings);
    saveAccessibilitySettings(accessibilitySettings);
  }, [accessibilitySettings]);

  // Derive dark mode boolean for root element helper
  const isDarkEffective = 
    accessibilitySettings.theme === 'dark' || 
    (accessibilitySettings.theme === 'system' && 
     typeof window !== 'undefined' && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Active accessibility badges count
  let activeAccessibilityCount = 0;
  if (accessibilitySettings.theme !== 'light') activeAccessibilityCount++;
  if (accessibilitySettings.contrast !== 'normal') activeAccessibilityCount++;
  if (accessibilitySettings.cursorSize !== 'normal') activeAccessibilityCount++;
  if (accessibilitySettings.zoomLevel !== 100) activeAccessibilityCount++;
  if (accessibilitySettings.dyslexiaFont) activeAccessibilityCount++;
  if (accessibilitySettings.reducedMotion) activeAccessibilityCount++;
  if (accessibilitySettings.highlightLinks) activeAccessibilityCount++;
  if (accessibilitySettings.enhancedFocus) activeAccessibilityCount++;
  if (accessibilitySettings.readingGuide) activeAccessibilityCount++;

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
    <div className={`${isDarkEffective ? 'dark' : ''} min-h-screen flex flex-col bg-[#f7f6f2] dark:bg-[#0b1320] text-slate-800 dark:text-slate-100 transition-colors duration-200 selection:bg-[#007ba8]/20 selection:text-[#007ba8]`}>
      {/* Header with Navigation, Live countdown & Settings Button replacing old light/dark toggle */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeAccessibilityCount={activeAccessibilityCount}
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

      {/* Reading Guide Ruler Overlay */}
      <ReadingGuide enabled={accessibilitySettings.readingGuide} />

      {/* Accessibility & Display Settings Modal */}
      <AccessibilitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={accessibilitySettings}
        onUpdateSettings={setAccessibilitySettings}
      />
    </div>
  );
}
