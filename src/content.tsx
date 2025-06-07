import { Suspense, lazy, memo, useState } from 'react'
import { Divider } from '@heroui/react'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy loading des composants du Huz Studio Launcher
const Sidebar = lazy(() =>
  import('@/components/page/sidebar').then((module) => ({ default: module.Sidebar })),
)

const HuzStudioGame = lazy(() =>
  import('@/pages/games/huz-studio-game').then((module) => ({ default: module.HuzStudioGame })),
)

const TestPage = lazy(() =>
  import('@/pages/TestPage').then((module) => ({ default: module.default })),
)

const ContentComponent: React.FC = () => {
  const [isTestModeActive, setIsTestModeActive] = useState(false)

  console.log('🎮 Huz Studio Launcher: Content rendering...')

  const handleTestModeToggle = () => {
    setIsTestModeActive(!isTestModeActive)
  }

  return (
    <>
      {/* Navigation */}
      <Suspense fallback={<div className="bg-content1 w-16" />}>
        <Sidebar onTestModeToggle={handleTestModeToggle} isTestModeActive={isTestModeActive} />
      </Suspense>

      <Divider orientation="vertical" />

      {/* Pages */}
      <Suspense fallback={<LoadingSpinner />}>
        {isTestModeActive ? <TestPage /> : <HuzStudioGame />}
      </Suspense>
    </>
  )
}

// Mémorisation du composant Huz Studio pour éviter les re-renders inutiles
export const Content = memo(ContentComponent)
Content.displayName = 'HuzStudioContent'
