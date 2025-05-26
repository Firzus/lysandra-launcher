import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'

import i18n from './i18n'
import { getGamePaths, GAME_IDS } from './paths'
import { downloadOperation, fetchManifest } from './update-service'
import { checkFileHash } from './hash-verification'
import { extractZip } from './zip'
import { getGameRepository } from './game-data'

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

    // 3. Télécharger le jeu
    console.log(`⬇️ Starting download...`)
    onProgress?.({
      step: 'downloading',
      message: i18n.t('game.install.downloading', { game: gameId, version }),
    })
    await downloadOperation(version, url, cacheDir, zipFileName)
    console.log(`✅ Download completed`)

    // 4. Vérifier l'intégrité
    console.log(`🔍 Verifying file integrity...`)
    onProgress?.({ step: 'verifying', message: i18n.t('game.install.verifying') })
    if (!(await checkFileHash(zipFilePath, hash))) {
      throw new Error("La vérification d'intégrité a échoué")
    }
    console.log(`✅ File integrity verified`)

    // 5. Extraire dans le dossier d'installation
    console.log(`📦 Extracting to: ${gamePaths.install}`)
    onProgress?.({ step: 'extracting', message: i18n.t('game.install.extracting') })
    await invoke('create_dir_all', { path: gamePaths.install })
    await extractZip(zipFilePath, gamePaths.install)
    console.log(`✅ Extraction completed`)

    // 6. Sauvegarder la version
    console.log(`💾 Saving version file...`)
    onProgress?.({ step: 'installing', message: i18n.t('game.install.installing') })
    await invoke('write_text_file', {
      path: gamePaths.versionFile,
      content: version,
    })
    console.log(`✅ Version file saved: ${version}`)

    // 7. Nettoyer le fichier ZIP
    console.log(`🧹 Cleaning up...`)
    onProgress?.({ step: 'cleaning', message: i18n.t('game.install.cleaning') })
    try {
      await invoke('delete_file', { path: zipFilePath })
      console.log(`✅ Cleanup completed`)
    } catch (cleanupError) {
      console.warn(`⚠️ Cleanup failed (non-critical):`, cleanupError)
    }

    // 8. Terminé
    console.log(`🎉 Installation completed successfully!`)
    onProgress?.({
      step: 'complete',
      message: i18n.t('game.install.complete', { game: gameId, version }),
    })

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
