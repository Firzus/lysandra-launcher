import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'

import i18n from './i18n'
import { getGamePaths, GAME_IDS } from './paths'
import { fetchManifest } from './update-service'
import { checkFileHash } from './hash-verification'
import { extractZipAsync } from './zip'
import { getGameRepository } from './game-data'
import { sendDownloadCompleteNotification } from './notifications'
import {
  initializeGameDirectoryStructure,
  checkGameDirectoryStructure,
} from './game-directory-manager'

export type GameInstallProgress = {
  step:
    | 'fetching'
    | 'downloading'
    | 'verifying'
    | 'extracting'
    | 'installing'
    | 'cleaning'
    | 'complete'
  progress?: number
  message: string
}

export type GameInstallResult = {
  success: boolean
  version?: string
  error?: string
}

/**
 * Télécharge et installe un jeu dans la nouvelle architecture
 * Gère tout le processus : téléchargement → vérification → extraction → nettoyage
 */
export async function downloadAndInstallGame(
  gameId: string,
  owner: string,
  repo: string,
  onProgress?: (progress: GameInstallProgress) => void,
): Promise<GameInstallResult> {
  try {
    console.log(`🎮 Starting installation of ${gameId} from ${owner}/${repo}`)

    // 0. Initialiser la structure des dossiers AVANT tout
    console.log(`📁 Initializing game directory structure...`)
    onProgress?.({ step: 'fetching', message: i18n.t('game.install.initializing_structure') })
    const initResult = await initializeGameDirectoryStructure(gameId)

    if (!initResult.success) {
      throw new Error(`Failed to initialize directory structure: ${initResult.errors.join(', ')}`)
    }

    const gamePaths = await getGamePaths(gameId)

    console.log(`📁 Game paths:`, gamePaths)

    // 1. Récupérer le manifeste
    console.log(`📋 Fetching manifest...`)
    onProgress?.({ step: 'fetching', message: i18n.t('game.install.fetching') })
    const manifest = await fetchManifest(owner, repo)
    const { version, url, hash } = manifest

    console.log(`✅ Manifest fetched: version=${version}, url=${url}`)

    // 2. Préparer les chemins
    console.log(`📂 Preparing paths...`)
    const cacheDir = await join(await gamePaths.root, '..', '..', 'cache') // Dossier cache du launcher
    const zipFileName = `${gameId}-${version}.zip`
    const zipFilePath = await join(cacheDir, zipFileName)

    console.log(`📦 Cache dir: ${cacheDir}`)
    console.log(`📦 Zip file path: ${zipFilePath}`)

    // S'assurer que le dossier cache existe
    console.log(`📁 Creating cache directory...`)
    await invoke('create_dir_all', { path: cacheDir })

    // 3. Télécharger le jeu avec le nouveau système
    console.log(`⬇️ Starting download with new download manager...`)
    onProgress?.({
      step: 'downloading',
      message: i18n.t('game.install.downloading', { progress: 0 }),
    })

    // Démarrer le téléchargement avec le nouveau gestionnaire
    const downloadId = await invoke<string>('start_download', {
      url,
      filePath: zipFilePath,
    })

    console.log(`📥 Download started with ID: ${downloadId}`)

    // Attendre que le téléchargement soit terminé avec gestion des événements
    await new Promise<void>((resolve, reject) => {
      let completed = false

      const checkDownloadStatus = async () => {
        try {
          const downloadProgress = await invoke<any>('get_download_progress', { downloadId })

          if (!downloadProgress) {
            if (!completed) {
              reject(new Error('Download not found'))
            }

            return
          }

          const progressPercentage = Math.round(downloadProgress.percentage || 0)

          console.log(`📊 Download status: ${downloadProgress.status} (${progressPercentage}%)`)

          // Mettre à jour la progression
          if (downloadProgress.status === 'Downloading' || downloadProgress.status === 'Pending') {
            onProgress?.({
              step: 'downloading',
              progress: progressPercentage,
              message: i18n.t('game.install.downloading', { progress: progressPercentage }),
            })
          }

          if (downloadProgress.status === 'Completed') {
            if (!completed) {
              completed = true
              console.log(`✅ Download completed - waiting for file sync...`)

              // Attendre un court délai pour que le fichier soit complètement synchronisé sur le disque
              setTimeout(async () => {
                try {
                  // Vérifier que le fichier existe et a une taille > 0
                  const fileExists = await invoke<boolean>('check_file_exists', {
                    path: zipFilePath,
                  })

                  if (fileExists) {
                    const fileSize = await invoke<number>('get_file_size', { path: zipFilePath })

                    console.log(`📦 Downloaded file size: ${fileSize} bytes`)

                    if (fileSize > 0) {
                      resolve()
                    } else {
                      reject(new Error('Downloaded file is empty'))
                    }
                  } else {
                    reject(new Error('Downloaded file not found'))
                  }
                } catch (error) {
                  reject(new Error(`File verification failed: ${error}`))
                }
              }, 2000) // Attendre 2 secondes pour la synchronisation
            }
          } else if (downloadProgress.status === 'Failed') {
            if (!completed) {
              completed = true
              reject(new Error(downloadProgress.error || 'Download failed'))
            }
          } else if (downloadProgress.status === 'Cancelled') {
            if (!completed) {
              completed = true
              reject(new Error('Download was cancelled'))
            }
          } else {
            // Continuer à vérifier
            if (!completed) {
              setTimeout(checkDownloadStatus, 1000)
            }
          }
        } catch (error) {
          if (!completed) {
            completed = true
            reject(error)
          }
        }
      }

      // Commencer la vérification après un court délai
      setTimeout(checkDownloadStatus, 500)
    })

    // 4. Attendre un délai supplémentaire pour s'assurer que le fichier est complètement écrit
    console.log(`⏳ Waiting for file to be fully written to disk...`)
    await new Promise((resolve) => setTimeout(resolve, 3000)) // 3 secondes d'attente

    // 5. Vérifier l'intégrité
    console.log(`🔍 Verifying file integrity...`)
    onProgress?.({ step: 'verifying', message: i18n.t('game.install.verifying') })

    // Vérifier la taille avant la vérification d'intégrité
    try {
      const fileExists = await invoke<boolean>('check_file_exists', { path: zipFilePath })

      if (!fileExists) {
        throw new Error(`Downloaded file not found: ${zipFilePath}`)
      }

      const fileSize = await invoke<number>('get_file_size', { path: zipFilePath })

      console.log(`📦 File size before hash verification: ${fileSize} bytes`)

      if (fileSize === 0) {
        throw new Error('Downloaded file is empty')
      }
    } catch (error) {
      console.error(`❌ File verification before hash check failed:`, error)
      throw new Error(`File verification failed: ${error}`)
    }

    if (!(await checkFileHash(zipFilePath, hash))) {
      throw new Error("La vérification d'intégrité a échoué")
    }
    console.log(`✅ File integrity verified`)

    // 6. Extraire dans le dossier d'installation
    console.log(`📦 Extracting to: ${gamePaths.install}`)
    onProgress?.({ step: 'extracting', message: i18n.t('game.install.extracting') })

    // S'assurer que le dossier d'installation existe (double vérification)
    await invoke('create_dir_all', { path: gamePaths.install })

    // Extraction asynchrone avec progression
    await new Promise<void>((resolve, reject) => {
      extractZipAsync(zipFilePath, gamePaths.install, {
        onProgress: (progress) => {
          console.log(
            `📦 Extracting: ${progress.current_file} (${progress.files_processed}/${progress.total_files} - ${progress.percentage.toFixed(1)}%)`,
          )
          onProgress?.({
            step: 'extracting',
            progress: Math.round(progress.percentage),
            message: i18n.t('game.install.extracting_file', {
              file: progress.current_file,
              progress: Math.round(progress.percentage),
            }),
          })
        },
        onComplete: () => {
          console.log(`✅ Extraction completed`)
          resolve()
        },
        onError: (error) => {
          console.error(`❌ Extraction failed:`, error)
          reject(new Error(`Extraction failed: ${error}`))
        },
      }).catch(reject)
    })

    // 7. Sauvegarder la version
    console.log(`💾 Saving version file...`)
    onProgress?.({ step: 'installing', message: i18n.t('game.install.installing') })
    await invoke('write_text_file', {
      path: gamePaths.versionFile,
      content: version,
    })
    console.log(`✅ Version file saved: ${version}`)

    // 8. Vérifier la structure finale
    console.log(`🔍 Verifying final directory structure...`)
    const finalCheck = await checkGameDirectoryStructure(gameId)

    if (!finalCheck.isValid) {
      console.warn(`⚠️ Directory structure verification failed:`, finalCheck.missingDirectories)
      // Tenter de corriger les problèmes
      const repairResult = await initializeGameDirectoryStructure(gameId)

      if (!repairResult.success) {
        console.warn(`⚠️ Failed to repair directory structure: ${repairResult.errors.join(', ')}`)
      }
    }

    // 9. Nettoyer le fichier ZIP
    console.log(`🧹 Cleaning up...`)
    onProgress?.({ step: 'cleaning', message: i18n.t('game.install.cleaning') })
    try {
      await invoke('delete_file', { path: zipFilePath })
      console.log(`✅ Cleanup completed`)
    } catch (cleanupError) {
      console.warn(`⚠️ Cleanup failed (non-critical):`, cleanupError)
    }

    // 10. Terminé
    console.log(`🎉 Installation completed successfully!`)
    onProgress?.({
      step: 'complete',
      message: i18n.t('game.install.complete', { game: gameId, version }),
    })

    // 11. Envoyer une notification de succès
    try {
      await sendDownloadCompleteNotification(gameId, version)
    } catch (notificationError) {
      console.warn('Failed to send completion notification:', notificationError)
    }

    return {
      success: true,
      version,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    console.error('❌ Game installation failed:', errorMessage)
    console.error('📍 Error details:', error)
    console.error('📚 Stack trace:', errorStack)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Met à jour un jeu existant
 * Même processus que l'installation mais avec gestion de l'ancienne version
 */
export async function updateGame(
  gameId: string,
  owner: string,
  repo: string,
  onProgress?: (progress: GameInstallProgress) => void,
): Promise<GameInstallResult> {
  try {
    const gamePaths = await getGamePaths(gameId)

    // Sauvegarder l'ancienne version pour rollback si nécessaire
    let oldVersion = ''

    try {
      oldVersion = await invoke<string>('read_text_file', { path: gamePaths.versionFile })
    } catch {
      // Pas d'ancienne version
    }

    onProgress?.({ step: 'fetching', message: i18n.t('game.install.update_preparing') })

    // Utiliser la même logique que l'installation
    const result = await downloadAndInstallGame(gameId, owner, repo, onProgress)

    if (result.success && oldVersion) {
      console.log(`✅ Game updated from ${oldVersion} to ${result.version}`)
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur de mise à jour'

    console.error('Game update failed:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Fonction helper pour installer Lysandra spécifiquement
 */
export async function installLysandra(
  onProgress?: (progress: GameInstallProgress) => void,
): Promise<GameInstallResult> {
  const { owner, repo } = getGameRepository(GAME_IDS.LYSANDRA)

  return await downloadAndInstallGame(GAME_IDS.LYSANDRA, owner, repo, onProgress)
}

/**
 * Fonction helper pour mettre à jour Lysandra spécifiquement
 */
export async function updateLysandra(
  onProgress?: (progress: GameInstallProgress) => void,
): Promise<GameInstallResult> {
  const { owner, repo } = getGameRepository(GAME_IDS.LYSANDRA)

  return await updateGame(GAME_IDS.LYSANDRA, owner, repo, onProgress)
}
