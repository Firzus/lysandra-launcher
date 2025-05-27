import React, { useState } from "react";
import { useDownloadManager } from "../hooks/useDownloadManager";
import {
    DownloadProgress,
    formatBytes,
    formatSpeed,
    formatDuration,
    getEstimatedTimeRemaining,
    getStatusColor,
    getStatusIcon,
} from "../types/download";

type DownloadItemProps = {
    download: DownloadProgress;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
    onCancel: (id: string) => void;
    onRemove: (id: string) => void;
};

const DownloadItem: React.FC<DownloadItemProps> = ({
    download,
    onPause,
    onResume,
    onCancel,
    onRemove,
}) => {
    const fileName = download.file_path.split("/").pop() || download.url.split("/").pop() || "Unknown";
    const eta = getEstimatedTimeRemaining(download.downloaded, download.total_size, download.speed);

    const canPause = download.status === "Downloading";
    const canResume = download.status === "Paused";
    const canCancel = download.status === "Downloading" || download.status === "Paused" || download.status === "Pending";
    const canRemove = download.status === "Completed" || download.status === "Failed" || download.status === "Cancelled";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {fileName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {download.url}
                    </p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                    <span className={`text-2xl ${getStatusColor(download.status)}`}>
                        {getStatusIcon(download.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(download.status)}`}>
                        {download.status}
                    </span>
                </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span>{formatBytes(download.downloaded)} / {formatBytes(download.total_size)}</span>
                    <span>{download.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(download.percentage, 100)}%` }}
                    />
                </div>
            </div>

            {/* Informations de vitesse et temps restant */}
            {download.status === "Downloading" && (
                <div className="mb-4 flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Vitesse: {formatSpeed(download.speed)}</span>
                    {eta > 0 && <span>Temps restant: {formatDuration(eta)}</span>}
                </div>
            )}

            {/* Affichage des chunks */}
            {download.chunks.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Chunks ({download.chunks.length})
                    </p>
                    <div className="grid grid-cols-8 gap-1">
                        {download.chunks.map((chunk) => (
                            <div
                                key={chunk.id}
                                className={`h-2 rounded-sm ${chunk.status === "Completed" ? "bg-green-500" :
                                        chunk.status === "Downloading" ? "bg-blue-500" :
                                            chunk.status === "Failed" ? "bg-red-500" :
                                                "bg-gray-300 dark:bg-gray-600"
                                    }`}
                                title={`Chunk ${chunk.id}: ${chunk.status} (${formatBytes(chunk.downloaded)}/${formatBytes(chunk.end - chunk.start + 1)})`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Message d'erreur */}
            {download.error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Erreur: {download.error}
                    </p>
                </div>
            )}

            {/* Boutons de contrôle */}
            <div className="flex space-x-2">
                {canPause && (
                    <button
                        onClick={() => onPause(download.id)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm font-medium transition-colors"
                    >
                        Pause
                    </button>
                )}
                {canResume && (
                    <button
                        onClick={() => onResume(download.id)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
                    >
                        Reprendre
                    </button>
                )}
                {canCancel && (
                    <button
                        onClick={() => onCancel(download.id)}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors"
                    >
                        Annuler
                    </button>
                )}
                {canRemove && (
                    <button
                        onClick={() => onRemove(download.id)}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
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
    );
};

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
    } = useDownloadManager();

    const [newDownloadUrl, setNewDownloadUrl] = useState("");
    const [newDownloadPath, setNewDownloadPath] = useState("");
    const [showNewDownloadForm, setShowNewDownloadForm] = useState(false);

    const handleStartDownload = async () => {
        if (!newDownloadUrl.trim() || !newDownloadPath.trim()) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        try {
            await startDownload(newDownloadUrl, newDownloadPath);
            setNewDownloadUrl("");
            setNewDownloadPath("");
            setShowNewDownloadForm(false);
        } catch (err) {
            console.error("Failed to start download:", err);
            alert("Échec du démarrage du téléchargement: " + err);
        }
    };

    const handlePause = async (id: string) => {
        try {
            await pauseDownload(id);
        } catch (err) {
            console.error("Failed to pause download:", err);
            alert("Échec de la mise en pause: " + err);
        }
    };

    const handleResume = async (id: string) => {
        try {
            await resumeDownload(id);
        } catch (err) {
            console.error("Failed to resume download:", err);
            alert("Échec de la reprise: " + err);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelDownload(id);
        } catch (err) {
            console.error("Failed to cancel download:", err);
            alert("Échec de l'annulation: " + err);
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await removeDownload(id);
        } catch (err) {
            console.error("Failed to remove download:", err);
            alert("Échec de la suppression: " + err);
        }
    };

    const handleCleanup = async () => {
        try {
            await cleanupCompletedDownloads();
        } catch (err) {
            console.error("Failed to cleanup downloads:", err);
            alert("Échec du nettoyage: " + err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-300">Chargement des téléchargements...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Gestionnaire de téléchargements
                </h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowNewDownloadForm(!showNewDownloadForm)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Nouveau téléchargement
                    </button>
                    <button
                        onClick={refreshDownloads}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Actualiser
                    </button>
                    <button
                        onClick={handleCleanup}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Nettoyer
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_downloads}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.active_downloads}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminés</p>
                        <p className="text-2xl font-bold text-green-600">{stats.completed_downloads}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Données téléchargées</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatBytes(stats.total_downloaded_bytes)}</p>
                    </div>
                </div>
            )}

            {/* Formulaire de nouveau téléchargement */}
            {showNewDownloadForm && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Nouveau téléchargement
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                URL du fichier
                            </label>
                            <input
                                type="url"
                                value={newDownloadUrl}
                                onChange={(e) => setNewDownloadUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="https://example.com/file.zip"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Chemin de destination
                            </label>
                            <input
                                type="text"
                                value={newDownloadPath}
                                onChange={(e) => setNewDownloadPath(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="/path/to/save/file.zip"
                            />
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleStartDownload}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Démarrer le téléchargement
                            </button>
                            <button
                                onClick={() => setShowNewDownloadForm(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message d'erreur global */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400">
                        Erreur: {error}
                    </p>
                </div>
            )}

            {/* Liste des téléchargements */}
            {downloads.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Aucun téléchargement en cours
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                        Cliquez sur "Nouveau téléchargement" pour commencer
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {downloads.map((download) => (
                        <DownloadItem
                            key={download.id}
                            download={download}
                            onPause={handlePause}
                            onResume={handleResume}
                            onCancel={handleCancel}
                            onRemove={handleRemove}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default DownloadManager; 