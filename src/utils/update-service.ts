import { download } from '@tauri-apps/plugin-upload'
import { invoke } from '@tauri-apps/api/core'

export async function fetchManifest(owner: string, repo: string) {
  const latestUrl = `https://github.com/${owner}/${repo}/releases/latest/download/latest.json`

  const manifestStr = await invoke<string>('fetch_manifest_from_github', { url: latestUrl })
  const manifest = JSON.parse(manifestStr)

  const platform = getPlatform()
  const platformZip = manifest.zip[platform]

  if (!platformZip) {
    throw new Error(`No ZIP available for platform: ${platform}`)
  }

  return {
    version: manifest.version,
    url: platformZip.url,
    hash: platformZip.sha256,
    platform,
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

export function getPlatform(): 'windows' | 'macos' | 'linux' | 'unknown' {
  const platform = navigator.userAgent.toLowerCase()

  if (platform.includes('win')) return 'windows'
  if (platform.includes('mac')) return 'macos'
  if (platform.includes('linux')) return 'linux'

  return 'unknown'
}
