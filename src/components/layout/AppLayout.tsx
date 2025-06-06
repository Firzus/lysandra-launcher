import { Suspense, memo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Divider } from '@heroui/react'

import { Sidebar } from '@/components/page/sidebar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorFallback } from '@/components/ui/ErrorFallback'

type AppLayoutProps = {
  children: React.ReactNode
}

const AppLayoutComponent: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="bg-background text-foreground flex h-screen overflow-hidden antialiased select-none">
      {/* Navigation */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div className="bg-content1 w-16" />}>
          <Sidebar />
        </Suspense>
      </ErrorBoundary>

      <Divider orientation="vertical" />

      {/* Contenu principal */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<LoadingSpinner />}>
          <main className="flex-1 overflow-hidden">{children}</main>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

// Mémorisation du layout pour éviter les re-renders inutiles
export const AppLayout = memo(AppLayoutComponent)
AppLayout.displayName = 'AppLayout'
