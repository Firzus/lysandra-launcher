/**
 * Configuration des optimisations de performance pour l'application
 */

// Configuration du lazy loading
export const LAZY_LOADING_CONFIG = {
  // Délai avant le chargement des composants non critiques (ms)
  DEFER_DELAY: 100,

  // Seuil de visibilité pour l'Intersection Observer
  VISIBILITY_THRESHOLD: 0.1,

  // Marge pour le préchargement des composants
  ROOT_MARGIN: '50px',
} as const

// Configuration de la mémorisation
export const MEMOIZATION_CONFIG = {
  // Taille maximale du cache pour les composants mémorisés
  MAX_CACHE_SIZE: 50,

  // Durée de vie du cache (ms)
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  // Activer le debugging des re-renders
  DEBUG_RERENDERS: process.env.NODE_ENV === 'development',
} as const

// Configuration des chunks
export const CHUNK_CONFIG = {
  // Taille maximale des chunks (KB)
  MAX_CHUNK_SIZE: 500,

  // Taille minimale des chunks (KB)
  MIN_CHUNK_SIZE: 20,

  // Préchargement des chunks critiques
  PRELOAD_CRITICAL: true,
} as const

// Configuration des images
export const IMAGE_CONFIG = {
  // Formats d'image supportés par ordre de préférence
  SUPPORTED_FORMATS: ['webp', 'avif', 'png', 'jpg'] as const,

  // Qualité par défaut pour la compression
  DEFAULT_QUALITY: 85,

  // Lazy loading des images
  LAZY_LOAD_IMAGES: true,

  // Placeholder pendant le chargement
  USE_PLACEHOLDER: true,
} as const

// Configuration du debouncing/throttling
export const TIMING_CONFIG = {
  // Délai de debounce pour les recherches (ms)
  SEARCH_DEBOUNCE: 300,

  // Délai de throttle pour le scroll (ms)
  SCROLL_THROTTLE: 16, // ~60fps

  // Délai de throttle pour le resize (ms)
  RESIZE_THROTTLE: 100,

  // Délai de debounce pour les sauvegardes (ms)
  SAVE_DEBOUNCE: 1000,
} as const

// Configuration du monitoring des performances
export const MONITORING_CONFIG = {
  // Activer le monitoring en production
  ENABLE_IN_PRODUCTION: false,

  // Seuil d'alerte pour les temps de rendu (ms)
  RENDER_TIME_THRESHOLD: 16,

  // Seuil d'alerte pour la taille des bundles (KB)
  BUNDLE_SIZE_THRESHOLD: 1000,

  // Nombre maximum d'événements à stocker
  MAX_EVENTS: 100,
} as const

// Types pour la configuration
export type LazyLoadingConfig = typeof LAZY_LOADING_CONFIG
export type MemoizationConfig = typeof MEMOIZATION_CONFIG
export type ChunkConfig = typeof CHUNK_CONFIG
export type ImageConfig = typeof IMAGE_CONFIG
export type TimingConfig = typeof TIMING_CONFIG
export type MonitoringConfig = typeof MONITORING_CONFIG
