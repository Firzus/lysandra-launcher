use reqwest::{Client, header::{RANGE, CONTENT_LENGTH}};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::fs::{File, OpenOptions};
use tokio::io::{AsyncSeekExt, AsyncWriteExt, SeekFrom};
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration, Instant};
use uuid::Uuid;

// Structures de données
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub id: String,
    pub url: String,
    pub file_path: String,
    pub total_size: u64,
    pub downloaded: u64,
    pub speed: u64, // bytes/sec
    pub percentage: f64,
    pub status: DownloadStatus,
    pub error: Option<String>,
    pub chunks: Vec<ChunkProgress>,
    pub created_at: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DownloadStatus {
    Pending,
    Downloading,
    Paused,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkProgress {
    pub id: usize,
    pub start: u64,
    pub end: u64,
    pub downloaded: u64,
    pub status: ChunkStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChunkStatus {
    Pending,
    Downloading,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadConfig {
    pub max_concurrent_chunks: usize,
    pub chunk_size: u64,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
    pub timeout_seconds: u64,
    pub progress_update_interval_ms: u64,
}

impl Default for DownloadConfig {
    fn default() -> Self {
        Self {
            max_concurrent_chunks: 8,
            chunk_size: 2 * 1024 * 1024, // 2MB
            max_retries: 5,
            retry_delay_ms: 2000,
            timeout_seconds: 60,
            progress_update_interval_ms: 100,
        }
    }
}

// Gestionnaire principal des téléchargements
pub struct DownloadManager {
    downloads: Arc<RwLock<HashMap<String, DownloadProgress>>>,
    client: Client,
    config: DownloadConfig,
    active_tasks: Arc<RwLock<HashMap<String, tokio::task::JoinHandle<()>>>>,
}

impl DownloadManager {
    pub fn new(config: DownloadConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_seconds))
            .user_agent("Lysandra-Launcher/1.0")
            .build()
            .expect("Failed to create HTTP client");

        Self {
            downloads: Arc::new(RwLock::new(HashMap::new())),
            client,
            config,
            active_tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // Démarrer un nouveau téléchargement
    pub async fn start_download(
        &self,
        url: String,
        file_path: String,
        app: AppHandle,
    ) -> Result<String, String> {
        let download_id = Uuid::new_v4().to_string();
        
        // Vérifier si le fichier existe déjà et est complet
        if let Ok(metadata) = tokio::fs::metadata(&file_path).await {
            let existing_size = metadata.len();
            
            // Obtenir la taille du fichier distant
            match self.get_file_size(&url).await {
                Ok(remote_size) if existing_size == remote_size => {
                    return Err("File already exists and is complete".to_string());
                }
                _ => {} // Continue with download
            }
        }
        
        // Vérifier si le serveur supporte les requêtes partielles
        let supports_partial = self.check_partial_support(&url).await.unwrap_or(false);
        
        // Obtenir la taille du fichier
        let total_size = self.get_file_size(&url).await?;
        
        // Vérifier si un téléchargement partiel existe
        let existing_size = self.get_existing_file_size(&file_path).await;
        
        // Créer la structure de progression
        let progress = DownloadProgress {
            id: download_id.clone(),
            url: url.clone(),
            file_path: file_path.clone(),
            total_size,
            downloaded: existing_size,
            speed: 0,
            percentage: if total_size > 0 { (existing_size as f64 / total_size as f64) * 100.0 } else { 0.0 },
            status: DownloadStatus::Pending,
            error: None,
            chunks: Vec::new(),
            created_at: chrono::Utc::now().to_rfc3339(),
            started_at: None,
            completed_at: None,
        };

        // Ajouter aux téléchargements actifs
        {
            let mut downloads = self.downloads.write().await;
            downloads.insert(download_id.clone(), progress.clone());
        }

        // Démarrer le téléchargement en arrière-plan
        let manager = self.clone();
        let id = download_id.clone();
        let task = tokio::spawn(async move {
            manager.execute_download(id, supports_partial, app).await;
        });

        // Sauvegarder la tâche pour pouvoir l'annuler plus tard
        {
            let mut tasks = self.active_tasks.write().await;
            tasks.insert(download_id.clone(), task);
        }

        Ok(download_id)
    }

    // Exécuter le téléchargement avec la stratégie appropriée
    async fn execute_download(&self, download_id: String, supports_partial: bool, app: AppHandle) {
        let total_size = {
            let downloads = self.downloads.read().await;
            downloads.get(&download_id).map(|p| p.total_size).unwrap_or(0)
        };

        // Marquer comme démarré
        {
            let mut downloads = self.downloads.write().await;
            if let Some(progress) = downloads.get_mut(&download_id) {
                progress.status = DownloadStatus::Downloading;
                progress.started_at = Some(chrono::Utc::now().to_rfc3339());
            }
        }

        let result = if supports_partial && total_size > self.config.chunk_size {
            self.download_with_chunks(download_id.clone(), app.clone()).await
        } else {
            self.download_single_thread(download_id.clone(), app.clone()).await
        };

        // Nettoyer la tâche
        {
            let mut tasks = self.active_tasks.write().await;
            tasks.remove(&download_id);
        }

        // Gérer le résultat
        match result {
            Ok(_) => {
                let mut downloads = self.downloads.write().await;
                if let Some(progress) = downloads.get_mut(&download_id) {
                    progress.status = DownloadStatus::Completed;
                    progress.percentage = 100.0;
                    progress.completed_at = Some(chrono::Utc::now().to_rfc3339());
                    
                    let _ = app.emit("download-completed", &*progress);
                }
            }
            Err(e) => {
                let mut downloads = self.downloads.write().await;
                if let Some(progress) = downloads.get_mut(&download_id) {
                    progress.status = DownloadStatus::Failed;
                    progress.error = Some(e);
                    
                    let _ = app.emit("download-failed", &*progress);
                }
            }
        }
    }

    // Téléchargement avec chunks parallèles
    async fn download_with_chunks(&self, download_id: String, app: AppHandle) -> Result<(), String> {
        let (url, file_path, total_size, existing_size) = {
            let downloads = self.downloads.read().await;
            let progress = downloads.get(&download_id).ok_or("Download not found")?;
            (
                progress.url.clone(),
                progress.file_path.clone(),
                progress.total_size,
                progress.downloaded,
            )
        };

        // S'assurer que le répertoire parent existe
        if let Some(parent) = Path::new(&file_path).parent() {
            tokio::fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
        }

        // Calculer les chunks
        let remaining_size = total_size - existing_size;
        if remaining_size == 0 {
            return Ok(());
        }

        let chunk_count = std::cmp::min(
            self.config.max_concurrent_chunks,
            ((remaining_size / self.config.chunk_size) + 1) as usize
        );
        let chunk_size = remaining_size / chunk_count as u64;

        // Créer les chunks
        let mut chunks = Vec::new();
        for i in 0..chunk_count {
            let start = existing_size + (i as u64 * chunk_size);
            let end = if i == chunk_count - 1 {
                total_size - 1
            } else {
                start + chunk_size - 1
            };

            chunks.push(ChunkProgress {
                id: i,
                start,
                end,
                downloaded: 0,
                status: ChunkStatus::Pending,
            });
        }

        // Ajouter les chunks à la progression
        {
            let mut downloads = self.downloads.write().await;
            if let Some(progress) = downloads.get_mut(&download_id) {
                progress.chunks = chunks.clone();
            }
        }

        // Lancer les téléchargements de chunks en parallèle
        let mut handles = Vec::new();
        for chunk in chunks {
            let manager = self.clone();
            let id = download_id.clone();
            let url_clone = url.clone();
            let file_path_clone = file_path.clone();
            let app_clone = app.clone();

            let handle = tokio::spawn(async move {
                manager.download_chunk(id, chunk, url_clone, file_path_clone, app_clone).await
            });

            handles.push(handle);
        }

        // Attendre tous les chunks
        let mut has_error = false;
        for handle in handles {
            if let Err(e) = handle.await {
                eprintln!("Chunk download error: {:?}", e);
                has_error = true;
            }
        }

        if has_error {
            return Err("One or more chunks failed to download".to_string());
        }

        Ok(())
    }

    // Téléchargement d'un chunk spécifique
    async fn download_chunk(
        &self,
        download_id: String,
        mut chunk: ChunkProgress,
        url: String,
        file_path: String,
        app: AppHandle,
    ) -> Result<(), String> {
        let mut retries = 0;
        
        while retries < self.config.max_retries {
            // Vérifier si le téléchargement a été annulé
            {
                let downloads = self.downloads.read().await;
                if let Some(progress) = downloads.get(&download_id) {
                    if progress.status == DownloadStatus::Cancelled {
                        return Err("Download cancelled".to_string());
                    }
                }
            }

            chunk.status = ChunkStatus::Downloading;
            self.update_chunk_progress(&download_id, &chunk).await;

            match self.download_chunk_attempt(&download_id, &mut chunk, &url, &file_path, &app).await {
                Ok(_) => {
                    chunk.status = ChunkStatus::Completed;
                    self.update_chunk_progress(&download_id, &chunk).await;
                    return Ok(());
                }
                Err(e) => {
                    retries += 1;
                    chunk.status = ChunkStatus::Failed;
                    
                    if retries < self.config.max_retries {
                        sleep(Duration::from_millis(self.config.retry_delay_ms * retries as u64)).await;
                    } else {
                        return Err(format!("Chunk {} failed after {} retries: {}", chunk.id, self.config.max_retries, e));
                    }
                }
            }
        }
        
        Ok(())
    }

    async fn download_chunk_attempt(
        &self,
        download_id: &str,
        chunk: &mut ChunkProgress,
        url: &str,
        file_path: &str,
        app: &AppHandle,
    ) -> Result<(), String> {
        // Ouvrir le fichier en mode lecture/écriture
        let mut file = OpenOptions::new()
            .create(true)
            .write(true)
            .read(true)
            .open(file_path)
            .await
            .map_err(|e| e.to_string())?;

        // Se positionner au début du chunk
        file.seek(SeekFrom::Start(chunk.start + chunk.downloaded)).await.map_err(|e| e.to_string())?;

        // Calculer la plage à télécharger
        let range_start = chunk.start + chunk.downloaded;
        let range_end = chunk.end;
        
        if range_start > range_end {
            return Ok(()); // Chunk déjà complet
        }

        // Faire la requête avec range
        let range_header = format!("bytes={}-{}", range_start, range_end);
        let mut response = self.client
            .get(url)
            .header(RANGE, range_header)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !response.status().is_success() && response.status().as_u16() != 206 {
            return Err(format!("HTTP error: {}", response.status()));
        }

        let _buffer = vec![0u8; 8192]; // Buffer de 8KB
        let _start_time = Instant::now();
        let mut last_update = Instant::now();

        while let Ok(bytes_read) = response.chunk().await {
            if let Some(chunk_data) = bytes_read {
                if chunk_data.is_empty() {
                    break;
                }

                file.write_all(&chunk_data).await.map_err(|e| e.to_string())?;
                chunk.downloaded += chunk_data.len() as u64;

                // Vérifier si on dépasse la taille du chunk
                if chunk.downloaded > (chunk.end - chunk.start + 1) {
                    chunk.downloaded = chunk.end - chunk.start + 1;
                    break;
                }

                // Mettre à jour la progression périodiquement
                let now = Instant::now();
                if now.duration_since(last_update).as_millis() >= self.config.progress_update_interval_ms as u128 {
                    self.update_chunk_progress(download_id, chunk).await;
                    self.emit_progress_event(download_id, app).await;
                    last_update = now;
                }
            } else {
                break;
            }
        }

        file.flush().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    // Téléchargement simple (sans chunks)
    async fn download_single_thread(&self, download_id: String, app: AppHandle) -> Result<(), String> {
        let (url, file_path, existing_size) = {
            let downloads = self.downloads.read().await;
            let progress = downloads.get(&download_id).ok_or("Download not found")?;
            (progress.url.clone(), progress.file_path.clone(), progress.downloaded)
        };

        // S'assurer que le répertoire parent existe
        if let Some(parent) = Path::new(&file_path).parent() {
            tokio::fs::create_dir_all(parent).await.map_err(|e| e.to_string())?;
        }

        let mut retries = 0;
        while retries < self.config.max_retries {
            // Vérifier si le téléchargement a été annulé
            {
                let downloads = self.downloads.read().await;
                if let Some(progress) = downloads.get(&download_id) {
                    if progress.status == DownloadStatus::Cancelled {
                        return Err("Download cancelled".to_string());
                    }
                }
            }

            match self.download_single_attempt(&download_id, &url, &file_path, existing_size, &app).await {
                Ok(_) => return Ok(()),
                Err(e) => {
                    retries += 1;
                    if retries < self.config.max_retries {
                        sleep(Duration::from_millis(self.config.retry_delay_ms * retries as u64)).await;
                    } else {
                        return Err(format!("Download failed after {} retries: {}", self.config.max_retries, e));
                    }
                }
            }
        }

        Ok(())
    }

    async fn download_single_attempt(
        &self,
        download_id: &str,
        url: &str,
        file_path: &str,
        resume_from: u64,
        app: &AppHandle,
    ) -> Result<(), String> {
        let mut request = self.client.get(url);
        
        // Ajouter header Range si reprise
        if resume_from > 0 {
            request = request.header(RANGE, format!("bytes={}-", resume_from));
        }

        let mut response = request.send().await.map_err(|e| e.to_string())?;

        if !response.status().is_success() && !(resume_from > 0 && response.status().as_u16() == 206) {
            return Err(format!("HTTP error: {}", response.status()));
        }

        // Ouvrir/créer le fichier
        let mut file = if resume_from > 0 {
            OpenOptions::new()
                .create(true)
                .append(true)
                .open(file_path)
                .await
                .map_err(|e| e.to_string())?
        } else {
            File::create(file_path).await.map_err(|e| e.to_string())?
        };

        let mut downloaded = resume_from;
        let start_time = Instant::now();
        let mut last_update = Instant::now();

        while let Ok(chunk_result) = response.chunk().await {
            if let Some(chunk) = chunk_result {
                if chunk.is_empty() {
                    break;
                }

                file.write_all(&chunk).await.map_err(|e| e.to_string())?;
                downloaded += chunk.len() as u64;

                // Mettre à jour la progression
                let now = Instant::now();
                if now.duration_since(last_update).as_millis() >= self.config.progress_update_interval_ms as u128 {
                    {
                        let mut downloads = self.downloads.write().await;
                        if let Some(progress) = downloads.get_mut(download_id) {
                            progress.downloaded = downloaded;
                            progress.percentage = if progress.total_size > 0 {
                                (downloaded as f64 / progress.total_size as f64) * 100.0
                            } else {
                                0.0
                            };
                            
                            // Calculer la vitesse
                            let elapsed = now.duration_since(start_time);
                            if elapsed.as_secs() > 0 {
                                progress.speed = ((downloaded - resume_from) as f64 / elapsed.as_secs_f64()) as u64;
                            }
                        }
                    }

                    self.emit_progress_event(download_id, app).await;
                    last_update = now;
                }
            } else {
                break;
            }
        }

        file.flush().await.map_err(|e| e.to_string())?;
        Ok(())
    }

    // Fonctions utilitaires
    async fn check_partial_support(&self, url: &str) -> Result<bool, String> {
        let response = self.client
            .head(url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        Ok(response.headers().get("accept-ranges")
            .and_then(|v| v.to_str().ok())
            .map(|v| v == "bytes")
            .unwrap_or(false))
    }

    async fn get_file_size(&self, url: &str) -> Result<u64, String> {
        let response = self.client
            .head(url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        response.headers()
            .get(CONTENT_LENGTH)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.parse().ok())
            .ok_or_else(|| "Unable to get file size".to_string())
    }

    async fn get_existing_file_size(&self, file_path: &str) -> u64 {
        tokio::fs::metadata(file_path)
            .await
            .map(|m| m.len())
            .unwrap_or(0)
    }

    async fn update_chunk_progress(&self, download_id: &str, chunk: &ChunkProgress) {
        let mut downloads = self.downloads.write().await;
        if let Some(progress) = downloads.get_mut(download_id) {
            if let Some(existing_chunk) = progress.chunks.iter_mut().find(|c| c.id == chunk.id) {
                *existing_chunk = chunk.clone();
            }

            // Recalculer la progression totale
            let total_downloaded: u64 = progress.chunks.iter().map(|c| c.downloaded).sum();
            progress.downloaded = total_downloaded;
            progress.percentage = if progress.total_size > 0 {
                (total_downloaded as f64 / progress.total_size as f64) * 100.0
            } else {
                0.0
            };
        }
    }

    async fn emit_progress_event(&self, download_id: &str, app: &AppHandle) {
        let progress_clone = {
            let downloads = self.downloads.read().await;
            downloads.get(download_id).cloned()
        };

        if let Some(progress) = progress_clone {
            let _ = app.emit("download-progress", &progress);
        }
    }

    // Méthodes publiques pour le contrôle des téléchargements
    pub async fn pause_download(&self, download_id: &str) -> Result<(), String> {
        let mut downloads = self.downloads.write().await;
        if let Some(progress) = downloads.get_mut(download_id) {
            if progress.status == DownloadStatus::Downloading {
                progress.status = DownloadStatus::Paused;
                Ok(())
            } else {
                Err("Download is not in progress".to_string())
            }
        } else {
            Err("Download not found".to_string())
        }
    }

    pub async fn resume_download(&self, download_id: String, app: AppHandle) -> Result<(), String> {
        let should_resume = {
            let mut downloads = self.downloads.write().await;
            if let Some(progress) = downloads.get_mut(&download_id) {
                if progress.status == DownloadStatus::Paused {
                    progress.status = DownloadStatus::Downloading;
                    true
                } else {
                    false
                }
            } else {
                false
            }
        };

        if should_resume {
            let manager = self.clone();
            let id = download_id.clone();
            let task = tokio::spawn(async move {
                let supports_partial = manager.check_partial_support(
                    &{
                        let downloads = manager.downloads.read().await;
                        downloads.get(&id).map(|p| p.url.clone()).unwrap_or_default()
                    }
                ).await.unwrap_or(false);
                
                manager.execute_download(id, supports_partial, app).await;
            });

            let mut tasks = self.active_tasks.write().await;
            tasks.insert(download_id, task);
        }

        Ok(())
    }

    pub async fn cancel_download(&self, download_id: &str) -> Result<(), String> {
        // Marquer comme annulé
        {
            let mut downloads = self.downloads.write().await;
            if let Some(progress) = downloads.get_mut(download_id) {
                progress.status = DownloadStatus::Cancelled;
            }
        }

        // Annuler la tâche active
        {
            let mut tasks = self.active_tasks.write().await;
            if let Some(handle) = tasks.remove(download_id) {
                handle.abort();
            }
        }

        Ok(())
    }

    pub async fn get_download_progress(&self, download_id: &str) -> Option<DownloadProgress> {
        let downloads = self.downloads.read().await;
        downloads.get(download_id).cloned()
    }

    pub async fn get_all_downloads(&self) -> Vec<DownloadProgress> {
        let downloads = self.downloads.read().await;
        downloads.values().cloned().collect()
    }

    pub async fn remove_download(&self, download_id: &str) -> Result<(), String> {
        // S'assurer que le téléchargement est arrêté
        self.cancel_download(download_id).await?;

        // Supprimer de la liste
        let mut downloads = self.downloads.write().await;
        downloads.remove(download_id);

        Ok(())
    }

    pub async fn cleanup_completed_downloads(&self) {
        let mut downloads = self.downloads.write().await;
        downloads.retain(|_, progress| {
            !matches!(progress.status, DownloadStatus::Completed | DownloadStatus::Failed | DownloadStatus::Cancelled)
        });
    }
}

impl Clone for DownloadManager {
    fn clone(&self) -> Self {
        Self {
            downloads: Arc::clone(&self.downloads),
            client: self.client.clone(),
            config: self.config.clone(),
            active_tasks: Arc::clone(&self.active_tasks),
        }
    }
}

// Commandes Tauri
#[tauri::command]
pub async fn start_download(
    url: String,
    file_path: String,
    manager: State<'_, DownloadManager>,
    app: AppHandle,
) -> Result<String, String> {
    manager.start_download(url, file_path, app).await
}

#[tauri::command]
pub async fn pause_download(
    download_id: String,
    manager: State<'_, DownloadManager>,
) -> Result<(), String> {
    manager.pause_download(&download_id).await
}

#[tauri::command]
pub async fn resume_download(
    download_id: String,
    manager: State<'_, DownloadManager>,
    app: AppHandle,
) -> Result<(), String> {
    manager.resume_download(download_id, app).await
}

#[tauri::command]
pub async fn cancel_download(
    download_id: String,
    manager: State<'_, DownloadManager>,
) -> Result<(), String> {
    manager.cancel_download(&download_id).await
}

#[tauri::command]
pub async fn remove_download(
    download_id: String,
    manager: State<'_, DownloadManager>,
) -> Result<(), String> {
    manager.remove_download(&download_id).await
}

#[tauri::command]
pub async fn get_download_progress(
    download_id: String,
    manager: State<'_, DownloadManager>,
) -> Result<Option<DownloadProgress>, String> {
    Ok(manager.get_download_progress(&download_id).await)
}

#[tauri::command]
pub async fn get_all_downloads(
    manager: State<'_, DownloadManager>,
) -> Result<Vec<DownloadProgress>, String> {
    Ok(manager.get_all_downloads().await)
}

#[tauri::command]
pub async fn cleanup_completed_downloads(
    manager: State<'_, DownloadManager>,
) -> Result<(), String> {
    manager.cleanup_completed_downloads().await;
    Ok(())
}

#[tauri::command]
pub async fn get_download_stats(
    manager: State<'_, DownloadManager>,
) -> Result<DownloadStats, String> {
    let downloads = manager.get_all_downloads().await;
    
    let stats = DownloadStats {
        total_downloads: downloads.len(),
        active_downloads: downloads.iter().filter(|d| matches!(d.status, DownloadStatus::Downloading | DownloadStatus::Pending)).count(),
        completed_downloads: downloads.iter().filter(|d| d.status == DownloadStatus::Completed).count(),
        failed_downloads: downloads.iter().filter(|d| d.status == DownloadStatus::Failed).count(),
        total_downloaded_bytes: downloads.iter().map(|d| d.downloaded).sum(),
        total_size_bytes: downloads.iter().map(|d| d.total_size).sum(),
    };
    
    Ok(stats)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadStats {
    pub total_downloads: usize,
    pub active_downloads: usize,
    pub completed_downloads: usize,
    pub failed_downloads: usize,
    pub total_downloaded_bytes: u64,
    pub total_size_bytes: u64,
}

// Fonction d'initialisation pour main.rs
pub fn init_download_manager() -> DownloadManager {
    let config = DownloadConfig {
        max_concurrent_chunks: 8,
        chunk_size: 2 * 1024 * 1024, // 2MB chunks
        max_retries: 5,
        retry_delay_ms: 2000,
        timeout_seconds: 60,
        progress_update_interval_ms: 100,
    };
    
    DownloadManager::new(config)
} 