import { download } from '@tauri-apps/plugin-upload'
import { invoke } from '@tauri-apps/api/core'

export async function fetchManifest(owner: string, repo: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  })

  if (!res.ok) {
    throw new Error(`Error fetching manifest: ${res.statusText}`)
  }

  const data = await res.json()

  return {
    version: data.tag_name,
    url: data.assets[0].browser_download_url,
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

    console.log(`Downloaded ${progress} of ${total} bytes (${progressPercentage}%)`)
  })

  // Informer le backend que le téléchargement est terminé
  invoke('handle_download_complete', { version })
  console.log('Download complete for version:', version)
}
