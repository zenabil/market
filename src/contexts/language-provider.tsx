'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import arTranslations from '@/locales/ar.json';
import frTranslations from '@/locales/fr.json';

type Locale = 'ar' | 'fr';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations = {
  ar: arTranslations,
  fr: frTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['ar', 'fr'].includes(savedLocale)) {
      setLocaleState(savedLocale);
      document.documentElement.lang = savedLocale;
      document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
    } else {
        // Default to Arabic if nothing is saved
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[locale];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to Arabic if key not found in current locale
        let fallbackResult: any = translations.ar;
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
        }
        return fallbackResult || key;
      }
    }
    return result || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
