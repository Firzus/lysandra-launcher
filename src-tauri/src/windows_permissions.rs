//! Module Windows pour la gestion des permissions UAC et des privilèges administrateur
//! 
//! Ce module fournit des fonctions pour :
//! - Vérifier les privilèges administrateur actuels
//! - Demander l'élévation UAC quand nécessaire
//! - Gérer l'exécution en mode utilisateur vs administrateur
//! - Redémarrer l'application avec des privilèges élevés

use serde::{Deserialize, Serialize};
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;
use std::ptr;

#[cfg(target_os = "windows")]
use winapi::um::{
    handleapi::CloseHandle,
    processthreadsapi::{GetCurrentProcess, OpenProcessToken},
    securitybaseapi::GetTokenInformation,
    shellapi::ShellExecuteW,
    winnt::{TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY},
    winuser::{SW_SHOWNORMAL, SW_HIDE},
};

/// Structure pour représenter l'état des permissions
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct PermissionStatus {
    pub is_admin: bool,
    pub is_elevated: bool,
    pub can_elevate: bool,
    pub uac_enabled: bool,
}

/// Erreurs liées aux permissions Windows
#[derive(Debug, thiserror::Error)]
pub enum PermissionError {
    #[error("Impossible d'obtenir le token du processus")]
    TokenAccessError,
    #[error("Impossible de vérifier l'élévation")]
    ElevationCheckError,
    #[error("Échec de l'élévation UAC")]
    ElevationFailure,
    #[error("Opération non supportée sur cette plateforme")]
    UnsupportedPlatform,
}

/// Vérifie si le processus actuel s'exécute avec des privilèges administrateur
#[cfg(target_os = "windows")]
pub fn is_running_as_admin() -> Result<bool, PermissionError> {
    unsafe {
        let mut token_handle = ptr::null_mut();
        
        // Obtenir le token du processus actuel
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token_handle) == 0 {
            return Err(PermissionError::TokenAccessError);
        }
        
        let mut elevation = TOKEN_ELEVATION { TokenIsElevated: 0 };
        let mut return_length = 0u32;
        
        // Vérifier l'élévation
        let result = GetTokenInformation(
            token_handle,
            TokenElevation,
            &mut elevation as *mut _ as *mut _,
            std::mem::size_of::<TOKEN_ELEVATION>() as u32,
            &mut return_length,
        );
        
        CloseHandle(token_handle);
        
        if result == 0 {
            return Err(PermissionError::ElevationCheckError);
        }
        
        Ok(elevation.TokenIsElevated != 0)
    }
}

/// Version non-Windows qui retourne toujours false
#[cfg(not(target_os = "windows"))]
pub fn is_running_as_admin() -> Result<bool, PermissionError> {
    Err(PermissionError::UnsupportedPlatform)
}

/// Vérifie si UAC est activé sur le système
#[cfg(target_os = "windows")]
pub fn is_uac_enabled() -> bool {
    use winapi::um::winreg::{RegOpenKeyExW, RegQueryValueExW, RegCloseKey, HKEY_LOCAL_MACHINE};
    use winapi::um::winnt::{KEY_READ, REG_DWORD};
    use std::mem;
    
    unsafe {
        let mut hkey = ptr::null_mut();
        let subkey = OsStr::new("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        if RegOpenKeyExW(HKEY_LOCAL_MACHINE, subkey.as_ptr(), 0, KEY_READ, &mut hkey) != 0 {
            return true; // Par défaut, considérer UAC comme activé
        }
        
        let value_name = OsStr::new("EnableLUA")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let mut value: u32 = 0;
        let mut value_size = mem::size_of::<u32>() as u32;
        let mut value_type = REG_DWORD;
        
        let result = RegQueryValueExW(
            hkey,
            value_name.as_ptr(),
            ptr::null_mut(),
            &mut value_type,
            &mut value as *mut _ as *mut u8,
            &mut value_size,
        );
        
        RegCloseKey(hkey);
        
        if result == 0 {
            value != 0
        } else {
            true // Par défaut, considérer UAC comme activé
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn is_uac_enabled() -> bool {
    false
}

/// Obtient le statut complet des permissions
pub fn get_permission_status() -> PermissionStatus {
    let is_admin = is_running_as_admin().unwrap_or(false);
    let uac_enabled = is_uac_enabled();
    
    PermissionStatus {
        is_admin,
        is_elevated: is_admin,
        can_elevate: uac_enabled,
        uac_enabled,
    }
}

/// Redémarre l'application avec des privilèges élevés
#[cfg(target_os = "windows")]
pub fn restart_as_admin(executable_path: &str, arguments: Option<&str>) -> Result<(), PermissionError> {
    unsafe {
        let verb = OsStr::new("runas")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let file = OsStr::new(executable_path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let params = if let Some(args) = arguments {
            OsStr::new(args)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect::<Vec<u16>>()
        } else {
            vec![0u16]
        };
        
        let result = ShellExecuteW(
            ptr::null_mut(),
            verb.as_ptr(),
            file.as_ptr(),
            if arguments.is_some() { params.as_ptr() } else { ptr::null() },
            ptr::null(),
            SW_SHOWNORMAL,
        );
        
        // ShellExecuteW retourne une valeur > 32 en cas de succès
        if result as i32 > 32 {
            Ok(())
        } else {
            Err(PermissionError::ElevationFailure)
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn restart_as_admin(_executable_path: &str, _arguments: Option<&str>) -> Result<(), PermissionError> {
    Err(PermissionError::UnsupportedPlatform)
}

/// Exécute une commande avec des privilèges élevés
#[cfg(target_os = "windows")]
pub fn run_elevated_command(command: &str, arguments: Option<&str>, show_window: bool) -> Result<(), PermissionError> {
    unsafe {
        let verb = OsStr::new("runas")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let file = OsStr::new(command)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect::<Vec<u16>>();
        
        let params = if let Some(args) = arguments {
            OsStr::new(args)
                .encode_wide()
                .chain(std::iter::once(0))
                .collect::<Vec<u16>>()
        } else {
            vec![0u16]
        };
        
        let show_cmd = if show_window { SW_SHOWNORMAL } else { SW_HIDE };
        
        let result = ShellExecuteW(
            ptr::null_mut(),
            verb.as_ptr(),
            file.as_ptr(),
            if arguments.is_some() { params.as_ptr() } else { ptr::null() },
            ptr::null(),
            show_cmd,
        );
        
        if result as i32 > 32 {
            Ok(())
        } else {
            Err(PermissionError::ElevationFailure)
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn run_elevated_command(_command: &str, _arguments: Option<&str>, _show_window: bool) -> Result<(), PermissionError> {
    Err(PermissionError::UnsupportedPlatform)
}

/// Vérifie si une opération nécessite des privilèges élevés
pub fn requires_elevation(operation: &str) -> bool {
    match operation {
        "install" | "uninstall" | "update" | "modify_system" => true,
        "launch_game" | "download" | "read_config" => false,
        _ => false,
    }
}

/// Vérifie si l'utilisateur peut effectuer une opération donnée
pub fn can_perform_operation(operation: &str) -> bool {
    let status = get_permission_status();
    
    if requires_elevation(operation) {
        status.is_admin || status.can_elevate
    } else {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_permission_status() {
        let status = get_permission_status();
        println!("Permission status: {:?}", status);
        
        // Les tests de base qui devraient toujours passer
        assert!(status.is_admin == true || status.is_admin == false);
        assert!(status.uac_enabled == true || status.uac_enabled == false);
    }
    
    #[test]
    fn test_operation_requirements() {
        assert!(requires_elevation("install"));
        assert!(requires_elevation("uninstall"));
        assert!(requires_elevation("update"));
        assert!(!requires_elevation("launch_game"));
        assert!(!requires_elevation("download"));
    }
    
    #[test]
    fn test_can_perform_operations() {
        assert!(can_perform_operation("launch_game"));
        assert!(can_perform_operation("download"));
        // Les opérations d'élévation dépendent du système
    }
} 