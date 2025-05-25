import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'

import i18n from './i18n'
import { getGamePaths, GAME_IDS } from './paths'
import { downloadOperation, fetchManifest } from './update-service'
import { checkFileHash } from './hash-verification'
import { extractZip } from './zip'

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
    const gamePaths = await getGamePaths(gameId)

    // 1. Récupérer le manifeste
    onProgress?.({ step: 'fetching', message: i18n.t('game.install.fetching') })
    const manifest = await fetchManifest(owner, repo)
    const { version, url, hash } = manifest

    // 2. Préparer les chemins
    const cacheDir = await join(await gamePaths.root, '..', '..', 'cache') // Dossier cache du launcher
    const zipFileName = `${gameId}-${version}.zip`
    const zipFilePath = await join(cacheDir, zipFileName)

    // S'assurer que le dossier cache existe
    await invoke('create_dir_all', { path: cacheDir })

    // 3. Télécharger le jeu
    onProgress?.({
      step: 'downloading',
      message: i18n.t('game.install.downloading', { game: gameId, version }),
    })
    await downloadOperation(version, url, cacheDir, zipFileName)

    // 4. Vérifier l'intégrité
    onProgress?.({ step: 'verifying', message: i18n.t('game.install.verifying') })
    if (!(await checkFileHash(zipFilePath, hash))) {
      throw new Error("La vérification d'intégrité a échoué")
    }

    // 5. Extraire dans le dossier d'installation
    onProgress?.({ step: 'extracting', message: i18n.t('game.install.extracting') })
    await extractZip(zipFilePath, gamePaths.install)

    // 6. Sauvegarder la version
    onProgress?.({ step: 'installing', message: i18n.t('game.install.installing') })
    await invoke('write_text_file', {
      path: gamePaths.versionFile,
      content: version,
    })

    // 7. Nettoyer le fichier ZIP
    onProgress?.({ step: 'cleaning', message: i18n.t('game.install.cleaning') })
    await invoke('delete_file', { path: zipFilePath })

    // 8. Terminé
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

    console.error('Game installation failed:', errorMessage)

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
  return await downloadAndInstallGame(GAME_IDS.LYSANDRA, 'Firzus', 'lysandra-vslice', onProgress)
}

/**
 * Fonction helper pour mettre à jour Lysandra spécifiquement
 */
export async function updateLysandra(
  onProgress?: (progress: GameInstallProgress) => void,
): Promise<GameInstallResult> {
  return await updateGame(GAME_IDS.LYSANDRA, 'Firzus', 'lysandra-vslice', onProgress)
}
