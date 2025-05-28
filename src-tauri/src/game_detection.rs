use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameInstallation {
    pub path: String,
    pub executable: String,
    pub launcher: String,
    pub confidence: u8, // Score de confiance sur 100
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameSearchResult {
    pub game_found: bool,
    pub installations: Vec<GameInstallation>,
    pub search_paths: Vec<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub executable_exists: bool,
    pub path_accessible: bool,
    pub is_game_directory: bool,
    pub suggested_executable: Option<String>,
    pub detected_launcher: Option<String>,
}

/// Répertoires communs où les jeux sont généralement installés
/// Basé sur les conventions des principaux launchers de jeux
const COMMON_GAME_DIRECTORIES: &[&str] = &[
    // Steam - Répertoires standards
    "C:\\Program Files (x86)\\Steam\\steamapps\\common",
    "C:\\Program Files\\Steam\\steamapps\\common",
    "C:\\SteamLibrary\\steamapps\\common",
    "D:\\SteamLibrary\\steamapps\\common",
    "E:\\SteamLibrary\\steamapps\\common",
    "F:\\SteamLibrary\\steamapps\\common",
    "G:\\SteamLibrary\\steamapps\\common",
    
    // Epic Games - Répertoires standards
    "C:\\Epic Games",
    "D:\\Epic Games",
    "E:\\Epic Games",
    "F:\\Epic Games",
    "C:\\Program Files\\Epic Games",
    "C:\\Program Files (x86)\\Epic Games",
    
    // GOG - Répertoires standards
    "C:\\GOG Games",
    "D:\\GOG Games",
    "E:\\GOG Games",
    "F:\\GOG Games",
    "C:\\Program Files\\GOG.com",
    "C:\\Program Files (x86)\\GOG.com",
    "C:\\Program Files\\GOG Galaxy\\Games",
    
    // Origin/EA - Répertoires standards
    "C:\\Program Files\\Origin Games",
    "C:\\Program Files (x86)\\Origin Games",
    "C:\\Program Files\\EA Games",
    "C:\\Program Files (x86)\\EA Games",
    "C:\\ProgramData\\Origin\\LocalContent",
    
    // Ubisoft Connect (ex-Uplay) - Répertoires standards
    "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games",
    "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games",
    "C:\\Program Files\\Ubisoft Game Launcher\\games",
    
    // Battle.net - Répertoires standards
    "C:\\Program Files (x86)\\Battle.net",
    "C:\\Program Files\\Battle.net",
    
    // Microsoft Store/Xbox - Répertoires standards
    "C:\\Program Files\\WindowsApps",
    "C:\\Program Files\\ModifiableWindowsApps",
    
    // Répertoires génériques communs
    "C:\\Games",
    "D:\\Games",
    "E:\\Games",
    "F:\\Games",
    "C:\\Program Files\\Games",
    "C:\\Program Files (x86)\\Games",
    
    // Répertoires utilisateur
    "C:\\Users\\Public\\Games",
];

/// Patterns d'exécutables de jeux communs avec priorités
/// Basé sur l'analyse des conventions des développeurs de jeux
const GAME_EXECUTABLE_PATTERNS: &[(&str, u8)] = &[
    // Patterns haute priorité (score bonus élevé)
    ("game.exe", 30),
    ("Game.exe", 30),
    ("GAME.exe", 30),
    ("main.exe", 25),
    ("Main.exe", 25),
    ("MAIN.exe", 25),
    
    // Patterns priorité moyenne
    ("launcher.exe", 20),
    ("Launcher.exe", 20),
    ("start.exe", 15),
    ("Start.exe", 15),
    ("run.exe", 15),
    ("Run.exe", 15),
    
    // Patterns spécifiques aux jeux
    ("*.exe", 5), // Fallback général
];

/// Indicateurs de dossiers de jeux pour améliorer la détection
const GAME_DIRECTORY_INDICATORS: &[(&str, u8)] = &[
    // Dossiers de données haute priorité
    ("data", 25), ("Data", 25), ("DATA", 25),
    ("assets", 20), ("Assets", 20), ("ASSETS", 20),
    ("resources", 20), ("Resources", 20), ("RESOURCES", 20),
    
    // Dossiers de configuration
    ("config", 15), ("Config", 15), ("CONFIG", 15),
    ("settings", 15), ("Settings", 15),
    
    // Dossiers de contenu utilisateur
    ("saves", 15), ("Saves", 15), ("SAVES", 15),
    ("mods", 10), ("Mods", 10), ("MODS", 10),
    ("screenshots", 10), ("Screenshots", 10),
    
    // Dossiers techniques
    ("bin", 15), ("Bin", 15), ("BIN", 15),
    ("lib", 10), ("Lib", 10), ("LIB", 10),
    ("plugins", 10), ("Plugins", 10),
    
    // Dossiers de contenu
    ("content", 15), ("Content", 15),
    ("media", 10), ("Media", 10),
    ("audio", 10), ("Audio", 10),
    ("video", 10), ("Video", 10),
    ("textures", 10), ("Textures", 10),
];

/// Detecte les installations de jeu en cherchant des patterns spécifiques
#[tauri::command]
pub async fn search_installed_games(
    game_name: Option<String>,
    custom_paths: Option<Vec<String>>,
) -> Result<GameSearchResult, String> {
    let start_time = std::time::Instant::now();
    
    println!("🔍 Starting automatic game detection...");
    
    let mut search_paths = COMMON_GAME_DIRECTORIES.iter().map(|s| s.to_string()).collect::<Vec<_>>();
    
    // Ajouter les chemins personnalisés si fournis
    if let Some(paths) = custom_paths {
        search_paths.extend(paths);
    }
    
    // Ajouter les chemins depuis le registre Windows (Steam, Epic, etc.)
    if let Ok(registry_paths) = get_registry_game_paths() {
        search_paths.extend(registry_paths);
    }
    
    println!("📂 Searching in {} directories...", search_paths.len());
    
    let mut installations = Vec::new();
    let mut valid_search_paths = Vec::new();
    
    for search_path in &search_paths {
        if let Ok(found_games) = search_games_in_directory(search_path, &game_name).await {
            installations.extend(found_games);
            valid_search_paths.push(search_path.clone());
        }
    }
    
    // Trier par score de confiance (décroissant)
    installations.sort_by(|a, b| b.confidence.cmp(&a.confidence));
    
    let duration = start_time.elapsed().as_millis() as u64;
    
    println!("✅ Game detection completed in {}ms - Found {} installations", duration, installations.len());
    
    Ok(GameSearchResult {
        game_found: !installations.is_empty(),
        installations,
        search_paths: valid_search_paths,
        duration_ms: duration,
    })
}

/// Valide qu'une installation de jeu est correcte
#[tauri::command]
pub async fn validate_game_installation(path: String) -> Result<ValidationResult, String> {
    println!("🔍 Validating game installation at: {}", path);
    
    let game_path = Path::new(&path);
    
    if !game_path.exists() {
        return Ok(ValidationResult {
            is_valid: false,
            executable_exists: false,
            path_accessible: false,
            is_game_directory: false,
            suggested_executable: None,
            detected_launcher: None,
        });
    }
    
    if !game_path.is_dir() {
        return Ok(ValidationResult {
            is_valid: false,
            executable_exists: false,
            path_accessible: true,
            is_game_directory: false,
            suggested_executable: None,
            detected_launcher: None,
        });
    }
    
    // Chercher des exécutables dans le dossier
    let executables = find_executables_in_directory(&path)?;
    let is_game_directory = is_likely_game_directory(&path)?;
    let detected_launcher = detect_launcher_from_path(&path);
    
    // Suggérer le meilleur exécutable
    let suggested_executable = if !executables.is_empty() {
        Some(suggest_best_executable(&executables))
    } else {
        None
    };
    
    let executable_exists = suggested_executable.is_some();
    let is_valid = executable_exists && is_game_directory;
    
    println!("✅ Validation completed - Valid: {}, Executables found: {}", is_valid, executables.len());
    
    Ok(ValidationResult {
        is_valid,
        executable_exists,
        path_accessible: true,
        is_game_directory,
        suggested_executable,
        detected_launcher,
    })
}

/// Retourne les répertoires communs de jeux
#[tauri::command]
pub async fn get_common_game_directories() -> Result<Vec<String>, String> {
    let mut directories = COMMON_GAME_DIRECTORIES.iter().map(|s| s.to_string()).collect::<Vec<_>>();
    
    // Ajouter les chemins du registre
    if let Ok(registry_paths) = get_registry_game_paths() {
        directories.extend(registry_paths);
    }
    
    // Filtrer uniquement les répertoires qui existent
    let existing_directories: Vec<String> = directories
        .into_iter()
        .filter(|path| Path::new(path).exists())
        .collect();
    
    println!("📂 Found {} existing game directories", existing_directories.len());
    
    Ok(existing_directories)
}

/// Recherche des jeux dans un répertoire spécifique
async fn search_games_in_directory(
    directory: &str,
    target_game: &Option<String>,
) -> Result<Vec<GameInstallation>, String> {
    let dir_path = Path::new(directory);
    
    if !dir_path.exists() {
        return Ok(Vec::new());
    }
    
    println!("🔍 Scanning directory: {}", directory);
    
    let mut installations = Vec::new();
    
    // Lire le contenu du répertoire
    let entries = fs::read_dir(dir_path).map_err(|e| e.to_string())?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            
            if path.is_dir() {
                let folder_name = path.file_name()
                    .and_then(|name| name.to_str())
                    .unwrap_or("");
                
                // Si on cherche un jeu spécifique, filtrer par nom
                if let Some(ref game_name) = target_game {
                    if !folder_name.to_lowercase().contains(&game_name.to_lowercase()) {
                        continue;
                    }
                }
                
                // Analyser ce dossier pour voir s'il contient un jeu
                if let Ok(installation) = analyze_potential_game_directory(&path).await {
                    installations.push(installation);
                }
            }
        }
    }
    
    Ok(installations)
}

/// Analyse un dossier pour déterminer s'il contient un jeu
async fn analyze_potential_game_directory(path: &Path) -> Result<GameInstallation, String> {
    let path_str = path.to_string_lossy().to_string();
    
    // Chercher des exécutables
    let executables = find_executables_in_directory(&path_str)?;
    
    if executables.is_empty() {
        return Err("No executables found".to_string());
    }
    
    // Calculer le score de confiance
    let confidence = calculate_confidence_score(path, &executables)?;
    
    // Détecter le launcher
    let launcher = detect_launcher_from_path(&path_str).unwrap_or_else(|| "Unknown".to_string());
    
    // Suggérer le meilleur exécutable
    let best_executable = suggest_best_executable(&executables);
    
    // Métadonnées additionnelles
    let mut metadata = HashMap::new();
    metadata.insert("folder_name".to_string(), path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_string());
    metadata.insert("executables_count".to_string(), executables.len().to_string());
    
    // Ajouter des informations sur la taille du dossier si possible
    if let Ok(size) = get_directory_size(&path_str) {
        metadata.insert("directory_size".to_string(), size.to_string());
    }
    
    Ok(GameInstallation {
        path: path_str,
        executable: best_executable,
        launcher,
        confidence,
        metadata,
    })
}

/// Trouve tous les exécutables dans un répertoire
fn find_executables_in_directory(directory: &str) -> Result<Vec<String>, String> {
    let dir_path = Path::new(directory);
    
    if !dir_path.exists() || !dir_path.is_dir() {
        return Ok(Vec::new());
    }
    
    let mut executables = Vec::new();
    
    // Lire le répertoire
    let entries = fs::read_dir(dir_path).map_err(|e| e.to_string())?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    if extension.to_str() == Some("exe") {
                        if let Some(file_name) = path.file_name().and_then(|name| name.to_str()) {
                            executables.push(file_name.to_string());
                        }
                    }
                }
            }
        }
    }
    
    Ok(executables)
}

/// Détermine si un répertoire ressemble à un dossier de jeu
/// Utilise un système de scoring basé sur les indicateurs trouvés
fn is_likely_game_directory(directory: &str) -> Result<bool, String> {
    let dir_path = Path::new(directory);
    
    if !dir_path.exists() || !dir_path.is_dir() {
        return Ok(false);
    }
    
    let mut score = 0u8;
    let entries = fs::read_dir(dir_path).map_err(|e| e.to_string())?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            
            if path.is_dir() {
                if let Some(folder_name) = path.file_name().and_then(|name| name.to_str()) {
                    // Chercher des correspondances avec les indicateurs
                    for (indicator, bonus) in GAME_DIRECTORY_INDICATORS {
                        if folder_name == *indicator {
                            score += bonus;
                            break; // Éviter les doublons
                        }
                    }
                }
            }
        }
    }
    
    // Considérer comme un dossier de jeu si le score dépasse un seuil
    Ok(score >= 20) // Seuil ajustable selon les besoins
}

/// Calcule un score de confiance pour une installation de jeu
/// Système de scoring amélioré basé sur les conventions professionnelles
fn calculate_confidence_score(path: &Path, executables: &[String]) -> Result<u8, String> {
    let mut score = 0u8;
    
    // Score de base si des exécutables sont présents
    if !executables.is_empty() {
        score += 20; // Score de base réduit
    }
    
    // Bonus selon le nombre d'exécutables (mais plafonné)
    let exe_bonus = std::cmp::min(executables.len() as u8 * 5, 15);
    score += exe_bonus;
    
    // Bonus si le dossier ressemble à un jeu
    if is_likely_game_directory(&path.to_string_lossy())? {
        score += 25;
    }
    
    // Bonus selon le launcher détecté (scores ajustés)
    let launcher = detect_launcher_from_path(&path.to_string_lossy());
    if let Some(launcher_name) = launcher {
        match launcher_name.as_str() {
            "Steam" => score += 25,
            "Epic Games" => score += 20,
            "GOG" => score += 20,
            "Origin" => score += 15,
            "Ubisoft Connect" => score += 15,
            "Battle.net" => score += 15,
            _ => score += 5,
        }
    }
    
    // Bonus pour des noms d'exécutables spécifiques
    for exe in executables {
        let exe_lower = exe.to_lowercase();
        for (pattern, bonus) in GAME_EXECUTABLE_PATTERNS {
            if pattern.contains('*') {
                // Pattern générique
                if exe_lower.ends_with(".exe") {
                    score += bonus;
                    break;
                }
            } else if exe_lower == pattern.to_lowercase() {
                // Pattern exact
                score += bonus;
                break;
            } else if exe_lower.contains(&pattern.to_lowercase().replace(".exe", "")) {
                // Pattern partiel
                score += bonus / 2;
                break;
            }
        }
    }
    
    // Bonus pour la taille du dossier (les jeux sont généralement volumineux)
    if let Ok(size) = get_directory_size(&path.to_string_lossy()) {
        if size > 100_000_000 { // Plus de 100MB
            score += 5;
        }
        if size > 1_000_000_000 { // Plus de 1GB
            score += 5;
        }
    }
    
    // Plafonner à 100
    Ok(std::cmp::min(score, 100))
}

/// Suggère le meilleur exécutable parmi une liste
/// Utilise un système de priorités amélioré
fn suggest_best_executable(executables: &[String]) -> String {
    // Chercher selon les priorités définies
    for (pattern, _) in GAME_EXECUTABLE_PATTERNS {
        if pattern.contains('*') {
            continue; // Ignorer les patterns génériques pour la suggestion
        }
        
        for exe in executables {
            if exe.to_lowercase() == pattern.to_lowercase() {
                return exe.clone();
            }
        }
    }
    
    // Chercher des correspondances partielles
    for (pattern, _) in GAME_EXECUTABLE_PATTERNS {
        if pattern.contains('*') {
            continue;
        }
        
        let pattern_base = pattern.to_lowercase().replace(".exe", "");
        for exe in executables {
            if exe.to_lowercase().contains(&pattern_base) {
                return exe.clone();
            }
        }
    }
    
    // Si aucune priorité trouvée, retourner le premier
    executables.first().unwrap_or(&"".to_string()).clone()
}

/// Détecte le launcher à partir du chemin
/// Support étendu pour plus de launchers
fn detect_launcher_from_path(path: &str) -> Option<String> {
    let path_lower = path.to_lowercase();
    
    if path_lower.contains("steam") {
        Some("Steam".to_string())
    } else if path_lower.contains("epic") {
        Some("Epic Games".to_string())
    } else if path_lower.contains("gog") {
        Some("GOG".to_string())
    } else if path_lower.contains("origin") || path_lower.contains("ea games") {
        Some("Origin".to_string())
    } else if path_lower.contains("uplay") || path_lower.contains("ubisoft") {
        Some("Ubisoft Connect".to_string())
    } else if path_lower.contains("battle.net") || path_lower.contains("blizzard") {
        Some("Battle.net".to_string())
    } else if path_lower.contains("windowsapps") || path_lower.contains("modifiablewindowsapps") {
        Some("Microsoft Store".to_string())
    } else {
        None
    }
}

/// Calcule la taille d'un répertoire
fn get_directory_size(directory: &str) -> Result<u64, String> {
    let dir_path = Path::new(directory);
    
    if !dir_path.exists() || !dir_path.is_dir() {
        return Ok(0);
    }
    
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
    
    calculate_dir_size(dir_path).map_err(|e| e.to_string())
}

/// Récupère les chemins de jeux depuis le registre Windows
/// Support étendu pour plus de launchers
#[cfg(target_os = "windows")]
fn get_registry_game_paths() -> Result<Vec<String>, String> {
    let mut paths = Vec::new();
    
    // Steam
    if let Ok(steam_path) = get_steam_path_from_registry() {
        paths.push(format!("{}\\steamapps\\common", steam_path));
    }
    
    // Epic Games
    if let Ok(epic_paths) = get_epic_games_paths_from_registry() {
        paths.extend(epic_paths);
    }
    
    // GOG
    if let Ok(gog_paths) = get_gog_paths_from_registry() {
        paths.extend(gog_paths);
    }
    
    // Origin/EA
    if let Ok(origin_paths) = get_origin_paths_from_registry() {
        paths.extend(origin_paths);
    }
    
    // Ubisoft Connect
    if let Ok(ubisoft_paths) = get_ubisoft_paths_from_registry() {
        paths.extend(ubisoft_paths);
    }
    
    Ok(paths)
}

#[cfg(not(target_os = "windows"))]
fn get_registry_game_paths() -> Result<Vec<String>, String> {
    // Sur les autres plateformes, retourner une liste vide
    Ok(Vec::new())
}

#[cfg(target_os = "windows")]
fn get_steam_path_from_registry() -> Result<String, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    // Essayer 64-bit d'abord
    if let Ok(steam_key) = hklm.open_subkey("SOFTWARE\\Valve\\Steam") {
        if let Ok(install_path) = steam_key.get_value::<String, _>("InstallPath") {
            return Ok(install_path);
        }
    }
    
    // Essayer 32-bit
    if let Ok(steam_key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\Valve\\Steam") {
        if let Ok(install_path) = steam_key.get_value::<String, _>("InstallPath") {
            return Ok(install_path);
        }
    }
    
    Err("Steam path not found in registry".to_string())
}

#[cfg(target_os = "windows")]
fn get_epic_games_paths_from_registry() -> Result<Vec<String>, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    let mut paths = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    // Essayer de lire le chemin d'installation d'Epic Games
    if let Ok(epic_key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher") {
        if let Ok(app_data_path) = epic_key.get_value::<String, _>("AppDataPath") {
            // Le chemin des manifestes contient les informations des jeux installés
            paths.push(format!("{}\\Manifests", app_data_path));
        }
    }
    
    // Ajouter les chemins par défaut
    paths.extend(vec![
        "C:\\Program Files\\Epic Games".to_string(),
        "C:\\Program Files (x86)\\Epic Games".to_string(),
    ]);
    
    Ok(paths)
}

#[cfg(target_os = "windows")]
fn get_gog_paths_from_registry() -> Result<Vec<String>, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    let mut paths = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    // Essayer de lire les jeux GOG installés
    if let Ok(gog_key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\GOG.com\\Games") {
        for game_id in gog_key.enum_keys().map(|x| x.unwrap()) {
            if let Ok(game_key) = gog_key.open_subkey(&game_id) {
                if let Ok(path) = game_key.get_value::<String, _>("PATH") {
                    // Extraire le dossier parent
                    if let Some(parent) = Path::new(&path).parent() {
                        let parent_str = parent.to_string_lossy().to_string();
                        if !paths.contains(&parent_str) {
                            paths.push(parent_str);
                        }
                    }
                }
            }
        }
    }
    
    // Ajouter les chemins par défaut si rien trouvé
    if paths.is_empty() {
        paths.extend(vec![
            "C:\\GOG Games".to_string(),
            "C:\\Program Files\\GOG.com".to_string(),
            "C:\\Program Files (x86)\\GOG.com".to_string(),
            "C:\\Program Files\\GOG Galaxy\\Games".to_string(),
        ]);
    }
    
    Ok(paths)
}

#[cfg(target_os = "windows")]
fn get_origin_paths_from_registry() -> Result<Vec<String>, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    let mut paths = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    // Essayer de lire le chemin d'installation d'Origin
    if let Ok(origin_key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\Origin") {
        if let Ok(install_path) = origin_key.get_value::<String, _>("OriginPath") {
            if let Some(parent) = Path::new(&install_path).parent() {
                paths.push(format!("{}\\Origin Games", parent.to_string_lossy()));
            }
        }
    }
    
    // Ajouter les chemins par défaut
    paths.extend(vec![
        "C:\\Program Files\\Origin Games".to_string(),
        "C:\\Program Files (x86)\\Origin Games".to_string(),
        "C:\\Program Files\\EA Games".to_string(),
        "C:\\Program Files (x86)\\EA Games".to_string(),
    ]);
    
    Ok(paths)
}

#[cfg(target_os = "windows")]
fn get_ubisoft_paths_from_registry() -> Result<Vec<String>, String> {
    use winreg::enums::*;
    use winreg::RegKey;
    
    let mut paths = Vec::new();
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    
    // Essayer de lire les jeux Ubisoft installés
    if let Ok(ubisoft_key) = hklm.open_subkey("SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs") {
        for game_id in ubisoft_key.enum_keys().map(|x| x.unwrap()) {
            if let Ok(game_key) = ubisoft_key.open_subkey(&game_id) {
                if let Ok(install_dir) = game_key.get_value::<String, _>("InstallDir") {
                    if let Some(parent) = Path::new(&install_dir).parent() {
                        let parent_str = parent.to_string_lossy().to_string();
                        if !paths.contains(&parent_str) {
                            paths.push(parent_str);
                        }
                    }
                }
            }
        }
    }
    
    // Ajouter les chemins par défaut
    paths.extend(vec![
        "C:\\Program Files\\Ubisoft\\Ubisoft Game Launcher\\games".to_string(),
        "C:\\Program Files (x86)\\Ubisoft\\Ubisoft Game Launcher\\games".to_string(),
    ]);
    
    Ok(paths)
} 