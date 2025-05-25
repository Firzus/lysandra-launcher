use tauri::{Manager, Emitter};
use serde::{Serialize, Deserialize};
use tauri_plugin_http::reqwest;

// Module pour la vérification d'intégrité SHA-256
pub mod hash;
pub mod zip;

// Structure pour les événements de progression
#[derive(Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub progress_percentage: u32,
    pub progress: u64,
    pub total: u64,
    pub version: String,
}

// Commandes Tauri
#[tauri::command]
fn handle_download_progress(
    app_handle: tauri::AppHandle,
    progress_percentage: u32,
    progress: u64,
    total: u64,
    version: String,
) {
    app_handle.emit("download-progress", ProgressEvent {
        progress_percentage,
        progress,
        total,
        version,
    }).unwrap();
}

#[tauri::command]
fn handle_download_complete(app_handle: tauri::AppHandle, version: String) {
    app_handle.emit("download-complete", version).unwrap();
}

#[tauri::command]
fn verify_file_integrity(file_path: String) -> Result<String, String> {
    match std::panic::catch_unwind(|| hash::compute_sha256(&file_path)) {
        Ok(hash) => Ok(hash),
        Err(_) => Err(format!("Failed to compute hash for file: {}", file_path))
    }
}

#[tauri::command]
async fn fetch_manifest_from_github(url: String) -> Result<String, String> {
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Request failed: {}", response.status()));
    }

    let body = response.text().await.map_err(|e| e.to_string())?;
    Ok(body)
}

#[tauri::command]
fn read_version_file() -> Result<String, String> {
    std::fs::read_to_string("version.txt").map_err(|e| e.to_string())
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}



#[tauri::command]
fn create_dir_all(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn check_directory_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).is_dir())
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_directory(path: String) -> Result<(), String> {
    std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_directory_size(path: String) -> Result<u64, String> {
    fn dir_size(path: &std::path::Path) -> std::io::Result<u64> {
        let mut size = 0;
        if path.is_dir() {
            for entry in std::fs::read_dir(path)? {
                let entry = entry?;
                let path = entry.path();
                if path.is_dir() {
                    size += dir_size(&path)?;
                } else {
                    size += entry.metadata()?.len();
                }
            }
        }
        Ok(size)
    }
    
    dir_size(std::path::Path::new(&path)).map_err(|e| e.to_string())
}

/// Initialise la structure de base du launcher (appelé au setup)
fn initialize_launcher_structure(app_handle: &tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    
    // Obtenir le dossier app local data
    let app_local_data_dir = app_handle.path().app_local_data_dir()
        .map_err(|e| e.to_string())?;
    
    // Créer la structure de dossiers de base
    let directories = [
        app_local_data_dir.join("games"),
        app_local_data_dir.join("config"), 
        app_local_data_dir.join("cache"),
        app_local_data_dir.join("logs"),
    ];
    
    for dir in directories {
        std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    
    println!("Launcher structure initialized at: {:?}", app_local_data_dir);
    Ok(())
}

#[tauri::command]
async fn initialize_launcher_directories(app_handle: tauri::AppHandle) -> Result<(), String> {
    initialize_launcher_structure(&app_handle)
}

#[tauri::command]
async fn open_folder_dialog(app_handle: tauri::AppHandle, title: String, default_path: Option<String>) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    use std::sync::mpsc;
    
    let mut dialog = app_handle.dialog().file();
    
    dialog = dialog.set_title(&title);
    
    if let Some(path) = default_path {
        if !path.is_empty() {
            dialog = dialog.set_directory(&path);
        }
    }
    
    let (tx, rx) = mpsc::channel();
    
    dialog.pick_folder(move |result| {
        let _ = tx.send(result);
    });
    
    match rx.recv().map_err(|e| e.to_string())? {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus on the main window when trying to open a second instance
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())        
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())        
        .invoke_handler(tauri::generate_handler![
            handle_download_progress,
            handle_download_complete,
            verify_file_integrity,
            fetch_manifest_from_github,
            read_version_file,
            read_text_file,
            write_text_file,
            create_dir_all,
            check_directory_exists,
            open_folder,
            delete_file,
            delete_directory,
            get_directory_size,
            initialize_launcher_directories,
            open_folder_dialog,
            zip::extract_zip_file
        ])
        .setup(|app| {
            // Initialiser la structure de base du launcher au démarrage
            if let Err(e) = initialize_launcher_structure(app.handle()) {
                eprintln!("Failed to initialize launcher structure: {}", e);
            }
            
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
