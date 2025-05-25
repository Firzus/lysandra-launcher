import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import es from '@/locales/es.json'
import de from '@/locales/de.json'

// Fonction pour détecter la langue du système
const getSystemLanguage = (): string => {
  const systemLang = navigator.language || navigator.languages?.[0] || 'en'
  const langCode = systemLang.split('-')[0] // Prendre seulement le code de langue (ex: 'fr' de 'fr-FR')

  // Vérifier si la langue est supportée
  const supportedLanguages = ['en', 'fr', 'es', 'de']

  return supportedLanguages.includes(langCode) ? langCode : 'en'
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      de: { translation: de },
    },
    lng: getSystemLanguage(),
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
