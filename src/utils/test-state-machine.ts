import reducer, { type State, type Action } from './game-action-sm'

/**
 * Test de la state machine pour vérifier toutes les transitions
 * selon le schéma fourni
 */
export function testStateMachine() {
  console.log('🧪 Testing Game State Machine...')

  const tests = [
    // Test du flow principal : Idle → Checking → Ready → Launching → Playing → Ready
    {
      name: 'Main Flow - Game Ready',
      transitions: [
        { from: 'idle', action: 'SELECT_GAME', expected: 'checking' },
        { from: 'checking', action: 'CHECK_PASS', expected: 'ready' },
        { from: 'ready', action: 'CLICK_PLAY_BUTTON', expected: 'launching' },
        { from: 'launching', action: 'OPEN_UNITY', expected: 'playing' },
        { from: 'playing', action: 'CLOSE_UNITY', expected: 'ready' },
      ],
    },

    // Test du flow de téléchargement : Idle → Checking → WaitingForDownload → Downloading → Ready
    {
      name: 'Download Flow',
      transitions: [
        { from: 'idle', action: 'SELECT_GAME', expected: 'checking' },
        { from: 'checking', action: 'GAME_NOT_INSTALLED', expected: 'waitingForDownload' },
        { from: 'waitingForDownload', action: 'CLICK_DOWNLOAD_BUTTON', expected: 'downloading' },
        { from: 'downloading', action: 'DOWNLOAD_COMPLETED', expected: 'ready' },
      ],
    },

    // Test du flow de mise à jour : Idle → Checking → WaitingForUpdate → Updating → Ready
    {
      name: 'Update Flow',
      transitions: [
        { from: 'idle', action: 'SELECT_GAME', expected: 'checking' },
        { from: 'checking', action: 'FIND_UPDATE', expected: 'waitingForUpdate' },
        { from: 'waitingForUpdate', action: 'CLICK_UPDATE_BUTTON', expected: 'updating' },
        { from: 'updating', action: 'UPDATE_COMPLETED', expected: 'ready' },
      ],
    },

    // Test du flow de réparation : Idle → Checking → WaitingForRepair → Repairing → Checking → Ready
    {
      name: 'Repair Flow',
      transitions: [
        { from: 'idle', action: 'SELECT_GAME', expected: 'checking' },
        { from: 'checking', action: 'SUCCESS_REPAIR', expected: 'waitingForRepair' },
        { from: 'waitingForRepair', action: 'CLICK_REPAIR_BUTTON', expected: 'repairing' },
        { from: 'repairing', action: 'SUCCESS_REPAIR', expected: 'checking' },
        { from: 'checking', action: 'CHECK_PASS', expected: 'ready' },
      ],
    },

    // Test des erreurs : différents états → Error → Idle
    {
      name: 'Error Handling',
      transitions: [
        { from: 'checking', action: 'CHECK_FAIL', expected: 'error' },
        { from: 'error', action: 'CLOSE_ERROR_MESSAGE', expected: 'idle' },
        { from: 'downloading', action: 'FAILED_TO_DOWNLOAD', expected: 'error' },
        { from: 'error', action: 'CLOSE_ERROR_MESSAGE', expected: 'idle' },
        { from: 'updating', action: 'FAILED_TO_UPDATE', expected: 'error' },
        { from: 'error', action: 'CLOSE_ERROR_MESSAGE', expected: 'idle' },
        { from: 'launching', action: 'FAILED_TO_LAUNCH', expected: 'error' },
        { from: 'error', action: 'CLOSE_ERROR_MESSAGE', expected: 'idle' },
      ],
    },
  ]

  let totalTests = 0
  let passedTests = 0

  tests.forEach((testSuite) => {
    console.log(`\n📋 Testing: ${testSuite.name}`)

    testSuite.transitions.forEach((test) => {
      totalTests++

      const result = reducer(test.from as State, { type: test.action } as Action)

      if (result === test.expected) {
        console.log(`  ✅ ${test.from} + ${test.action} → ${result}`)
        passedTests++
      } else {
        console.log(`  ❌ ${test.from} + ${test.action} → ${result} (expected: ${test.expected})`)
      }
    })
  })

  // Test des transitions invalides (doivent retourner l'état actuel)
  console.log('\n📋 Testing Invalid Transitions')
  const invalidTests = [
    { from: 'idle', action: 'CHECK_PASS' },
    { from: 'ready', action: 'GAME_NOT_INSTALLED' },
    { from: 'playing', action: 'CLICK_DOWNLOAD_BUTTON' },
    { from: 'downloading', action: 'CLICK_PLAY_BUTTON' },
  ]

  invalidTests.forEach((test) => {
    totalTests++
    const result = reducer(test.from as State, { type: test.action } as Action)

    if (result === test.from) {
      console.log(`  ✅ ${test.from} + ${test.action} → ${result} (no transition, as expected)`)
      passedTests++
    } else {
      console.log(`  ❌ ${test.from} + ${test.action} → ${result} (should stay in ${test.from})`)
    }
  })

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`)

  if (passedTests === totalTests) {
    console.log('🎉 All state machine tests passed!')
    return true
  } else {
    console.log('⚠️ Some state machine tests failed!')
    return false
  }
}

/**
 * Affiche un diagramme ASCII de la state machine
 */
export function printStateMachineDiagram() {
  console.log(`
🎮 Game State Machine Diagram

States: idle, checking, error, repairing, waitingForRepair, updating, 
        waitingForUpdate, downloading, waitingForDownload, ready, launching, playing

Flow Diagram:
┌─────────┐ SELECT_GAME  ┌──────────┐
│  idle   │─────────────→│ checking │
└─────────┘              └─────┬────┘
     ↑                         │
     │ CLOSE_ERROR_MESSAGE     │ CHECK_PASS
     │                         ↓
┌─────────┐                ┌───────┐ CLICK_PLAY_BUTTON ┌───────────┐
│  error  │                │ ready │──────────────────→│ launching │
└─────────┘                └───┬───┘                   └─────┬─────┘
     ↑                         │                             │
     │ CHECK_FAIL               │ CLOSE_UNITY                 │ OPEN_UNITY
     │                         │                             ↓
     │                         │                       ┌─────────┐
     │                         └──────────────────────→│ playing │
     │                                                 └─────────┘
     │
     │ FAILED_TO_*
     │
┌────┴─────────────────────────────────────────────────────────────┐
│                    Error Transitions                             │
│  downloading, updating, launching, repairing → error             │
└──────────────────────────────────────────────────────────────────┘

Additional Flows:
• checking → waitingForDownload → downloading → ready
• checking → waitingForUpdate → updating → ready  
• checking → waitingForRepair → repairing → checking
`)
}

// Export pour utilisation dans les tests
export { reducer }
