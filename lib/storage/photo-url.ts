export const GOOGLE_DRIVE_CDN_PREFIX = "https://lh3.googleusercontent.com/d/"

export function normalizePhotoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizePhotoUrls(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  return values
    .map(normalizePhotoUrl)
    .filter((url): url is string => url !== null)
}

export function parseUrlList(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return normalizePhotoUrls(raw)

  if (typeof raw !== "string") return []
  const trimmed = raw.trim()
  if (!trimmed || trimmed === "[]") return []

  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    try {
      return parseUrlList(JSON.parse(trimmed))
    } catch {
      return []
    }
  }

  const normalized = normalizePhotoUrl(trimmed)
  return normalized ? [normalized] : []
}

export function buildCdnUrl(fileId: string): string {
  return `/api/photos/${fileId}`
}

export function buildDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=download`
}

export function extractDriveFileId(url: unknown): string | null {
  const normalized = normalizePhotoUrl(url)
  if (!normalized) return null

  if (normalized.startsWith(GOOGLE_DRIVE_CDN_PREFIX)) {
    return normalized.substring(GOOGLE_DRIVE_CDN_PREFIX.length)
  }

  const downloadMatch = normalized.match(/drive\.google\.com\/uc\?id=([^&]+)/)
  if (downloadMatch) {
    return downloadMatch[1]
  }

  const proxyMatch = normalized.match(/\/api\/photos\/([^/?#]+)/)
  if (proxyMatch) {
    return proxyMatch[1]
  }

  return null
}

export function resolvePhotoUrl(url: unknown): string {
  const normalized = normalizePhotoUrl(url)
  if (!normalized) return ""

  const fileId = extractDriveFileId(normalized)
  return fileId ? buildCdnUrl(fileId) : normalized
}
