import React, { useState, useEffect } from 'react';
import { NavigationTab, AccessibilitySettings, TelephonyPipelineTelemetry, AdminAnnouncement } from './types.ts';
import { Header } from './components/Header.tsx';
import { AIAssistantView } from './components/AIAssistantView.tsx';
import { VoiceHotlineView } from './components/VoiceHotlineView.tsx';
import { ScheduleView } from './components/ScheduleView.tsx';
import { VisitorInfoView } from './components/VisitorInfoView.tsx';
import { VideosView } from './components/VideosView.tsx';
import { Footer } from './components/Footer.tsx';
import { AccessibilitySettingsModal } from './components/AccessibilitySettingsModal.tsx';
import { ReadingGuide } from './components/ReadingGuide.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { AdminDashboardModal } from './components/AdminDashboardModal.tsx';
import { PhonebotPipelineInspector } from './components/PhonebotPipelineInspector.tsx';
import { calculateCentralPrayerCountdown, getCentralTimeInfo } from './utils/time.ts';
import { 
  getStoredAccessibilitySettings, 
  saveAccessibilitySettings, 
  applyAccessibilityToDOM 
} from './utils/accessibility.ts';
import { isUserAdmin, setAdminAuth, getAdminAnnouncement } from './utils/adminAuth.ts';
import { 
  getCallerMessages, 
  getTourReservations, 
  getPhonebotMetrics 
} from './utils/phonebotStorage.ts';
import { Info, Bell, AlertTriangle, X, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('hotline');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Monitor scroll position for smooth scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Accessibility & Display Settings State
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>(() => {
    return getStoredAccessibilitySettings();
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Staff & Admin Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return isUserAdmin();
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isPipelineInspectorOpen, setIsPipelineInspectorOpen] = useState<boolean>(false);
  
  // Center Announcement broadcast banner state
  const [announcement, setAnnouncement] = useState<AdminAnnouncement>(() => getAdminAnnouncement());
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState<boolean>(false);

  const [upcomingSessionName, setUpcomingSessionName] = useState<string>('Upcoming Session');
  const [upcomingSessionText, setUpcomingSessionText] = useState<string>('Calculating...');
  const [centralTimeDisplay, setCentralTimeDisplay] = useState<string>('');

  // Default telemetry instance for top-level admin pipeline inspections
  const [telemetry, setTelemetry] = useState<TelephonyPipelineTelemetry>({
    sttEngine: 'Chrome Web Speech Recognition (Zero-Latency Local WebKit Stream)',
    llmEngine: 'Gemini 2.5 Flash Telephony Optimized (with verified local fallback)',
    ttsEngine: 'Google UK English Male / SpeechSynthesis Natural Voice (0.92x Rate)',
    telephonyStatus: 'Telephony Active (Port 3000 WebRTC Gateway Ready)',
    roundtripLatencyMs: 135,
    sampleRate: '48 kHz High-Fidelity Audio',
    packetLossPct: 0.0,
    currentIntent: 'Administrative Overview',
    audioBufferMs: 18,
    activeLayer: 'telephony',
  });

  // Storage data snapshot for inspector
  const [callerMessages, setCallerMessages] = useState(() => getCallerMessages());
  const [tourReservations, setTourReservations] = useState(() => getTourReservations());
  const [phonebotMetrics, setPhonebotMetrics] = useState(() => getPhonebotMetrics());

  const handleRefreshData = () => {
    setCallerMessages(getCallerMessages());
    setTourReservations(getTourReservations());
    setPhonebotMetrics(getPhonebotMetrics());
    setAnnouncement(getAdminAnnouncement());
  };

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
      else if (e.key === '6' && isAdmin) setCurrentTab('admin');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  const [adminInitialTab, setAdminInitialTab] = useState<'calls' | 'experiences' | 'history' | 'pipeline' | 'messages' | 'announcements' | 'telephony'>('calls');

  // Handle Admin Key Button Click with optional direct navigation tab
  const handleOpenAdmin = (tab: 'calls' | 'experiences' | 'history' | 'pipeline' | 'messages' | 'announcements' | 'telephony' = 'calls') => {
    setAdminInitialTab(tab);
    if (isAdmin) {
      handleRefreshData();
      setCurrentTab('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    handleRefreshData();
    setCurrentTab('admin');
  };

  const handleAdminLogout = () => {
    setAdminAuth(false);
    setIsAdmin(false);
    setIsAdminDashboardOpen(false);
    setIsPipelineInspectorOpen(false);
    if (currentTab === 'admin') {
      setCurrentTab('hotline');
    }
  };

  return (
    <div className={`${isDarkEffective ? 'dark' : ''} min-h-screen flex flex-col bg-[#f7f6f2] dark:bg-[#0b1320] text-slate-800 dark:text-slate-100 transition-colors duration-200 selection:bg-[#007ba8]/20 selection:text-[#007ba8]`}>
      {/* Header with Navigation, Live countdown, Settings Button, & Admin Key Access */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onLogoutAdmin={handleAdminLogout}
        isAdmin={isAdmin}
        activeAccessibilityCount={activeAccessibilityCount}
        upcomingSessionText={upcomingSessionText}
        centralTimeDisplay={centralTimeDisplay}
      />

      {/* Center Broadcast Announcement Banner (Controlled via Admin Console) */}
      {announcement.enabled && announcement.message && !isAnnouncementDismissed && (
        <div 
          className={`w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-2.5 text-xs sm:text-sm border-b transition-colors shadow-xs ${
            announcement.type === 'alert'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
              : announcement.type === 'schedule'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'bg-[#007ba8]/10 border-[#007ba8]/30 text-[#005a7d] dark:text-teal-200'
          }`}
        >
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
              {announcement.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              {announcement.type === 'schedule' && <Bell className="w-4 h-4 text-amber-600 shrink-0" />}
              {announcement.type === 'info' && <Info className="w-4 h-4 text-[#007ba8] shrink-0" />}
              <span className="font-semibold truncate">{announcement.message}</span>
              {announcement.linkUrl && (
                <a
                  href={announcement.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold text-xs shrink-0 hover:opacity-80"
                >
                  {announcement.linkText || 'Learn More'}
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsAnnouncementDismissed(true)}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
              aria-label="Dismiss center announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container - Full Browser Tab Width & Low-Scroll Viewport */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {currentTab === 'assistant' && (
              <AIAssistantView onNavigateToTab={setCurrentTab} />
            )}
            {/* Pass isAdmin to VoiceHotlineView: Pipeline inspector button hidden in normal version */}
            {currentTab === 'hotline' && <VoiceHotlineView isAdmin={isAdmin} />}
            {currentTab === 'schedule' && (
              <ScheduleView
                upcomingSessionText={upcomingSessionText}
                upcomingSessionName={upcomingSessionName}
                centralTimeDisplay={centralTimeDisplay}
              />
            )}
            {currentTab === 'visitor' && <VisitorInfoView />}
            {currentTab === 'videos' && <VideosView />}
            {currentTab === 'admin' && isAdmin && (
              <AdminDashboardModal
                isOpen={true}
                embedded={true}
                onClose={() => setCurrentTab('hotline')}
                onLogout={handleAdminLogout}
                initialTab={adminInitialTab}
                onOpenPipelineInspector={() => setIsPipelineInspectorOpen(true)}
                telemetry={telemetry}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer onSelectTab={setCurrentTab} />

      {/* Smooth Floating Scroll-To-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            onClick={handleScrollToTop}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-[#007ba8] text-white shadow-xl hover:bg-[#006185] border border-white/20 transition-colors cursor-pointer flex items-center justify-center group"
            title="Scroll to Top"
            aria-label="Scroll to top of page"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Reading Guide Ruler Overlay */}
      <ReadingGuide enabled={accessibilitySettings.readingGuide} />

      {/* Accessibility & Display Settings Modal */}
      <AccessibilitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={accessibilitySettings}
        onUpdateSettings={setAccessibilitySettings}
      />

      {/* Admin Login Modal (Authorized Leads) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Dashboard Hub (Pipeline, Lifespan History, Messages, Experiences, Telephony) */}
      <AdminDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        onLogout={handleAdminLogout}
        initialTab={adminInitialTab}
        onOpenPipelineInspector={() => {
          setIsAdminDashboardOpen(false);
          setIsPipelineInspectorOpen(true);
        }}
        telemetry={telemetry}
      />

      {/* Dedicated Pipeline Inspector (Accessible exclusively via Admin) */}
      <PhonebotPipelineInspector
        isOpen={isPipelineInspectorOpen}
        onClose={() => setIsPipelineInspectorOpen(false)}
        telemetry={telemetry}
        messages={callerMessages}
        reservations={tourReservations}
        metrics={phonebotMetrics}
        onRefreshData={handleRefreshData}
        onOpenMessageModal={() => {}}
        onOpenBookingModal={() => {}}
        onSimulateTransfer={() => {}}
      />
    </div>
  );
}
