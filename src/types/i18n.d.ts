import 'i18next'

import en from '@/locales/en.json'
import fr from '@/locales/fr.json'
import es from '@/locales/es.json'
import de from '@/locales/de.json'

// Union de tous les types de traduction pour s'assurer que toutes les clés sont disponibles
type AllTranslations = typeof en & typeof fr & typeof es & typeof de

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: AllTranslations
    }
  }
}
