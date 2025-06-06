import type { GameProcessEventPayload } from '@/types/game-events'

import React, { useEffect, useCallback } from 'react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export type UseGameProcessEventsOptions = {
  onGameStarting?: (gameId: string, processId?: number) => void
  onGameRunning?: (gameId: string, processId: number) => void
  onGameStopped?: (gameId: string, processId?: number) => void
  onError?: (gameId: string, error: string) => void
}

export function useGameProcessEvents(options: UseGameProcessEventsOptions) {
  // Utiliser useRef pour garder les callbacks les plus récents sans déclencher re-abonnement
  const callbacksRef = React.useRef(options)

  callbacksRef.current = options

  const handleGameProcessEvent = useCallback(
    (event: { payload: GameProcessEventPayload }) => {
      const { gameId, processId, status, error } = event.payload

      console.log(`🎮 Game process event: ${gameId} -> ${status}`, { processId, error })

      const callbacks = callbacksRef.current

      switch (status) {
        case 'starting':
          callbacks.onGameStarting?.(gameId, processId)
          break
        case 'running':
          if (processId) {
            callbacks.onGameRunning?.(gameId, processId)
          }
          break
        case 'stopped':
          callbacks.onGameStopped?.(gameId, processId)
          break
        default:
          console.warn('Unknown game process status:', status)
      }

      if (error) {
        callbacks.onError?.(gameId, error)
      }
    },
    [], // Pas de dépendances pour éviter les re-abonnements
  )

  useEffect(() => {
    let unlisten: UnlistenFn | null = null

    // Écouter les événements de processus de jeu
    listen<GameProcessEventPayload>('game-process-event', handleGameProcessEvent)
      .then((unlistenFn) => {
        unlisten = unlistenFn
        console.log('🔊 Started listening to game process events')
      })
      .catch((error) => {
        console.error('Failed to listen to game process events:', error)
      })

    return () => {
      if (unlisten) {
        unlisten()
        console.log('🔇 Stopped listening to game process events')
      }
    }
  }, [handleGameProcessEvent])
}
