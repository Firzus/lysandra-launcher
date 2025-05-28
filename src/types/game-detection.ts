export type GameInstallation = {
  path: string
  executable: string
  launcher: string
  confidence: number // Score de confiance sur 100
  metadata: Record<string, string>
}

export type GameSearchResult = {
  game_found: boolean
  installations: GameInstallation[]
  search_paths: string[]
  duration_ms: number
}

export type ValidationResult = {
  is_valid: boolean
  executable_exists: boolean
  path_accessible: boolean
  is_game_directory: boolean
  suggested_executable?: string
  detected_launcher?: string
}

export type AutoDetectionOptions = {
  game_name?: string
  custom_paths?: string[]
  max_results?: number
  min_confidence?: number
}
