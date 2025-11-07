'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import arTranslations from '@/locales/ar.json';
import frTranslations from '@/locales/fr.json';

type Locale = 'ar' | 'fr';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const translations: { [key in Locale]: any } = {
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

  const t = (key: string, options?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    
    const findTranslation = (localeToUse: Locale): string | undefined => {
        let result: any = translations[localeToUse];
        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                return undefined;
            }
        }
        return result;
    };

    let translation = findTranslation(locale) ?? findTranslation('ar'); // Fallback to arabic

    if (translation === undefined) {
        return key; // Return key if not found in either language
    }

    if (options) {
        Object.keys(options).forEach(optionKey => {
            translation = translation.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(options[optionKey]));
        });
    }

    return translation;
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
