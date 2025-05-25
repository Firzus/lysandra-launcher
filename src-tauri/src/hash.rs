use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::{BufReader, Read},
};

pub fn compute_sha256(path: &str) -> Result<String, std::io::Error> {
    let mut file = BufReader::new(File::open(path)?);
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];
    while let Ok(n) = file.read(&mut buffer) {
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    format!("{:x}", hasher.finalize())
}
