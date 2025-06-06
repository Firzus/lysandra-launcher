import { memo } from 'react'
import { Card, CardBody, CardHeader, Chip, Button } from '@heroui/react'

import { useSystemLocale, useLanguagePreference } from '@/hooks'

/**
 * Composant de test pour vérifier la détection de langue système
 * À utiliser uniquement en développement
 */
export const LanguageDetectionTest = memo(() => {
  const {
    systemLocale,
    languageCode: systemLanguageCode,
    isLoading: isDetectingSystem,
    error: systemError,
    detectSystemLocale,
  } = useSystemLocale()

  const {
    selectedLanguage,
    systemLanguage,
    isLoading: isLoadingPreference,
    changeLanguage,
  } = useLanguagePreference()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <h3 className="text-lg font-semibold">Language Detection Test</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Détection système */}
        <div className="space-y-2">
          <h4 className="font-medium">System Detection</h4>
          <div className="flex flex-wrap gap-2">
            <Chip color={isDetectingSystem ? 'warning' : 'success'} variant="flat">
              Status: {isDetectingSystem ? 'Detecting...' : 'Complete'}
            </Chip>
            {systemLocale && (
              <Chip color="primary" variant="flat">
                System Locale: {systemLocale}
              </Chip>
            )}
            <Chip color="secondary" variant="flat">
              Language Code: {systemLanguageCode}
            </Chip>
          </div>
          {systemError && <div className="text-sm text-red-500">Error: {systemError}</div>}
          <Button size="sm" variant="bordered" onPress={detectSystemLocale}>
            Re-detect System Language
          </Button>
        </div>

        {/* Préférences utilisateur */}
        <div className="space-y-2">
          <h4 className="font-medium">User Preferences</h4>
          <div className="flex flex-wrap gap-2">
            <Chip color={isLoadingPreference ? 'warning' : 'success'} variant="flat">
              Status: {isLoadingPreference ? 'Loading...' : 'Ready'}
            </Chip>
            <Chip color="primary" variant="flat">
              Selected: {selectedLanguage}
            </Chip>
            {systemLanguage && (
              <Chip color="secondary" variant="flat">
                System: {systemLanguage}
              </Chip>
            )}
          </div>
        </div>

        {/* Actions de test */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              color="primary"
              size="sm"
              variant="bordered"
              onPress={() => changeLanguage('fr')}
            >
              Switch to French
            </Button>
            <Button
              color="primary"
              size="sm"
              variant="bordered"
              onPress={() => changeLanguage('en')}
            >
              Switch to English
            </Button>
            <Button
              color="secondary"
              isDisabled={!systemLanguageCode}
              size="sm"
              variant="bordered"
              onPress={() => systemLanguageCode && changeLanguage(systemLanguageCode)}
            >
              Use System Language
            </Button>
          </div>
        </div>

        {/* Informations de debug */}
        <div className="space-y-2">
          <h4 className="font-medium">Debug Info</h4>
          <div className="rounded bg-gray-100 p-3 font-mono text-sm dark:bg-gray-800">
            <div>Navigator Language: {navigator.language}</div>
            <div>Navigator Languages: {navigator.languages?.join(', ')}</div>
            <div>System Locale (Tauri): {systemLocale || 'Not detected'}</div>
            <div>Extracted Language Code: {systemLanguageCode}</div>
            <div>Current i18n Language: {selectedLanguage}</div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
})

LanguageDetectionTest.displayName = 'LanguageDetectionTest'
