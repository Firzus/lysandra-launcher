// Store pour garder en mémoire les PID des processus de jeu
let gameProcessPid: number | undefined = undefined

export function setGameProcessPid(pid: number | undefined): void {
  gameProcessPid = pid
  console.log(`📌 Game process PID set to: ${pid}`)
}

export function getGameProcessPid(): number | undefined {
  return gameProcessPid
}

export function clearGameProcessPid(): void {
  gameProcessPid = undefined
  console.log('📌 Game process PID cleared')
}
