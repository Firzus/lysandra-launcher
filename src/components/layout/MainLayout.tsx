import { Suspense, memo, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorFallback } from '@/components/ui/ErrorFallback'
import { useRenderPerformance } from '@/hooks/usePerformance'

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
      className={`bg-background text-foreground flex h-screen overflow-hidden antialiased select-none ${className}`}
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
