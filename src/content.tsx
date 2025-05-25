import { Suspense, lazy, memo } from 'react'
import { Divider } from '@heroui/divider'

import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy loading des composants
const Sidebar = lazy(() =>
  import('@/components/page/sidebar').then((module) => ({ default: module.Sidebar })),
)
const LysandraGame = lazy(() =>
  import('@/pages/games/lysandra-game').then((module) => ({ default: module.LysandraGame })),
)

const ContentComponent: React.FC = () => {
  console.log('📄 Content: Component rendering...')
  
  return (
    <>
      {/* Navigation */}
      <Suspense fallback={<div className="w-16 bg-content1" />}>
        <Sidebar />
      </Suspense>

      <Divider orientation="vertical" />

      {/* Pages */}
      <Suspense fallback={<LoadingSpinner />}>
        <LysandraGame />
      </Suspense>
    </>
  )
}

// Mémorisation du composant pour éviter les re-renders inutiles
export const Content = memo(ContentComponent)
Content.displayName = 'Content'
