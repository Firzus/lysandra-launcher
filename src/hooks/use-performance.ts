import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook pour optimiser les performances de l'application
 * Fournit des utilitaires pour la mémorisation et la gestion des re-renders
 */
export function usePerformance() {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())

  // Compter les renders pour le debugging
  useEffect(() => {
    renderCount.current += 1
    lastRenderTime.current = Date.now()
  })

  // Debounce function pour limiter les appels fréquents
  const debounce = useCallback(
    <T extends (...args: any[]) => any>(
      func: T,
      delay: number,
    ): ((...args: Parameters<T>) => void) => {
      let timeoutId: NodeJS.Timeout

      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
      }
    },
    [],
  )

  // Throttle function pour limiter la fréquence d'exécution
  const throttle = useCallback(
    <T extends (...args: any[]) => any>(
      func: T,
      delay: number,
    ): ((...args: Parameters<T>) => void) => {
      let lastCall = 0

      return (...args: Parameters<T>) => {
        const now = Date.now()

        if (now - lastCall >= delay) {
          lastCall = now
          func(...args)
        }
      }
    },
    [],
  )

  // Mémorisation stable pour les objets - Note: à utiliser dans les composants
  const createStableMemo = useCallback(<T>(value: T): T => {
    // Cette fonction retourne la valeur telle quelle
    // La mémorisation doit être faite au niveau du composant
    return value
  }, [])

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    debounce,
    throttle,
    createStableMemo,
  }
}

/**
 * Hook pour détecter les changements de props et identifier les causes de re-render
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previous = useRef<Record<string, any>>()

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props })
      const changedProps: Record<string, { from: any; to: any }> = {}

      allKeys.forEach((key) => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key],
          }
        }
      })

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps)
      }
    }

    previous.current = props
  })
}

/**
 * Hook pour mesurer les performances de rendu
 */
export function useRenderPerformance(componentName: string) {
  const renderStart = useRef<number>()
  const renderTimes = useRef<number[]>([])

  useEffect(() => {
    renderStart.current = performance.now()
  })

  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current

      renderTimes.current.push(renderTime)

      // Garder seulement les 10 derniers temps de rendu
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift()
      }

      const avgRenderTime =
        renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length

      if (renderTime > 16) {
        // Plus de 16ms = potentiel problème de performance
        console.warn(
          `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (avg: ${avgRenderTime.toFixed(2)}ms)`,
        )
      }
    }
  })

  return {
    averageRenderTime:
      renderTimes.current.length > 0
        ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
        : 0,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0,
  }
}
