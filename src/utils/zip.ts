import { invoke } from '@tauri-apps/api/core'

export async function extractZip(filePath: string, extractTo: string) {
  invoke('extract_zip_file', {
    filePath,
    extractTo,
  })
}
