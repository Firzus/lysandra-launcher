import { GAME_IDS } from './paths'

import { globalInfos } from '@/data/lysandra'

/**
 * Obtient les informations d'un jeu par son ID
 */
export function getGameData(gameId: string) {
  switch (gameId) {
    case GAME_IDS.LYSANDRA:
      return globalInfos
    default:
      throw new Error(`Unknown game ID: ${gameId}`)
  }
}

/**
 * Obtient le nom de l'exécutable d'un jeu par son ID
 */
export function getGameExecutable(gameId: string): string {
  const gameData = getGameData(gameId)

  return gameData.gameExecutable
}

/**
 * Obtient les informations de repository d'un jeu par son ID
 */
export function getGameRepository(gameId: string) {
  const gameData = getGameData(gameId)

  return {
    owner: gameData.owner,
    repo: gameData.repositoryName,
  }
}
