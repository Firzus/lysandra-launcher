import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

// Types pour la progression d'extraction
export type ExtractionProgress = {
  extraction_id: string
  current_file: string
  files_processed: number
  total_files: number
  percentage: number
  status: 'starting' | 'extracting' | 'completed' | 'failed'
}

export type ExtractionOptions = {
  onProgress?: (progress: ExtractionProgress) => void
  onComplete?: () => void
  onError?: (error: string) => void
}

// Version synchrone simple
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
  options?: ExtractionOptions,
): Promise<string> {
  // Générer un ID unique pour cette extraction
  const extractionId = `extraction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  let unlisten: UnlistenFn | null = null

  try {
    // Configurer l'écoute des événements de progression
    if (options?.onProgress || options?.onComplete || options?.onError) {
      unlisten = await listen<ExtractionProgress>('extraction-progress', (event) => {
        const progress = event.payload

        // Vérifier que c'est bien notre extraction
        if (progress.extraction_id === extractionId) {
          if (progress.status === 'completed') {
            options?.onComplete?.()
            unlisten?.()
          } else if (progress.status === 'failed') {
            options?.onError?.('Extraction failed')
            unlisten?.()
          } else {
            options?.onProgress?.(progress)
          }
        }
      })
    }

    // Démarrer l'extraction asynchrone
    await invoke('extract_zip_file_async', {
      filePath,
      extractTo,
      extractionId,
    })

    return extractionId
  } catch (error) {
    unlisten?.()
    const errorMessage = error instanceof Error ? error.message : String(error)

    options?.onError?.(errorMessage)
    throw error
  }
}
