import { useCallback, useMemo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyStore } from '@tauri-apps/plugin-store'
import { useSystemLanguage } from './use-system-locale'

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
        // Vérifier d'abord s'il y a une langue sauvegardée
        const savedLang = await store.get<string>(LANGUAGE_KEY)

        let targetLanguage: string

        if (savedLang) {
          // Utiliser la langue sauvegardée si elle existe
          targetLanguage = savedLang
          console.log('Using saved language:', savedLang)
        } else if (systemLanguage && !isDetectingSystem) {
          // Utiliser la langue système si aucune langue n'est sauvegardée
          targetLanguage = systemLanguage
          console.log('Using system language:', systemLanguage)
          // Sauvegarder la langue système comme préférence par défaut
          await store.set(LANGUAGE_KEY, systemLanguage)
          await store.save()
        } else {
          // Fallback vers la langue par défaut
          targetLanguage = 'en'
          console.log('Using fallback language: en')
        }

        if (targetLanguage !== i18n.language) {
          await i18n.changeLanguage(targetLanguage)
          setSelectedLanguage(targetLanguage)
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error)
        // En cas d'erreur, utiliser la langue système ou fallback
        const fallbackLang = systemLanguage || 'en'
        if (fallbackLang !== i18n.language) {
          await i18n.changeLanguage(fallbackLang)
          setSelectedLanguage(fallbackLang)
        }
      } finally {
        setIsLoading(false)
      }
    }

    // Attendre que la détection système soit terminée avant de charger les préférences
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
          // Revenir à la langue précédente en cas d'erreur
          setSelectedLanguage(selectedLanguage)
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
