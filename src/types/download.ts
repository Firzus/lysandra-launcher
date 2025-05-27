export type DownloadStatus =
  | 'Pending'
  | 'Downloading'
  | 'Paused'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'

export type ChunkStatus = 'Pending' | 'Downloading' | 'Completed' | 'Failed'

export type ChunkProgress = {
  id: number
  start: number
  end: number
  downloaded: number
  status: ChunkStatus
}

export type DownloadProgress = {
  id: string
  url: string
  file_path: string
  total_size: number
  downloaded: number
  speed: number // bytes/sec
  percentage: number
  status: DownloadStatus
  error?: string
  chunks: ChunkProgress[]
  created_at: string
  started_at?: string
  completed_at?: string
}

export type DownloadStats = {
  total_downloads: number
  active_downloads: number
  completed_downloads: number
  failed_downloads: number
  total_downloaded_bytes: number
  total_size_bytes: number
}

export type DownloadConfig = {
  max_concurrent_chunks: number
  chunk_size: number
  max_retries: number
  retry_delay_ms: number
  timeout_seconds: number
  progress_update_interval_ms: number
}

// Événements émis par Tauri
export type DownloadProgressEvent = DownloadProgress
export type DownloadCompletedEvent = DownloadProgress
export type DownloadFailedEvent = DownloadProgress

// API pour les commandes Tauri
export interface DownloadManagerAPI {
  startDownload(url: string, filePath: string): Promise<string>
  pauseDownload(downloadId: string): Promise<void>
  resumeDownload(downloadId: string): Promise<void>
  cancelDownload(downloadId: string): Promise<void>
  removeDownload(downloadId: string): Promise<void>
  getDownloadProgress(downloadId: string): Promise<DownloadProgress | null>
  getAllDownloads(): Promise<DownloadProgress[]>
  cleanupCompletedDownloads(): Promise<void>
  getDownloadStats(): Promise<DownloadStats>
}

// Utilitaires pour formatter les données
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond) + '/s'
}

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)

    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    return `${hours}h ${minutes}m`
  }
}

export const getEstimatedTimeRemaining = (
  downloaded: number,
  total: number,
  speed: number,
): number => {
  if (speed === 0 || downloaded >= total) return 0

  return (total - downloaded) / speed
}

export const getStatusColor = (status: DownloadStatus): string => {
  switch (status) {
    case 'Pending':
      return 'text-gray-500'
    case 'Downloading':
      return 'text-blue-500'
    case 'Paused':
      return 'text-yellow-500'
    case 'Completed':
      return 'text-green-500'
    case 'Failed':
      return 'text-red-500'
    case 'Cancelled':
      return 'text-gray-400'
    default:
      return 'text-gray-500'
  }
}

export const getStatusIcon = (status: DownloadStatus): string => {
  switch (status) {
    case 'Pending':
      return '⏳'
    case 'Downloading':
      return '⬇️'
    case 'Paused':
      return '⏸️'
    case 'Completed':
      return '✅'
    case 'Failed':
      return '❌'
    case 'Cancelled':
      return '⭕'
    default:
      return '❓'
  }
}
