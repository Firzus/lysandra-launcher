import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import synchrone des traductions
import enTranslations from '@/locales/en.json'
import frTranslations from '@/locales/fr.json'
import esTranslations from '@/locales/es.json'
import deTranslations from '@/locales/de.json'

// Mapping des traductions
const translations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  de: deTranslations,
}

// Fonction pour détecter la langue du système
const getSystemLanguage = (): string => {
  const systemLang = navigator.language || navigator.languages?.[0] || 'en'
  const langCode = systemLang.split('-')[0] // Prendre seulement le code de langue (ex: 'fr' de 'fr-FR')

  // Vérifier si la langue est supportée
  const supportedLanguages = ['en', 'fr', 'es', 'de']

  return supportedLanguages.includes(langCode) ? langCode : 'en'
}

// Préparer les ressources avec toutes les traductions
const systemLang = getSystemLanguage()
const resources = {
  en: { translation: translations.en },
  fr: { translation: translations.fr },
  es: { translation: translations.es },
  de: { translation: translations.de },
}

// Configuration i18n optimisée avec chargement synchrone
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Chargement synchrone de toutes les traductions
    resources,
    lng: systemLang,
    fallbackLng: 'en',

    // Configuration du détecteur de langue
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Optimisations de performance
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },

    // Désactiver les logs en production
    debug: process.env.NODE_ENV === 'development',

    // Optimisations de cache
    saveMissing: false,
    updateMissing: false,

    // Configuration des namespaces
    defaultNS: 'translation',
    ns: ['translation'],

    // Optimisations de performance
    cleanCode: true,
  })

export default i18n
