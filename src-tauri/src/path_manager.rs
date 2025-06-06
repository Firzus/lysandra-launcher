use std::path::PathBuf;

/// Gestionnaire de chemins cross-plateforme pour HuzStudio
pub struct PathManager;

impl PathManager {
    /// Détermine si nous sommes en mode développement
    fn is_development_mode() -> bool {
        // Vérifie si nous sommes en mode dev via la variable d'environnement TAURI_DEV
        std::env::var("TAURI_DEV").is_ok() ||
        // Ou si le binaire est dans target/debug
        std::env::current_exe()
            .map(|path| path.to_string_lossy().contains("target/debug"))
            .unwrap_or(false) ||
        // En cas de doute, toujours utiliser le mode dev si on peut écrire dans AppLocalData mais pas dans Program Files
        Self::can_write_to_local_appdata() && !Self::can_write_to_program_files()
    }

    /// Vérifie si on peut écrire dans LocalAppData
    fn can_write_to_local_appdata() -> bool {
        #[cfg(target_os = "windows")]
        {
            if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
                let test_path = std::path::PathBuf::from(local_appdata).join("HuzStudio_test");
                std::fs::create_dir_all(&test_path).is_ok() && {
                    let _ = std::fs::remove_dir_all(&test_path);
                    true
                }
            } else {
                false
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            true // Pour les autres plateformes, on suppose que c'est possible
        }
    }

    /// Vérifie si on peut écrire dans Program Files
    fn can_write_to_program_files() -> bool {
        #[cfg(target_os = "windows")]
        {
            let program_files = std::env::var("ProgramFiles")
                .unwrap_or_else(|_| "C:\\Program Files".to_string());
            let test_path = std::path::PathBuf::from(program_files).join("HuzStudio_test");
            std::fs::create_dir_all(&test_path).is_ok() && {
                let _ = std::fs::remove_dir_all(&test_path);
                true
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            false // Pour les autres plateformes, on force l'utilisation du mode dev
        }
    }

    /// Obtient le répertoire racine HuzStudio/ cross-plateforme
    pub fn get_huzstudio_root() -> Result<PathBuf, String> {
        if Self::is_development_mode() {
            // En mode développement, utilise AppLocalData
            Self::get_development_root()
        } else {
            // En mode production, utilise les chemins système
            Self::get_production_root()
        }
    }

    /// Obtient le répertoire racine pour le développement
    fn get_development_root() -> Result<PathBuf, String> {
        #[cfg(target_os = "windows")]
        {
            // Windows: %LOCALAPPDATA%/HuzStudio/
            let local_appdata = std::env::var("LOCALAPPDATA")
                .or_else(|_| std::env::var("USERPROFILE").map(|p| format!("{}\\AppData\\Local", p)))
                .map_err(|_| "Unable to get LocalAppData directory".to_string())?;
            Ok(PathBuf::from(local_appdata).join("HuzStudio"))
        }
        
        #[cfg(target_os = "macos")]
        {
            // macOS: ~/Library/Application Support/HuzStudio/
            let home = std::env::var("HOME")
                .map_err(|_| "Unable to get HOME directory".to_string())?;
            Ok(PathBuf::from(home).join("Library/Application Support/HuzStudio"))
        }
        
        #[cfg(target_os = "linux")]
        {
            // Linux: ~/.local/share/HuzStudio/ 
            let home = std::env::var("HOME")
                .map_err(|_| "Unable to get HOME directory".to_string())?;
            Ok(PathBuf::from(home).join(".local/share/HuzStudio"))
        }
        
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            Err("Platform not supported".to_string())
        }
    }

    /// Obtient le répertoire racine pour la production
    fn get_production_root() -> Result<PathBuf, String> {
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