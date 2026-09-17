import assert from "node:assert/strict"

import type { DriveFolder, DriveFolderGateway } from "./folder-gateway"
import {
  ensureChecklistDocumentFolder,
  ensureChecklistEvidenceFolder,
  ensureChecklistReportFolder,
} from "./hierarchy-service"

class FakeGateway implements DriveFolderGateway {
  folders = new Map<string, DriveFolder>()
  children = new Map<string, string[]>()
  creates: Array<{ parentId: string; name: string; id: string }> = []

  constructor(folders: Array<{ id: string; name: string; parentId?: string }>) {
    for (const folder of folders) {
      const parentIds = folder.parentId ? [folder.parentId] : []
      this.folders.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentIds,
      })
      if (folder.parentId) {
        this.children.set(folder.parentId, [
          ...(this.children.get(folder.parentId) ?? []),
          folder.id,
        ])
      }
    }
  }

  async listChildFolders(parentId: string): Promise<DriveFolder[]> {
    return (this.children.get(parentId) ?? []).map((id) =>
      this.folders.get(id)!
    )
  }

  async getFolder(folderId: string): Promise<DriveFolder | null> {
    return this.folders.get(folderId) ?? null
  }

  async createFolder(parentId: string, name: string): Promise<DriveFolder> {
    const id = `created-${this.creates.length + 1}`
    const folder = { id, name, parentIds: [parentId] }
    this.folders.set(id, folder)
    this.children.set(parentId, [...(this.children.get(parentId) ?? []), id])
    this.creates.push({ parentId, name, id })
    return folder
  }
}

const gateway = new FakeGateway([{ id: "root", name: "DOKUMEN SPARTA" }])

const reportFolderId = await ensureChecklistReportFolder(
  { gateway },
  {
    rootFolderId: "root",
    branchName: "BANJARMASIN",
    areaName: "Office",
    periodKey: "2026-09",
    reportCode: "ENG-OFFICE-202609-001",
  }
)

assert.equal(reportFolderId, "created-6")
assert.deepEqual(
  gateway.creates.map((create) => create.name),
  [
    "BANJARMASIN",
    "Engineering",
    "Checklist",
    "Office",
    "2026-09",
    "ENG-OFFICE-202609-001",
  ]
)

const evidenceFolderId = await ensureChecklistEvidenceFolder(
  { gateway },
  {
    rootFolderId: "root",
    branchName: "BANJARMASIN",
    areaName: "Office",
    periodKey: "2026-09",
    reportCode: "ENG-OFFICE-202609-001",
    evidence: {
      formCode: "FRM_TSM_003",
      itemId: "air_conditioner",
      itemName: "Air Conditioner",
    },
  }
)

assert.equal(evidenceFolderId, "created-9")
assert.deepEqual(
  gateway.creates.slice(6).map((create) => create.name),
  ["02 - Foto Checklist", "FRM_TSM_003", "air_conditioner - Air Conditioner"]
)

const documentFolderId = await ensureChecklistDocumentFolder(
  { gateway },
  {
    rootFolderId: "root",
    branchName: "BANJARMASIN",
    areaName: "Office",
    periodKey: "2026-09",
    reportCode: "ENG-OFFICE-202609-001",
  }
)

assert.equal(gateway.folders.get(documentFolderId)?.name, "01 - Dokumen")
