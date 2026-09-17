import {
  buildChecklistEvidenceRelativePath,
  buildChecklistReportRelativePath,
  type ChecklistEvidencePathInput,
  type ChecklistReportPathInput,
  REPORT_DOCUMENT_FOLDER,
} from "./hierarchy-policy"
import type { DriveFolderGateway } from "./folder-gateway"

export type DriveHierarchyDeps = {
  gateway: DriveFolderGateway
}

export type ChecklistReportFolderInput = ChecklistReportPathInput & {
  rootFolderId: string
}

export type ChecklistEvidenceFolderInput = ChecklistReportFolderInput & {
  evidence: ChecklistEvidencePathInput
}

async function ensureChildFolder(
  gateway: DriveFolderGateway,
  parentId: string,
  name: string
): Promise<string> {
  const child = (await gateway.listChildFolders(parentId)).find(
    (folder) => folder.name === name
  )
  if (child) {
    return child.id
  }

  return (await gateway.createFolder(parentId, name)).id
}

async function ensureFolderPath(
  gateway: DriveFolderGateway,
  rootFolderId: string,
  path: string[]
): Promise<string> {
  let parentId = rootFolderId

  for (const segment of path) {
    parentId = await ensureChildFolder(gateway, parentId, segment)
  }

  return parentId
}

export async function ensureChecklistReportFolder(
  deps: DriveHierarchyDeps,
  input: ChecklistReportFolderInput
): Promise<string> {
  return ensureFolderPath(
    deps.gateway,
    input.rootFolderId,
    buildChecklistReportRelativePath(input)
  )
}

export async function ensureChecklistEvidenceFolder(
  deps: DriveHierarchyDeps,
  input: ChecklistEvidenceFolderInput
): Promise<string> {
  const reportFolderId = await ensureChecklistReportFolder(deps, input)
  return ensureFolderPath(
    deps.gateway,
    reportFolderId,
    buildChecklistEvidenceRelativePath(input.evidence)
  )
}

export async function ensureChecklistDocumentFolder(
  deps: DriveHierarchyDeps,
  input: ChecklistReportFolderInput
): Promise<string> {
  const reportFolderId = await ensureChecklistReportFolder(deps, input)
  return ensureFolderPath(deps.gateway, reportFolderId, [
    REPORT_DOCUMENT_FOLDER,
  ])
}
