import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Laptop, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  MousePointer2, 
  Type, 
  Sparkles, 
  Check, 
  Sliders,
  Volume2,
  Compass,
  ArrowUpDown,
  Maximize2
} from 'lucide-react';
import { 
  AccessibilitySettings, 
  ThemeMode, 
  ContrastMode, 
  CursorSize
} from '../types.ts';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '../utils/accessibility.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

interface AccessibilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: AccessibilitySettings) => void;
}

export const AccessibilitySettingsModal: React.FC<AccessibilitySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape or Enter key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        // If user is not currently focused on an interactive button or input, Enter acts as OK/Done
        const target = e.target as HTMLElement | null;
        if (!target || (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT')) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleContrastChange = (contrast: ContrastMode) => {
    onUpdateSettings({ ...settings, contrast });
  };

  const handleCursorChange = (cursorSize: CursorSize) => {
    onUpdateSettings({ ...settings, cursorSize });
  };

  const handleZoomChange = (delta: number) => {
    const validLevels = [90, 100, 110, 125, 150, 175, 200];
    const currentIndex = validLevels.indexOf(settings.zoomLevel);
    
    if (currentIndex === -1) {
      // Find closest
      const nextLevel = Math.max(90, Math.min(200, settings.zoomLevel + delta * 15));
      onUpdateSettings({ ...settings, zoomLevel: nextLevel });
      return;
    }

    const nextIndex = Math.max(0, Math.min(validLevels.length - 1, currentIndex + delta));
    onUpdateSettings({ ...settings, zoomLevel: validLevels[nextIndex] });
  };

  const setZoomPreset = (zoomLevel: number) => {
    onUpdateSettings({ ...settings, zoomLevel });
  };

  const handleToggleOption = (key: keyof AccessibilitySettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
  };

  // Test Speech Aloud
  const speakSampleAnnouncement = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const phrase = "Ismaili Center Houston display helper is active. You can customize text size, contrast, and reading tools.";
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Calculate active enhancements count (excluding defaults)
  let activeCount = 0;
  if (settings.theme !== 'light') activeCount++;
  if (settings.contrast !== 'normal') activeCount++;
  if (settings.cursorSize !== 'normal') activeCount++;
  if (settings.zoomLevel !== 100) activeCount++;
  if (settings.dyslexiaFont) activeCount++;
  if (settings.reducedMotion) activeCount++;
  if (settings.highlightLinks) activeCount++;
  if (settings.enhancedFocus) activeCount++;
  if (settings.readingGuide) activeCount++;

  return (
    <div 
      id="accessibility-settings-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-start items-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overscroll-contain transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88dvh] my-auto overflow-hidden animate-in zoom-in-95 duration-150 shrink-0 relative"
      >
        {/* Modal Header (Sticky Top with Guaranteed Always-Accessible Quick OK) */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/98 dark:bg-slate-950/98 backdrop-blur-md sticky top-0 z-30 shrink-0 shadow-xs">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-[#007ba8]/10 dark:bg-[#007ba8]/20 flex items-center justify-center text-[#007ba8] dark:text-teal-400 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 id="accessibility-title" className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {t('settings.title', 'Display & Accessibility Settings')}
                </h2>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#007ba8]/15 text-[#007ba8] dark:text-teal-300 font-mono text-[11px] font-bold shrink-0">
                    {activeCount} active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('settings.subtitle', 'Customize text size, contrast, colors, and reading tools')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              id="accessibility-ok-top-btn"
              onClick={onClose}
              className="modal-ok-btn px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-[#007ba8] hover:bg-[#006185] active:bg-[#004e6b] text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 transition-all ring-2 ring-white/20 shrink-0 min-h-[36px]"
              title="OK (Apply settings and close)"
              aria-label="OK, apply settings and close"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>OK</span>
            </button>
            <button
              id="accessibility-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - min-h-0 guarantees flex shrink and sticky footer preservation */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1 min-h-0 overscroll-contain focus:outline-none">

          {/* SECTION 1: THEME SELECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Color Theme</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Light, Dark, or match your device
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-medium">Light</span>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-medium">Dark</span>
              </button>

              {/* System Preference */}
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                  settings.theme === 'system'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Laptop className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-medium">Match Device</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: CONTRAST MODES */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#007ba8]" />
                <span>Contrast</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Make text and borders easier to see
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Normal Contrast */}
              <button
                type="button"
                onClick={() => handleContrastChange('normal')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.contrast === 'normal'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold">Standard</span>
                  {settings.contrast === 'normal' && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Everyday balanced colors
                </span>
              </button>

              {/* High Contrast */}
              <button
                type="button"
                onClick={() => handleContrastChange('high')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.contrast === 'high'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold">High Contrast</span>
                  {settings.contrast === 'high' && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Crisp dark borders and text
                </span>
              </button>

              {/* Yellow on Black */}
              <button
                type="button"
                onClick={() => handleContrastChange('yellow-black')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.contrast === 'yellow-black'
                    ? 'border-yellow-400 bg-black text-yellow-300 font-bold shadow-md shadow-yellow-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-black text-yellow-300 hover:border-yellow-500'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-semibold">Yellow on Black</span>
                  {settings.contrast === 'yellow-black' && <Check className="w-3.5 h-3.5 text-yellow-300" />}
                </div>
                <span className="text-[11px] text-yellow-200/70">
                  High contrast for easy reading
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 4: ENLARGED CURSOR */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MousePointer2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Mouse Pointer Size</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Make pointer easier to find and track
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleCursorChange('normal')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  settings.cursorSize === 'normal'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-base font-mono">1x</span>
                <span className="text-xs">Normal</span>
              </button>

              <button
                type="button"
                onClick={() => handleCursorChange('large')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  settings.cursorSize === 'large'
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20 text-[#007ba8] dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-base font-bold font-mono">1.5x</span>
                <span className="text-xs">Large</span>
              </button>

              <button
                type="button"
                onClick={() => handleCursorChange('extra-large')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                  settings.cursorSize === 'extra-large'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-base font-black font-mono text-rose-500">2x</span>
                <span className="text-xs">Extra Large</span>
              </button>
            </div>
          </div>

          {/* SECTION 5: ZOOM IN / OUT & TEXT SCALING */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Text & Screen Zoom</span>
              </label>
              <span className="text-xs font-mono font-bold text-[#007ba8] dark:text-teal-300">
                Current: {settings.zoomLevel}%
              </span>
            </div>

            {/* Stepper & Preset Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Minus / Plus Stepper */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleZoomChange(-1)}
                  disabled={settings.zoomLevel <= 90}
                  className="flex-1 sm:flex-initial p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Zoom Out (-)"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </button>

                <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-center font-mono font-bold text-xs min-w-[70px]">
                  {settings.zoomLevel}%
                </div>

                <button
                  type="button"
                  onClick={() => handleZoomChange(1)}
                  disabled={settings.zoomLevel >= 200}
                  className="flex-1 sm:flex-initial p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Zoom In (+)"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </button>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 w-full">
                {[90, 100, 110, 125, 150, 175, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setZoomPreset(pct)}
                    className={`py-2 px-1.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer text-center min-h-[36px] ${
                      settings.zoomLevel === pct
                        ? 'bg-[#007ba8] text-white shadow-xs ring-2 ring-[#007ba8]/30 scale-102'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 6: HELPFUL READING & FOCUS ASSISTANCE */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Reading & Focus Helpers</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tools to help you read comfortably
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Easy-to-read font */}
              <button
                type="button"
                onClick={() => handleToggleOption('dyslexiaFont')}
                className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                  settings.dyslexiaFont
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-900 dark:text-white">
                    <Type className="w-3.5 h-3.5 text-[#007ba8]" />
                    <span>Easy-Reading Font</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clear letter shapes that are easier to distinguish
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  settings.dyslexiaFont ? 'bg-[#007ba8] border-[#007ba8] text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {settings.dyslexiaFont && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Reduced Motion */}
              <button
                type="button"
                onClick={() => handleToggleOption('reducedMotion')}
                className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                  settings.reducedMotion
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-900 dark:text-white">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Pause Moving Animations</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keeps the screen calm with fewer moving parts
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  settings.reducedMotion ? 'bg-[#007ba8] border-[#007ba8] text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {settings.reducedMotion && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Highlight Interactive Links */}
              <button
                type="button"
                onClick={() => handleToggleOption('highlightLinks')}
                className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                  settings.highlightLinks
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-900 dark:text-white">
                    <Compass className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Underline Clickable Links</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Shows a clear line under every button and link
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  settings.highlightLinks ? 'bg-[#007ba8] border-[#007ba8] text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {settings.highlightLinks && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Enhanced Keyboard Focus Rings */}
              <button
                type="button"
                onClick={() => handleToggleOption('enhancedFocus')}
                className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                  settings.enhancedFocus
                    ? 'border-[#007ba8] bg-[#007ba8]/10 dark:bg-[#007ba8]/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-900 dark:text-white">
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>Bright Keyboard Outlines</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Clear colored border when moving with the keyboard
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  settings.enhancedFocus ? 'bg-[#007ba8] border-[#007ba8] text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {settings.enhancedFocus && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>

              {/* Reading Focus Guide Line */}
              <button
                type="button"
                onClick={() => handleToggleOption('readingGuide')}
                className={`p-3.5 rounded-2xl border text-left flex items-start justify-between transition-all cursor-pointer sm:col-span-2 ${
                  settings.readingGuide
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 font-semibold text-xs text-slate-900 dark:text-white">
                    <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Reading Guide Line</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    A steady line that follows your mouse to help you read line by line
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  settings.readingGuide ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {settings.readingGuide && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            </div>
          </div>

          {/* Quick Voice Demo Helper */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Voice Helper Demo
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Listen to spoken text through your speakers
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={speakSampleAnnouncement}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Play Voice
            </button>
          </div>

        </div>

        {/* Modal Sticky Footer - Guaranteed to remain pinned, visible, and 100% clickable at any zoom level */}
        <div className="modal-sticky-footer px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/98 dark:bg-slate-950/98 backdrop-blur-md flex items-center justify-between gap-3 sticky bottom-0 z-40 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold cursor-pointer py-2 px-3 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('settings.reset_btn', 'Reset Defaults')}</span>
          </button>

          <button
            type="button"
            id="accessibility-ok-btn"
            onClick={onClose}
            className="modal-ok-btn inline-flex items-center justify-center space-x-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-[#007ba8] hover:bg-[#006185] active:bg-[#004e6b] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 min-h-[46px] min-w-[130px] ring-2 ring-white/30 shrink-0"
            title="OK (Apply settings and close)"
            aria-label="OK, apply settings and close"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>{t('settings.close_btn', 'OK / Done')}</span>
          </button>
        </div>
      </div>

      {/* Floating Quick OK Button for Mobile / Extreme Zoom Accessibility */}
      <div className="sm:hidden fixed bottom-3 right-3 z-60 pointer-events-auto">
        <button
          type="button"
          id="accessibility-ok-floating-btn"
          onClick={onClose}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#007ba8] hover:bg-[#006185] text-white font-bold text-xs shadow-2xl border-2 border-white/50 active:scale-95 cursor-pointer backdrop-blur-md ring-2 ring-black/20"
          aria-label="OK, apply settings and close"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );
};
