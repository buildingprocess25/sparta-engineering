import assert from "node:assert/strict"

import {
  buildCdnUrl,
  buildDownloadUrl,
  extractDriveFileId,
  normalizePhotoUrls,
  resolvePhotoUrl,
} from "./photo-url"

assert.equal(buildCdnUrl("drive-file-123"), "/api/photos/drive-file-123")
assert.equal(
  buildDownloadUrl("drive-file-123"),
  "https://drive.google.com/uc?id=drive-file-123&export=download"
)

assert.equal(
  extractDriveFileId("https://lh3.googleusercontent.com/d/drive-file-123"),
  "drive-file-123"
)
assert.equal(
  extractDriveFileId(
    "https://drive.google.com/uc?id=drive-file-123&export=download"
  ),
  "drive-file-123"
)
assert.equal(extractDriveFileId("/api/photos/drive-file-123"), "drive-file-123")
assert.equal(extractDriveFileId("https://example.com/photo.jpg"), null)

assert.equal(
  resolvePhotoUrl("https://lh3.googleusercontent.com/d/drive-file-123"),
  "/api/photos/drive-file-123"
)
assert.equal(resolvePhotoUrl("https://example.com/photo.jpg"), "https://example.com/photo.jpg")
assert.deepEqual(normalizePhotoUrls([" a ", "", null, "b"]), ["a", "b"])
