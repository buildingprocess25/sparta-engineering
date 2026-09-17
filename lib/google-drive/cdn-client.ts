import "server-only"

import { google, type drive_v3 } from "googleapis"

export type DriveCdnConfig = {
  rootFolderId: string
}

let cdnDriveClient: drive_v3.Drive | null = null
let cdnDriveConfig: DriveCdnConfig | null = null

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} env variable is not set`)
  }
  return value
}

export function getDriveCdnClient(): {
  drive: drive_v3.Drive
  config: DriveCdnConfig
} {
  if (typeof window !== "undefined") {
    throw new Error("Drive CDN client must only run on server side")
  }

  if (cdnDriveClient && cdnDriveConfig) {
    return { drive: cdnDriveClient, config: cdnDriveConfig }
  }

  const oauth2Client = new google.auth.OAuth2(
    requiredEnv("DRIVE_CDN_CLIENT_ID"),
    requiredEnv("DRIVE_CDN_CLIENT_SECRET")
  )
  oauth2Client.setCredentials({
    refresh_token: requiredEnv("DRIVE_CDN_REFRESH_TOKEN"),
  })

  cdnDriveClient = google.drive({ version: "v3", auth: oauth2Client })
  cdnDriveConfig = {
    rootFolderId: requiredEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID"),
  }

  return { drive: cdnDriveClient, config: cdnDriveConfig }
}
