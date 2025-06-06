import { Button } from '@heroui/react'
import { useState } from 'react'
import { LuFolderPlus, LuCheck, LuX } from 'react-icons/lu'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'

import { ensureLauncherDirectories } from '@/utils/paths'

type DebugStatus = 'idle' | 'creating' | 'success' | 'error'

type Props = {
  className?: string
}

export const DebugLauncherStructure: React.FC<Props> = ({ className }) => {
  const { t } = useTranslation()
  const [status, setStatus] = useState<DebugStatus>('idle')
  const [message, setMessage] = useState<string>('')

  const handleCreateStructure = async () => {
    try {
      setStatus('creating')
      setMessage('')

      // 1. Créer la structure via notre fonction utilitaire
      await ensureLauncherDirectories()

      // 2. Appeler aussi la fonction Tauri pour double vérification
      await invoke('initialize_launcher_directories')

      setStatus('success')
      setMessage(t('debug.created'))

      // Reset après 3 secondes
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : t('debug.error'))

      // Reset après 5 secondes
      setTimeout(() => {
        setStatus('idle')
        setMessage('')
      }, 5000)
    }
  }

  const getButtonProps = () => {
    switch (status) {
      case 'creating':
        return {
          color: 'default' as const,
          isLoading: true,
          children: t('debug.creating'),
          startContent: null,
        }
      case 'success':
        return {
          color: 'success' as const,
          isLoading: false,
          children: t('debug.created'),
          startContent: <LuCheck size={16} />,
        }
      case 'error':
        return {
          color: 'danger' as const,
          isLoading: false,
          children: t('debug.error'),
          startContent: <LuX size={16} />,
        }
      default:
        return {
          color: 'primary' as const,
          isLoading: false,
          children: t('debug.create_structure'),
          startContent: <LuFolderPlus size={16} />,
        }
    }
  }

  const buttonProps = getButtonProps()

  return (
    <div className={className}>
      <Button
        isDisabled={status === 'creating'}
        size="sm"
        variant="flat"
        onPress={handleCreateStructure}
        {...buttonProps}
      >
        {buttonProps.children}
      </Button>

      {message && (
        <p
          className={`mt-2 text-xs ${
            status === 'success'
              ? 'text-success'
              : status === 'error'
                ? 'text-danger'
                : 'text-default-500'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
