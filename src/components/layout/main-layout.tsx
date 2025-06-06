import { Suspense, memo, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorFallback } from '@/components/ui/error-fallback'
import { useRenderPerformance } from '@/hooks/use-performance'

type MainLayoutProps = {
  children: React.ReactNode
  className?: string
  fallbackComponent?: React.ComponentType<any>
  loadingComponent?: React.ComponentType<any>
}

const MainLayoutComponent: React.FC<MainLayoutProps> = ({
  children,
  className = '',
  fallbackComponent: FallbackComponent = ErrorFallback,
  loadingComponent: LoadingComponent = LoadingSpinner,
}) => {
  // Mesurer les performances de rendu
  useRenderPerformance('MainLayout')

  // Gestionnaire d'erreur mémorisé
  const handleError = useCallback((error: Error, errorInfo: any) => {
    console.error('Layout Error:', error, errorInfo)
    // Ici on pourrait envoyer l'erreur à un service de monitoring
  }, [])

  return (
    <div
      className={`flex h-screen select-none overflow-hidden bg-background text-foreground antialiased ${className}`}
    >
      <ErrorBoundary
        FallbackComponent={FallbackComponent}
        resetKeys={[children]} // Reset l'ErrorBoundary quand les children changent
        onError={handleError}
      >
        <Suspense fallback={<LoadingComponent />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  )
}

// Mémorisation du layout pour éviter les re-renders inutiles
export const MainLayout = memo(MainLayoutComponent)
MainLayout.displayName = 'MainLayout'
