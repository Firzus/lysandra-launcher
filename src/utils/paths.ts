import { invoke } from '@tauri-apps/api/core'
import { join, appLocalDataDir } from '@tauri-apps/api/path'

/**
 * Structure des chemins du launcher
 */
export type LauncherPaths = {
  root: string // AppLocalData/
  games: string // AppLocalData/games/
  config: string // AppLocalData/config/
  cache: string // AppLocalData/cache/
  logs: string // AppLocalData/logs/
}

/**
 * Structure des chemins pour un jeu spécifique
 */
export type GamePaths = {
  root: string // AppLocalData/games/JeuA/
  install: string // AppLocalData/games/JeuA/install/
  saves: string // AppLocalData/games/JeuA/saves/
  logs: string // AppLocalData/games/JeuA/logs/
  config: string // AppLocalData/games/JeuA/config/
  versionFile: string // AppLocalData/games/JeuA/config/version.txt
}

/**
 * Obtient le dossier racine du launcher dans AppLocalData
 */
export async function getLauncherRootPath(): Promise<string> {
  // Utilise appLocalDataDir() qui crée automatiquement un dossier spécifique à l'app
  return await appLocalDataDir()
}

/**
 * Génère tous les chemins du launcher
 */
export async function getLauncherPaths(): Promise<LauncherPaths> {
  const root = await getLauncherRootPath()

  return {
    root,
    games: await join(root, 'games'),
    config: await join(root, 'config'),
    cache: await join(root, 'cache'),
    logs: await join(root, 'logs'),
  }
}

/**
 * Génère tous les chemins pour un jeu spécifique
 */
export async function getGamePaths(gameId: string): Promise<GamePaths> {
  const launcherPaths = await getLauncherPaths()
  const gameRoot = await join(launcherPaths.games, gameId)

  return {
    root: gameRoot,
    install: await join(gameRoot, 'install'),
    saves: await join(gameRoot, 'saves'),
    logs: await join(gameRoot, 'logs'),
    config: await join(gameRoot, 'config'),
    versionFile: await join(gameRoot, 'config', 'version.txt'),
  }
}

/**
 * Crée la structure de dossiers du launcher si elle n'existe pas
 */
export async function ensureLauncherDirectories(): Promise<void> {
  const paths = await getLauncherPaths()

  // Créer tous les dossiers principaux
  await invoke('create_dir_all', { path: paths.games })
  await invoke('create_dir_all', { path: paths.config })
  await invoke('create_dir_all', { path: paths.cache })
  await invoke('create_dir_all', { path: paths.logs })
}

/**
 * Crée la structure de dossiers pour un jeu spécifique
 */
export async function ensureGameDirectories(gameId: string): Promise<void> {
  const paths = await getGamePaths(gameId)

  // Créer tous les dossiers du jeu
  await invoke('create_dir_all', { path: paths.install })
  await invoke('create_dir_all', { path: paths.saves })
  await invoke('create_dir_all', { path: paths.logs })
  await invoke('create_dir_all', { path: paths.config })
}

/**
 * Constantes pour les IDs des jeux
 */
export const GAME_IDS = {
  LYSANDRA: 'lysandra-vslice',
} as const

export type GameId = (typeof GAME_IDS)[keyof typeof GAME_IDS]
