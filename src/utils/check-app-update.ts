/* eslint-disable no-console */
import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'

/**
 * Vérifie et installe la mise à jour si elle existe.
 * @param onUserClick
 */
export async function checkAppUpdates(onUserClick: boolean): Promise<void> {
  try {
    const update = await check()

    if (update === null) {
      await message('Impossible de vérifier les mises à jour.', {
        title: 'Erreur',
        kind: 'error',
        okLabel: 'OK',
      })

      return
    }

    console.log(`Nouvelle version ${update.version} détectée.`)
    const confirmed = await ask(
      `Une nouvelle version (${update.version}) est disponible !\nNotes :\n${update.body}`,
      {
        title: 'Mise à jour disponible',
        kind: 'info',
        okLabel: 'Mettre à jour',
        cancelLabel: 'Annuler',
      },
    )

    if (!confirmed) {
      if (onUserClick) {
        await message('Mise à jour annulée.', {
          title: 'Annulé',
          kind: 'warning',
          okLabel: 'OK',
        })
      }

      return
    }

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          console.log(`Début du téléchargement (${event.data.contentLength} bytes)`)
          break
        case 'Progress':
          console.log(`Téléchargé ${event.data.chunkLength} bytes`)
          break
        case 'Finished':
          console.log('Téléchargement terminé')
          break
      }
    })
    console.log('Mise à jour installée, relance...')
    await relaunch()
  } catch (e) {
    console.error('Erreur lors de l’auto-update :', e)
    await message('Une erreur est survenue.', {
      title: 'Erreur',
      kind: 'error',
      okLabel: 'OK',
    })
  }
}
