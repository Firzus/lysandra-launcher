use std::{
    fs::{self, File},
    path::{Path, PathBuf},
    thread,
    time::Duration,
};

use ::zip::ZipArchive;
use serde::{Deserialize, Serialize};
use tauri::Emitter;

// Structure pour les événements de progression d'extraction
#[derive(Clone, Serialize, Deserialize)]
pub struct ExtractionProgressEvent {
    pub current_file: u32,
    pub total_files: u32,
    pub progress_percentage: u32,
    pub current_file_name: String,
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

// Version synchrone pour compatibilité
#[tauri::command]
pub fn extract_zip_file(file_path: String, extract_to: String) -> Result<(), String> {
    extract_zip_sync(&file_path, &extract_to)
}

// Version asynchrone avec événements de progression
#[tauri::command]
pub async fn extract_zip_file_async(
    app_handle: tauri::AppHandle,
    file_path: String,
    extract_to: String,
) -> Result<(), String> {
    let app_handle_clone = app_handle.clone();
    
    // Exécuter l'extraction dans un thread séparé pour éviter de bloquer l'UI
    let result = tokio::task::spawn_blocking(move || {
        extract_zip_with_progress(&file_path, &extract_to, &app_handle_clone)
    }).await;

    match result {
        Ok(extraction_result) => extraction_result,
        Err(e) => Err(format!("❌ Extraction task failed: {}", e)),
    }
}

fn extract_zip_sync(file_path: &str, extract_to: &str) -> Result<(), String> {
    let zip_file = File::open(file_path).map_err(|e| format!("❌ Failed to open zip: {}", e))?;
    let mut archive =
        ZipArchive::new(zip_file).map_err(|e| format!("❌ Invalid zip archive: {}", e))?;

    fs::create_dir_all(extract_to)
        .map_err(|e| format!("❌ Failed to create output dir: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("❌ Cannot access entry: {}", e))?;
        let entry_name = file.name();

        let relative_path = match sanitize_zip_path(entry_name) {
            Some(path) => path,
            None => {
                println!("⚠️ Skipped suspicious file path: {}", entry_name);
                continue;
            }
        };

        let out_path = Path::new(extract_to).join(&relative_path);

        if file.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

fn extract_zip_with_progress(
    file_path: &str,
    extract_to: &str,
    app_handle: &tauri::AppHandle,
) -> Result<(), String> {
    let zip_file = File::open(file_path).map_err(|e| format!("❌ Failed to open zip: {}", e))?;
    let mut archive =
        ZipArchive::new(zip_file).map_err(|e| format!("❌ Invalid zip archive: {}", e))?;

    fs::create_dir_all(extract_to)
        .map_err(|e| format!("❌ Failed to create output dir: {}", e))?;

    let total_files = archive.len() as u32;
    println!("📦 Starting extraction of {} files...", total_files);

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("❌ Cannot access entry: {}", e))?;
        let entry_name = file.name().to_string();

        let relative_path = match sanitize_zip_path(&entry_name) {
            Some(path) => path,
            None => {
                println!("⚠️ Skipped suspicious file path: {}", entry_name);
                continue;
            }
        };

        let out_path = Path::new(extract_to).join(&relative_path);
        let current_file = (i + 1) as u32;
        let progress_percentage = (current_file * 100) / total_files;

        // Émettre l'événement de progression
        let progress_event = ExtractionProgressEvent {
            current_file,
            total_files,
            progress_percentage,
            current_file_name: entry_name.clone(),
        };

        if let Err(e) = app_handle.emit("extraction-progress", progress_event) {
            eprintln!("Failed to emit extraction-progress event: {}", e);
        }

        if file.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            println!("📁 Created directory: {}", entry_name);
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            println!("📄 Extracted file: {}", entry_name);
        }

        // Petite pause pour permettre à l'UI de se mettre à jour
        thread::sleep(Duration::from_millis(1));
    }

    // Émettre l'événement de fin d'extraction
    if let Err(e) = app_handle.emit("extraction-complete", ()) {
        eprintln!("Failed to emit extraction-complete event: {}", e);
    }

    println!("✅ Extraction completed successfully!");
    Ok(())
}
