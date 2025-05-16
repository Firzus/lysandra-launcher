// src/utils/checkForAppUpdates.ts
import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { relaunch } from '@tauri-apps/plugin-process'

/**
 * Vérifie et installe la mise à jour si elle existe.
 * @param onUserClick – si true, on affiche un toast “à jour” quand il n’y a pas de MAJ.
 */
export async function checkAppUpdates(onUserClick: boolean): Promise<void> {
  try {
    const update = await check() // Update|null

    // Pas de MAJ dispo
    if (update === null) {
      if (onUserClick) {
        await message('Vous êtes déjà sur la dernière version !', {
          title: 'À jour',
          kind: 'info',
          okLabel: 'OK',
        })
      }

      return
    }

    // MAJ dispo → on prévient et on installe si l’utilisateur confirme
    const confirm = await ask(
      `Une nouvelle version (${update.version}) est disponible !\n\nNotes :\n${update.body}`,
      {
        title: 'Mise à jour disponible',
        kind: 'info',
        okLabel: 'Mettre à jour',
        cancelLabel: 'Annuler',
      },
    )

    if (!confirm) {
      return
    }

    // Télécharge et installe avec suivi
    await update.downloadAndInstall((e) => {
      switch (e.event) {
        case 'Started':
          // TODO: Optionally, implement a user-facing progress indicator here
          break
        case 'Progress':
          // TODO: Optionally, update the user-facing progress indicator here
          break
        case 'Finished':
          // TODO: Optionally, inform the user that the download is complete
          break
      }
    })

    // Relance l’app pour appliquer la MAJ
    await relaunch()
  } catch (err) {
    // TODO: Implement proper error logging or reporting
    await message('Impossible de vérifier les mises à jour.\nVeuillez réessayer plus tard.', {
      title: 'Erreur',
      kind: 'error',
      okLabel: 'OK',
    })
  }
}
