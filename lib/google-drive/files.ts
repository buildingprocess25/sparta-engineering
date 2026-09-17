import "server-only"

import { Readable } from "node:stream"

import { getGoogleDriveClient } from "@/lib/google-drive/client"
import { createGoogleFolderGateway } from "@/lib/google-drive/folder-gateway"

const folderPathCache = new Map<string, string>()
const folderLookupCache = new Map<string, string>()

export type DriveFileResult = {
  fileId: string
  webViewLink: string | null
  webContentLink: string | null
  name: string
}

export async function ensureDriveFolderPath(
  pathSegments: string[]
): Promise<string> {
  if (pathSegments.length === 0) {
    throw new Error("pathSegments must have at least one segment")
  }

  const { drive, config } = getGoogleDriveClient()
  const gateway = createGoogleFolderGateway(drive)
  const normalizedSegments = pathSegments
    .map((segment) => segment.trim())
    .filter(Boolean)

  const pathCacheKey = `${config.rootFolderId}/${normalizedSegments.join("/")}`
  const cachedPathFolderId = folderPathCache.get(pathCacheKey)
  if (cachedPathFolderId) {
    return cachedPathFolderId
  }

  let currentParentId = config.rootFolderId

  for (const segment of normalizedSegments) {
    const lookupKey = `${currentParentId}::${segment}`
    const cachedFolderId = folderLookupCache.get(lookupKey)
    if (cachedFolderId) {
      currentParentId = cachedFolderId
      continue
    }

    const existing = (await gateway.listChildFolders(currentParentId)).find(
      (folder) => folder.name === segment
    )
    const folderId =
      existing?.id ?? (await gateway.createFolder(currentParentId, segment)).id

    folderLookupCache.set(lookupKey, folderId)
    currentParentId = folderId
  }

  folderPathCache.set(pathCacheKey, currentParentId)
  return currentParentId
}

export async function uploadPdfToDrive(params: {
  fileName: string
  folderId: string
  buffer: Buffer
  overwriteIfExists?: boolean
}): Promise<DriveFileResult> {
  const { drive } = getGoogleDriveClient()
  const { fileName, folderId, buffer, overwriteIfExists = true } = params

  let existingId: string | undefined
  if (overwriteIfExists) {
    const safeFileName = fileName.replaceAll("\\", "\\\\").replaceAll("'", "\\'")
    const existing = await drive.files.list({
      q: `'${folderId}' in parents and name = '${safeFileName}' and trashed = false`,
      fields: "files(id,name)",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      pageSize: 1,
    })
    existingId = existing.data.files?.[0]?.id ?? undefined
  }

  const media = {
    mimeType: "application/pdf",
    body: Readable.from(buffer),
  }

  const response = existingId
    ? await drive.files.update({
        fileId: existingId,
        media,
        fields: "id,name,webViewLink,webContentLink",
        supportsAllDrives: true,
      })
    : await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          mimeType: "application/pdf",
        },
        media,
        fields: "id,name,webViewLink,webContentLink",
        supportsAllDrives: true,
      })

  if (!response.data.id || !response.data.name) {
    throw new Error("Google Drive file response is missing id or name")
  }

  return {
    fileId: response.data.id,
    name: response.data.name,
    webViewLink: response.data.webViewLink ?? null,
    webContentLink: response.data.webContentLink ?? null,
  }
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const { drive } = getGoogleDriveClient()
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  })
}
