import React, { useState } from 'react'

import { useDownloadManager } from '../hooks/useDownloadManager'
import {
  DownloadProgress,
  formatBytes,
  formatSpeed,
  formatDuration,
  getEstimatedTimeRemaining,
  getStatusColor,
  getStatusIcon,
} from '../types/download'

type DownloadItemProps = {
  download: DownloadProgress
  onPause: (id: string) => void
  onResume: (id: string) => void
  onCancel: (id: string) => void
  onRemove: (id: string) => void
}

const DownloadItem: React.FC<DownloadItemProps> = ({
  download,
  onPause,
  onResume,
  onCancel,
  onRemove,
}) => {
  const fileName = download.file_path.split('/').pop() || download.url.split('/').pop() || 'Unknown'
  const eta = getEstimatedTimeRemaining(download.downloaded, download.total_size, download.speed)

  const canPause = download.status === 'Downloading'
  const canResume = download.status === 'Paused'
  const canCancel =
    download.status === 'Downloading' ||
    download.status === 'Paused' ||
    download.status === 'Pending'
  const canRemove =
    download.status === 'Completed' ||
    download.status === 'Failed' ||
    download.status === 'Cancelled'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
            {fileName}
          </h3>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">{download.url}</p>
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <span className={`text-2xl ${getStatusColor(download.status)}`}>
            {getStatusIcon(download.status)}
          </span>
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(download.status)}`}
          >
            {download.status}
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>
            {formatBytes(download.downloaded)} / {formatBytes(download.total_size)}
          </span>
          <span>{download.percentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${Math.min(download.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Informations de vitesse et temps restant */}
      {download.status === 'Downloading' && (
        <div className="mb-4 flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Vitesse: {formatSpeed(download.speed)}</span>
          {eta > 0 && <span>Temps restant: {formatDuration(eta)}</span>}
        </div>
      )}

      {/* Affichage des chunks */}
      {download.chunks.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
            Chunks ({download.chunks.length})
          </p>
          <div className="grid grid-cols-8 gap-1">
            {download.chunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`h-2 rounded-sm ${
                  chunk.status === 'Completed'
                    ? 'bg-green-500'
                    : chunk.status === 'Downloading'
                      ? 'bg-blue-500'
                      : chunk.status === 'Failed'
                        ? 'bg-red-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                }`}
                title={`Chunk ${chunk.id}: ${chunk.status} (${formatBytes(chunk.downloaded)}/${formatBytes(chunk.end - chunk.start + 1)})`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {download.error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">Erreur: {download.error}</p>
        </div>
      )}

      {/* Boutons de contrôle */}
      <div className="flex space-x-2">
        {canPause && (
          <button
            className="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
            onClick={() => onPause(download.id)}
          >
            Pause
          </button>
        )}
        {canResume && (
          <button
            className="rounded bg-green-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-green-600"
            onClick={() => onResume(download.id)}
          >
            Reprendre
          </button>
        )}
        {canCancel && (
          <button
            className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600"
            onClick={() => onCancel(download.id)}
          >
            Annuler
          </button>
        )}
        {canRemove && (
          <button
            className="rounded bg-gray-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-gray-600"
            onClick={() => onRemove(download.id)}
          >
            Supprimer
          </button>
        )}
      </div>

      {/* Timestamps */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div>Créé: {new Date(download.created_at).toLocaleString()}</div>
        {download.started_at && (
          <div>Démarré: {new Date(download.started_at).toLocaleString()}</div>
        )}
        {download.completed_at && (
          <div>Terminé: {new Date(download.completed_at).toLocaleString()}</div>
        )}
      </div>
    </div>
  )
}

const DownloadManager: React.FC = () => {
  const {
    downloads,
    stats,
    isLoading,
    error,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    removeDownload,
    cleanupCompletedDownloads,
    refreshDownloads,
  } = useDownloadManager()

  const [newDownloadUrl, setNewDownloadUrl] = useState('')
  const [newDownloadPath, setNewDownloadPath] = useState('')
  const [showNewDownloadForm, setShowNewDownloadForm] = useState(false)

  const handleStartDownload = async () => {
    if (!newDownloadUrl.trim() || !newDownloadPath.trim()) {
      alert('Veuillez remplir tous les champs')

      return
    }

    try {
      await startDownload(newDownloadUrl, newDownloadPath)
      setNewDownloadUrl('')
      setNewDownloadPath('')
      setShowNewDownloadForm(false)
    } catch (err) {
      console.error('Failed to start download:', err)
      alert('Échec du démarrage du téléchargement: ' + err)
    }
  }

  const handlePause = async (id: string) => {
    try {
      await pauseDownload(id)
    } catch (err) {
      console.error('Failed to pause download:', err)
      alert('Échec de la mise en pause: ' + err)
    }
  }

  const handleResume = async (id: string) => {
    try {
      await resumeDownload(id)
    } catch (err) {
      console.error('Failed to resume download:', err)
      alert('Échec de la reprise: ' + err)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelDownload(id)
    } catch (err) {
      console.error('Failed to cancel download:', err)
      alert("Échec de l'annulation: " + err)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await removeDownload(id)
    } catch (err) {
      console.error('Failed to remove download:', err)
      alert('Échec de la suppression: ' + err)
    }
  }

  const handleCleanup = async () => {
    try {
      await cleanupCompletedDownloads()
    } catch (err) {
      console.error('Failed to cleanup downloads:', err)
      alert('Échec du nettoyage: ' + err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">
          Chargement des téléchargements...
        </span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestionnaire de téléchargements
        </h1>
        <div className="flex space-x-3">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            onClick={() => setShowNewDownloadForm(!showNewDownloadForm)}
          >
            Nouveau téléchargement
          </button>
          <button
            className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
            onClick={refreshDownloads}
          >
            Actualiser
          </button>
          <button
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
            onClick={handleCleanup}
          >
            Nettoyer
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total_downloads}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active_downloads}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminés</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed_downloads}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Données téléchargées
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatBytes(stats.total_downloaded_bytes)}
            </p>
          </div>
        </div>
      )}

      {/* Formulaire de nouveau téléchargement */}
      {showNewDownloadForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Nouveau téléchargement
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="download-url"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                URL du fichier
              </label>
              <input
                id="download-url"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/file.zip"
                type="url"
                value={newDownloadUrl}
                onChange={(e) => setNewDownloadUrl(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="download-path"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Chemin de destination
              </label>
              <input
                id="download-path"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="/path/to/save/file.zip"
                type="text"
                value={newDownloadPath}
                onChange={(e) => setNewDownloadPath(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
                onClick={handleStartDownload}
              >
                Démarrer le téléchargement
              </button>
              <button
                className="rounded-lg bg-gray-600 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-700"
                onClick={() => setShowNewDownloadForm(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message d'erreur global */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">Erreur: {error}</p>
        </div>
      )}

      {/* Liste des téléchargements */}
      {downloads.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center shadow dark:border-gray-700 dark:bg-gray-800">
          <p className="text-lg text-gray-500 dark:text-gray-400">Aucun téléchargement en cours</p>
          <p className="mt-2 text-gray-400 dark:text-gray-500">
            Cliquez sur &ldquo;Nouveau téléchargement&rdquo; pour commencer
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.map((download) => (
            <DownloadItem
              key={download.id}
              download={download}
              onCancel={handleCancel}
              onPause={handlePause}
              onRemove={handleRemove}
              onResume={handleResume}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DownloadManager
