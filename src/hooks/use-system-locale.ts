import { useCallback, useEffect, useState } from 'react'
import { locale } from '@tauri-apps/plugin-os'

/**
 * Hook pour détecter la langue système avec le plugin OS de Tauri
 * Retourne la langue au format BCP-47 (ex: "fr-FR", "en-US")
 */
export function useSystemLocale() {
  const [systemLocale, setSystemLocale] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detectSystemLocale = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const detectedLocale = await locale()
      setSystemLocale(detectedLocale)

      console.log('System locale detected:', detectedLocale)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect system locale'
      setError(errorMessage)
      console.error('Error detecting system locale:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    detectSystemLocale()
  }, [detectSystemLocale])

  /**
   * Convertit la locale système en code de langue pour i18n
   * Ex: "fr-FR" -> "fr", "en-US" -> "en"
   */
  const getLanguageCode = useCallback((localeString: string | null): string => {
    if (!localeString) return 'en' // fallback par défaut

    // Extraire le code de langue (avant le tiret)
    const languageCode = localeString.split('-')[0].toLowerCase()

    // Vérifier si la langue est supportée par l'application
    const supportedLanguages = ['fr', 'en'] // Ajouter d'autres langues selon les besoins

    return supportedLanguages.includes(languageCode) ? languageCode : 'en'
  }, [])

  return {
    systemLocale,
    languageCode: getLanguageCode(systemLocale),
    isLoading,
    error,
    detectSystemLocale,
  }
}

/**
 * Hook simplifié qui retourne directement le code de langue
 */
export function useSystemLanguage() {
  const { languageCode, isLoading, error } = useSystemLocale()
  return { languageCode, isLoading, error }
}
