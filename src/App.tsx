import { Suspense, lazy, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useAutoAppUpdate } from './hooks/use-auto-app-update'
import { Loader } from './pages/loader'

import { useLanguagePreference } from '@/hooks/use-language-preference'
import { useLauncherIntegrity } from '@/hooks/use-launcher-integrity'
import { WindowControls } from '@/components/system/window-controls'
import { DragZone } from '@/components/system/drag-zone'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy loading du contenu principal
const Content = lazy(() => import('./content').then((module) => ({ default: module.Content })))

export default function App() {
  // Charge la langue sauvegardée dès le lancement
  const { isLoading: isLanguageLoading } = useLanguagePreference()

  // Vérifier l'intégrité de la structure du launcher
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
    }

    return messages[status]
  }, [status, progress, t])

  // Attendre que tous les systèmes soient prêts
  const isLoading = useMemo(() => {
    // En cas d'erreur d'intégrité, on continue quand même le chargement
    return isLanguageLoading || (status !== 'ready' && status !== 'error')
  }, [isLanguageLoading, status])

  // Afficher l'erreur de structure si elle existe mais ne pas bloquer
  if (launcherIntegrity.hasError) {
    // Garder un avertissement discret peut être utile ici
    console.warn('Launcher integrity warning:', launcherIntegrity.error)
  }

  return (
    <main className="flex h-screen select-none overflow-hidden bg-background text-foreground antialiased">
      {/* System */}
      <DragZone />
      <WindowControls />

      {/* Debug Tools - Supprimé */}
      {/* <DevToolsToggle className="absolute bottom-2 right-2 z-50" /> */}

      {/* Content */}
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
