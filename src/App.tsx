import { useTranslation } from 'react-i18next'

import { Content } from './content'
import { useAutoAppUpdate } from './hooks/use-auto-app-update'
import { Loader } from './pages/loader'

import { useLanguagePreference } from '@/hooks/use-language-preference'
import { WindowControls } from '@/components/system/window-controls'
import { DragZone } from '@/components/system/drag-zone'

export default function App() {
  // Charge la langue sauvegardée dès le lancement
  useLanguagePreference()

  const { t } = useTranslation()
  const { status, progress } = useAutoAppUpdate()

  const message = {
    idle: t('loader.initializing'),
    checking: t('loader.checking'),
    downloading: t('loader.downloading', { progress }),
    ready: t('loader.ready'),
    installing: t('loader.installing'),
    error: t('loader.error'),
  }[status]

  const isLoading = status !== 'ready' && status !== 'error'

  return (
    <main className="flex h-screen select-none overflow-hidden bg-background text-foreground antialiased">
      {/* System */}
      <DragZone />
      <WindowControls />

      {/* Content */}
      {isLoading ? <Loader message={message} /> : <Content />}
    </main>
  )
}
