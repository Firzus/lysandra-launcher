import React, { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useTranslation } from 'react-i18next'

type ProgressEvent = {
  progress_percentage: number
  progress: number
  total: number
  version: string
}

export const DownloadProgress: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [version, setVersion] = useState('')
  const [downloadedMB, setDownloadedMB] = useState(0)
  const [totalMB, setTotalMB] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    // Écouter les événements de progression
    const unlisten1 = listen<ProgressEvent>('download-progress', (event) => {
      setIsDownloading(true)
      setProgress(event.payload.progress_percentage)
      setVersion(event.payload.version)

      // Convertir bytes en MB pour un affichage plus convivial
      setDownloadedMB(Math.round((event.payload.progress / 1024 / 1024) * 10) / 10)
      setTotalMB(Math.round((event.payload.total / 1024 / 1024) * 10) / 10)
    })

    // Écouter l'événement de fin de téléchargement
    const unlisten2 = listen<string>('download-complete', (event) => {
      console.log('Download complete event received for version:', event.payload)
      setIsDownloading(false)

      // Garder la barre à 100% pendant quelques instants avant de la masquer
      setTimeout(() => {
        if (!isDownloading) {
          setProgress(0)
        }
      }, 3000)
    })

    // Nettoyer les listeners lorsque le composant est démonté
    return () => {
      unlisten1.then((unsubscribe) => unsubscribe())
      unlisten2.then((unsubscribe) => unsubscribe())
    }
  }, [isDownloading])

  // Ne pas afficher le composant s'il n'y a pas de téléchargement et que la progression est à 0
  if (!isDownloading && progress === 0) {
    return null
  }

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {isDownloading ? t('game.downloading', { progress }) : t('game.download_complete')}
        </span>
        <span className="text-muted-foreground text-xs">
          {downloadedMB} MB / {totalMB} MB
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-content1">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {progress === 100 && !isDownloading && (
        <div className="mt-2 text-right text-sm text-success-500">
          {t('game.download_complete_message')}
        </div>
      )}
    </div>
  )
}
