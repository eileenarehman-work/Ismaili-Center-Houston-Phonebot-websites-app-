import { AccessibilitySettings, LanguageOption } from '../types.ts';

const STORAGE_KEY = 'ich_accessibility_settings';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', dir: 'ltr' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', dir: 'ltr' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', dir: 'rtl' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', dir: 'ltr' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', dir: 'rtl' },
  { code: 'tl', nativeName: 'Tagalog', englishName: 'Tagalog', dir: 'ltr' },
];

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  language: 'en',
  theme: 'light',
  contrast: 'normal',
  cursorSize: 'normal',
  zoomLevel: 100,
  dyslexiaFont: false,
  reducedMotion: false,
  highlightLinks: false,
  enhancedFocus: false,
  readingGuide: false,
  textToSpeech: false,
};

export function getStoredAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const legacyTheme = localStorage.getItem('theme');

    let parsed: Partial<AccessibilitySettings> = {};
    if (raw) {
      parsed = JSON.parse(raw);
    }

    // Preserve legacy theme setting if present
    const theme = parsed.theme || (legacyTheme === 'dark' ? 'dark' : legacyTheme === 'light' ? 'light' : 'light');

    return {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...parsed,
      theme,
      language: 'en', // Default language is strictly English
    };
  } catch (e) {
    console.warn('Error reading accessibility settings from localStorage', e);
    return DEFAULT_ACCESSIBILITY_SETTINGS;
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Keep legacy theme key in sync for any external scripts or existing styles
    if (settings.theme === 'dark') {
      localStorage.setItem('theme', 'dark');
    } else if (settings.theme === 'light') {
      localStorage.setItem('theme', 'light');
    }
  } catch (e) {
    console.warn('Error saving accessibility settings to localStorage', e);
  }
}

/**
 * Apply all accessibility settings to the DOM (HTML / body elements and CSS variables)
 */
export function applyAccessibilityToDOM(settings: AccessibilitySettings): void {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  // 0. Language & Text Direction (RTL / LTR)
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === settings.language) || SUPPORTED_LANGUAGES[0];
  html.lang = langConfig.code;
  html.dir = langConfig.dir;
  body.setAttribute('data-lang', langConfig.code);
  body.setAttribute('data-dir', langConfig.dir);

  // 1. Theme (Dark / Light / System)
  let isDark = false;
  if (settings.theme === 'dark') {
    isDark = true;
  } else if (settings.theme === 'light') {
    isDark = false;
  } else if (settings.theme === 'system') {
    isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    html.classList.add('dark');
    body.classList.add('dark');
  } else {
    html.classList.remove('dark');
    body.classList.remove('dark');
  }

  // 2. Contrast Mode
  html.classList.remove('contrast-high', 'contrast-yellow-black');
  body.classList.remove('contrast-high', 'contrast-yellow-black');
  if (settings.contrast === 'high') {
    html.classList.add('contrast-high');
    body.classList.add('contrast-high');
  } else if (settings.contrast === 'yellow-black') {
    html.classList.add('contrast-yellow-black');
    body.classList.add('contrast-yellow-black');
  }

  // 3. Cursor Size
  html.classList.remove('cursor-large', 'cursor-xlarge');
  body.classList.remove('cursor-large', 'cursor-xlarge');
  if (settings.cursorSize === 'large') {
    html.classList.add('cursor-large');
    body.classList.add('cursor-large');
  } else if (settings.cursorSize === 'extra-large') {
    html.classList.add('cursor-xlarge');
    body.classList.add('cursor-xlarge');
  }

  // 4. Zoom / UI Scaling
  // We apply CSS zoom to the document root and set custom CSS variable
  const zoomRatio = settings.zoomLevel / 100;
  (html.style as any).zoom = `${settings.zoomLevel}%`;
  html.style.setProperty('--app-zoom-level', `${zoomRatio}`);

  // 5. Dyslexia-Friendly Font
  if (settings.dyslexiaFont) {
    html.classList.add('font-dyslexia');
    body.classList.add('font-dyslexia');
  } else {
    html.classList.remove('font-dyslexia');
    body.classList.remove('font-dyslexia');
  }

  // 6. Reduced Motion
  if (settings.reducedMotion) {
    html.classList.add('reduced-motion');
    body.classList.add('reduced-motion');
  } else {
    html.classList.remove('reduced-motion');
    body.classList.remove('reduced-motion');
  }

  // 7. Highlight Links
  if (settings.highlightLinks) {
    html.classList.add('highlight-links');
    body.classList.add('highlight-links');
  } else {
    html.classList.remove('highlight-links');
    body.classList.remove('highlight-links');
  }

  // 8. Enhanced Focus Rings
  if (settings.enhancedFocus) {
    html.classList.add('enhanced-focus');
    body.classList.add('enhanced-focus');
  } else {
    html.classList.remove('enhanced-focus');
    body.classList.remove('enhanced-focus');
  }
}
