import { Readable } from "node:stream"
import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"
import { getPrisma } from "@/lib/prisma"
import { getWorkPermitUser } from "@/lib/work-permits/current-user"
import { createPhotoGetHandler } from "./handler"

function toWebBody(data: unknown): ReadableStream<Uint8Array> | Uint8Array {
  if (data instanceof Uint8Array) {
    return data
  }
  if (
    data &&
    typeof data === "object" &&
    "getReader" in data &&
    typeof (data as ReadableStream<Uint8Array>).getReader === "function"
  ) {
    return data as ReadableStream<Uint8Array>
  }

  const nodeStream = data as Readable
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on("data", (chunk: Buffer | Uint8Array | string) => {
        if (typeof chunk === "string") {
          controller.enqueue(Buffer.from(chunk))
        } else {
          controller.enqueue(new Uint8Array(chunk))
        }
      })
      nodeStream.on("end", () => {
        controller.close()
      })
      nodeStream.on("error", (error: Error) => {
        controller.error(error)
      })
    },
    cancel() {
      nodeStream.destroy()
    },
  })
}

export const GET = createPhotoGetHandler({
  async getCurrentUser() {
    return getWorkPermitUser()
  },
  async findOwningReport(fileId) {
    const prisma = getPrisma()
    try {
      const direct = await prisma.checklistReport.findFirst({
        where: {
          drivePhotoFileIds: {
            array_contains: [fileId],
          },
        },
        select: {
          authorId: true,
          author: {
            select: {
              branchName: true,
            },
          },
          equipment: {
            select: {
              branchName: true,
            },
          },
        },
      })
      if (direct) return direct
    } catch {
      // fallback to scan below when JSON filter is not supported
    }

    const candidates = await prisma.checklistReport.findMany({
      select: {
        authorId: true,
        drivePhotoFileIds: true,
        checklistPayload: true,
        author: {
          select: {
            branchName: true,
          },
        },
        equipment: {
          select: {
            branchName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    })

    for (const candidate of candidates) {
      const inDriveList =
        Array.isArray(candidate.drivePhotoFileIds) &&
        candidate.drivePhotoFileIds.includes(fileId)
      const inPayload =
        candidate.checklistPayload &&
        JSON.stringify(candidate.checklistPayload).includes(fileId)
      if (inDriveList || inPayload) {
        return {
          authorId: candidate.authorId,
          author: candidate.author,
          equipment: candidate.equipment,
        }
      }
    }

    return null
  },
  async fetchPhoto(fileId) {
    const { drive } = getDriveCdnClient()
    const file = await drive.files.get({
      fileId,
      fields: "mimeType",
      supportsAllDrives: true,
    })
    const mimeType = file.data.mimeType || "image/jpeg"
    const response = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" },
    )
    return {
      mimeType,
      body: toWebBody(response.data),
    }
  },
})
