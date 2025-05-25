import { invoke } from '@tauri-apps/api/core'

export async function extractZip(filePath: string, extractTo: string): Promise<void> {
  return await invoke('extract_zip_file', {
    filePath,
    extractTo,
  })
}
