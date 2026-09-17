import type { Readable } from "node:stream"

import { type NextRequest, NextResponse } from "next/server"

import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await context.params

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      )
    }

    const { drive } = getDriveCdnClient()
    const file = await drive.files.get({
      fileId,
      fields: "mimeType",
      supportsAllDrives: true,
    })
    const mimeType = file.data.mimeType || "image/jpeg"

    const response = await drive.files.get(
      {
        fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    )

    const nodeStream = response.data as Readable
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        nodeStream.on("end", () => {
          controller.close()
        })
        nodeStream.on("error", (error: Error) => {
          controller.error(error)
        })
      },
    })

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    )
  }
}
