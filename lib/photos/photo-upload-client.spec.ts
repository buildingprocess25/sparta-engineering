import assert from "node:assert/strict"
import { readPhotoUploadResponse } from "./photo-upload-client"

const response = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "application/json" } })

const photo = await readPhotoUploadResponse(
  response(JSON.stringify({ fileId: "drive-file-1", url: "/api/photos/drive-file-1" })),
)
assert.deepEqual(photo, { fileId: "drive-file-1", url: "/api/photos/drive-file-1" })

await assert.rejects(
  () => readPhotoUploadResponse(response(JSON.stringify({ ok: true, photo: {} }))),
  /ID dan alamat foto/,
)
await assert.rejects(
  () => readPhotoUploadResponse(response(JSON.stringify({ error: "Ukuran foto melebihi 4 MB" }), 400)),
  /melebihi 4 MB/,
)
await assert.rejects(
  () => readPhotoUploadResponse(new Response("<html>error</html>", { status: 500 })),
  /HTTP 500/,
)
console.log("PASS photo-upload-client.spec.ts")
