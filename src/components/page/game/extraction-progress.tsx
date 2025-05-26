import React, { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useTranslation } from 'react-i18next'
import { Progress } from '@heroui/progress'

type ExtractionProgressEvent = {
    current_file: number
    total_files: number
    progress_percentage: number
    current_file_name: string
}

export const ExtractionProgress: React.FC = () => {
    const [isExtracting, setIsExtracting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentFile, setCurrentFile] = useState('')
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [totalFiles, setTotalFiles] = useState(0)
    const { t } = useTranslation()

    useEffect(() => {
        // Écouter les événements de progression d'extraction
        const unlisten1 = listen<ExtractionProgressEvent>('extraction-progress', (event) => {
            setIsExtracting(true)
            setProgress(event.payload.progress_percentage)
            setCurrentFile(event.payload.current_file_name)
            setCurrentFileIndex(event.payload.current_file)
            setTotalFiles(event.payload.total_files)
        })

        // Écouter l'événement de fin d'extraction
        const unlisten2 = listen('extraction-complete', () => {
            setIsExtracting(false)

            // Garder la barre à 100% pendant quelques instants avant de la masquer
            setTimeout(() => {
                if (!isExtracting) {
                    setProgress(0)
                    setCurrentFile('')
                    setCurrentFileIndex(0)
                    setTotalFiles(0)
                }
            }, 3000)
        })

        // Nettoyer les listeners lorsque le composant est démonté
        return () => {
            unlisten1.then((unsubscribe) => unsubscribe())
            unlisten2.then((unsubscribe) => unsubscribe())
        }
    }, [isExtracting])

    // Ne pas afficher le composant s'il n'y a pas d'extraction et que la progression est à 0
    if (!isExtracting && progress === 0) {
        return null
    }

    // Tronquer le nom du fichier s'il est trop long
    const displayFileName = currentFile.length > 50 ? `...${currentFile.slice(-47)}` : currentFile

    return (
        <div className="w-full space-y-2 rounded-lg bg-default-100 p-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('game.install.extracting')}</span>
                <span className="text-sm text-default-500">{progress}%</span>
            </div>

            <Progress className="w-full" color="primary" size="sm" value={progress} />

            {currentFile && (
                <div className="space-y-1">
                    <div className="truncate text-xs text-default-600" title={currentFile}>
                        {displayFileName}
                    </div>
                    <div className="text-xs text-default-500">
                        {currentFileIndex} / {totalFiles} fichiers
                    </div>
                </div>
            )}
        </div>
    )
}
