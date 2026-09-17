import { Readable } from "node:stream"

import { getDriveCdnClient } from "../google-drive/cdn-client"
import { buildCdnUrl } from "./photo-url"

export type DrivePhotoUploadOutcome =
  | { success: true; fileId: string; url: string }
  | { success: false; error: string }

export async function uploadPhotoToDriveCdn(
  blob: Blob | File,
  input: { parentFolderId: string; fileName: string }
): Promise<DrivePhotoUploadOutcome> {
  try {
    const { drive } = getDriveCdnClient()
    const buffer = Buffer.from(await blob.arrayBuffer())
    const contentType = blob.type || "image/jpeg"

    const created = await drive.files.create({
      requestBody: {
        name: input.fileName,
        parents: [input.parentFolderId],
        mimeType: contentType,
      },
      media: {
        mimeType: contentType,
        body: Readable.from(buffer),
      },
      fields: "id",
      supportsAllDrives: true,
    })

    const fileId = created.data.id
    if (!fileId) {
      return {
        success: false,
        error: "Google Drive create returned empty file ID",
      }
    }

    return { success: true, fileId, url: buildCdnUrl(fileId) }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
