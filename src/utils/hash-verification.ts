import { invoke } from '@tauri-apps/api/core'

/**
 * Computes and returns the SHA-256 hash of a file
 * @param filePath The path to the file to verify
 * @returns A promise that resolves to the SHA-256 hash as a hexadecimal string
 */
export async function verifyFileIntegrity(filePath: string): Promise<string> {
  try {
    return await invoke<string>('verify_file_integrity', { filePath })
  } catch (error) {
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
    const actualHash = await verifyFileIntegrity(filePath)

    return actualHash.toLowerCase() === expectedHash.toLowerCase()
  } catch (error) {
    throw new Error(`Failed to verify file hash: ${error}`)
  }
}
