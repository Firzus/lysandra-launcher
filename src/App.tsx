import { Spinner } from '@heroui/spinner'

import { Content } from './content'
import { useAutoAppUpdate } from './hooks/use-auto-app-update'

import { WindowControls } from '@/components/system/window-controls'
import { DragZone } from '@/components/system/drag-zone'

export default function App() {
  const { status, progress } = useAutoAppUpdate()

  const message = {
    idle: 'Initialisation…',
    checking: 'Vérification des mises à jour…',
    downloading: `Téléchargement : ${progress}%`,
    ready: 'Chargement terminé',
    installing: 'Installation…',
    error: 'Erreur de mise à jour',
  }[status]

  const isLoading = status !== 'ready' && status !== 'error'

  return (
    <main className="flex h-screen select-none overflow-hidden bg-background text-foreground antialiased">
      {/* System */}
      <DragZone />
      <WindowControls />

      {/* Content */}
      {isLoading ? (
        <Spinner className="m-auto" label={message} size="lg" variant="dots" />
      ) : (
        <Content />
      )}
    </main>
  )
}
