import React from 'react'
import { check, type DownloadEvent } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

type Status = 'idle' | 'checking' | 'downloading' | 'installing' | 'ready' | 'error'

export function useAutoAppUpdate() {
  const [status, setStatus] = React.useState<Status>('idle')
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    ;(async () => {
      setStatus('checking')
      try {
        const update = await check() // retourne Update | null :contentReference[oaicite:0]{index=0}

        if (!update) {
          setStatus('ready')

          return
        }
        setStatus('downloading')

        let total = 0

        // downloadAndInstall prend un callback (DownloadEvent) :contentReference[oaicite:1]{index=1}
        await update.downloadAndInstall((event: DownloadEvent) => {
          switch (event.event) {
            case 'Started':
              // reçoit la taille totale (en octets)
              total = event.data.contentLength ?? 0
              break
            case 'Progress':
              // event.data.chunkLength = octets reçus depuis le dernier appel
              setProgress(Math.round((event.data.chunkLength / total) * 100))
              break
            // on peut aussi gérer 'Cancelled' ou 'Completed' si besoin
          }
        })

        setStatus('installing')
        // relance l'app une fois l'installation terminée
        await relaunch() // nécessite @tauri-apps/plugin-process :contentReference[oaicite:2]{index=2}
      } catch (e) {
        setError((e as Error).message)
        setStatus('error')
      }
    })()
  }, [])

  return { status, progress, error }
}
