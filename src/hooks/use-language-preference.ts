import React from 'react'
import { useTranslation } from 'react-i18next'
import { LazyStore } from '@tauri-apps/plugin-store'

const LANGUAGE_KEY = 'language'
const store = new LazyStore('settings.json')

export function useLanguagePreference() {
  const { i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language)

  // Charger la langue sauvegardée au démarrage
  React.useEffect(() => {
    store.get<string>(LANGUAGE_KEY).then((lang) => {
      if (lang && lang !== i18n.language) {
        i18n.changeLanguage(lang)
      }
    })
  }, [])

  // Mettre à jour l'état local si la langue change ailleurs
  React.useEffect(() => {
    setSelectedLanguage(i18n.language)
  }, [i18n.language])

  // Changer la langue et la sauvegarder
  const changeLanguage = React.useCallback(
    (lang: string) => {
      if (lang && lang !== selectedLanguage) {
        setSelectedLanguage(lang)
        i18n.changeLanguage(lang)
        store.set(LANGUAGE_KEY, lang)
        store.save()
      }
    },
    [i18n, selectedLanguage],
  )

  return { selectedLanguage, changeLanguage }
}
