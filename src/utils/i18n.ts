import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Lazy loading des traductions pour améliorer les performances
const loadTranslations = async (language: string) => {
  try {
    // Import dynamique avec gestion explicite des langues supportées
    let translations

    switch (language) {
      case 'fr':
        translations = await import('@/locales/fr.json')
        break
      case 'en':
        translations = await import('@/locales/en.json')
        break
      case 'es':
        translations = await import('@/locales/es.json')
        break
      case 'de':
        translations = await import('@/locales/de.json')
        break
      default:
        // Fallback vers l'anglais pour les langues non supportées
        translations = await import('@/locales/en.json')
        break
    }

    return translations.default
  } catch (error) {
    console.warn(`Failed to load translations for ${language}, falling back to English`)
    const fallback = await import('@/locales/en.json')

    return fallback.default
  }
}

// Fonction pour détecter la langue du système
const getSystemLanguage = (): string => {
  const systemLang = navigator.language || navigator.languages?.[0] || 'en'
  const langCode = systemLang.split('-')[0] // Prendre seulement le code de langue (ex: 'fr' de 'fr-FR')

  // Vérifier si la langue est supportée
  const supportedLanguages = ['en', 'fr', 'es', 'de']

  return supportedLanguages.includes(langCode) ? langCode : 'en'
}

// Configuration i18n optimisée
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Chargement initial vide pour démarrer rapidement
    resources: {},
    lng: getSystemLanguage(),
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

// Précharger les traductions de la langue système
const systemLang = getSystemLanguage()

loadTranslations(systemLang).then((translations) => {
  i18n.addResourceBundle(systemLang, 'translation', translations, true, true)
})

// Précharger l'anglais comme fallback si ce n'est pas la langue système
if (systemLang !== 'en') {
  loadTranslations('en').then((translations) => {
    i18n.addResourceBundle('en', 'translation', translations, true, true)
  })
}

export default i18n
