import type { drive_v3 } from "googleapis"

export type DriveFolder = {
  id: string
  name: string
  parentIds: string[]
}

export interface DriveFolderGateway {
  listChildFolders(parentId: string): Promise<DriveFolder[]>
  getFolder(folderId: string): Promise<DriveFolder | null>
  createFolder(parentId: string, name: string): Promise<DriveFolder>
}

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"
const LIST_PAGE_SIZE = 1000

function escapeDriveQueryValue(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")
}

function toDriveFolder(file: drive_v3.Schema$File): DriveFolder {
  if (!file.id || !file.name) {
    throw new Error("Google Drive folder response is missing id or name")
  }

  return {
    id: file.id,
    name: file.name,
    parentIds: file.parents ?? [],
  }
}

export function createGoogleFolderGateway(
  drive: drive_v3.Drive
): DriveFolderGateway {
  return {
    async listChildFolders(parentId) {
      const escapedParentId = escapeDriveQueryValue(parentId)
      const folders: DriveFolder[] = []
      let pageToken: string | undefined

      do {
        const response = await drive.files.list({
          q: `'${escapedParentId}' in parents and mimeType = '${FOLDER_MIME_TYPE}' and trashed = false`,
          fields: "nextPageToken,files(id,name,parents)",
          spaces: "drive",
          pageSize: LIST_PAGE_SIZE,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        })

        folders.push(...(response.data.files ?? []).map(toDriveFolder))
        pageToken = response.data.nextPageToken ?? undefined
      } while (pageToken)

      return folders
    },

    async getFolder(folderId) {
      try {
        const response = await drive.files.get({
          fileId: folderId,
          fields: "id,name,parents,mimeType,trashed",
          supportsAllDrives: true,
        })
        const file = response.data

        if (file.trashed || file.mimeType !== FOLDER_MIME_TYPE) {
          return null
        }

        return toDriveFolder(file)
      } catch (error) {
        const status =
          (error as { code?: number; status?: number }).code ??
          (error as { status?: number }).status
        if (status === 404) {
          return null
        }
        throw error
      }
    },

    async createFolder(parentId, name) {
      const response = await drive.files.create({
        requestBody: {
          name,
          mimeType: FOLDER_MIME_TYPE,
          parents: [parentId],
        },
        fields: "id,name,parents",
        supportsAllDrives: true,
      })

      return toDriveFolder(response.data)
    },
  }
}
