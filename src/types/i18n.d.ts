import 'i18next'

import en from '@/locales/en.json'

type DefaultNamespace = typeof en

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: DefaultNamespace
    }
  }
}
