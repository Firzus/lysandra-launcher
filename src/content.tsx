import { Suspense, lazy, memo } from 'react'
import { Divider } from '@heroui/divider'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy loading des composants du Huz Studio Launcher
const Sidebar = lazy(() =>
  import('@/components/page/Sidebar').then((module) => ({ default: module.Sidebar })),
)

const HuzStudioGame = lazy(() =>
  import('@/pages/games/huz-studio-game').then((module) => ({ default: module.HuzStudioGame })),
)

const ContentComponent: React.FC = () => {
  console.log('🎮 Huz Studio Launcher: Content rendering...')

  return (
    <>
      {/* Navigation */}
      <Suspense fallback={<div className="w-16 bg-content1" />}>
        <Sidebar />
      </Suspense>

      <Divider orientation="vertical" />

      {/* Pages */}
      <Suspense fallback={<LoadingSpinner />}>
        <HuzStudioGame />
      </Suspense>
    </>
  )
}

// Mémorisation du composant Huz Studio pour éviter les re-renders inutiles
export const Content = memo(ContentComponent)
Content.displayName = 'HuzStudioContent'
