import type {
  GameSearchResult,
  ValidationResult,
  AutoDetectionOptions,
  GameInstallation,
} from '../types/game-detection'

import { invoke } from '@tauri-apps/api/core'

/**
 * Recherche automatiquement les installations de jeux sur le système
 */
export async function searchInstalledGames(
  options: AutoDetectionOptions = {},
): Promise<GameSearchResult> {
  try {
    console.log('🔍 Starting automatic game detection...', options)

    const result = await invoke<GameSearchResult>('search_installed_games', {
      gameName: options.game_name,
      customPaths: options.custom_paths,
    })

    // Filtrer par score de confiance minimum si spécifié
    if (options.min_confidence !== undefined) {
      result.installations = result.installations.filter(
        (installation) => installation.confidence >= options.min_confidence!,
      )
    }

    // Limiter le nombre de résultats si spécifié
    if (options.max_results !== undefined) {
      result.installations = result.installations.slice(0, options.max_results)
    }

    console.log(
      `✅ Found ${result.installations.length} game installations in ${result.duration_ms}ms`,
    )

    return result
  } catch (error) {
    console.error('❌ Failed to search for installed games:', error)
    throw new Error(`Game detection failed: ${error}`)
  }
}

/**
 * Valide qu'une installation de jeu est correcte
 */
export async function validateGameInstallation(path: string): Promise<ValidationResult> {
  try {
    console.log('🔍 Validating game installation at:', path)

    const result = await invoke<ValidationResult>('validate_game_installation', {
      path,
    })

    console.log('✅ Validation completed:', result)

    return result
  } catch (error) {
    console.error('❌ Failed to validate game installation:', error)
    throw new Error(`Validation failed: ${error}`)
  }
}

/**
 * Récupère la liste des répertoires communs de jeux
 */
export async function getCommonGameDirectories(): Promise<string[]> {
  try {
    console.log('📂 Getting common game directories...')

    const directories = await invoke<string[]>('get_common_game_directories')

    console.log(`📂 Found ${directories.length} common game directories`)

    return directories
  } catch (error) {
    console.error('❌ Failed to get common game directories:', error)
    throw new Error(`Failed to get directories: ${error}`)
  }
}

/**
 * Recherche spécifiquement un jeu par nom
 */
export async function searchGameByName(
  gameName: string,
  customPaths?: string[],
): Promise<GameInstallation[]> {
  const options: AutoDetectionOptions = {
    game_name: gameName,
    custom_paths: customPaths,
    min_confidence: 50, // Score minimum pour être considéré comme valide
  }

  const result = await searchInstalledGames(options)

  return result.installations
}

/**
 * Trouve la meilleure installation parmi plusieurs options
 */
export function getBestInstallation(installations: GameInstallation[]): GameInstallation | null {
  if (installations.length === 0) {
    return null
  }

  // Trier par score de confiance (décroissant)
  const sorted = installations.sort((a, b) => b.confidence - a.confidence)

  return sorted[0]
}

/**
 * Filtre les installations par launcher
 */
export function filterByLauncher(
  installations: GameInstallation[],
  launcher: string,
): GameInstallation[] {
  return installations.filter(
    (installation) => installation.launcher.toLowerCase() === launcher.toLowerCase(),
  )
}

/**
 * Formate le nom du launcher pour l'affichage
 * Support étendu pour plus de launchers
 */
export function formatLauncherName(launcher: string): string {
  const launcherMap: Record<string, string> = {
    steam: 'Steam',
    'epic games': 'Epic Games',
    gog: 'GOG',
    origin: 'Origin',
    'ubisoft connect': 'Ubisoft Connect',
    'battle.net': 'Battle.net',
    'microsoft store': 'Microsoft Store',
    unknown: 'Inconnu',
  }

  return launcherMap[launcher.toLowerCase()] || launcher
}

/**
 * Génère une description courte d'une installation
 */
export function getInstallationDescription(installation: GameInstallation): string {
  const launcher = formatLauncherName(installation.launcher)
  const folderName = installation.metadata.folder_name || 'Dossier inconnu'

  return `${folderName} (${launcher}, ${installation.confidence}% confiance)`
}

/**
 * Vérifie si une installation semble être celle recherchée
 */
export function isLikelyTargetGame(
  installation: GameInstallation,
  targetGameName: string,
): boolean {
  const folderName = installation.metadata.folder_name?.toLowerCase() || ''
  const targetName = targetGameName.toLowerCase()

  // Vérifier si le nom du dossier contient des mots-clés du jeu recherché
  const keywords = targetName.split(/\s+/)
  const matchingKeywords = keywords.filter((keyword) => folderName.includes(keyword))

  // Considérer comme probable si au moins 50% des mots-clés correspondent
  const matchRatio = matchingKeywords.length / keywords.length

  return matchRatio >= 0.5 && installation.confidence >= 60
}

/**
 * Obtient la couleur du badge de confiance selon le score
 */
export function getConfidenceColor(
  confidence: number,
): 'success' | 'warning' | 'danger' | 'default' {
  if (confidence >= 80) return 'success'
  if (confidence >= 60) return 'warning'
  if (confidence >= 40) return 'danger'

  return 'default'
}

/**
 * Obtient l'icône du launcher selon le nom
 */
export function getLauncherIcon(launcher: string): string {
  const iconMap: Record<string, string> = {
    steam: '🎮',
    'epic games': '🎯',
    gog: '🏆',
    origin: '🎲',
    'ubisoft connect': '🎪',
    'battle.net': '⚔️',
    'microsoft store': '🏪',
    unknown: '❓',
  }

  return iconMap[launcher.toLowerCase()] || '📁'
}

/**
 * Formate la taille d'un dossier en unités lisibles
 */
export function formatDirectorySize(sizeInBytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = sizeInBytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Obtient des statistiques sur les installations trouvées
 */
export function getInstallationStats(installations: GameInstallation[]): {
  total: number
  byLauncher: Record<string, number>
  averageConfidence: number
  highConfidenceCount: number
} {
  const byLauncher: Record<string, number> = {}
  let totalConfidence = 0
  let highConfidenceCount = 0

  installations.forEach((installation) => {
    const launcher = formatLauncherName(installation.launcher)

    byLauncher[launcher] = (byLauncher[launcher] || 0) + 1
    totalConfidence += installation.confidence

    if (installation.confidence >= 70) {
      highConfidenceCount++
    }
  })

  return {
    total: installations.length,
    byLauncher,
    averageConfidence: installations.length > 0 ? totalConfidence / installations.length : 0,
    highConfidenceCount,
  }
}

/**
 * Groupe les installations par launcher
 */
export function groupInstallationsByLauncher(
  installations: GameInstallation[],
): Record<string, GameInstallation[]> {
  const grouped: Record<string, GameInstallation[]> = {}

  installations.forEach((installation) => {
    const launcher = formatLauncherName(installation.launcher)

    if (!grouped[launcher]) {
      grouped[launcher] = []
    }
    grouped[launcher].push(installation)
  })

  // Trier chaque groupe par score de confiance
  Object.keys(grouped).forEach((launcher) => {
    grouped[launcher].sort((a, b) => b.confidence - a.confidence)
  })

  return grouped
}

/**
 * Valide plusieurs installations en parallèle
 */
export async function validateMultipleInstallations(
  installations: GameInstallation[],
): Promise<Map<string, ValidationResult>> {
  const validationPromises = installations.map(async (installation) => {
    try {
      const result = await validateGameInstallation(installation.path)

      return { path: installation.path, result }
    } catch (error) {
      console.error(`Failed to validate ${installation.path}:`, error)

      return {
        path: installation.path,
        result: {
          is_valid: false,
          executable_exists: false,
          path_accessible: false,
          is_game_directory: false,
        } as ValidationResult,
      }
    }
  })

  const validationResults = await Promise.all(validationPromises)
  const resultMap = new Map<string, ValidationResult>()

  validationResults.forEach(({ path, result }) => {
    resultMap.set(path, result)
  })

  return resultMap
}

/**
 * Recherche avec options avancées et filtrage intelligent
 */
export async function advancedGameSearch(options: {
  gameName?: string
  customPaths?: string[]
  minConfidence?: number
  maxResults?: number
  launchers?: string[]
  validateResults?: boolean
}): Promise<{
  installations: GameInstallation[]
  validations?: Map<string, ValidationResult>
  stats: ReturnType<typeof getInstallationStats>
  duration: number
}> {
  const startTime = Date.now()

  // Recherche initiale
  const searchResult = await searchInstalledGames({
    game_name: options.gameName,
    custom_paths: options.customPaths,
    min_confidence: options.minConfidence || 30,
    max_results: options.maxResults,
  })

  let installations = searchResult.installations

  // Filtrer par launchers si spécifié
  if (options.launchers && options.launchers.length > 0) {
    installations = installations.filter((installation) =>
      options.launchers!.some((launcher) =>
        installation.launcher.toLowerCase().includes(launcher.toLowerCase()),
      ),
    )
  }

  // Validation optionnelle
  let validations: Map<string, ValidationResult> | undefined

  if (options.validateResults) {
    validations = await validateMultipleInstallations(installations)
  }

  const stats = getInstallationStats(installations)
  const duration = Date.now() - startTime

  return {
    installations,
    validations,
    stats,
    duration,
  }
}
