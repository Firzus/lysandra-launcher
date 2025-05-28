import { invoke } from '@tauri-apps/api/core'

/**
 * Computes and returns the SHA-256 hash of a file
 * @param filePath The path to the file to verify
 * @returns A promise that resolves to the SHA-256 hash as a hexadecimal string
 */
export async function verifyFileIntegrity(filePath: string): Promise<string> {
  try {
    console.log(`🔍 Computing SHA-256 hash for: ${filePath}`)
    const hash = await invoke<string>('verify_file_integrity', { filePath })
    console.log(`✅ Hash computed successfully: ${hash.substring(0, 16)}...`)
    return hash
  } catch (error) {
    console.error(`❌ Failed to compute hash for ${filePath}:`, error)
    throw new Error(`Failed to compute hash: ${error}`)
  }
}

/**
 * Verifies if a file matches an expected hash
 * @param filePath The path to the file to verify
 * @param expectedHash The expected SHA-256 hash
 * @returns A promise that resolves to true if the hash matches, false otherwise
 */
export async function checkFileHash(filePath: string, expectedHash: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifying file hash for: ${filePath}`)
    console.log(`📋 Expected hash: ${expectedHash}`)

    const actualHash = await verifyFileIntegrity(filePath)
    console.log(`📋 Actual hash:   ${actualHash}`)

    const matches = actualHash.toLowerCase() === expectedHash.toLowerCase()

    if (matches) {
      console.log(`✅ Hash verification successful`)
    } else {
      console.log(`❌ Hash verification failed`)
      console.log(`📊 Expected: ${expectedHash.toLowerCase()}`)
      console.log(`📊 Actual:   ${actualHash.toLowerCase()}`)
    }

    return matches
  } catch (error) {
    console.error(`❌ Failed to verify file hash for ${filePath}:`, error)
    throw new Error(`Failed to verify file hash: ${error}`)
  }
}

/**
 * Teste si un fichier est accessible en lecture avant la vérification de hash
 * @param filePath Le chemin du fichier à tester
 * @returns true si le fichier est accessible
 */
export async function testFileAccessibility(filePath: string): Promise<boolean> {
  try {
    console.log(`🔍 Testing file accessibility: ${filePath}`)

    // Tenter de lire les premiers 1024 bytes
    await invoke<number[]>('read_binary_file_head', { path: filePath, size: 1024 })

    console.log(`✅ File is accessible for reading`)
    return true
  } catch (error) {
    console.error(`❌ File not accessible for reading:`, error)
    return false
  }
}

/**
 * Fonction de debug pour analyser un échec de vérification de hash
 */
export async function debugHashMismatch(
  filePath: string,
  expectedHash: string,
  actualHash: string,
): Promise<void> {
  console.group('🔍 Hash Verification Debug Analysis')

  try {
    // Informations sur le fichier
    const fileSize = await invoke<number>('get_file_size', { path: filePath })
    console.log(`📁 File: ${filePath}`)
    console.log(`📦 Size: ${fileSize} bytes (${Math.round(fileSize / (1024 * 1024))} MB)`)

    // Comparaison des hashs
    console.log(`🎯 Expected Hash: ${expectedHash.toLowerCase()}`)
    console.log(`❌ Actual Hash:   ${actualHash.toLowerCase()}`)

    // Analyse des différences
    if (expectedHash.toLowerCase() === actualHash.toLowerCase()) {
      console.log(`✅ Hashs are identical (case difference only)`)
    } else {
      console.log(`❌ Hashs are completely different`)

      // Vérifier les premiers caractères
      const expectedPrefix = expectedHash.substring(0, 16).toLowerCase()
      const actualPrefix = actualHash.substring(0, 16).toLowerCase()

      if (expectedPrefix === actualPrefix) {
        console.log(`🔄 First 16 chars match - possible partial corruption`)
      } else {
        console.log(`💥 Complete hash mismatch - likely different file`)
      }
    }

    // Suggestions
    console.log(`💡 Possible causes:`)
    console.log(`   1. Manifest has incorrect hash (GitHub release updated)`)
    console.log(`   2. File corrupted during download`)
    console.log(`   3. Network proxy/cache interference`)
    console.log(`   4. Antivirus modification`)

    console.log(`🔧 Recommended actions:`)
    console.log(`   1. Check GitHub release page for updated hash`)
    console.log(`   2. Try downloading from different network`)
    console.log(`   3. Temporarily disable antivirus`)
    console.log(`   4. Clear download cache and retry`)
  } catch (error) {
    console.error(`❌ Debug analysis failed:`, error)
  }

  console.groupEnd()
}
