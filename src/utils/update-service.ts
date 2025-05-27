import { download } from '@tauri-apps/plugin-upload'
import { invoke } from '@tauri-apps/api/core'

import { getPlatform } from '@/hooks/useGetPlatform'

export async function fetchManifest(owner: string, repo: string) {
  try {
    const latestUrl = `https://github.com/${owner}/${repo}/releases/latest/download/latest.json`

    console.log(`📋 Fetching manifest from: ${latestUrl}`)

    const manifestStr = await invoke<string>('fetch_manifest_from_github', { url: latestUrl })

    console.log(`📋 Raw manifest:`, manifestStr)

    const manifest = JSON.parse(manifestStr)

    console.log(`📋 Parsed manifest:`, manifest)

    const platform = getPlatform()

    console.log(`🖥️ Current platform: ${platform}`)

    const platformZip = manifest.zip[platform]

    if (!platformZip) {
      console.error(`❌ No ZIP available for platform: ${platform}`)
      console.error(`📋 Available platforms:`, Object.keys(manifest.zip))
      throw new Error(`No ZIP available for platform: ${platform}`)
    }

    console.log(`✅ Platform ZIP found:`, platformZip)

    return {
      version: manifest.version,
      url: platformZip.url,
      hash: platformZip.sha256,
    }
  } catch (error) {
    console.error(`❌ Failed to fetch manifest:`, error)
    throw new Error(
      `Failed to fetch manifest: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function downloadOperation(
  version: string,
  url: string,
  localPath: string,
  fileName?: string,
) {
  try {
    const finalFileName = fileName || `game-${version}.zip`
    const fullPath = `${localPath}/${finalFileName}`

    console.log(`📥 Starting download: ${url} -> ${fullPath}`)

    await download(url, fullPath, ({ progress, total }) => {
      // Calcul plus précis du pourcentage basé sur les bytes
      const progressPercentage = total > 0 ? Math.round((progress * 100) / total) : 0

      invoke('handle_download_progress', {
        progressPercentage,
        progress,
        total,
        version,
      })
    })

    console.log(`✅ Download completed: ${fullPath}`)
    invoke('handle_download_complete', { version })
  } catch (error) {
    console.error(`❌ Download failed:`, error)
    throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function isGameUpdate(owner: string, repo: string): Promise<boolean> {
  try {
    // Get the current installed version
    const currentVersion = await invoke<string>('read_version_file').catch(() => {
      throw new Error('Version file not found')
    })

    // Get the latest version from the manifest
    const manifest = await fetchManifest(owner, repo)

    // Inform the application about the version check (keeping existing functionality)
    await invoke('handle_version_check', { version: currentVersion || '0.0.0' })

    // Compare versions to determine if update is needed
    return currentVersion !== manifest.version
  } catch (error) {
    // Log error but don't crash - just indicate no update
    console.error('Failed to check for game updates:', error)

    return false
  }
}
