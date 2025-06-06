import { Suspense, lazy, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useAutoAppUpdate } from './hooks/useAutoAppUpdate'
import { Loader } from './pages/loader'

import { useLanguagePreference } from '@/hooks/useLanguagePreference'
import { useLauncherIntegrity } from '@/hooks/useLauncherIntegrity'
import { WindowControls } from '@/components/system/WindowControls'
import { DragZone } from '@/components/system/DragZone'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy loading du contenu principal
const Content = lazy(() => import('./content').then((module) => ({ default: module.Content })))

export default function App() {
  // Charge la langue sauvegardée dès le lancement du Huz Studio
  const { isLoading: isLanguageLoading } = useLanguagePreference()

  // Vérifier l'intégrité de la structure du Huz Studio Launcher
  const launcherIntegrity = useLauncherIntegrity()

  const { t } = useTranslation()
  const { status, progress } = useAutoAppUpdate()

  // Mémorisation des messages pour éviter les re-calculs
  const message = useMemo(() => {
    const messages = {
      idle: t('loader.initializing'),
      checking: t('loader.checking'),
      downloading: t('loader.downloading', { progress }),
      ready: t('loader.ready'),
      installing: t('loader.installing'),
      error: t('loader.error'),
      disabled: t('loader.ready'), // En mode dev, on considère comme "prêt"
    }

    return messages[status]
  }, [status, progress, t])

  // Attendre que tous les systèmes soient prêts
  const isLoading = useMemo(() => {
    // En cas d'erreur d'intégrité, on continue quand même le chargement
    return isLanguageLoading || (status !== 'ready' && status !== 'error' && status !== 'disabled')
  }, [isLanguageLoading, status])

  // Afficher l'erreur de structure si elle existe mais ne pas bloquer
  if (launcherIntegrity.hasError) {
    // Garder un avertissement discret peut être utile ici
    console.warn('Huz Studio Launcher integrity warning:', launcherIntegrity.error)
  }

  // Log informatif pour le mode développement
  if (status === 'disabled') {
    console.log('🔧 Huz Studio - Mode développement détecté - Auto-update désactivé')
  }

  return (
    <main className="bg-background text-foreground flex h-screen overflow-hidden antialiased select-none">
      {/* System Controls */}
      <DragZone />
      <WindowControls />

      {/* Huz Studio Launcher Content */}
      {isLoading ? (
        <Loader message={message} />
      ) : (
        <Suspense fallback={<LoadingSpinner label={t('loader.initializing')} />}>
          <Content />
        </Suspense>
      )}
    </main>
  )
}
