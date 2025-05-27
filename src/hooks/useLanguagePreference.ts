import { useCallback, useMemo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyStore } from '@tauri-apps/plugin-store'

import { useSystemLanguage } from './useSystemLocale'

const LANGUAGE_KEY = 'language'
const store = new LazyStore('settings.json')

export function useLanguagePreference() {
  const { i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  const [isLoading, setIsLoading] = useState(true)
  const { languageCode: systemLanguage, isLoading: isDetectingSystem } = useSystemLanguage()

  // Charger la langue sauvegardée ou utiliser la langue système
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLang = await store.get<string>(LANGUAGE_KEY)
        let targetLanguage: string

        if (savedLang) {
          targetLanguage = savedLang
        } else if (systemLanguage && !isDetectingSystem) {
          targetLanguage = systemLanguage
          await store.set(LANGUAGE_KEY, systemLanguage)
          await store.save()
        } else {
          targetLanguage = 'en' // Fallback
        }

        if (targetLanguage !== i18n.language) {
          await i18n.changeLanguage(targetLanguage)
          setSelectedLanguage(targetLanguage)
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error)
        const fallbackLang = systemLanguage || 'en'

        if (fallbackLang !== i18n.language) {
          await i18n.changeLanguage(fallbackLang)
          setSelectedLanguage(fallbackLang)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (!isDetectingSystem) {
      loadLanguagePreference()
    }
  }, [i18n, systemLanguage, isDetectingSystem])

  // Mettre à jour l'état local si la langue change ailleurs
  useEffect(() => {
    setSelectedLanguage(i18n.language)
  }, [i18n.language])

  // Changer la langue et la sauvegarder
  const changeLanguage = useCallback(
    async (lang: string) => {
      if (lang && lang !== selectedLanguage) {
        try {
          setSelectedLanguage(lang)
          await i18n.changeLanguage(lang)
          await store.set(LANGUAGE_KEY, lang)
          await store.save()
        } catch (error) {
          console.error('Failed to change language:', error)
          setSelectedLanguage(selectedLanguage) // Revenir en cas d'erreur
        }
      }
    },
    [i18n, selectedLanguage],
  )

  return useMemo(
    () => ({
      selectedLanguage,
      changeLanguage,
      isLoading: isLoading || isDetectingSystem,
      systemLanguage,
    }),
    [selectedLanguage, changeLanguage, isLoading, isDetectingSystem, systemLanguage],
  )
}
