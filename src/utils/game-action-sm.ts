// --- Types d’état et d’action ---
type State = 'idle' | 'checking' | 'updating' | 'ready' | 'launching' | 'error'

type Action =
  | { type: 'CHECK' }
  | { type: 'UPDATE_NEEDED' }
  | { type: 'NO_UPDATE' }
  | { type: 'DONE' }
  | { type: 'LAUNCH' }
  | { type: 'ERROR' }
  | { type: 'RETRY' }

// --- Reducer de la machine d’état ---
export default function reducer(state: State, action: Action): State {
  switch (state) {
    case 'idle':
      if (action.type === 'CHECK') return 'checking'
      break
    case 'checking':
      if (action.type === 'UPDATE_NEEDED') return 'updating'
      if (action.type === 'NO_UPDATE') return 'ready'
      if (action.type === 'ERROR') return 'error'
      break
    case 'updating':
      if (action.type === 'DONE') return 'ready'
      if (action.type === 'ERROR') return 'error'
      break
    case 'ready':
      if (action.type === 'LAUNCH') return 'launching'
      break
    case 'launching':
      if (action.type === 'ERROR') return 'error'
      break
    case 'error':
      if (action.type === 'RETRY') return 'checking'
      break
  }

  return state
}
