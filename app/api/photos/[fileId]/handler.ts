import { NextResponse } from "next/server"
import { canUserAccessReport, type ReportAccessTarget, type ReportAccessUser } from "../../../../lib/reports/report-access"

export type PhotoGetHandlerDeps = {
  getCurrentUser(): Promise<ReportAccessUser | null>
  findOwningReport(fileId: string): Promise<ReportAccessTarget | null>
  fetchPhoto(fileId: string): Promise<{
    mimeType: string
    body: ReadableStream<Uint8Array> | Uint8Array
  }>
}

export function createPhotoGetHandler(deps: PhotoGetHandlerDeps) {
  return async function get(
    _request: Request,
    context: { params: Promise<{ fileId: string }> },
  ) {
    try {
      const user = await deps.getCurrentUser()
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { fileId } = await context.params
      if (!fileId || !fileId.trim()) {
        return NextResponse.json({ error: "File ID is required" }, { status: 400 })
      }

      const report = await deps.findOwningReport(fileId)
      if (!report) {
        return NextResponse.json({ error: "Foto tidak ditemukan" }, { status: 404 })
      }

      if (!canUserAccessReport(user, report)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const { mimeType, body } = await deps.fetchPhoto(fileId)
      return new NextResponse(body as BodyInit, {
        headers: {
          "Content-Type": mimeType || "image/jpeg",
          "Cache-Control": "private, max-age=3600",
          Vary: "Cookie",
        },
      })
    } catch (error) {
      console.error("[photo-get] Failed to fetch photo:", error)
      return NextResponse.json(
        { error: "Failed to fetch photo" },
        { status: 500 },
      )
    }
  }
}
