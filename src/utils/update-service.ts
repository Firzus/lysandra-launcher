type Props = {
  owner: string
  repo: string
}

export async function fetchManifest({ owner, repo }: Props) {
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
