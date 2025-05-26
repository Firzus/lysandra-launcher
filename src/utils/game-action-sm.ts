type State =
  | 'idle'
  | 'checking'
  | 'error'
  | 'repairing'
  | 'waitingForRepair'
  | 'updating'
  | 'waitingForUpdate'
  | 'downloading'
  | 'waitingForDownload'
  | 'ready'
  | 'launching'
  | 'playing'
  | 'uninstalling'

type Action =
  | { type: 'SELECT_GAME' }
  | { type: 'CHECK_PASS' }
  | { type: 'CHECK_FAIL' }
  | { type: 'CLICK_UPDATE_BUTTON' }
  | { type: 'CLICK_DOWNLOAD_BUTTON' }
  | { type: 'CLICK_REPAIR_BUTTON' }
  | { type: 'CLICK_PLAY_BUTTON' }
  | { type: 'UPDATE_COMPLETED' }
  | { type: 'DOWNLOAD_COMPLETED' }
  | { type: 'FIND_UPDATE' }
  | { type: 'GAME_NOT_INSTALLED' }
  | { type: 'FAILED_TO_UPDATE' }
  | { type: 'FAILED_TO_DOWNLOAD' }
  | { type: 'SUCCESS_REPAIR' }
  | { type: 'FAILED_TO_LAUNCH' }
  | { type: 'OPEN_UNITY' }
  | { type: 'CLOSE_UNITY' }
  | { type: 'CLOSE_ERROR_MESSAGE' }
  | { type: 'START_UNINSTALL' }
  | { type: 'UNINSTALL_COMPLETED' }
  | { type: 'FAILED_TO_UNINSTALL' }

export default function reducer(state: State, action: Action): State {
  switch (state) {
    case 'idle':
      if (action.type === 'SELECT_GAME') return 'checking'
      break

    case 'checking':
      if (action.type === 'CHECK_PASS') return 'ready'
      if (action.type === 'FIND_UPDATE') return 'waitingForUpdate'
      if (action.type === 'GAME_NOT_INSTALLED') return 'waitingForDownload'
      if (action.type === 'SUCCESS_REPAIR') return 'waitingForRepair'
      if (action.type === 'CHECK_FAIL') return 'error'
      break

    case 'waitingForUpdate':
      if (action.type === 'CLICK_UPDATE_BUTTON') return 'updating'
      break

    case 'updating':
      if (action.type === 'UPDATE_COMPLETED') return 'ready'
      if (action.type === 'FAILED_TO_UPDATE') return 'error'
      break

    case 'waitingForDownload':
      if (action.type === 'CLICK_DOWNLOAD_BUTTON') return 'downloading'
      break

    case 'downloading':
      if (action.type === 'DOWNLOAD_COMPLETED') return 'ready'
      if (action.type === 'FAILED_TO_DOWNLOAD') return 'error'
      break

    case 'ready':
      if (action.type === 'CLICK_PLAY_BUTTON') return 'launching'
      if (action.type === 'CHECK_PASS') return 'ready' // Re-check après réparation
      if (action.type === 'START_UNINSTALL') return 'uninstalling'
      break

    case 'launching':
      if (action.type === 'FAILED_TO_LAUNCH') return 'error'
      if (action.type === 'OPEN_UNITY') return 'playing'
      break

    case 'playing':
      if (action.type === 'CLOSE_UNITY') return 'ready'
      break

    case 'waitingForRepair':
      if (action.type === 'CLICK_REPAIR_BUTTON') return 'repairing'
      break

    case 'repairing':
      if (action.type === 'SUCCESS_REPAIR') return 'checking'
      if (action.type === 'CHECK_FAIL') return 'error'
      break

    case 'error':
      if (action.type === 'CLOSE_ERROR_MESSAGE') return 'idle'
      break

    case 'uninstalling':
      if (action.type === 'UNINSTALL_COMPLETED') return 'checking'
      if (action.type === 'FAILED_TO_UNINSTALL') return 'error'
      break
  }

  return state
}

export type { State, Action }
