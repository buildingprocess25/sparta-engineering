import assert from "node:assert/strict"

import { createPhotoUploadPostHandler } from "./handler"

async function makeRequest(
  context: unknown,
  file = new File(["x"], "photo.jpg", { type: "image/jpeg" })
) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("context", JSON.stringify(context))
  return new Request("http://localhost/api/photos/upload", {
    method: "POST",
    body: formData,
  })
}

const uploadCalls: Array<{ parentFolderId: string; fileName: string }> = []
const handler = createPhotoUploadPostHandler({
  getSession: async () => ({ userId: "ES001", role: "ES" }),
  loadReport: async () => ({
    reportCode: "ENG-OFFICE-202609-001",
    authorId: "ES001",
    status: "DRAFT",
    formCode: "FRM_TSM_003",
    periodKey: "2026-09",
    area: { name: "Office" },
    author: { branchName: "BANJARMASIN" },
  }),
  rootFolderId: "root",
  ensureEvidenceFolder: async () => "evidence-123",
  uploadPhoto: async (_file, input) => {
    uploadCalls.push(input)
    return { success: true, fileId: "file-123", url: "/api/photos/file-123" }
  },
  randomId: () => "abcdef12",
})

const ok = await handler(
  await makeRequest({
    kind: "CHECKLIST_ITEM",
    reportCode: "ENG-OFFICE-202609-001",
    formCode: "FRM_TSM_003",
    itemId: "air_conditioner",
  })
)

assert.equal(ok.status, 200)
assert.deepEqual(await ok.json(), {
  fileId: "file-123",
  url: "/api/photos/file-123",
})
assert.equal(uploadCalls[0]?.parentFolderId, "evidence-123")
assert.match(uploadCalls[0]?.fileName ?? "", /^checklist-001-abcdef12\.jpg$/)

const forbidden = await createPhotoUploadPostHandler({
  getSession: async () => ({ userId: "ES002", role: "ES" }),
  loadReport: async () => ({
    reportCode: "ENG-OFFICE-202609-001",
    authorId: "ES001",
    status: "DRAFT",
    formCode: "FRM_TSM_003",
    periodKey: "2026-09",
    area: { name: "Office" },
    author: { branchName: "BANJARMASIN" },
  }),
  rootFolderId: "root",
  ensureEvidenceFolder: async () => "evidence",
  uploadPhoto: async () => ({
    success: true,
    fileId: "file",
    url: "/api/photos/file",
  }),
})(
  await makeRequest({
    kind: "CHECKLIST_ITEM",
    reportCode: "ENG-OFFICE-202609-001",
    formCode: "FRM_TSM_003",
    itemId: "air_conditioner",
  })
)

assert.equal(forbidden.status, 403)
