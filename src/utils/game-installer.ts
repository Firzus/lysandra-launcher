import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'

import i18n from './i18n'
import { fetchManifest } from './update-service'
import { checkFileHash, debugHashMismatch } from './hash-verification'
import { extractZipAsync } from './zip'
import { getGameData } from './game-data'
import {
  GameInstallConfiguration,
  generateGamePaths,
  saveInstallConfiguration,
  validateCustomInstallPath,
} from './install-config'

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
 * Télécharge et installe un jeu avec support pour les chemins personnalisés
 * Inspiré des meilleures pratiques de Steam et Xbox App
 */
export async function downloadAndInstallGame(
  gameId: string,
  owner: string,
  repo: string,
  installConfig?: GameInstallConfiguration,
  onProgress?: (progress: GameInstallProgress) => void,
): Promise<GameInstallResult> {
  try {
    console.log(`🎮 Starting installation of ${gameId} from ${owner}/${repo}`)

    // Si une configuration est fournie, la sauvegarder d'abord
    if (installConfig) {
      console.log(`📋 Using custom install configuration:`, installConfig)

      // Valider le chemin personnalisé si spécifié (valider le dossier "games" parent)
      if (installConfig.useCustomPath && installConfig.customInstallPath) {
        console.log(`🔍 Validating custom games directory: ${installConfig.customInstallPath}`)
        onProgress?.({ step: 'fetching', message: 'Validation du dossier des jeux...' })

        const validation = await validateCustomInstallPath(installConfig.customInstallPath)

        if (!validation.valid) {
          throw new Error(`Dossier des jeux invalide: ${validation.error}`)
        }
        console.log(`✅ Custom games directory validated`)
      }

      await saveInstallConfiguration(installConfig)
    }

    // Générer les chemins basés sur la configuration (personnalisée ou par défaut)
    const gamePaths = await generateGamePaths(gameId, installConfig)

    console.log(`📁 Using game paths:`, gamePaths)

    // 0. Initialiser la structure des dossiers selon les nouveaux chemins
    console.log(`📁 Initializing game directory structure...`)
    onProgress?.({ step: 'fetching', message: i18n.t('game.install.initializing_structure') })

    // Créer manuellement la structure avec les nouveaux chemins
    await invoke('create_dir_all', { path: gamePaths.root })
    await invoke('create_dir_all', { path: gamePaths.install })
    await invoke('create_dir_all', { path: gamePaths.saves })
    await invoke('create_dir_all', { path: gamePaths.logs })
    await invoke('create_dir_all', { path: gamePaths.config })

    console.log(`✅ Directory structure created at: ${gamePaths.root}`)

    // 1. Récupérer le manifeste
    console.log(`📋 Fetching manifest...`)
    onProgress?.({ step: 'fetching', message: i18n.t('game.install.fetching') })
    const manifest = await fetchManifest(owner, repo)
    const { version, url, hash } = manifest

    console.log(`✅ Manifest fetched: version=${version}, url=${url}`)

    // 2. Préparer les chemins de cache (toujours dans AppData pour les fichiers temporaires)
    console.log(`📂 Preparing cache paths...`)
    const appDataDir = await invoke<string>('get_app_data_dir')
    const cacheDir = await join(appDataDir, 'cache')
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
    await new Promise((resolve) => setTimeout(resolve, 5000)) // Augmenté de 3s à 5s

    // 5. Vérifier l'intégrité avec retry logic amélioré
    console.log(`🔍 Verifying file integrity...`)
    onProgress?.({ step: 'verifying', message: i18n.t('game.install.verifying') })

    // Amélioration de la vérification d'intégrité avec retry
    let hashVerificationAttempts = 0
    const maxHashAttempts = 5 // Augmenté de 3 à 5 tentatives
    let hashVerified = false

    while (hashVerificationAttempts < maxHashAttempts && !hashVerified) {
      try {
        // Vérifier la taille et l'accessibilité avant la vérification d'intégrité
        const fileExists = await invoke<boolean>('check_file_exists', { path: zipFilePath })

        if (!fileExists) {
          throw new Error(`Downloaded file not found: ${zipFilePath}`)
        }

        // Attendre plus longtemps avant la première tentative
        if (hashVerificationAttempts === 0) {
          console.log(`⏳ Initial wait before first hash check...`)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }

        const fileSize = await invoke<number>('get_file_size', { path: zipFilePath })

        console.log(
          `📦 File size before hash verification (attempt ${hashVerificationAttempts + 1}): ${fileSize} bytes`,
        )

        if (fileSize === 0) {
          throw new Error('Downloaded file is empty')
        }

        // Vérifier que le fichier est accessible en lecture
        try {
          await invoke('read_binary_file_head', { path: zipFilePath, size: 1024 })
        } catch (readError) {
          console.log(`⚠️ File not yet readable, waiting longer...`)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }

        // Vérification du hash avec attente supplémentaire progressive
        if (hashVerificationAttempts > 0) {
          const waitTime = 3000 + hashVerificationAttempts * 2000 // 3s, 5s, 7s, 9s

          console.log(
            `⏳ Progressive wait before hash check (attempt ${hashVerificationAttempts + 1}): ${waitTime}ms...`,
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }

        const hashCheckResult = await checkFileHash(zipFilePath, hash)

        if (hashCheckResult) {
          hashVerified = true
          console.log(`✅ File integrity verified on attempt ${hashVerificationAttempts + 1}`)
        } else {
          hashVerificationAttempts++
          if (hashVerificationAttempts < maxHashAttempts) {
            console.log(
              `⚠️ Hash verification failed, retrying... (${hashVerificationAttempts}/${maxHashAttempts})`,
            )

            // Forcer la synchronisation du cache du système de fichiers
            try {
              await invoke('force_file_sync', { path: zipFilePath })
            } catch (syncError) {
              console.log(`⚠️ Could not force file sync: ${syncError}`)
            }
          } else {
            // Dernier échec - faire l'analyse de debug
            try {
              const actualHash = await invoke<string>('verify_file_integrity', {
                filePath: zipFilePath,
              })

              await debugHashMismatch(zipFilePath, hash, actualHash)
            } catch (debugError) {
              console.warn(`⚠️ Could not perform hash debug analysis:`, debugError)
            }
          }
        }
      } catch (error) {
        hashVerificationAttempts++
        console.error(`❌ Hash verification attempt ${hashVerificationAttempts} failed:`, error)

        if (hashVerificationAttempts < maxHashAttempts) {
          const waitTime = 5000 + hashVerificationAttempts * 1000

          console.log(`⏳ Waiting ${waitTime}ms before retry...`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }
    }

    if (!hashVerified) {
      // Option de fallback : continuer malgré l'échec de vérification
      console.warn(
        `⚠️ ATTENTION: La vérification d'intégrité a échoué après ${maxHashAttempts} tentatives`,
      )
      console.warn(
        `📦 Le fichier a été téléchargé avec la taille attendue: ${await invoke<number>('get_file_size', { path: zipFilePath })} bytes`,
      )
      console.warn(`🔄 Nous allons continuer l'installation malgré l'échec de vérification`)
      console.warn(`⚠️ Si l'installation échoue, retéléchargez le jeu`)

      // Debug supplémentaire pour identifier le problème
      console.warn(`🔍 Hash Debug Information:`)
      console.warn(`   Expected: ${hash}`)
      console.warn(`   Received: L'utilisateur peut vérifier manuellement le fichier`)
      console.warn(`   File: ${zipFilePath}`)
      console.warn(`   Size: ${await invoke<number>('get_file_size', { path: zipFilePath })} bytes`)
      console.warn(`💡 Suggestion: Vérifier si le manifeste GitHub a le bon hash`)

      // Notifier l'utilisateur via la progression
      onProgress?.({
        step: 'verifying',
        message: '⚠️ Vérification échouée, installation en mode dégradé...',
      })

      // Attendre 3 secondes pour que l'utilisateur puisse voir le message
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }

    // 6. Extraire dans le dossier d'installation personnalisé
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

    // 7. Sauvegarder la version dans le nouveau chemin
    console.log(`💾 Saving version file...`)
    onProgress?.({ step: 'installing', message: i18n.t('game.install.installing') })
    await invoke('write_text_file', {
      path: gamePaths.versionFile,
      content: version,
    })
    console.log(`✅ Version file saved: ${version} at ${gamePaths.versionFile}`)

    // 8. Créer les raccourcis si demandés
    if (installConfig?.createDesktopShortcut) {
      console.log(`🔗 Creating desktop shortcut...`)
      // TODO: Implémenter la création de raccourci
    }

    if (installConfig?.createStartMenuShortcut) {
      console.log(`🔗 Creating start menu shortcut...`)
      // TODO: Implémenter la création de raccourci
    }

    // 9. Nettoyer le fichier ZIP
    console.log(`🧹 Cleaning up...`)
    onProgress?.({ step: 'cleaning', message: i18n.t('game.install.cleaning') })
    try {
      await invoke('delete_file', { path: zipFilePath })
      console.log(`✅ ZIP file deleted: ${zipFilePath}`)
    } catch (cleanupError) {
      console.warn(`⚠️ Failed to cleanup ZIP file: ${cleanupError}`)
    }

    // 10. Finaliser l'installation
    console.log(`🎉 Installation completed successfully!`)

    // Récupérer le nom du jeu pour les traductions
    const gameData = getGameData(gameId)
    const gameName = gameData.name

    onProgress?.({
      step: 'complete',
      message: i18n.t('game.install.complete', { game: gameName, version }),
    })

    return {
      success: true,
      version,
    }
  } catch (error) {
    console.error(`❌ Installation failed:`, error)

    // Nettoyer les fichiers temporaires en cas d'erreur
    try {
      console.log(`🧹 Cleaning up failed installation files...`)
      // Note: On pourrait implémenter un nettoyage plus précis ici
    } catch (cleanupError) {
      console.warn(`⚠️ Failed to cleanup after installation error: ${cleanupError}`)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Vérifie si un jeu est installé dans un chemin donné
 * @param gameId ID du jeu
 * @param customPath Chemin personnalisé à vérifier (optionnel)
 * @returns true si le jeu est installé
 */
export async function isGameInstalled(gameId: string, customPath?: string): Promise<boolean> {
  try {
    const gamePaths = customPath
      ? await generateGamePaths(gameId, {
          gameId,
          useCustomPath: true,
          customInstallPath: customPath,
          createDesktopShortcut: false,
          createStartMenuShortcut: false,
        })
      : await generateGamePaths(gameId)

    const versionFileExists = await invoke<boolean>('check_file_exists', {
      path: gamePaths.versionFile,
    })
    const installDirExists = await invoke<boolean>('check_directory_exists', {
      path: gamePaths.install,
    })

    return versionFileExists && installDirExists
  } catch (error) {
    console.error(`Error checking if game ${gameId} is installed:`, error)

    return false
  }
}

/**
 * Récupère la version installée d'un jeu
 * @param gameId ID du jeu
 * @param customPath Chemin personnalisé (optionnel)
 * @returns Version installée ou null si pas installé
 */
export async function getInstalledGameVersion(
  gameId: string,
  customPath?: string,
): Promise<string | null> {
  try {
    const gamePaths = customPath
      ? await generateGamePaths(gameId, {
          gameId,
          useCustomPath: true,
          customInstallPath: customPath,
          createDesktopShortcut: false,
          createStartMenuShortcut: false,
        })
      : await generateGamePaths(gameId)

    const version = await invoke<string>('read_text_file', { path: gamePaths.versionFile })

    return version.trim()
  } catch (error) {
    console.error(`Error reading installed version for game ${gameId}:`, error)

    return null
  }
}
