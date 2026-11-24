/** Common API contract for checklist photo uploads; no browser-specific logic. */
export type UploadedChecklistPhoto = {
  fileId: string
  url: string
}

export async function readPhotoUploadResponse(
  response: Response,
): Promise<UploadedChecklistPhoto> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(
      response.ok
        ? "Respons server upload foto tidak valid. Hubungi admin."
        : `Upload foto gagal (HTTP ${response.status}). Periksa server SPARTA.`,
    )
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Respons server upload foto tidak valid. Hubungi admin.")
  }

  const data = payload as Record<string, unknown>
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : `Upload foto gagal (HTTP ${response.status}).`,
    )
  }

  if (
    typeof data.fileId !== "string" ||
    !data.fileId.trim() ||
    typeof data.url !== "string" ||
    !data.url.trim()
  ) {
    throw new Error("Server tidak mengirim ID dan alamat foto yang valid.")
  }

  return { fileId: data.fileId, url: data.url }
}
