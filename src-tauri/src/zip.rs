use std::{
    fs::{self, File},
    path::{Path, PathBuf},
};

use ::zip::ZipArchive;
use tauri::{AppHandle, Emitter};
use serde::{Deserialize, Serialize};
use tokio::time::{sleep, Duration};
use tokio::sync::mpsc;
use log::{info, debug, warn};

// Structure pour les événements de progression d'extraction
#[derive(Clone, Serialize, Deserialize)]
pub struct ExtractionProgress {
    pub extraction_id: String,
    pub current_file: String,
    pub files_processed: usize,
    pub total_files: usize,
    pub percentage: f64,
    pub status: String, // "extracting", "completed", "failed"
}

/// Sanitize ZIP file entries to avoid path traversal attacks
fn sanitize_zip_path(entry: &str) -> Option<PathBuf> {
    let path = Path::new(entry);
    if path
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        None
    } else {
        Some(path.to_path_buf())
    }
}

// Version synchrone simple
#[tauri::command]
pub fn extract_zip_file(file_path: String, extract_to: String) -> Result<(), String> {
    let zip_file = File::open(&file_path).map_err(|e| format!("Failed to open zip: {}", e))?;
    let mut archive =
        ZipArchive::new(zip_file).map_err(|e| format!("Invalid zip archive: {}", e))?;

    fs::create_dir_all(&extract_to)
        .map_err(|e| format!("Failed to create output dir: {}", e))?;

    let total_files = archive.len();
    info!("Starting extraction of {} files to: {}", total_files, extract_to);

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Cannot access entry: {}", e))?;
        let entry_name = file.name().to_string();

        let relative_path = match sanitize_zip_path(&entry_name) {
            Some(path) => path,
            None => {
                warn!("Skipped suspicious file path: {}", entry_name);
                continue;
            }
        };

        let out_path = Path::new(&extract_to).join(&relative_path);

        if file.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            debug!("Created directory: {}", entry_name);
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            debug!("Extracted file: {}", entry_name);
        }
    }

    info!("Extraction completed successfully!");
    Ok(())
}

// Version asynchrone avec événements de progression
#[tauri::command]
pub async fn extract_zip_file_async(
    file_path: String,
    extract_to: String,
    extraction_id: String,
    app: AppHandle,
) -> Result<(), String> {
    // Créer un channel pour communiquer les événements de progression
    let (progress_tx, mut progress_rx) = mpsc::unbounded_channel::<ExtractionProgress>();

    // Émettre le début de l'extraction
    let _ = app.emit(
        "extraction-progress",
        ExtractionProgress {
            extraction_id: extraction_id.clone(),
            current_file: String::new(),
            files_processed: 0,
            total_files: 0,
            percentage: 0.0,
            status: "starting".to_string(),
        },
    );

    // Cloner les variables pour la tâche blocking
    let file_path_clone = file_path.clone();
    let extract_to_clone = extract_to.clone();
    let extraction_id_clone = extraction_id.clone();
    let progress_tx_clone = progress_tx.clone();
    
    // Spawner la tâche d'extraction en parallèle avec la tâche d'émission d'événements
    let extraction_task = tokio::task::spawn_blocking(move || -> Result<(), String> {
        let zip_file = File::open(&file_path_clone).map_err(|e| format!("Failed to open zip: {}", e))?;
        let mut archive = ZipArchive::new(zip_file).map_err(|e| format!("Invalid zip archive: {}", e))?;

        fs::create_dir_all(&extract_to_clone)
            .map_err(|e| format!("Failed to create output dir: {}", e))?;

        let total_files = archive.len();
        info!("Starting async extraction of {} files to: {}", total_files, extract_to_clone);

        // Envoyer la progression initiale avec le nombre total de fichiers
        let _ = progress_tx_clone.send(ExtractionProgress {
            extraction_id: extraction_id_clone.clone(),
            current_file: String::new(),
            files_processed: 0,
            total_files,
            percentage: 0.0,
            status: "extracting".to_string(),
        });

        for i in 0..archive.len() {
            let mut file = archive
                .by_index(i)
                .map_err(|e| format!("Cannot access entry: {}", e))?;
            let entry_name = file.name().to_string();

            let relative_path = match sanitize_zip_path(&entry_name) {
                Some(path) => path,
                None => {
                    warn!("Skipped suspicious file path: {}", entry_name);
                    continue;
                }
            };

            let out_path = Path::new(&extract_to_clone).join(&relative_path);

            if file.is_dir() {
                fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
                debug!("Created directory: {}", entry_name);
            } else {
                if let Some(parent) = out_path.parent() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
                let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
                std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
                debug!("Extracted file: {}", entry_name);
            }

            // Calculer et envoyer la progression
            let files_processed = i + 1;
            let percentage = (files_processed as f64 / total_files as f64) * 100.0;

            let _ = progress_tx_clone.send(ExtractionProgress {
                extraction_id: extraction_id_clone.clone(),
                current_file: entry_name,
                files_processed,
                total_files,
                percentage,
                status: "extracting".to_string(),
            });
        }

        // Envoyer la completion
        let _ = progress_tx_clone.send(ExtractionProgress {
            extraction_id: extraction_id_clone.clone(),
            current_file: String::new(),
            files_processed: total_files,
            total_files,
            percentage: 100.0,
            status: "completed".to_string(),
        });

        info!("Async extraction completed successfully!");
        Ok(())
    });

    // Tâche pour émettre les événements de progression
    let event_task = tokio::spawn(async move {
        while let Some(progress) = progress_rx.recv().await {
            let _ = app.emit("extraction-progress", progress);
            
            // Petit délai pour ne pas spammer les événements et permettre à l'UI de se mettre à jour
            sleep(Duration::from_millis(10)).await;
        }
    });

    // Attendre que l'extraction soit terminée
    let extraction_result = extraction_task
        .await
        .map_err(|e| format!("Task join error: {}", e))?;

    // Fermer le channel et attendre que tous les événements soient émis
    drop(progress_tx); // Fermer l'envoyeur pour terminer la boucle de réception
    let _ = event_task.await;

    extraction_result
}
