import { download } from '@tauri-apps/plugin-upload'
import { invoke } from '@tauri-apps/api/core'
import { getPlatform } from '@/hooks/use-get-platform'

export async function fetchManifest(owner: string, repo: string) {
  const latestUrl = `https://github.com/${owner}/${repo}/releases/latest/download/latest.json`

  const manifestStr = await invoke<string>('fetch_manifest_from_github', { url: latestUrl })
  const manifest = JSON.parse(manifestStr)

  const platformZip = manifest.zip[getPlatform()]

  if (!platformZip) {
    throw new Error(`No ZIP available for platform: ${getPlatform()}`)
  }

  return {
    version: manifest.version,
    url: platformZip.url,
    hash: platformZip.sha256,
  }
}

export async function downloadOperation(version: string, url: string, localPath: string) {
  await download(url, `${localPath}/game-${version}.zip`, ({ progress, total }) => {
    const progressPercentage = Math.floor((progress * 100) / total)

    invoke('handle_download_progress', {
      progressPercentage,
      progress,
      total,
      version,
    })
  })

  invoke('handle_download_complete', { version })
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
