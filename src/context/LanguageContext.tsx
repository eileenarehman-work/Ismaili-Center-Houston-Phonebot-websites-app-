import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageOption } from '../types.ts';
import { SUPPORTED_LANGUAGES } from '../utils/accessibility.ts';
import { getTranslation } from '../utils/translations.ts';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
  dir: 'ltr',
  isRTL: false,
  currentLanguageOption: SUPPORTED_LANGUAGES[0],
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export interface LanguageProviderProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  language,
  onLanguageChange,
  children,
}) => {
  const currentLanguageOption = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const dir = currentLanguageOption.dir;
  const isRTL = dir === 'rtl';

  const t = useCallback(
    (key: string, fallback?: string) => {
      return getTranslation(language, key, fallback);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: onLanguageChange,
      t,
      dir,
      isRTL,
      currentLanguageOption,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, onLanguageChange, t, dir, isRTL, currentLanguageOption]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation() {
  return useContext(LanguageContext);
}

export function useLanguage() {
  return useContext(LanguageContext);
}
