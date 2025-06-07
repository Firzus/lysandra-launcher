use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};
use tauri_plugin_http::reqwest;
use std::path::Path;

// Modules
pub mod hash;
pub mod zip;
pub mod download_manager;
pub mod game_detection;
pub mod path_manager;
pub mod windows_permissions;
pub mod updater_manager;

// Structure pour les événements de progression
#[derive(Clone, Serialize, Deserialize)]
pub struct ProgressEvent {
    pub progress_percentage: u32,
    pub progress: u64,
    pub total: u64,
    pub version: String,
}

// Structure pour les événements de désinstallation
#[derive(Clone, Serialize, Deserialize)]
pub struct UninstallEvent {
    pub game_id: String,
    pub step: String,
    pub message: String,
    pub success: bool,
}

// Structure pour les événements de processus de jeu
#[derive(Clone, Serialize, Deserialize)]
pub struct GameProcessEvent {
    #[serde(rename = "gameId")]
    pub game_id: String,
    #[serde(rename = "processId")]
    pub process_id: Option<u32>,
    pub status: String, // "starting", "running", "stopped"
    pub error: Option<String>,
}

// Structures pour le manifest du launcher
#[derive(Clone, Serialize, Deserialize)]
pub struct LauncherManifest {
    pub success: bool,
    pub data: LauncherManifestData,
    pub repository: String,
    pub cached: bool,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct LauncherManifestData {
    pub version: String,
    pub name: String,
    pub description: String,
    pub published_at: String,
    pub html_url: String,
    #[serde(rename = "type")]
    pub manifest_type: String,
    pub platforms: LauncherPlatforms,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct LauncherPlatforms {
    pub windows: Option<PlatformAsset>,
    pub macos: Option<PlatformAsset>,
    pub linux: Option<PlatformAsset>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct PlatformAsset {
    pub url: String,
    pub size: u64,
    pub name: String,
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
fn emit_uninstall_event(
    app_handle: tauri::AppHandle,
    game_id: String,
    step: String,
    message: String,
    success: bool,
) {
    let event = UninstallEvent {
        game_id,
        step,
        message,
        success,
    };
    
    if let Err(e) = app_handle.emit("game-uninstall", event) {
        eprintln!("Failed to emit game-uninstall event: {}", e);
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
    
    // Créer un client avec les headers requis
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Content-Type", "application/json")
        .header("User-Agent", "HuzStudioLauncher/1.0.0")
        .header("Accept", "application/json")
        .header("Accept-Encoding", "gzip, deflate")
        .send()
        .await
        .map_err(|e| {
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
async fn read_version_file() -> Result<LauncherManifest, String> {
    const MANIFEST_URL: &str = "https://huz-studio-api.up.railway.app/api/v1/manifests/launcher";
    
    println!("🔍 Fetching launcher manifest from: {}", MANIFEST_URL);
    
    // Créer un client avec les headers requis
    let client = reqwest::Client::new();
    let response = client
        .get(MANIFEST_URL)
        .header("Content-Type", "application/json")
        .header("User-Agent", "HuzStudioLauncher/1.0.0")
        .header("Accept", "application/json")
        .header("Accept-Encoding", "gzip, deflate")
        .send()
        .await
        .map_err(|e| {
            format!("Network error fetching launcher manifest: {}", e)
        })?;
    
    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Unable to read error response".to_string());
        return Err(format!("HTTP {} from launcher manifest API: {}", status, error_body));
    }

    let manifest_text = response.text().await.map_err(|e| {
        format!("Failed to read launcher manifest response body: {}", e)
    })?;
    
    let manifest: LauncherManifest = serde_json::from_str(&manifest_text).map_err(|e| {
        format!("Failed to parse launcher manifest JSON: {}", e)
    })?;
    
    println!("✅ Successfully fetched launcher manifest, version: {}", manifest.data.version);
    Ok(manifest)
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
fn check_file_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).is_file())
}

#[tauri::command]
fn get_file_size(path: String) -> Result<u64, String> {
    use std::fs;
    use std::path::Path;
    
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    
    fs::metadata(file_path)
        .map(|metadata| metadata.len())
        .map_err(|e| format!("Failed to get file size for {}: {}", path, e))
}

// Nouvelle fonction pour lire les premiers bytes d'un fichier (test d'accessibilité)
#[tauri::command]
fn read_binary_file_head(path: String, size: usize) -> Result<Vec<u8>, String> {
    use std::fs::File;
    use std::io::{Read, BufReader};
    use std::path::Path;
    
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    if !file_path.is_file() {
        return Err(format!("Path is not a file: {}", path));
    }
    
    let file = File::open(file_path)
        .map_err(|e| format!("Failed to open file {}: {}", path, e))?;
    
    let mut reader = BufReader::new(file);
    let mut buffer = vec![0u8; size];
    
    match reader.read(&mut buffer) {
        Ok(bytes_read) => {
            buffer.truncate(bytes_read);
            Ok(buffer)
        },
        Err(e) => Err(format!("Failed to read from file {}: {}", path, e))
    }
}

// Nouvelle fonction pour forcer la synchronisation du cache système
#[tauri::command]
fn force_file_sync(path: String) -> Result<(), String> {
    use std::fs::File;
    use std::path::Path;
    
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    
    // Ouvrir le fichier et forcer la synchronisation
    let file = File::open(file_path)
        .map_err(|e| format!("Failed to open file for sync {}: {}", path, e))?;
    
    #[cfg(windows)]
    {
        // Sur Windows, utiliser FlushFileBuffers
        use std::os::windows::io::AsRawHandle;
        use winapi::um::fileapi::FlushFileBuffers;
        
        let handle = file.as_raw_handle() as winapi::um::winnt::HANDLE;
        unsafe {
            if FlushFileBuffers(handle) == 0 {
                return Err("Failed to flush file buffers".to_string());
            }
        }
    }
    
    #[cfg(unix)]
    {
        // Sur Unix, utiliser fsync
        use std::os::unix::io::AsRawFd;
        
        let fd = file.as_raw_fd();
        unsafe {
            if libc::fsync(fd) != 0 {
                return Err("Failed to sync file".to_string());
            }
        }
    }
    
    Ok(())
}

#[tauri::command]
async fn launch_game_with_shell(
    app_handle: tauri::AppHandle,
    executable_path: String,
    game_id: String,
) -> Result<(), String> {
    use tauri_plugin_shell::{ShellExt, process::CommandEvent};
    
    println!("🚀 Launching game executable with shell: {}", executable_path);
    
    let shell = app_handle.shell();
    let (mut rx, child) = shell
        .command(&executable_path)
        .spawn()
        .map_err(|e| format!("Failed to spawn game process: {}", e))?;
    
    println!("✅ Game process spawned successfully");
    
    // Émettre immédiatement l'événement de démarrage
    let starting_event = GameProcessEvent {
        game_id: game_id.clone(),
        process_id: Some(child.pid()),
        status: "starting".to_string(),
        error: None,
    };
    
    if let Err(e) = app_handle.emit("game-process-event", starting_event) {
        eprintln!("Failed to emit starting event: {}", e);
    }
    
    let app_handle_clone = app_handle.clone();
    let game_id_clone = game_id.clone();
    
    // Gérer les événements du processus en arrière-plan
    tauri::async_runtime::spawn(async move {
        let mut has_started = false;
        
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(data) => {
                    let output = String::from_utf8_lossy(&data);
                    println!("🎮 Game stdout: {}", output.trim());
                    
                    // Émettre l'événement "running" au premier output
                    if !has_started {
                        has_started = true;
                                                 let running_event = GameProcessEvent {
                             game_id: game_id_clone.clone(),
                             process_id: Some(child.pid()),
                             status: "running".to_string(),
                             error: None,
                         };
                        
                        if let Err(e) = app_handle_clone.emit("game-process-event", running_event) {
                            eprintln!("Failed to emit running event: {}", e);
                        } else {
                            println!("✅ Game process confirmed running");
                        }
                    }
                }
                CommandEvent::Stderr(data) => {
                    let error_output = String::from_utf8_lossy(&data);
                    println!("🎮 Game stderr: {}", error_output.trim());
                }
                CommandEvent::Error(error) => {
                    println!("❌ Game process error: {}", error);
                    let error_event = GameProcessEvent {
                        game_id: game_id_clone.clone(),
                        process_id: Some(child.pid()),
                        status: "stopped".to_string(),
                        error: Some(error),
                    };
                    let _ = app_handle_clone.emit("game-process-event", error_event);
                    break;
                }
                CommandEvent::Terminated(payload) => {
                    println!("🛑 Game process terminated with code: {:?}, signal: {:?}", 
                             payload.code, payload.signal);
                    
                    let stopped_event = GameProcessEvent {
                        game_id: game_id_clone.clone(),
                        process_id: Some(child.pid()),
                        status: "stopped".to_string(),
                        error: payload.code.and_then(|code| {
                            if code != 0 {
                                Some(format!("Process exited with code {}", code))
                            } else {
                                None
                            }
                        }),
                    };
                    
                    if let Err(e) = app_handle_clone.emit("game-process-event", stopped_event) {
                        eprintln!("Failed to emit stopped event: {}", e);
                    } else {
                        println!("✅ Successfully emitted stopped event");
                    }
                    break;
                }
                _ => {
                    // Autres événements non gérés
                    println!("🔍 Unhandled command event");
                }
            }
        }
        
        println!("🔚 Game process monitoring ended");
    });
    
    Ok(())
}

// Fonction supprimée - remplacée par launch_game_with_shell utilisant le plugin Shell de Tauri

// Fonctions obsolètes supprimées - remplacées par le plugin Shell de Tauri

#[tauri::command]
fn get_directory_size(path: String) -> Result<u64, String> {
    use std::fs;
    use std::path::Path;
    
    fn calculate_dir_size(dir: &Path) -> Result<u64, std::io::Error> {
        let mut size = 0;
        
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                
                if path.is_dir() {
                    size += calculate_dir_size(&path)?;
                } else {
                    size += entry.metadata()?.len();
                }
            }
        }
        
        Ok(size)
    }
    
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Ok(0); // Si le dossier n'existe pas, retourner 0
    }
    
    calculate_dir_size(dir_path)
        .map_err(|e| format!("Failed to calculate directory size: {}", e))
}

#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;
    
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Ok(()); // Si le fichier n'existe pas, considérer comme succès
    }
    
    if file_path.is_file() {
        fs::remove_file(file_path)
            .map_err(|e| format!("Failed to delete file {}: {}", path, e))
    } else {
        Err(format!("Path {} is not a file", path))
    }
}

#[tauri::command]
fn delete_directory(path: String) -> Result<(), String> {
    use std::fs;
    use std::path::Path;
    
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Ok(()); // Si le dossier n'existe pas, considérer comme succès
    }
    
    if dir_path.is_dir() {
        fs::remove_dir_all(dir_path)
            .map_err(|e| format!("Failed to delete directory {}: {}", path, e))
    } else {
        Err(format!("Path {} is not a directory", path))
    }
}

#[tauri::command]
fn list_directory_contents(path: String) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::Path;
    
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err(format!("Directory does not exist: {}", path));
    }
    
    if !dir_path.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    
    let mut contents = Vec::new();
    
    match fs::read_dir(dir_path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let file_name = entry.file_name().to_string_lossy().to_string();
                        let is_dir = entry.path().is_dir();
                        let prefix = if is_dir { "[DIR] " } else { "[FILE] " };
                        contents.push(format!("{}{}", prefix, file_name));
                    }
                    Err(e) => {
                        contents.push(format!("[ERROR] Failed to read entry: {}", e));
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!("Failed to read directory {}: {}", path, e));
        }
    }
    
    Ok(contents)
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_app_data_dir(_app: tauri::AppHandle) -> Result<String, String> {
    // Utilise maintenant la nouvelle structure HuzStudio
    path_manager::PathManager::get_huzstudio_root()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn store_config(_app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
    use std::collections::HashMap;
    
    // Utiliser le nouveau gestionnaire de chemins pour le répertoire config
    let config_dir = path_manager::PathManager::get_config_dir()?;
    
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let config_file = config_dir.join("launcher_config.json");
    
    // Lire la configuration existante ou créer une nouvelle
    let mut config_map: HashMap<String, String> = if config_file.exists() {
        let content = std::fs::read_to_string(&config_file)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        HashMap::new()
    };
    
    // Ajouter/mettre à jour la clé
    config_map.insert(key, value);
    
    // Sauvegarder
    let json_content = serde_json::to_string_pretty(&config_map)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    
    std::fs::write(&config_file, json_content)
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn get_config(_app: tauri::AppHandle, key: String) -> Result<String, String> {
    use std::collections::HashMap;
    
    let config_dir = path_manager::PathManager::get_config_dir()?;
    let config_file = config_dir.join("launcher_config.json");
    
    if !config_file.exists() {
        return Err("Config file not found".to_string());
    }
    
    let content = std::fs::read_to_string(&config_file)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    let config_map: HashMap<String, String> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config file: {}", e))?;
    
    config_map.get(&key)
        .cloned()
        .ok_or_else(|| format!("Key '{}' not found in config", key))
}

#[tauri::command]
fn get_free_space(path: String) -> Result<u64, String> {
    use std::path::Path;
    
    let _path_obj = Path::new(&path);
    
    // Utiliser statvfs sur Unix ou GetDiskFreeSpaceEx sur Windows
    #[cfg(unix)]
    {
        use std::ffi::CString;
        use libc::{statvfs, c_char};
        
        let c_path = CString::new(path.as_bytes())
            .map_err(|e| format!("Invalid path: {}", e))?;
        
        let mut stat: libc::statvfs = unsafe { std::mem::zeroed() };
        
        let result = unsafe { statvfs(c_path.as_ptr() as *const c_char, &mut stat) };
        
        if result == 0 {
            let free_space = stat.f_bavail * stat.f_frsize;
            Ok(free_space as u64)
        } else {
            Err("Failed to get disk free space".to_string())
        }
    }
    
    #[cfg(windows)]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use winapi::um::fileapi::GetDiskFreeSpaceExW;
        
        let wide_path: Vec<u16> = OsStr::new(&path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        
        let mut free_bytes_available: u64 = 0;
        let mut total_bytes: u64 = 0;
        let mut total_free_bytes: u64 = 0;
        
        let result = unsafe {
            GetDiskFreeSpaceExW(
                wide_path.as_ptr(),
                &mut free_bytes_available as *mut u64 as *mut _,
                &mut total_bytes as *mut u64 as *mut _,
                &mut total_free_bytes as *mut u64 as *mut _,
            )
        };
        
        if result != 0 {
            Ok(free_bytes_available)
        } else {
            Err("Failed to get disk free space".to_string())
        }
    }
    
    #[cfg(not(any(unix, windows)))]
    {
        Err("Platform not supported for disk space check".to_string())
    }
}

// ===== COMMANDES WINDOWS PERMISSIONS =====

/// Obtient le statut des permissions Windows
#[tauri::command]
fn get_windows_permission_status() -> windows_permissions::PermissionStatus {
    windows_permissions::get_permission_status()
}

/// Vérifie si l'application s'exécute avec des privilèges administrateur
#[tauri::command]
fn is_running_as_admin() -> Result<bool, String> {
    windows_permissions::is_running_as_admin()
        .map_err(|e| e.to_string())
}

/// Vérifie si UAC est activé sur le système
#[tauri::command]
fn is_uac_enabled() -> bool {
    windows_permissions::is_uac_enabled()
}

/// Vérifie si une opération nécessite des privilèges élevés
#[tauri::command]
fn requires_elevation(operation: String) -> bool {
    windows_permissions::requires_elevation(&operation)
}

/// Vérifie si l'utilisateur peut effectuer une opération donnée
#[tauri::command]
fn can_perform_operation(operation: String) -> bool {
    windows_permissions::can_perform_operation(&operation)
}

/// Redémarre l'application avec des privilèges élevés
#[tauri::command]
fn restart_as_admin(executable_path: String, arguments: Option<String>) -> Result<(), String> {
    windows_permissions::restart_as_admin(&executable_path, arguments.as_deref())
        .map_err(|e| e.to_string())
}

/// Exécute une commande avec des privilèges élevés
#[tauri::command]
fn run_elevated_command(command: String, arguments: Option<String>, show_window: bool) -> Result<(), String> {
    windows_permissions::run_elevated_command(&command, arguments.as_deref(), show_window)
        .map_err(|e| e.to_string())
}

/// Vérifie si l'application peut effectuer des mises à jour (nécessite admin ou UAC)
#[tauri::command]
fn can_update_application() -> bool {
    windows_permissions::can_perform_operation("update")
}

/// Demande l'élévation pour effectuer une mise à jour
#[tauri::command]
fn request_update_elevation(app_handle: tauri::AppHandle) -> Result<(), String> {
    let status = windows_permissions::get_permission_status();
    
    if status.is_admin {
        return Ok(()); // Déjà admin, pas besoin d'élévation
    }
    
    if !status.can_elevate {
        return Err("UAC n'est pas disponible sur ce système".to_string());
    }
    
    // Obtenir le chemin de l'exécutable actuel
    let current_exe = std::env::current_exe()
        .map_err(|e| format!("Impossible d'obtenir le chemin de l'exécutable: {}", e))?;
    
    let exe_path = current_exe.to_string_lossy().to_string();
    
    // Redémarrer avec des privilèges élevés
    windows_permissions::restart_as_admin(&exe_path, Some("--elevated-update"))
        .map_err(|e| e.to_string())?;
    
    // Fermer l'instance actuelle après avoir lancé la version élevée
    app_handle.exit(0);
    
    Ok(())
}

#[tauri::command]
async fn copy_directory(source: String, destination: String) -> Result<(), String> {
    use std::path::Path;
    
    let src_path = Path::new(&source);
    let dst_path = Path::new(&destination);
    
    if !src_path.exists() {
        return Err(format!("Source directory does not exist: {}", source));
    }
    
    if !src_path.is_dir() {
        return Err(format!("Source is not a directory: {}", source));
    }
    
    // Créer le dossier de destination
    std::fs::create_dir_all(dst_path)
        .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    
    // Copier récursivement
    copy_dir_recursive(src_path, dst_path)
        .map_err(|e| format!("Failed to copy directory: {}", e))
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> std::io::Result<()> {
    if src.is_dir() {
        std::fs::create_dir_all(dst)?;
        
        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());
            
            if src_path.is_dir() {
                copy_dir_recursive(&src_path, &dst_path)?;
            } else {
                std::fs::copy(&src_path, &dst_path)?;
            }
        }
    } else {
        std::fs::copy(src, dst)?;
    }
    
    Ok(())
}

/// Initialise la structure de base du launcher (appelé au setup)
fn initialize_launcher_structure(_app_handle: &tauri::AppHandle) -> Result<(), String> {
    // Utiliser le nouveau PathManager pour initialiser la structure HuzStudio
    path_manager::PathManager::initialize_structure()?;
    
    println!("✅ HuzStudio launcher structure initialized successfully");
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
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_upload::init());

    // Plugins conditionnels pour desktop uniquement
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))
            .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
                println!("{}, {argv:?}, {cwd}", app.package_info().name);
            }));
        
        // Plugin updater uniquement en release
        #[cfg(not(debug_assertions))]
        {
            builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
        }
    }

    builder
        .invoke_handler(tauri::generate_handler![
            handle_download_progress,
            handle_download_complete,
            emit_uninstall_event,
            verify_file_integrity,
            fetch_manifest_from_github,
            read_version_file,
            read_text_file,
            write_text_file,
            create_dir_all,
            check_directory_exists,
            check_file_exists,
            get_file_size,
            launch_game_with_shell,
            get_directory_size,
            delete_file,
            delete_directory,
            list_directory_contents,
            zip::extract_zip_file,
            zip::extract_zip_file_async,
            // Commandes du download manager
            download_manager::start_download,
            download_manager::pause_download,
            download_manager::resume_download,
            download_manager::cancel_download,
            download_manager::remove_download,
            download_manager::get_download_progress,
            download_manager::get_all_downloads,
            download_manager::cleanup_completed_downloads,
            download_manager::get_download_stats,
            // Commandes de détection automatique de jeux
            game_detection::search_installed_games,
            game_detection::validate_game_installation,
            game_detection::get_common_game_directories,
            get_app_data_dir,
            get_free_space,
            copy_directory,
            store_config,
            get_config,
            // Nouvelles fonctions pour la vérification d'intégrité
            read_binary_file_head,
            force_file_sync,
            // Nouvelles commandes PathManager pour la structure HuzStudio
            path_manager::get_huzstudio_root_path,
            path_manager::get_games_directory,
            path_manager::get_config_directory,
            path_manager::get_cache_directory,
            path_manager::get_logs_directory,
            path_manager::get_game_directory,
            path_manager::get_game_install_directory,
            path_manager::initialize_game_directories,
            path_manager::verify_huzstudio_structure,
            // Commandes Windows Permissions
            get_windows_permission_status,
            is_running_as_admin,
            is_uac_enabled,
            requires_elevation,
            can_perform_operation,
            restart_as_admin,
            run_elevated_command,
            can_update_application,
            request_update_elevation,
            // Commandes Updater Manager 
            updater_manager::check_for_updates,
            updater_manager::install_update,
            updater_manager::download_update,
            updater_manager::restart_for_update,
            updater_manager::get_current_version,
            updater_manager::is_elevated_update_mode,
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

            // Initialiser le gestionnaire de téléchargements
            println!("⬇️ Initializing download manager...");
            let download_manager = download_manager::init_download_manager();
            app.manage(download_manager);
            println!("✅ Download manager initialized successfully");

            // Initialiser le gestionnaire de mises à jour (seulement en release)
            #[cfg(not(debug_assertions))]
            {
                println!("🔄 Initializing updater manager...");
                if let Err(e) = updater_manager::initialize_updater(app.handle()) {
                    eprintln!("❌ Failed to initialize updater manager: {}", e);
                    // Ne pas faire échouer le setup pour l'updater, juste logger l'erreur
                } else {
                    println!("✅ Updater manager initialized successfully");
                }
            }
            #[cfg(debug_assertions)]
            {
                println!("⚠️ Updater disabled in development mode");
            }

            println!("🌐 Tauri setup completed successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
