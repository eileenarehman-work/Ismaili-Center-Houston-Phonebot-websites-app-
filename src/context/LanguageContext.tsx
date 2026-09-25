import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'es' | 'ur' | 'gu' | 'fa' | 'fr' | 'ar';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'settings.title': 'Display & Accessibility Settings',
    'settings.subtitle': 'Customize text size, contrast, colors, and reading tools',
    'settings.reset_btn': 'Reset Defaults',
    'settings.close_btn': 'Done',
    'modal.cancel': 'Cancel',
    'modal.confirm': 'Confirm',
    'modal.close': 'Close',
  },
  es: {
    'settings.title': 'Configuración de Pantalla y Accesibilidad',
    'settings.subtitle': 'Personalice tamaño de texto, contraste, colores y herramientas de lectura',
    'settings.reset_btn': 'Restablecer Valores',
    'settings.close_btn': 'Listo',
    'modal.cancel': 'Cancelar',
    'modal.confirm': 'Confirmar',
    'modal.close': 'Cerrar',
  },
  ur: {
    'settings.title': 'ڈسپلے اور رسائی کی ترتیبات',
    'settings.subtitle': 'متن کے سائز، کنٹراسٹ اور رنگوں کو اپنی مرضی کے مطابق بنائیں',
    'settings.reset_btn': 'پہلے جیسا کریں',
    'settings.close_btn': 'مکمل',
    'modal.cancel': 'منسوخ کریں',
    'modal.confirm': 'تصدیق کریں',
    'modal.close': 'بند کریں',
  },
  gu: {
    'settings.title': 'ડિસ્પ્લે અને ઍક્સેસિબિલિટી સેટિંગ્સ',
    'settings.subtitle': 'ટેક્સ્ટનું કદ, કોન્ટ્રાસ્ટ અને રંગો કસ્ટમાઇઝ કરો',
    'settings.reset_btn': 'ડિફૉલ્ટ રીસેટ કરો',
    'settings.close_btn': 'સંપૂર્ણ',
    'modal.cancel': 'રદ કરો',
    'modal.confirm': 'ખાતરી કરો',
    'modal.close': 'બંધ કરો',
  },
  fa: {
    'settings.title': 'تنظیمات نمایش و دسترسی‌پذیری',
    'settings.subtitle': 'سفارشی‌سازی اندازه متن، کنتراست، رنگ‌ها و ابزارهای خواندن',
    'settings.reset_btn': 'بازنشانی پیش‌فرض‌ها',
    'settings.close_btn': 'انجام شد',
    'modal.cancel': 'لغو',
    'modal.confirm': 'تأیید',
    'modal.close': 'بستن',
  },
  fr: {
    'settings.title': 'Paramètres d\'affichage et d\'accessibilité',
    'settings.subtitle': 'Personnalisez la taille du texte, le contraste, les couleurs et les outils de lecture',
    'settings.reset_btn': 'Réinitialiser',
    'settings.close_btn': 'Terminé',
    'modal.cancel': 'Annuler',
    'modal.confirm': 'Confirmer',
    'modal.close': 'Fermer',
  },
  ar: {
    'settings.title': 'إعدادات العرض وإمكانية الوصول',
    'settings.subtitle': 'تخصيص حجم النص والتباين والألوان وأدوات القراءة',
    'settings.reset_btn': 'إعادة التعيين',
    'settings.close_btn': 'تم',
    'modal.cancel': 'إلغاء',
    'modal.confirm': 'تأكيد',
    'modal.close': 'إغلاق',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ich_language') as SupportedLanguage;
      if (stored && translations[stored]) return stored;
    }
    return 'en';
  });

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ich_language', lang);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
