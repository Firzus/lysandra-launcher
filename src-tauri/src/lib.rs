use serde::{Deserialize, Serialize};
use tauri::Emitter;
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
    if let Err(e) = app_handle.emit(
        "download-progress",
        ProgressEvent {
            progress_percentage,
            progress,
            total,
            version,
        },
    ) {
        eprintln!("Failed to emit download-progress event: {}", e);
    }
}

#[tauri::command]
fn handle_download_complete(app_handle: tauri::AppHandle, version: String) {
    if let Err(e) = app_handle.emit("download-complete", version) {
        eprintln!("Failed to emit download-complete event: {}", e);
    }
}

#[tauri::command]
fn verify_file_integrity(file_path: String) -> Result<String, String> {
    match std::panic::catch_unwind(|| hash::compute_sha256(&file_path)) {
        Ok(hash_result) => match hash_result {
            Ok(hash) => Ok(hash),
            Err(e) => Err(format!("IO error computing hash for file {}: {}", file_path, e)),
        },
        Err(_) => Err(format!("Failed to compute hash for file: {}", file_path)),
    }
}

#[tauri::command]
async fn fetch_manifest_from_github(url: String) -> Result<String, String> {
    println!("🌐 Fetching manifest from: {}", url);
    
    let response = reqwest::get(&url).await.map_err(|e| {
        format!("Network error fetching {}: {}", url, e)
    })?;
    
    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Unable to read error response".to_string());
        return Err(format!("HTTP {} from {}: {}", status, url, error_body));
    }

    let body = response.text().await.map_err(|e| {
        format!("Failed to read response body from {}: {}", url, e)
    })?;
    
    println!("✅ Successfully fetched manifest from: {}", url);
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

/// Initialise la structure de base du launcher (appelé au setup)
fn initialize_launcher_structure(app_handle: &tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;

    // Obtenir le dossier app local data
    let app_local_data_dir = app_handle
        .path()
        .app_local_data_dir()
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

    println!(
        "Launcher structure initialized at: {:?}",
        app_local_data_dir
    );
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_upload::init());

    // Plugins conditionnels pour desktop uniquement
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))
            .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
                println!("{}, {argv:?}, {cwd}", app.package_info().name);
            }));
        
        // Plugin updater uniquement si activé par variable d'environnement
        if std::env::var("TAURI_CONFIG_PLUGINS_UPDATER_ACTIVE").unwrap_or_default() == "true" {
            builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
        }
    }

    builder
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
            zip::extract_zip_file
        ])
        .setup(|app| {
            println!("🚀 Tauri application starting...");
            
            // Initialiser la structure de base du launcher au démarrage
            println!("📁 Initializing launcher structure...");
            if let Err(e) = initialize_launcher_structure(app.handle()) {
                eprintln!("❌ Failed to initialize launcher structure: {}", e);
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, e)));
            }
            println!("✅ Launcher structure initialized successfully");

            println!("🌐 Tauri setup completed successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
