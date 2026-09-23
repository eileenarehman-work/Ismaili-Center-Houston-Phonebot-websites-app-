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
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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
    const validLevels = [90, 100, 110, 125, 150];
    const currentIndex = validLevels.indexOf(settings.zoomLevel);
    
    if (currentIndex === -1) {
      // Find closest
      const nextLevel = Math.max(90, Math.min(150, settings.zoomLevel + delta * 10));
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
      const utterance = new SpeechSynthesisUtterance(
        "Ismaili Center Houston accessibility helper is active. You can customize text zoom, contrast, cursor size, and reading guides."
      );
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007ba8]/10 dark:bg-[#007ba8]/20 flex items-center justify-center text-[#007ba8] dark:text-teal-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="accessibility-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Display & Accessibility Settings
                </h2>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#007ba8]/15 text-[#007ba8] dark:text-teal-300 font-mono text-[11px] font-bold">
                    {activeCount} active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize contrast, text size, cursor, and reading assistance
              </p>
            </div>
          </div>

          <button
            id="accessibility-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* SECTION 1: THEME SELECTION (Replaces Old Header Toggle) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Color Theme</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Light, Dark, or System Preference
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
                <span className="text-xs">Light</span>
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
                <span className="text-xs">Dark</span>
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
                <span className="text-xs">System Auto</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: CONTRAST MODES */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#007ba8]" />
                <span>Contrast Mode</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Enhance edge definition & legibility
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
                  Balanced aesthetic colors
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
                  Crisp borders & deep darks
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
                  Low-vision WCAG mode
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 3: ENLARGED CURSOR */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MousePointer2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Enlarged Cursor & Pointer</span>
              </label>
              <span className="text-[11px] text-slate-400">
                High-visibility tracking
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
                <span className="text-xs">Large Cursor</span>
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

          {/* SECTION 4: ZOOM IN / OUT & TEXT SCALING */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Text & UI Zoom</span>
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
                  disabled={settings.zoomLevel >= 150}
                  className="flex-1 sm:flex-initial p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Zoom In (+)"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </button>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-5 gap-1.5 w-full">
                {[90, 100, 110, 125, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setZoomPreset(pct)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      settings.zoomLevel === pct
                        ? 'bg-[#007ba8] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: HELPFUL ACCESSIBILITY TOGGLES */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Reading & Focus Assistance</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Cognitive & Motor Enhancements
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dyslexia-Friendly Font */}
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
                    <span>Dyslexia-Friendly Font</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Expands letter spacing & distinct weights
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
                    <span>Reduce Motion</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Stops animations & pulse effects
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
                    <span>Highlight All Links</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Adds continuous underlines to all actions
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
                    <span>Ultra Focus Rings</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Vibrant amber outlines for keyboard tab
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
                    <span>Reading Focus Ruler (Line Guide)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    A cursor-tracking line ruler across the screen to help focus line-by-line while reading
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
                  Audio Speech Demonstration
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hear spoken assistance through your device speaker
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={speakSampleAnnouncement}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Test Voice
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#007ba8] hover:bg-[#006185] text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
