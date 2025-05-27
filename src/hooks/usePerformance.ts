import { useEffect, useRef } from 'react'

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
