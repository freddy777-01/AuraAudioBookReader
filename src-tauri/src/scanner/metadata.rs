use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::probe::Probe;
use lofty::tag::ItemKey;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;

use crate::db::AudiobookRecord;

pub fn generate_book_id<P: AsRef<Path>>(path: P) -> String {
    let canonical = fs::canonicalize(path.as_ref())
        .unwrap_or_else(|_| path.as_ref().to_path_buf());
    let mut hasher = Sha256::new();
    hasher.update(canonical.to_string_lossy().as_bytes());
    let result = hasher.finalize();
    hex::encode(&result[..16]) // 32 hex chars unique ID
}

pub fn extract_metadata<P: AsRef<Path>>(path: P) -> Option<AudiobookRecord> {
    let path_ref = path.as_ref();
    let file_metadata = fs::metadata(path_ref).ok()?;
    let file_size = file_metadata.len();
    let extension = path_ref
        .extension()?
        .to_str()?
        .to_lowercase();

    let book_id = generate_book_id(path_ref);
    let fallback_title = path_ref
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown Title")
        .to_string();

    let mut title = fallback_title.clone();
    let mut author = None;
    let mut narrator = None;
    let mut album = None;
    let mut duration_seconds = 0.0;
    let mut cover_image = None;

    // Use Lofty to probe and read audio metadata
    if let Ok(tagged_file) = Probe::open(path_ref).and_then(|p| p.read()) {
        let properties = tagged_file.properties();
        duration_seconds = properties.duration().as_secs_f64();

        if let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
            if let Some(t) = tag.get_string(&ItemKey::TrackTitle) {
                if !t.trim().is_empty() {
                    title = t.trim().to_string();
                }
            }

            if let Some(a) = tag.get_string(&ItemKey::TrackArtist).or_else(|| tag.get_string(&ItemKey::AlbumArtist)) {
                if !a.trim().is_empty() {
                    author = Some(a.trim().to_string());
                }
            }

            if let Some(comp) = tag.get_string(&ItemKey::Composer) {
                if !comp.trim().is_empty() {
                    narrator = Some(comp.trim().to_string());
                }
            }

            if let Some(alb) = tag.get_string(&ItemKey::AlbumTitle) {
                if !alb.trim().is_empty() {
                    album = Some(alb.trim().to_string());
                }
            }

            // Extract embedded album artwork
            if let Some(picture) = tag.pictures().first() {
                let mime_type = match picture.mime_type() {
                    Some(m) => m.as_str(),
                    None => "image/jpeg",
                };
                let b64 = BASE64.encode(picture.data());
                cover_image = Some(format!("data:{};base64,{}", mime_type, b64));
            }
        }
    }

    // Fallback: check for standalone cover.jpg, cover.png, folder.jpg in the same directory
    if cover_image.is_none() {
        if let Some(parent_dir) = path_ref.parent() {
            let cover_candidates = ["cover.jpg", "cover.png", "folder.jpg", "artwork.jpg", "front.jpg"];
            for candidate in cover_candidates {
                let candidate_path = parent_dir.join(candidate);
                if candidate_path.exists() {
                    if let Ok(bytes) = fs::read(&candidate_path) {
                        let mime = if candidate.ends_with(".png") {
                            "image/png"
                        } else {
                            "image/jpeg"
                        };
                        cover_image = Some(format!("data:{};base64,{}", mime, BASE64.encode(bytes)));
                        break;
                    }
                }
            }
        }
    }

    Some(AudiobookRecord {
        id: book_id,
        title,
        author,
        narrator,
        album,
        duration_seconds,
        file_path: path_ref.to_string_lossy().to_string(),
        file_size,
        format: extension,
        cover_image,
        last_scanned_at: None,
        playback: None,
    })
}
