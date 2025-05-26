export type UninstallEventStep =
  | 'started'
  | 'removing-install'
  | 'removing-version'
  | 'removing-logs'
  | 'removing-all'
  | 'completed'
  | 'error'

export type UninstallEvent = {
  game_id: string
  step: UninstallEventStep
  message: string
  success: boolean
}
