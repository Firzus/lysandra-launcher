//! Module de gestion de l'updater avec support des privilèges élevés
//! 
//! Ce module gère les mises à jour de l'application en tenant compte des
//! privilèges Windows et de l'élévation UAC nécessaire.

use crate::windows_permissions;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

/// État de la mise à jour
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UpdateStatus {
    pub available: bool,
    pub version: Option<String>,
    pub download_url: Option<String>,
    pub requires_elevation: bool,
    pub can_update: bool,
    pub error: Option<String>,
}

/// Événement de progression de mise à jour
#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateProgressEvent {
    pub stage: String,
    pub progress: Option<u32>,
    pub message: String,
}

/// Vérifie si des mises à jour sont disponibles
#[tauri::command]
pub async fn check_for_updates(app_handle: AppHandle) -> Result<UpdateStatus, String> {
    // Vérifier les permissions d'abord
    let _permission_status = windows_permissions::get_permission_status();
    let requires_elevation = windows_permissions::requires_elevation("update");
    let can_update = windows_permissions::can_perform_operation("update");
    
    // Émettre un événement de début de vérification
    emit_update_progress(&app_handle, "checking", None, "Vérification des mises à jour...".to_string());
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        #[cfg(debug_assertions)]
        {
            // En mode développement, retourner une réponse mock
            emit_update_progress(&app_handle, "debug_mode", None, "Mode développement - pas de vérification de mise à jour".to_string());
            return Ok(UpdateStatus {
                available: false,
                version: None,
                download_url: None,
                requires_elevation,
                can_update,
                error: Some("Mode développement".to_string()),
            });
        }
        
        #[cfg(not(debug_assertions))]
        {
            use tauri_plugin_updater::UpdaterExt;
            
            match app_handle.updater() {
            Ok(updater) => {
                match updater.check().await {
                    Ok(Some(update)) => {
                        emit_update_progress(&app_handle, "found", None, format!("Mise à jour disponible: {}", update.version));
                        
                        Ok(UpdateStatus {
                            available: true,
                            version: Some(update.version.clone()),
                            download_url: Some(update.download_url.to_string()),
                            requires_elevation,
                            can_update,
                            error: None,
                        })
                    },
                    Ok(None) => {
                        emit_update_progress(&app_handle, "up_to_date", None, "Application à jour".to_string());
                        
                        Ok(UpdateStatus {
                            available: false,
                            version: None,
                            download_url: None,
                            requires_elevation,
                            can_update,
                            error: None,
                        })
                    },
                    Err(e) => {
                        let error_msg = format!("Erreur lors de la vérification: {}", e);
                        emit_update_progress(&app_handle, "error", None, error_msg.clone());
                        
                        Ok(UpdateStatus {
                            available: false,
                            version: None,
                            download_url: None,
                            requires_elevation,
                            can_update,
                            error: Some(error_msg),
                        })
                    }
                }
            },
            Err(e) => {
                let error_msg = format!("Impossible d'initialiser l'updater: {}", e);
                emit_update_progress(&app_handle, "error", None, error_msg.clone());
                
                Ok(UpdateStatus {
                    available: false,
                    version: None,
                    download_url: None,
                    requires_elevation,
                    can_update,
                    error: Some(error_msg),
                })
            }
        }
        } // Fermeture du bloc #[cfg(not(debug_assertions))]
    }
    
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        Ok(UpdateStatus {
            available: false,
            version: None,
            download_url: None,
            requires_elevation: false,
            can_update: false,
            error: Some("Mises à jour non supportées sur mobile".to_string()),
        })
    }
}

/// Installe une mise à jour avec gestion des privilèges
#[tauri::command]
pub async fn install_update(app_handle: AppHandle) -> Result<(), String> {
    // Vérifier les permissions
    let permission_status = windows_permissions::get_permission_status();
    
    if !windows_permissions::can_perform_operation("update") {
        return Err("Permissions insuffisantes pour effectuer la mise à jour".to_string());
    }
    
    // Si on n'est pas admin et qu'on a besoin d'élévation, demander l'élévation
    if windows_permissions::requires_elevation("update") && !permission_status.is_admin {
        if !permission_status.can_elevate {
            return Err("UAC n'est pas disponible. Veuillez exécuter l'application en tant qu'administrateur".to_string());
        }
        
        emit_update_progress(&app_handle, "elevation_required", None, "Élévation des privilèges requise...".to_string());
        
        // Demander l'élévation via notre système de permissions
        return windows_permissions::restart_as_admin(
            &std::env::current_exe().map_err(|e| e.to_string())?.to_string_lossy(),
            Some("--elevated-update")
        ).map_err(|e| e.to_string());
    }
    
    emit_update_progress(&app_handle, "downloading", None, "Téléchargement de la mise à jour...".to_string());
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        #[cfg(debug_assertions)]
        {
            emit_update_progress(&app_handle, "debug_mode", None, "Mode développement - installation simulée".to_string());
            return Err("Installation non disponible en mode développement".to_string());
        }
        
        #[cfg(not(debug_assertions))]
        {
            use tauri_plugin_updater::UpdaterExt;
            
            let updater = app_handle.updater().map_err(|e| e.to_string())?;
            
            if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
                emit_update_progress(&app_handle, "installing", None, "Installation de la mise à jour...".to_string());
                
                // Lancer l'installation avec des callbacks vides
                update.download_and_install(
                    |_, _| {}, // on_chunk callback
                    || {}      // on_download_finish callback
                ).await.map_err(|e| {
                    emit_update_progress(&app_handle, "error", None, format!("Erreur d'installation: {}", e));
                    e.to_string()
                })?;
                
                emit_update_progress(&app_handle, "completed", Some(100), "Mise à jour installée avec succès".to_string());
                Ok(())
            } else {
                Err("Aucune mise à jour disponible".to_string())
            }
        }
    }
    
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        Err("Installation de mises à jour non supportée sur mobile".to_string())
    }
}

/// Télécharge une mise à jour sans l'installer
#[tauri::command]
pub async fn download_update(app_handle: AppHandle) -> Result<(), String> {
    emit_update_progress(&app_handle, "downloading", None, "Téléchargement de la mise à jour...".to_string());
    
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        #[cfg(debug_assertions)]
        {
            emit_update_progress(&app_handle, "debug_mode", None, "Mode développement - téléchargement simulé".to_string());
            return Err("Téléchargement non disponible en mode développement".to_string());
        }
        
        #[cfg(not(debug_assertions))]
        {
            use tauri_plugin_updater::UpdaterExt;
            
            let updater = app_handle.updater().map_err(|e| e.to_string())?;
            
            if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
                // Télécharger avec des callbacks vides
                update.download(
                    |_, _| {}, // on_chunk callback
                    || {}      // on_download_finish callback
                ).await.map_err(|e| {
                    emit_update_progress(&app_handle, "error", None, format!("Erreur de téléchargement: {}", e));
                    e.to_string()
                })?;
                
                emit_update_progress(&app_handle, "downloaded", Some(100), "Mise à jour téléchargée".to_string());
                Ok(())
            } else {
                Err("Aucune mise à jour disponible".to_string())
            }
        }
    }
    
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        Err("Téléchargement de mises à jour non supporté sur mobile".to_string())
    }
}

/// Redémarre l'application pour appliquer une mise à jour
#[tauri::command]
pub async fn restart_for_update(app_handle: AppHandle) -> Result<(), String> {
    emit_update_progress(&app_handle, "restarting", None, "Redémarrage pour appliquer la mise à jour...".to_string());
    
    // Vérifier si on a besoin de privilèges élevés
    if windows_permissions::requires_elevation("update") {
        let permission_status = windows_permissions::get_permission_status();
        
        if !permission_status.is_admin && permission_status.can_elevate {
            // Redémarrer avec élévation
            let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
            return windows_permissions::restart_as_admin(
                &current_exe.to_string_lossy(),
                Some("--apply-update")
            ).map_err(|e| e.to_string());
        }
    }
    
    // Redémarrage normal
    app_handle.restart();
    // Cette ligne ne sera jamais atteinte mais nécessaire pour le type de retour
    #[allow(unreachable_code)]
    Ok(())
}

/// Obtient les informations de version actuelle
#[tauri::command]
pub fn get_current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Vérifie si l'application a été lancée pour une mise à jour élevée
#[tauri::command]
pub fn is_elevated_update_mode() -> bool {
    #[cfg(debug_assertions)]
    {
        // En mode développement, retourner toujours false
        false
    }
    #[cfg(not(debug_assertions))]
    {
        std::env::args().any(|arg| arg == "--elevated-update" || arg == "--apply-update")
    }
}

/// Émet un événement de progression de mise à jour
fn emit_update_progress(app_handle: &AppHandle, stage: &str, progress: Option<u32>, message: String) {
    let event = UpdateProgressEvent {
        stage: stage.to_string(),
        progress,
        message,
    };
    
    if let Err(e) = app_handle.emit("update-progress", event) {
        eprintln!("Failed to emit update-progress event: {}", e);
    }
}

/// Initialise le gestionnaire de mises à jour
pub fn initialize_updater(_app_handle: &AppHandle) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        println!("⚠️ Updater manager initialization skipped in development mode");
        return Ok(());
    }
    
    #[cfg(not(debug_assertions))]
    {
        println!("🔄 Initializing updater manager...");
        
        // Vérifier si on est en mode mise à jour élevée
        if is_elevated_update_mode() {
            println!("🔐 Application launched in elevated update mode");
            
            // Ici on pourrait implémenter une logique spéciale pour les mises à jour élevées
            // Par exemple, appliquer automatiquement une mise à jour en attente
        }
        
        // Vérifier les permissions de mise à jour
        let permission_status = windows_permissions::get_permission_status();
        println!("🔐 Update permissions - Admin: {}, UAC: {}, Can update: {}", 
                 permission_status.is_admin, 
                 permission_status.uac_enabled,
                 windows_permissions::can_perform_operation("update"));
        
        println!("✅ Updater manager initialized successfully");
        Ok(())
    }
} 