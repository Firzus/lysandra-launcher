use std::path::PathBuf;

/// Gestionnaire de chemins cross-plateforme pour HuzStudio
pub struct PathManager;

impl PathManager {
    /// Obtient le répertoire racine HuzStudio/ cross-plateforme
    pub fn get_huzstudio_root() -> Result<PathBuf, String> {
        #[cfg(target_os = "windows")]
        {
            // Sur Windows : C:/Program Files/HuzStudio/
            let program_files = std::env::var("ProgramFiles")
                .unwrap_or_else(|_| "C:\\Program Files".to_string());
            Ok(PathBuf::from(program_files).join("HuzStudio"))
        }
        
        #[cfg(target_os = "macos")]
        {
            // Sur macOS : /Applications/HuzStudio/
            Ok(PathBuf::from("/Applications/HuzStudio"))
        }
        
        #[cfg(target_os = "linux")]
        {
            // Sur Linux : /opt/HuzStudio/ ou ~/HuzStudio/ selon les permissions
            let opt_path = PathBuf::from("/opt/HuzStudio");
            if std::fs::create_dir_all(&opt_path).is_ok() {
                Ok(opt_path)
            } else {
                // Fallback vers le home de l'utilisateur
                let home = std::env::var("HOME")
                    .map_err(|_| "Unable to get HOME directory".to_string())?;
                Ok(PathBuf::from(home).join("HuzStudio"))
            }
        }
        
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            Err("Platform not supported".to_string())
        }
    }
    
    /// Obtient le répertoire games/
    pub fn get_games_dir() -> Result<PathBuf, String> {
        Ok(Self::get_huzstudio_root()?.join("games"))
    }
    
    /// Obtient le répertoire config/
    pub fn get_config_dir() -> Result<PathBuf, String> {
        Ok(Self::get_huzstudio_root()?.join("config"))
    }
    
    /// Obtient le répertoire cache/
    pub fn get_cache_dir() -> Result<PathBuf, String> {
        Ok(Self::get_huzstudio_root()?.join("cache"))
    }
    
    /// Obtient le répertoire logs/
    pub fn get_logs_dir() -> Result<PathBuf, String> {
        Ok(Self::get_huzstudio_root()?.join("logs"))
    }
    
    /// Obtient le répertoire d'un jeu spécifique
    pub fn get_game_dir(game_id: &str) -> Result<PathBuf, String> {
        Ok(Self::get_games_dir()?.join(game_id))
    }
    
    /// Obtient le répertoire install/ d'un jeu
    pub fn get_game_install_dir(game_id: &str) -> Result<PathBuf, String> {
        Ok(Self::get_game_dir(game_id)?.join("install"))
    }
    
    /// Obtient le répertoire saves/ d'un jeu
    pub fn get_game_saves_dir(game_id: &str) -> Result<PathBuf, String> {
        Ok(Self::get_game_dir(game_id)?.join("saves"))
    }
    
    /// Obtient le répertoire logs/ d'un jeu
    pub fn get_game_logs_dir(game_id: &str) -> Result<PathBuf, String> {
        Ok(Self::get_game_dir(game_id)?.join("logs"))
    }
    
    /// Obtient le répertoire config/ d'un jeu
    pub fn get_game_config_dir(game_id: &str) -> Result<PathBuf, String> {
        Ok(Self::get_game_dir(game_id)?.join("config"))
    }
    
    /// Crée tous les répertoires nécessaires pour la structure HuzStudio
    pub fn initialize_structure() -> Result<(), String> {
        let directories = [
            Self::get_huzstudio_root()?,
            Self::get_games_dir()?,
            Self::get_config_dir()?,
            Self::get_cache_dir()?,
            Self::get_logs_dir()?,
        ];
        
        for dir in &directories {
            std::fs::create_dir_all(dir)
                .map_err(|e| format!("Failed to create directory {:?}: {}", dir, e))?;
        }
        
        println!("✅ HuzStudio structure initialized at: {:?}", Self::get_huzstudio_root()?);
        Ok(())
    }
    
    /// Crée la structure pour un jeu spécifique
    pub fn initialize_game_structure(game_id: &str) -> Result<(), String> {
        let directories = [
            Self::get_game_dir(game_id)?,
            Self::get_game_install_dir(game_id)?,
            Self::get_game_saves_dir(game_id)?,
            Self::get_game_logs_dir(game_id)?,
            Self::get_game_config_dir(game_id)?,
        ];
        
        for dir in &directories {
            std::fs::create_dir_all(dir)
                .map_err(|e| format!("Failed to create game directory {:?}: {}", dir, e))?;
        }
        
        println!("✅ Game structure initialized for {}: {:?}", game_id, Self::get_game_dir(game_id)?);
        Ok(())
    }
    
    /// Obtient le chemin vers l'exécutable du launcher
    pub fn get_launcher_executable() -> Result<PathBuf, String> {
        #[cfg(target_os = "windows")]
        {
            Ok(Self::get_huzstudio_root()?.join("launcher.exe"))
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            Ok(Self::get_huzstudio_root()?.join("launcher"))
        }
    }
    
    /// Obtient le chemin vers l'exécutable de désinstallation
    pub fn get_uninstaller_executable() -> Result<PathBuf, String> {
        #[cfg(target_os = "windows")]
        {
            Ok(Self::get_huzstudio_root()?.join("uninstall.exe"))
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            Ok(Self::get_huzstudio_root()?.join("uninstall"))
        }
    }
    
    /// Vérifie si la structure HuzStudio existe et est accessible
    pub fn verify_structure() -> Result<bool, String> {
        let root = Self::get_huzstudio_root()?;
        
        if !root.exists() {
            return Ok(false);
        }
        
        // Vérifie que nous pouvons lire et écrire dans le répertoire
        let test_file = root.join(".huzstudio_test");
        match std::fs::write(&test_file, "test") {
            Ok(_) => {
                let _ = std::fs::remove_file(&test_file);
                Ok(true)
            }
            Err(_) => Ok(false)
        }
    }
}

// Commandes Tauri utilisant le PathManager
#[tauri::command]
pub fn get_huzstudio_root_path() -> Result<String, String> {
    PathManager::get_huzstudio_root()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_games_directory() -> Result<String, String> {
    PathManager::get_games_dir()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_config_directory() -> Result<String, String> {
    PathManager::get_config_dir()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_cache_directory() -> Result<String, String> {
    PathManager::get_cache_dir()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_logs_directory() -> Result<String, String> {
    PathManager::get_logs_dir()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_game_directory(game_id: String) -> Result<String, String> {
    PathManager::get_game_dir(&game_id)
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_game_install_directory(game_id: String) -> Result<String, String> {
    PathManager::get_game_install_dir(&game_id)
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
pub fn initialize_game_directories(game_id: String) -> Result<(), String> {
    PathManager::initialize_game_structure(&game_id)
}

#[tauri::command]
pub fn verify_huzstudio_structure() -> Result<bool, String> {
    PathManager::verify_structure()
} 