import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export type ExtractionProgressEvent = {
  current_file: number
  total_files: number
  progress_percentage: number
  current_file_name: string
}

export type ExtractionProgressCallback = (progress: ExtractionProgressEvent) => void

// Version synchrone (pour compatibilité)
export async function extractZip(filePath: string, extractTo: string): Promise<void> {
  return await invoke('extract_zip_file', {
    filePath,
    extractTo,
  })
}

// Version asynchrone avec événements de progression
export async function extractZipAsync(
  filePath: string,
  extractTo: string,
  onProgress?: ExtractionProgressCallback,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    let progressUnlisten: (() => void) | null = null
    let completeUnlisten: (() => void) | null = null

    try {
      // Écouter les événements de progression
      if (onProgress) {
        progressUnlisten = await listen<ExtractionProgressEvent>('extraction-progress', (event) => {
          onProgress(event.payload)
        })
      }

      // Écouter l'événement de fin d'extraction
      completeUnlisten = await listen('extraction-complete', () => {
        // Nettoyer les listeners
        if (progressUnlisten) progressUnlisten()
        if (completeUnlisten) completeUnlisten()
        resolve()
      })

      // Démarrer l'extraction asynchrone
      await invoke('extract_zip_file_async', {
        filePath,
        extractTo,
      })
    } catch (error) {
      // Nettoyer les listeners en cas d'erreur
      if (progressUnlisten) progressUnlisten()
      if (completeUnlisten) completeUnlisten()
      reject(error)
    }
  })
}
