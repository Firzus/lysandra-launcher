import { openUrl } from '@tauri-apps/plugin-opener'

export const openLink = async (url: string) => {
  await openUrl(url)
}
