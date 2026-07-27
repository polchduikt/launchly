import React, { createContext, useContext, useEffect, useState } from 'react';
import { getLanguage, subscribeLanguageChange } from '../i18n/config';

interface LanguageContextType {
  language: 'en' | 'uk';
}

const LanguageContext = createContext<LanguageContextType>({ language: 'en' });

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'uk'>(getLanguage());

  useEffect(() => {
    const unsubscribe = subscribeLanguageChange(() => {
      setLanguage(getLanguage());
    });
    return unsubscribe;
  }, []);

  return (
    <LanguageContext.Provider value={{ language }}>
      <div key={language} style={{ display: 'contents' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => useContext(LanguageContext);
