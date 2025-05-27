import {
  checkGameDirectoryStructure,
  initializeGameDirectoryStructure,
} from './game-directory-manager'
import { GAME_IDS } from './paths'

/**
 * Script de test pour vérifier la création de la structure des dossiers
 */
export async function testDirectoryStructure(): Promise<void> {
  console.log('🧪 Testing directory structure creation...')

  try {
    const gameId = GAME_IDS.LYSANDRA

    // 1. Vérifier l'état initial
    console.log('\n1. Checking initial state...')
    const initialCheck = await checkGameDirectoryStructure(gameId)

    console.log('Initial check result:', initialCheck)

    // 2. Initialiser la structure
    console.log('\n2. Initializing directory structure...')
    const initResult = await initializeGameDirectoryStructure(gameId)

    console.log('Initialization result:', initResult)

    // 3. Vérifier l'état final
    console.log('\n3. Checking final state...')
    const finalCheck = await checkGameDirectoryStructure(gameId)

    console.log('Final check result:', finalCheck)

    // 4. Résumé
    console.log('\n📊 Test Summary:')
    console.log(`✅ Initialization successful: ${initResult.success}`)
    console.log(`✅ Final structure valid: ${finalCheck.isValid}`)

    if (finalCheck.isValid) {
      console.log('🎉 Directory structure test PASSED!')
    } else {
      console.log('❌ Directory structure test FAILED!')
      console.log('Missing directories:', finalCheck.missingDirectories)
      console.log('Missing files:', finalCheck.missingFiles)
      console.log('Errors:', finalCheck.errors)
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Fonction pour tester depuis la console du navigateur
if (typeof window !== 'undefined') {
  ;(window as any).testDirectoryStructure = testDirectoryStructure
}
