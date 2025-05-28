// Types pour les événements du jeu
export type GameProcessEvent = {
  gameId: string
  processId: number
  status: 'starting' | 'running' | 'stopped'
  timestamp: number
}

export type GameProcessEventPayload = {
  gameId: string
  processId?: number
  status: 'starting' | 'running' | 'stopped'
  error?: string
}
