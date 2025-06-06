import { relaunch } from '@tauri-apps/plugin-process'
import { Button, addToast } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { LuRefreshCw, LuCheck, LuX, LuCode } from 'react-icons/lu'

import { useAutoAppUpdate } from '@/hooks/useAutoAppUpdate'

type Props = {
  className?: string
}

export const CheckUpdateButton: React.FC<Props> = ({ className }) => {
  const { status, checkForUpdates, error, isDevMode } = useAutoAppUpdate()
  const { t } = useTranslation()

  const handleCheck = async () => {
    // Si en mode développement, afficher un message informatif
    if (status === 'disabled' && isDevMode) {
      addToast({
        color: 'default',
        title: t('update.disabled'),
        description: t('update.disabled_desc'),
      })

      return
    }

    // Si une mise à jour est disponible (status downloading/installing), redémarrer
    if (status === 'downloading' || status === 'installing') {
      addToast({
        color: 'warning',
        shouldShowTimeoutProgress: true,
        timeout: 5000,
        title: t('update.available'),
        description: t('update.will_restart'),
      })

      setTimeout(async () => {
        await relaunch()
      }, 5000)

      return
    }

    // Si le launcher est à jour, afficher un message
    if (status === 'ready') {
      addToast({
        color: 'success',
        title: t('update.ready'),
        description: t('update.already_latest'),
      })

      return
    }

    // Si il y a une erreur, afficher le message d'erreur
    if (status === 'error') {
      addToast({
        color: 'danger',
        title: t('update.error'),
        description: error || t('update.error_desc'),
      })

      return
    }

    // Déclencher une nouvelle vérification
    try {
      await checkForUpdates()
    } catch (err) {
      addToast({
        color: 'danger',
        title: t('update.error'),
        description: err instanceof Error ? err.message : t('update.error_desc'),
      })
    }
  }

  const getButtonProps = () => {
    switch (status) {
      case 'checking':
        return {
          color: 'default' as const,
          isLoading: true,
          children: t('loader.checking'),
          startContent: null,
        }
      case 'downloading':
      case 'installing':
        return {
          color: 'warning' as const,
          isLoading: false,
          children: t('update.available'),
          startContent: <LuRefreshCw size={16} />,
        }
      case 'ready':
        return {
          color: 'success' as const,
          isLoading: false,
          children: t('update.ready'),
          startContent: <LuCheck size={16} />,
        }
      case 'error':
        return {
          color: 'danger' as const,
          isLoading: false,
          children: t('update.error'),
          startContent: <LuX size={16} />,
        }
      case 'disabled':
        return {
          color: 'default' as const,
          isLoading: false,
          children: t('update.disabled'),
          startContent: <LuCode size={16} />,
        }
      default:
        return {
          color: 'primary' as const,
          isLoading: false,
          children: t('update.check'),
          startContent: <LuRefreshCw size={16} />,
        }
    }
  }

  const buttonProps = getButtonProps()

  return (
    <Button
      className={className}
      color={buttonProps.color}
      isLoading={buttonProps.isLoading}
      size="sm"
      startContent={buttonProps.startContent}
      variant="flat"
      onPress={handleCheck}
    >
      {buttonProps.children}
    </Button>
  )
}
