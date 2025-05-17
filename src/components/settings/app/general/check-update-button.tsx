import { relaunch } from '@tauri-apps/plugin-process'
import { Button } from '@heroui/button'
import { addToast } from '@heroui/toast'

import { useAutoAppUpdate } from '@/hooks/use-auto-app-update'

type Props = {
  className?: string
}

export const CheckUpdateButton: React.FC<Props> = ({ className }) => {
  const { status } = useAutoAppUpdate()

  const handleCheck = () => {
    if (status === 'ready') {
      addToast({
        color: 'success',
        title: 'Launcher à jour',
        description: 'Le launcher est déjà à jour.',
      })
    } else if (status === 'error') {
      addToast({
        color: 'danger',
        title: 'Erreur de mise à jour',
        description: 'Une erreur est survenue lors de la vérification des mises à jour.',
      })
    } else {
      addToast({
        color: 'warning',
        timeout: 3000,
        title: 'Mise à jour disponible',
        description: 'Votre launcher va être redémarré pour appliquer la mise à jour.',
      })

      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve()
        }, 3000)
      }).then(async () => {
        await relaunch()
      })
    }
  }

  return (
    <Button className={className} onPress={handleCheck}>
      Vérifier
    </Button>
  )
}
