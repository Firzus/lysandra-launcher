use std::{
    fs::{self, File},
    path::{Path, PathBuf},
};

use ::zip::ZipArchive;

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

// Version synchrone simple
#[tauri::command]
pub fn extract_zip_file(file_path: String, extract_to: String) -> Result<(), String> {
    let zip_file = File::open(&file_path).map_err(|e| format!("Failed to open zip: {}", e))?;
    let mut archive =
        ZipArchive::new(zip_file).map_err(|e| format!("Invalid zip archive: {}", e))?;

    fs::create_dir_all(&extract_to)
        .map_err(|e| format!("Failed to create output dir: {}", e))?;

    let total_files = archive.len();
    println!("Starting extraction of {} files to: {}", total_files, extract_to);

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Cannot access entry: {}", e))?;
        let entry_name = file.name().to_string();

        let relative_path = match sanitize_zip_path(&entry_name) {
            Some(path) => path,
            None => {
                println!("Skipped suspicious file path: {}", entry_name);
                continue;
            }
        };

        let out_path = Path::new(&extract_to).join(&relative_path);

        if file.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            println!("Created directory: {}", entry_name);
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            println!("Extracted file: {}", entry_name);
        }
    }

    println!("Extraction completed successfully!");
    Ok(())
}
