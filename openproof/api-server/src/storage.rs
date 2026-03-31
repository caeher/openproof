use std::path::{Path, PathBuf};

pub fn sanitize_filename(filename: &str) -> String {
    let mut sanitized = String::with_capacity(filename.len());
    for ch in filename.chars() {
        if ch.is_ascii_alphanumeric() || matches!(ch, '.' | '-' | '_') {
            sanitized.push(ch);
        } else {
            sanitized.push('_');
        }
    }

    let trimmed = sanitized.trim_matches('_').trim();
    if trimmed.is_empty() {
        "archivo.bin".to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn document_file_path(storage_root: &str, document_id: &str, filename: &str) -> PathBuf {
    Path::new(storage_root)
        .join(document_id)
        .join(sanitize_filename(filename))
}