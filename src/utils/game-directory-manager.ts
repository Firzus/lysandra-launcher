import { invoke } from '@tauri-apps/api/core'
import { getGamePaths, ensureGameDirectories } from './paths'

export type DirectoryStructureCheck = {
  isValid: boolean
  missingDirectories: string[]
  missingFiles: string[]
  errors: string[]
}

/**
 * Vérifie la structure complète des dossiers d'un jeu
 */
export async function checkGameDirectoryStructure(
  gameId: string,
): Promise<DirectoryStructureCheck> {
  const result: DirectoryStructureCheck = {
    isValid: true,
    missingDirectories: [],
    missingFiles: [],
    errors: [],
  }

  try {
    console.log(`🔍 Checking directory structure for: ${gameId}`)
    const gamePaths = await getGamePaths(gameId)

    // Vérifier tous les dossiers requis
    const requiredDirectories = [
      { path: gamePaths.root, name: 'root' },
      { path: gamePaths.install, name: 'install' },
      { path: gamePaths.saves, name: 'saves' },
      { path: gamePaths.logs, name: 'logs' },
      { path: gamePaths.config, name: 'config' },
    ]

    for (const dir of requiredDirectories) {
      try {
        const exists = await invoke<boolean>('check_directory_exists', { path: dir.path })
        if (!exists) {
          console.warn(`❌ Missing ${dir.name} directory: ${dir.path}`)
          result.missingDirectories.push(dir.path)
          result.isValid = false
        } else {
          console.log(`✅ Found ${dir.name} directory: ${dir.path}`)
        }
      } catch (error) {
        console.error(`❌ Error checking ${dir.name} directory: ${dir.path}`, error)
        result.errors.push(`Error checking ${dir.name}: ${error}`)
        result.isValid = false
      }
    }

    // Vérifier les fichiers critiques
    const requiredFiles = [{ path: gamePaths.versionFile, name: 'version file' }]

    for (const file of requiredFiles) {
      try {
        await invoke('read_text_file', { path: file.path })
        console.log(`✅ Found ${file.name}: ${file.path}`)
      } catch {
        console.warn(`❌ Missing ${file.name}: ${file.path}`)
        result.missingFiles.push(file.path)
        result.isValid = false
      }
    }

    if (result.isValid) {
      console.log(`✅ Directory structure is valid for: ${gameId}`)
    } else {
      console.warn(`⚠️ Directory structure issues found for: ${gameId}`)
    }

    return result
  } catch (error) {
    console.error(`❌ Failed to check directory structure for ${gameId}:`, error)
    return {
      isValid: false,
      missingDirectories: [],
      missingFiles: [],
      errors: [`Failed to check structure: ${error}`],
    }
  }
}

/**
 * Répare la structure des dossiers d'un jeu
 */
export async function repairGameDirectoryStructure(gameId: string): Promise<{
  success: boolean
  repairActions: string[]
  errors: string[]
}> {
  const repairActions: string[] = []
  const errors: string[] = []

  try {
    console.log(`🔧 Repairing directory structure for: ${gameId}`)

    // 1. Vérifier l'état actuel
    const check = await checkGameDirectoryStructure(gameId)

    if (check.isValid) {
      console.log(`✅ Directory structure is already valid for: ${gameId}`)
      return {
        success: true,
        repairActions: ['Directory structure was already valid'],
        errors: [],
      }
    }

    // 2. Créer la structure complète
    try {
      await ensureGameDirectories(gameId)
      repairActions.push('Recreated complete directory structure')
    } catch (error) {
      const errorMsg = `Failed to create directory structure: ${error}`
      console.error(`❌ ${errorMsg}`)
      errors.push(errorMsg)
    }

    // 3. Créer les fichiers manquants
    const gamePaths = await getGamePaths(gameId)

    // Créer le fichier version.txt s'il n'existe pas
    try {
      await invoke('read_text_file', { path: gamePaths.versionFile })
      console.log(`✅ Version file already exists: ${gamePaths.versionFile}`)
    } catch {
      try {
        await invoke('write_text_file', {
          path: gamePaths.versionFile,
          content: '',
        })
        repairActions.push('Created missing version file')
        console.log(`✅ Created version file: ${gamePaths.versionFile}`)
      } catch (error) {
        const errorMsg = `Failed to create version file: ${error}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // 4. Vérification finale
    const finalCheck = await checkGameDirectoryStructure(gameId)

    if (finalCheck.isValid) {
      console.log(`✅ Directory structure repair completed successfully for: ${gameId}`)
      return {
        success: true,
        repairActions,
        errors,
      }
    } else {
      console.error(`❌ Directory structure repair failed for: ${gameId}`)
      return {
        success: false,
        repairActions,
        errors: [...errors, ...finalCheck.errors],
      }
    }
  } catch (error) {
    const errorMsg = `Failed to repair directory structure: ${error}`
    console.error(`❌ ${errorMsg}`)
    return {
      success: false,
      repairActions,
      errors: [...errors, errorMsg],
    }
  }
}

/**
 * Initialise la structure complète des dossiers pour un jeu
 * Version robuste avec vérifications et retry
 */
export async function initializeGameDirectoryStructure(gameId: string): Promise<{
  success: boolean
  actions: string[]
  errors: string[]
}> {
  const actions: string[] = []
  const errors: string[] = []

  try {
    console.log(`📁 Initializing complete directory structure for: ${gameId}`)

    // 1. Vérifier l'état actuel
    const initialCheck = await checkGameDirectoryStructure(gameId)

    if (initialCheck.isValid) {
      console.log(`✅ Directory structure already exists and is valid for: ${gameId}`)
      return {
        success: true,
        actions: ['Directory structure was already valid'],
        errors: [],
      }
    }

    // 2. Créer la structure
    try {
      await ensureGameDirectories(gameId)
      actions.push('Created game directory structure')
    } catch (error) {
      const errorMsg = `Failed to create directories: ${error}`
      console.error(`❌ ${errorMsg}`)
      errors.push(errorMsg)
      return { success: false, actions, errors }
    }

    // 3. Créer les fichiers nécessaires
    const gamePaths = await getGamePaths(gameId)

    try {
      await invoke('read_text_file', { path: gamePaths.versionFile })
      console.log(`✅ Version file already exists: ${gamePaths.versionFile}`)
    } catch {
      try {
        await invoke('write_text_file', {
          path: gamePaths.versionFile,
          content: '',
        })
        actions.push('Created version file')
        console.log(`✅ Created version file: ${gamePaths.versionFile}`)
      } catch (error) {
        const errorMsg = `Failed to create version file: ${error}`
        console.error(`❌ ${errorMsg}`)
        errors.push(errorMsg)
      }
    }

    // 4. Vérification finale
    const finalCheck = await checkGameDirectoryStructure(gameId)

    if (finalCheck.isValid) {
      console.log(`✅ Directory structure initialization completed successfully for: ${gameId}`)
      return {
        success: true,
        actions,
        errors,
      }
    } else {
      console.error(`❌ Directory structure initialization failed for: ${gameId}`)
      return {
        success: false,
        actions,
        errors: [...errors, ...finalCheck.errors],
      }
    }
  } catch (error) {
    const errorMsg = `Failed to initialize directory structure: ${error}`
    console.error(`❌ ${errorMsg}`)
    return {
      success: false,
      actions,
      errors: [...errors, errorMsg],
    }
  }
}
