import { getCurrentWindow } from '@tauri-apps/api/window'

export const handleMinimize = async () => {
  await getCurrentWindow().minimize()
}

export const handleClose = async () => {
  await getCurrentWindow().close()
}
