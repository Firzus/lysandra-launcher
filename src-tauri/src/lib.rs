use tauri::{Manager, Emitter};
use serde::{Serialize, Deserialize};

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
        .invoke_handler(tauri::generate_handler![
            handle_download_progress,
            handle_download_complete
        ])
        .setup(|app| {
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
