'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Locale = 'ar' | 'en' | 'fr';
export type Direction = 'rtl' | 'ltr';

export interface LanguageContextType {
  locale: Locale;
  direction: Direction;
  translations: Record<string, any>;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [direction, setDirection] = useState<Direction>('rtl');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['ar', 'en', 'fr'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${locale}.json`);
        }
        const data = await response.json();
        setTranslations(data);
        const newDirection = locale === 'ar' ? 'rtl' : 'ltr';
        setDirection(newDirection);
        document.documentElement.lang = locale;
        document.documentElement.dir = newDirection;
      } catch (error) {
        console.error('Error fetching translations:', error);
        // Fallback to English on error
        if (locale !== 'en') {
          setLocaleState('en');
        }
      }
    };

    fetchTranslations();
  }, [locale]);
  
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  }, [translations]);

  const value = {
    locale,
    direction,
    translations,
    setLocale,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
