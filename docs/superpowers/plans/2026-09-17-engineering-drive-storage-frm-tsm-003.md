# Engineering Drive Storage and FRM TSM 003 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Google Drive storage/proxy foundation and prepare `FRM_TSM_003` to store checklist items as one JSON payload per report.

**Architecture:** Follow the proven `sparta-maintenance` pattern: reserve a draft report before the first photo upload, upload files directly to the final Drive hierarchy, store Drive file IDs in report data, and serve photos through an app proxy. The Engineering hierarchy is branch-based and area-based; it does not use store or store-code folders.

**Tech Stack:** Next.js App Router 16.2.6, React 19.2.4, Prisma 7.9.1, PostgreSQL, Google Drive API through `googleapis`, TypeScript, Node test scripts with `node:assert/strict`.

## Global Constraints

- Read `AI_RULES.md`, `skills-lock.json`, `docs/02_Features/Checklist/00_Spec.md`, and `docs/01_Architecture/10_Data_Models.md` before code changes.
- Prisma is the only ORM.
- Never run `prisma db push`.
- Before migration commands that touch a database, ask whether the current connection is development or production.
- `prisma validate`, `prisma format`, and `prisma generate` are allowed because they do not mutate the configured database.
- Secrets must not be committed to documentation, tests, logs, or source code.
- The Google Drive hierarchy must not include store or store-code folders.
- New checklist photos must not fall back to the Google Drive root folder.
- New `FRM_TSM_003` submissions store item results in `ChecklistReport.checklistPayload`, not `ChecklistItem` rows.
- `BAIK` and `RUSAK` require at least one photo; `TIDAK_ADA` does not.
- Use TDD: write a failing test, run it red, implement minimal code, run it green.

---

## File Structure

- Create `lib/google-drive/hierarchy-policy.ts`: pure naming, sanitization, folder path, and file name helpers.
- Create `lib/google-drive/hierarchy-policy.spec.ts`: pure tests for Engineering Drive paths.
- Create `lib/google-drive/folder-gateway.ts`: Drive folder gateway interface and Google Drive adapter.
- Create `lib/google-drive/hierarchy-service.ts`: ensure branch, Engineering, Checklist, area, period, report, document, and evidence folders.
- Create `lib/google-drive/hierarchy-service.spec.ts`: fake gateway tests for folder ensure behavior.
- Create `lib/google-drive/client.ts`: primary server-only Google Drive OAuth client.
- Create `lib/google-drive/cdn-client.ts`: server-only Drive client for photo upload/proxy.
- Create `lib/google-drive/files.ts`: PDF/file upload helpers for future report documents.
- Create `lib/storage/photo-url.ts`: build and resolve proxy photo URLs.
- Create `lib/storage/photo-url.spec.ts`: tests for file ID extraction and proxy URL behavior.
- Create `lib/storage/drive-photo-service.ts`: upload photo blobs to a provided Drive folder.
- Create `app/api/photos/[fileId]/route.ts`: stream Drive file content through the app proxy.
- Create `app/api/photos/upload/handler.ts`: injectable upload handler for route tests.
- Create `app/api/photos/upload/route.ts`: thin Next.js route wiring real dependencies.
- Create `app/api/photos/upload/route.spec.ts`: upload handler tests with fake dependencies.
- Create `lib/checklists/frm-tsm-003.ts`: form definition and item metadata.
- Create `lib/checklists/payload.ts`: checklist payload validation and safety calculation.
- Create `lib/checklists/payload.spec.ts`: tests for required photo and `isSafe` behavior.
- Create `lib/reports/drive-draft-service.ts`: reserve and promote draft report behavior.
- Create `lib/reports/drive-draft-service.spec.ts`: repository-contract tests for draft reuse and replacement.
- Create `lib/reports/drive-draft-prisma-repository.ts`: Prisma repository for draft reservation.
- Modify `prisma/schema.prisma`: add report JSON/file fields, `DRAFT` status, and `GoogleDriveFolderCache`.
- Add a Prisma migration after environment confirmation.
- Modify `docs/01_Architecture/10_Data_Models.md`: document new fields and folder cache.
- Modify `docs/02_Features/Checklist/00_Spec.md`: document `FRM_TSM_003`, draft upload, and JSON payload storage.
- Modify `.env.example`: document Google Drive env variable names without values.

### Task 1: Document Checklist And Data Model Contracts

**Files:**
- Modify: `docs/02_Features/Checklist/00_Spec.md`
- Modify: `docs/01_Architecture/10_Data_Models.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: approved design in `docs/superpowers/specs/2026-09-17-engineering-drive-storage-frm-tsm-003-design.md`.
- Produces: documented contracts used by schema, route, and storage tasks.

- [ ] **Step 1: Update checklist feature spec**

Add a section to `docs/02_Features/Checklist/00_Spec.md`:

```markdown
## FRM_TSM_003 Checklist Ruangan

`FRM_TSM_003` is the first digital checklist form. It is available for Office Monthly and warehouse-family Monthly flows.

The digital condition choices are:
- `BAIK`
- `RUSAK`
- `TIDAK_ADA`

`BAIK` and `RUSAK` require at least one uploaded photo. `TIDAK_ADA` does not require a photo.

Checklist item results are stored as one JSON payload on `ChecklistReport.checklistPayload`; this form does not create one `ChecklistItem` row per item.

Photos are uploaded to Google Drive only after a draft report has been reserved. Photo URLs shown in the application use `/api/photos/[fileId]`.
```

- [ ] **Step 2: Update data model doc**

Add fields to the `ChecklistReport` table in `docs/01_Architecture/10_Data_Models.md`:

```markdown
| reportCode | String? | Unique operational report code generated when the draft is reserved |
| formCode | String? | Form code such as `FRM_TSM_003` |
| checklistPayload | Json | One JSON object containing submitted checklist item results |
| drivePhotoFileIds | Json | Array of Google Drive file IDs uploaded for the report |
| finalPdfDriveUrl | String? | Future final PDF Drive URL |
| finalPdfFolderUrl | String? | Future final PDF folder URL |
```

Add a `GoogleDriveFolderCache` section:

```markdown
### GoogleDriveFolderCache
| Field | Tipe | Keterangan |
|---|---|---|
| id | String (cuid) | Primary key |
| cacheKey | String | Unique stable folder cache key |
| folderId | String | Google Drive folder ID |
| createdAt | DateTime | Timestamp pembuatan |
| updatedAt | DateTime | Timestamp update terakhir |
```

- [ ] **Step 3: Update env example**

Add these names to `.env.example`:

```dotenv
# Google Drive storage. Set these only on the server/runtime environment.
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REFRESH_TOKEN=""
GOOGLE_DRIVE_ROOT_FOLDER_ID=""
DRIVE_CDN_CLIENT_ID=""
DRIVE_CDN_CLIENT_SECRET=""
DRIVE_CDN_REFRESH_TOKEN=""
DRIVE_CDN_SHARE_MODE="private"
DRIVE_CDN_SHARE_DOMAIN=""
```

- [ ] **Step 4: Review documentation diff**

Run:

```powershell
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering diff -- docs/02_Features/Checklist/00_Spec.md docs/01_Architecture/10_Data_Models.md .env.example
```

Expected: the diff documents the storage and JSON payload contract without secret values.

### Task 2: Add Prisma Schema Support

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_drive_storage_checklist_json/migration.sql`

**Interfaces:**
- Consumes: documented fields from Task 1.
- Produces: Prisma models and generated types used by draft, upload, and payload tasks.

- [ ] **Step 1: Write schema expectation test**

Create `prisma/schema-contract.spec.mjs`:

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("./schema.prisma", import.meta.url), "utf8");

assert.match(schema, /DRAFT/);
assert.match(schema, /reportCode\s+String\?\s+@unique/);
assert.match(schema, /formCode\s+String\?/);
assert.match(schema, /checklistPayload\s+Json\s+@default\("\{\}"\)/);
assert.match(schema, /drivePhotoFileIds\s+Json\s+@default\("\[\]"\)/);
assert.match(schema, /finalPdfDriveUrl\s+String\?/);
assert.match(schema, /finalPdfFolderUrl\s+String\?/);
assert.match(schema, /model GoogleDriveFolderCache/);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node prisma/schema-contract.spec.mjs
```

Expected: FAIL because `DRAFT`, `reportCode`, and `GoogleDriveFolderCache` are not present yet.

- [ ] **Step 3: Modify Prisma schema**

Change `ReportStatus`:

```prisma
enum ReportStatus {
  DRAFT
  PENDING_COORD
  PENDING_MANAGER
  PENDING_REQUESTER
  COMPLETED
  REJECTED
}
```

Add this model:

```prisma
model GoogleDriveFolderCache {
  id        String   @id @default(cuid())
  cacheKey  String   @unique
  folderId  String
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @db.Timestamptz(3)
}
```

Update `ChecklistReport`:

```prisma
model ChecklistReport {
  id                String           @id @default(cuid())
  reportCode        String?          @unique
  areaId            String
  authorId          String
  category          ReportCategory   @default(PREVENTIVE)
  formCode          String?
  period            ChecklistPeriod?
  periodKey         String?
  status            ReportStatus     @default(DRAFT)
  isSafe            Boolean          @default(false)
  checklistPayload  Json             @default("{}")
  drivePhotoFileIds Json             @default("[]")
  finalPdfDriveUrl  String?
  finalPdfFolderUrl String?
  createdAt         DateTime         @default(now()) @db.Timestamptz(3)
  updatedAt         DateTime         @updatedAt @db.Timestamptz(3)

  area   Area            @relation(fields: [areaId], references: [id])
  author User            @relation("ReportAuthor", fields: [authorId], references: [NIK])
  items  ChecklistItem[]

  @@unique([areaId, period, periodKey])
  @@index([authorId])
  @@index([areaId])
  @@index([status])
  @@index([reportCode])
}
```

- [ ] **Step 4: Run schema expectation test**

Run:

```powershell
node prisma/schema-contract.spec.mjs
```

Expected: PASS.

- [ ] **Step 5: Validate Prisma schema**

Run:

```powershell
pnpm prisma:format
pnpm prisma:validate
```

Expected: both commands exit 0.

- [ ] **Step 6: Create migration after environment confirmation**

Ask the user: `Apakah DATABASE_URL saat ini development atau production?`

If the user confirms development, run:

```powershell
pnpm prisma migrate dev --create-only --name drive_storage_checklist_json
```

Expected: a new migration folder is created and the database is not migrated beyond migration creation.

### Task 3: Build Engineering Drive Hierarchy Policy

**Files:**
- Create: `lib/google-drive/hierarchy-policy.ts`
- Create: `lib/google-drive/hierarchy-policy.spec.ts`

**Interfaces:**
- Produces:
  - `sanitizeDriveSegment(value: string): string`
  - `buildChecklistReportRelativePath(input: ChecklistReportPathInput): string[]`
  - `buildChecklistEvidenceRelativePath(input: ChecklistEvidencePathInput): string[]`
  - `buildFinalPdfName(reportCode: string): string`
  - `buildChecklistPhotoName(input: { sequence: number; randomSuffix: string; extension: string }): string`

- [ ] **Step 1: Write failing policy tests**

Create `lib/google-drive/hierarchy-policy.spec.ts`:

```ts
import assert from "node:assert/strict"

import {
  buildChecklistEvidenceRelativePath,
  buildChecklistPhotoName,
  buildChecklistReportRelativePath,
  buildFinalPdfName,
  sanitizeDriveSegment,
} from "./hierarchy-policy"

assert.equal(sanitizeDriveSegment(" Dinding / partisi\\utama "), "Dinding - partisi-utama")
assert.equal(sanitizeDriveSegment("   "), "-")

assert.deepEqual(
  buildChecklistReportRelativePath({
    branchName: "BANJARMASIN",
    areaName: "Office",
    periodKey: "2026-09",
    reportCode: "ENG-OFFICE-202609-001",
  }),
  ["BANJARMASIN", "Engineering", "Checklist", "Office", "2026-09", "ENG-OFFICE-202609-001"],
)

assert.deepEqual(
  buildChecklistEvidenceRelativePath({
    formCode: "FRM_TSM_003",
    itemId: "air_conditioner",
    itemName: "Air Conditioner",
  }),
  ["02 - Foto Checklist", "FRM_TSM_003", "air_conditioner - Air Conditioner"],
)

assert.equal(
  buildChecklistPhotoName({ sequence: 1, randomSuffix: "abc123ef", extension: "jpg" }),
  "checklist-001-abc123ef.jpg",
)

assert.equal(
  buildFinalPdfName("ENG-OFFICE-202609-001"),
  "ENG-OFFICE-202609-001 - Laporan Final.pdf",
)
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx lib/google-drive/hierarchy-policy.spec.ts
```

Expected: FAIL because `hierarchy-policy.ts` does not exist.

- [ ] **Step 3: Implement policy**

Create `lib/google-drive/hierarchy-policy.ts`:

```ts
export const ENGINEERING_FOLDER = "Engineering"
export const CHECKLIST_FOLDER = "Checklist"
export const REPORT_DOCUMENT_FOLDER = "01 - Dokumen"
export const CHECKLIST_PHOTO_FOLDER = "02 - Foto Checklist"

export type ChecklistReportPathInput = {
  branchName: string
  areaName: string
  periodKey: string
  reportCode: string
}

export type ChecklistEvidencePathInput = {
  formCode: string
  itemId: string
  itemName: string
}

export function sanitizeDriveSegment(value: string): string {
  return value.replaceAll("/", "-").replaceAll("\\", "-").trim() || "-"
}

export function buildChecklistReportRelativePath(
  input: ChecklistReportPathInput,
): string[] {
  return [
    sanitizeDriveSegment(input.branchName),
    ENGINEERING_FOLDER,
    CHECKLIST_FOLDER,
    sanitizeDriveSegment(input.areaName),
    sanitizeDriveSegment(input.periodKey),
    sanitizeDriveSegment(input.reportCode),
  ]
}

export function buildChecklistEvidenceRelativePath(
  input: ChecklistEvidencePathInput,
): string[] {
  return [
    CHECKLIST_PHOTO_FOLDER,
    sanitizeDriveSegment(input.formCode),
    `${sanitizeDriveSegment(input.itemId)} - ${sanitizeDriveSegment(input.itemName)}`,
  ]
}

export function buildFinalPdfName(reportCode: string): string {
  return `${sanitizeDriveSegment(reportCode)} - Laporan Final.pdf`
}

export function buildChecklistPhotoName(input: {
  sequence: number
  randomSuffix: string
  extension: string
}): string {
  return `checklist-${String(input.sequence).padStart(3, "0")}-${sanitizeDriveSegment(input.randomSuffix)}.${sanitizeDriveSegment(input.extension).toLowerCase()}`
}
```

- [ ] **Step 4: Run policy tests**

Run:

```powershell
npx tsx lib/google-drive/hierarchy-policy.spec.ts
```

Expected: PASS.

### Task 4: Build Drive Folder Gateway And Hierarchy Service

**Files:**
- Create: `lib/google-drive/folder-gateway.ts`
- Create: `lib/google-drive/hierarchy-service.ts`
- Create: `lib/google-drive/hierarchy-service.spec.ts`

**Interfaces:**
- Consumes: policy functions from Task 3.
- Produces:
  - `DriveFolderGateway`
  - `createGoogleFolderGateway(drive: drive_v3.Drive): DriveFolderGateway`
  - `ensureChecklistReportFolder(deps, input): Promise<string>`
  - `ensureChecklistEvidenceFolder(deps, input): Promise<string>`
  - `ensureChecklistDocumentFolder(deps, input): Promise<string>`

- [ ] **Step 1: Write failing service tests**

Create `lib/google-drive/hierarchy-service.spec.ts` with a fake gateway:

```ts
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
      this.folders.set(folder.id, { id: folder.id, name: folder.name, parentIds })
      if (folder.parentId) {
        this.children.set(folder.parentId, [...(this.children.get(folder.parentId) ?? []), folder.id])
      }
    }
  }

  async listChildFolders(parentId: string): Promise<DriveFolder[]> {
    return (this.children.get(parentId) ?? []).map((id) => this.folders.get(id)!)
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

const reportFolderId = await ensureChecklistReportFolder({ gateway }, {
  rootFolderId: "root",
  branchName: "BANJARMASIN",
  areaName: "Office",
  periodKey: "2026-09",
  reportCode: "ENG-OFFICE-202609-001",
})

assert.equal(reportFolderId, "created-6")
assert.deepEqual(gateway.creates.map((create) => create.name), [
  "BANJARMASIN",
  "Engineering",
  "Checklist",
  "Office",
  "2026-09",
  "ENG-OFFICE-202609-001",
])

const evidenceFolderId = await ensureChecklistEvidenceFolder({ gateway }, {
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
})

assert.equal(evidenceFolderId, "created-9")
assert.deepEqual(gateway.creates.slice(6).map((create) => create.name), [
  "02 - Foto Checklist",
  "FRM_TSM_003",
  "air_conditioner - Air Conditioner",
])

const documentFolderId = await ensureChecklistDocumentFolder({ gateway }, {
  rootFolderId: "root",
  branchName: "BANJARMASIN",
  areaName: "Office",
  periodKey: "2026-09",
  reportCode: "ENG-OFFICE-202609-001",
})

assert.equal(gateway.folders.get(documentFolderId)?.name, "01 - Dokumen")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx lib/google-drive/hierarchy-service.spec.ts
```

Expected: FAIL because service files do not exist.

- [ ] **Step 3: Implement folder gateway**

Create `lib/google-drive/folder-gateway.ts`:

```ts
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

export function createGoogleFolderGateway(drive: drive_v3.Drive): DriveFolderGateway {
  return {
    async listChildFolders(parentId) {
      const folders: DriveFolder[] = []
      let pageToken: string | undefined

      do {
        const response = await drive.files.list({
          q: `'${escapeDriveQueryValue(parentId)}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: "nextPageToken,files(id,name,parents)",
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          pageSize: 1000,
          pageToken,
        })

        for (const file of response.data.files ?? []) {
          if (file.id && file.name) {
            folders.push({ id: file.id, name: file.name, parentIds: file.parents ?? [] })
          }
        }

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

        if (!response.data.id || !response.data.name || response.data.mimeType !== "application/vnd.google-apps.folder" || response.data.trashed) {
          return null
        }

        return { id: response.data.id, name: response.data.name, parentIds: response.data.parents ?? [] }
      } catch {
        return null
      }
    },

    async createFolder(parentId, name) {
      const response = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentId],
        },
        fields: "id,name,parents",
        supportsAllDrives: true,
      })

      if (!response.data.id || !response.data.name) {
        throw new Error(`Failed to create Drive folder '${name}'`)
      }

      return { id: response.data.id, name: response.data.name, parentIds: response.data.parents ?? [parentId] }
    },
  }
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/'/g, "\\'")
}
```

- [ ] **Step 4: Implement hierarchy service**

Create `lib/google-drive/hierarchy-service.ts`:

```ts
import type { DriveFolderGateway } from "./folder-gateway"
import {
  REPORT_DOCUMENT_FOLDER,
  buildChecklistEvidenceRelativePath,
  buildChecklistReportRelativePath,
  type ChecklistEvidencePathInput,
  type ChecklistReportPathInput,
} from "./hierarchy-policy"

export type DriveHierarchyDeps = {
  gateway: DriveFolderGateway
}

export type ChecklistReportFolderInput = ChecklistReportPathInput & {
  rootFolderId: string
}

export type ChecklistEvidenceFolderInput = ChecklistReportFolderInput & {
  evidence: ChecklistEvidencePathInput
}

export async function ensureChecklistReportFolder(
  deps: DriveHierarchyDeps,
  input: ChecklistReportFolderInput,
): Promise<string> {
  return ensureFolderPath(
    deps.gateway,
    input.rootFolderId,
    buildChecklistReportRelativePath(input),
  )
}

export async function ensureChecklistEvidenceFolder(
  deps: DriveHierarchyDeps,
  input: ChecklistEvidenceFolderInput,
): Promise<string> {
  const reportFolderId = await ensureChecklistReportFolder(deps, input)
  return ensureFolderPath(
    deps.gateway,
    reportFolderId,
    buildChecklistEvidenceRelativePath(input.evidence),
  )
}

export async function ensureChecklistDocumentFolder(
  deps: DriveHierarchyDeps,
  input: ChecklistReportFolderInput,
): Promise<string> {
  const reportFolderId = await ensureChecklistReportFolder(deps, input)
  return ensureNamedChildFolder(deps.gateway, reportFolderId, REPORT_DOCUMENT_FOLDER)
}

async function ensureFolderPath(
  gateway: DriveFolderGateway,
  parentId: string,
  pathSegments: string[],
): Promise<string> {
  let currentParentId = parentId
  for (const segment of pathSegments) {
    currentParentId = await ensureNamedChildFolder(gateway, currentParentId, segment)
  }
  return currentParentId
}

async function ensureNamedChildFolder(
  gateway: DriveFolderGateway,
  parentId: string,
  name: string,
): Promise<string> {
  const existing = (await gateway.listChildFolders(parentId)).find((folder) => folder.name === name)
  if (existing) return existing.id
  return (await gateway.createFolder(parentId, name)).id
}
```

- [ ] **Step 5: Run service tests**

Run:

```powershell
npx tsx lib/google-drive/hierarchy-service.spec.ts
```

Expected: PASS.

### Task 5: Build Drive Clients, Photo URL Helpers, And Proxy Route

**Files:**
- Create: `lib/google-drive/client.ts`
- Create: `lib/google-drive/cdn-client.ts`
- Create: `lib/storage/photo-url.ts`
- Create: `lib/storage/photo-url.spec.ts`
- Create: `app/api/photos/[fileId]/route.ts`

**Interfaces:**
- Produces:
  - `getGoogleDriveClient()`
  - `getDriveCdnClient()`
  - `buildCdnUrl(fileId: string): string`
  - `resolvePhotoUrl(url: unknown): string`
  - `GET /api/photos/[fileId]`

- [ ] **Step 1: Write failing photo URL tests**

Create `lib/storage/photo-url.spec.ts`:

```ts
import assert from "node:assert/strict"

import {
  buildCdnUrl,
  extractDriveFileId,
  normalizePhotoUrl,
  resolvePhotoUrl,
} from "./photo-url"

assert.equal(normalizePhotoUrl("  /api/photos/file-123  "), "/api/photos/file-123")
assert.equal(normalizePhotoUrl("   "), null)
assert.equal(normalizePhotoUrl(null), null)
assert.equal(buildCdnUrl("file-123"), "/api/photos/file-123")
assert.equal(extractDriveFileId("https://lh3.googleusercontent.com/d/file-123"), "file-123")
assert.equal(extractDriveFileId("https://drive.google.com/uc?id=file-456&export=download"), "file-456")
assert.equal(resolvePhotoUrl("https://lh3.googleusercontent.com/d/file-123"), "/api/photos/file-123")
assert.equal(resolvePhotoUrl("/api/photos/file-789"), "/api/photos/file-789")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx lib/storage/photo-url.spec.ts
```

Expected: FAIL because `photo-url.ts` does not exist.

- [ ] **Step 3: Implement photo URL helpers**

Create `lib/storage/photo-url.ts`:

```ts
export const GOOGLE_DRIVE_CDN_PREFIX = "https://lh3.googleusercontent.com/d/"

export function normalizePhotoUrl(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function buildCdnUrl(fileId: string): string {
  return `/api/photos/${fileId}`
}

export function resolvePhotoUrl(url: unknown): string {
  const normalized = normalizePhotoUrl(url)
  if (!normalized) return ""
  const fileId = extractDriveFileId(normalized)
  return fileId ? buildCdnUrl(fileId) : normalized
}

export function extractDriveFileId(url: unknown): string | null {
  const normalized = normalizePhotoUrl(url)
  if (!normalized) return null

  if (normalized.startsWith(GOOGLE_DRIVE_CDN_PREFIX)) {
    return normalized.substring(GOOGLE_DRIVE_CDN_PREFIX.length)
  }

  const downloadMatch = normalized.match(/drive\.google\.com\/uc\?id=([^&]+)/)
  return downloadMatch?.[1] ?? null
}
```

- [ ] **Step 4: Implement Drive clients**

Create `lib/google-drive/client.ts`:

```ts
import "server-only"

import { google, type drive_v3 } from "googleapis"

export type GoogleDriveConfig = {
  rootFolderId: string
}

let driveClient: drive_v3.Drive | null = null
let driveConfig: GoogleDriveConfig | null = null

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} env variable is not set`)
  return value
}

export function getGoogleDriveClient(): {
  drive: drive_v3.Drive
  config: GoogleDriveConfig
} {
  if (typeof window !== "undefined") {
    throw new Error("Google Drive client must only run on server side")
  }

  if (driveClient && driveConfig) return { drive: driveClient, config: driveConfig }

  const oauth2Client = new google.auth.OAuth2(
    requiredEnv("GOOGLE_CLIENT_ID"),
    requiredEnv("GOOGLE_CLIENT_SECRET"),
  )
  oauth2Client.setCredentials({ refresh_token: requiredEnv("GOOGLE_REFRESH_TOKEN") })

  driveClient = google.drive({ version: "v3", auth: oauth2Client })
  driveConfig = { rootFolderId: requiredEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID") }
  return { drive: driveClient, config: driveConfig }
}
```

Create `lib/google-drive/cdn-client.ts`:

```ts
import "server-only"

import { google, type drive_v3 } from "googleapis"

export type DriveCdnConfig = {
  rootFolderId: string
}

let cdnDriveClient: drive_v3.Drive | null = null
let cdnDriveConfig: DriveCdnConfig | null = null

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} env variable is not set`)
  return value
}

export function getDriveCdnClient(): {
  drive: drive_v3.Drive
  config: DriveCdnConfig
} {
  if (typeof window !== "undefined") {
    throw new Error("Drive CDN client must only run on server side")
  }

  if (cdnDriveClient && cdnDriveConfig) return { drive: cdnDriveClient, config: cdnDriveConfig }

  const oauth2Client = new google.auth.OAuth2(
    requiredEnv("DRIVE_CDN_CLIENT_ID"),
    requiredEnv("DRIVE_CDN_CLIENT_SECRET"),
  )
  oauth2Client.setCredentials({ refresh_token: requiredEnv("DRIVE_CDN_REFRESH_TOKEN") })

  cdnDriveClient = google.drive({ version: "v3", auth: oauth2Client })
  cdnDriveConfig = { rootFolderId: requiredEnv("GOOGLE_DRIVE_ROOT_FOLDER_ID") }
  return { drive: cdnDriveClient, config: cdnDriveConfig }
}
```

- [ ] **Step 5: Implement proxy route**

Create `app/api/photos/[fileId]/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import type { Readable } from "node:stream"

import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ fileId: string }> },
) {
  try {
    const { fileId } = await context.params
    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

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

    const nodeStream = response.data as Readable
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
        nodeStream.on("end", () => controller.close())
        nodeStream.on("error", (error: Error) => controller.error(error))
      },
    })

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 })
  }
}
```

- [ ] **Step 6: Run photo URL tests**

Run:

```powershell
npx tsx lib/storage/photo-url.spec.ts
```

Expected: PASS.

### Task 6: Build Photo Upload Service And Route Handler

**Files:**
- Create: `lib/storage/drive-photo-service.ts`
- Create: `app/api/photos/upload/handler.ts`
- Create: `app/api/photos/upload/route.ts`
- Create: `app/api/photos/upload/route.spec.ts`

**Interfaces:**
- Consumes: Drive clients, folder service, policy names, form metadata.
- Produces:
  - `uploadPhotoToDriveCdn(blob, input)`
  - `createPhotoUploadPostHandler(deps)`
  - `POST /api/photos/upload`

- [ ] **Step 1: Write failing route handler tests**

Create `app/api/photos/upload/route.spec.ts`:

```ts
import assert from "node:assert/strict"

import { createPhotoUploadPostHandler } from "./handler"

async function makeRequest(context: unknown, file = new File(["x"], "photo.jpg", { type: "image/jpeg" })) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("context", JSON.stringify(context))
  return new Request("http://localhost/api/photos/upload", { method: "POST", body: formData })
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

const ok = await handler(await makeRequest({
  kind: "CHECKLIST_ITEM",
  reportCode: "ENG-OFFICE-202609-001",
  formCode: "FRM_TSM_003",
  itemId: "air_conditioner",
}))

assert.equal(ok.status, 200)
assert.deepEqual(await ok.json(), { fileId: "file-123", url: "/api/photos/file-123" })
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
  uploadPhoto: async () => ({ success: true, fileId: "file", url: "/api/photos/file" }),
})(await makeRequest({
  kind: "CHECKLIST_ITEM",
  reportCode: "ENG-OFFICE-202609-001",
  formCode: "FRM_TSM_003",
  itemId: "air_conditioner",
}))

assert.equal(forbidden.status, 403)
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx app/api/photos/upload/route.spec.ts
```

Expected: FAIL because handler does not exist.

- [ ] **Step 3: Implement photo upload service**

Create `lib/storage/drive-photo-service.ts`:

```ts
import { Readable } from "node:stream"

import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"
import { buildCdnUrl } from "@/lib/storage/photo-url"

export type DrivePhotoUploadOutcome =
  | { success: true; fileId: string; url: string }
  | { success: false; error: string }

export async function uploadPhotoToDriveCdn(
  blob: Blob | File,
  input: { parentFolderId: string; fileName: string },
): Promise<DrivePhotoUploadOutcome> {
  try {
    const { drive } = getDriveCdnClient()
    const buffer = Buffer.from(await blob.arrayBuffer())
    const contentType = blob.type || "image/jpeg"

    const created = await drive.files.create({
      requestBody: {
        name: input.fileName,
        parents: [input.parentFolderId],
        mimeType: contentType,
      },
      media: {
        mimeType: contentType,
        body: Readable.from(buffer),
      },
      fields: "id",
      supportsAllDrives: true,
    })

    const fileId = created.data.id
    if (!fileId) return { success: false, error: "Google Drive create returned empty file ID" }

    return { success: true, fileId, url: buildCdnUrl(fileId) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
```

- [ ] **Step 4: Implement injectable route handler**

Create `app/api/photos/upload/handler.ts` using the test contract. The handler must:

```ts
const MAX_FILE_SIZE = 4 * 1024 * 1024
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
```

It must reject missing sessions with `401`, non-ES roles with `403`, invalid file data with `400`, wrong owner with `403`, non-draft reports with `422`, unknown items with `404`, and upload failures with `500`.

- [ ] **Step 5: Implement thin route wiring**

Create `app/api/photos/upload/route.ts`:

```ts
import { getDriveCdnClient } from "@/lib/google-drive/cdn-client"
import { createGoogleFolderGateway } from "@/lib/google-drive/folder-gateway"
import { ensureChecklistEvidenceFolder } from "@/lib/google-drive/hierarchy-service"
import { uploadPhotoToDriveCdn } from "@/lib/storage/drive-photo-service"

import { createPhotoUploadPostHandler } from "./handler"

export const POST = createPhotoUploadPostHandler({
  async getSession() {
    const session = await import("@/lib/session")
    return session.getSession()
  },
  async loadReport(reportCode) {
    const { getPrisma } = await import("@/lib/prisma")
    return getPrisma().checklistReport.findUnique({
      where: { reportCode },
      select: {
        reportCode: true,
        authorId: true,
        status: true,
        formCode: true,
        periodKey: true,
        area: { select: { name: true } },
        author: { select: { branchName: true } },
      },
    })
  },
  get rootFolderId() {
    return getDriveCdnClient().config.rootFolderId
  },
  async ensureEvidenceFolder(input) {
    const { drive } = getDriveCdnClient()
    return ensureChecklistEvidenceFolder(
      { gateway: createGoogleFolderGateway(drive) },
      input,
    )
  },
  uploadPhoto: uploadPhotoToDriveCdn,
})
```

- [ ] **Step 6: Run route tests**

Run:

```powershell
npx tsx app/api/photos/upload/route.spec.ts
```

Expected: PASS.

### Task 7: Define FRM_TSM_003 Payload Validation

**Files:**
- Create: `lib/checklists/frm-tsm-003.ts`
- Create: `lib/checklists/payload.ts`
- Create: `lib/checklists/payload.spec.ts`

**Interfaces:**
- Produces:
  - `FRM_TSM_003_ITEMS`
  - `getFrmTsm003Item(itemId: string)`
  - `validateChecklistPayload(payload): ChecklistPayloadValidationResult`
  - `calculateChecklistIsSafe(payload): boolean`

- [ ] **Step 1: Write failing payload tests**

Create `lib/checklists/payload.spec.ts`:

```ts
import assert from "node:assert/strict"

import { calculateChecklistIsSafe, validateChecklistPayload } from "./payload"

const validPayload = {
  formCode: "FRM_TSM_003",
  formName: "Form Checklist Ruangan",
  areaCode: "office",
  period: "MONTHLY",
  periodKey: "2026-09",
  items: [
    {
      id: "air_conditioner",
      label: "Air Conditioner",
      condition: "BAIK",
      photos: [{ fileId: "file-1", url: "/api/photos/file-1" }],
      notes: "",
    },
    {
      id: "exhaust_fan",
      label: "Exhaust Fan",
      condition: "TIDAK_ADA",
      photos: [],
      notes: "",
    },
  ],
}

assert.deepEqual(validateChecklistPayload(validPayload), { valid: true, errors: [] })
assert.equal(calculateChecklistIsSafe(validPayload), true)

const missingPhoto = {
  ...validPayload,
  items: [
    {
      id: "lampu",
      label: "Lampu",
      condition: "RUSAK",
      photos: [],
      notes: "",
    },
  ],
}

assert.deepEqual(validateChecklistPayload(missingPhoto), {
  valid: false,
  errors: ["Lampu wajib memiliki foto untuk kondisi RUSAK."],
})
assert.equal(calculateChecklistIsSafe(missingPhoto), false)
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx lib/checklists/payload.spec.ts
```

Expected: FAIL because payload files do not exist.

- [ ] **Step 3: Implement form definition**

Create `lib/checklists/frm-tsm-003.ts` with the 13 items from the design spec.

- [ ] **Step 4: Implement payload validation**

Create `lib/checklists/payload.ts` with explicit condition checks:

```ts
const PHOTO_REQUIRED_CONDITIONS = new Set(["BAIK", "RUSAK"])
```

For each item, if condition is in that set and `photos.length === 0`, add:

```ts
`${item.label} wajib memiliki foto untuk kondisi ${item.condition}.`
```

`calculateChecklistIsSafe` returns `false` if any item has `condition === "RUSAK"` and `true` otherwise.

- [ ] **Step 5: Run payload tests**

Run:

```powershell
npx tsx lib/checklists/payload.spec.ts
```

Expected: PASS.

### Task 8: Build Draft Reservation Service

**Files:**
- Create: `lib/reports/drive-draft-service.ts`
- Create: `lib/reports/drive-draft-service.spec.ts`
- Create: `lib/reports/drive-draft-prisma-repository.ts`

**Interfaces:**
- Produces:
  - `reserveChecklistDraft(repository, input): Promise<{ reportCode: string }>`
  - `promoteChecklistDraft(repository, input): Promise<void>`
  - `ChecklistDraftRepository`

- [ ] **Step 1: Write failing draft service tests**

Create `lib/reports/drive-draft-service.spec.ts`:

```ts
import assert from "node:assert/strict"

import { reserveChecklistDraft, type ChecklistDraftRepository } from "./drive-draft-service"

class FakeRepository implements ChecklistDraftRepository {
  existingDraft: { reportCode: string; areaId: string; periodKey: string; formCode: string } | null = null
  deleted: string[] = []
  created: Array<{ reportCode: string; areaId: string; authorId: string; formCode: string; periodKey: string }> = []

  async findDraftByUser(authorId: string) {
    return authorId === "ES001" ? this.existingDraft : null
  }

  async generateReportCode(input) {
    return `ENG-${input.areaCode.toUpperCase()}-202609-001`
  }

  async createDraft(input) {
    this.created.push(input)
  }

  async deleteDraft(reportCode: string) {
    this.deleted.push(reportCode)
  }
}

const reuseRepo = new FakeRepository()
reuseRepo.existingDraft = {
  reportCode: "ENG-OFFICE-202609-001",
  areaId: "area-office",
  periodKey: "2026-09",
  formCode: "FRM_TSM_003",
}

assert.deepEqual(
  await reserveChecklistDraft(reuseRepo, {
    authorId: "ES001",
    areaId: "area-office",
    areaCode: "office",
    formCode: "FRM_TSM_003",
    period: "MONTHLY",
    periodKey: "2026-09",
  }),
  { reportCode: "ENG-OFFICE-202609-001" },
)
assert.equal(reuseRepo.created.length, 0)

const replaceRepo = new FakeRepository()
replaceRepo.existingDraft = {
  reportCode: "ENG-WH-202609-001",
  areaId: "area-wh",
  periodKey: "2026-09",
  formCode: "FRM_TSM_003",
}

assert.deepEqual(
  await reserveChecklistDraft(replaceRepo, {
    authorId: "ES001",
    areaId: "area-office",
    areaCode: "office",
    formCode: "FRM_TSM_003",
    period: "MONTHLY",
    periodKey: "2026-09",
  }),
  { reportCode: "ENG-OFFICE-202609-001" },
)
assert.deepEqual(replaceRepo.deleted, ["ENG-WH-202609-001"])
assert.equal(replaceRepo.created[0]?.reportCode, "ENG-OFFICE-202609-001")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx lib/reports/drive-draft-service.spec.ts
```

Expected: FAIL because draft service does not exist.

- [ ] **Step 3: Implement draft service**

Create `lib/reports/drive-draft-service.ts` with interfaces matching the test. Reuse an existing draft only when `areaId`, `periodKey`, and `formCode` all match.

- [ ] **Step 4: Implement Prisma repository**

Create `lib/reports/drive-draft-prisma-repository.ts` with methods that use `getPrisma().checklistReport`. `createDraft` writes `status: "DRAFT"`, `category: "PREVENTIVE"`, `period`, `periodKey`, `formCode`, `reportCode`, and `authorId`.

- [ ] **Step 5: Run draft tests**

Run:

```powershell
npx tsx lib/reports/drive-draft-service.spec.ts
```

Expected: PASS.

### Task 9: Wire The First Checklist Form Route

**Files:**
- Create: `app/dashboard/reports/new/checklist/frm-tsm-003/page.tsx`
- Create: `app/dashboard/reports/new/checklist/frm-tsm-003/actions.ts`
- Create: `components/es-dashboard/frm-tsm-003-form.tsx`
- Modify: `components/es-dashboard/report-area-picker.tsx`

**Interfaces:**
- Consumes: draft reservation, payload validation, upload route.
- Produces: route that opens `FRM_TSM_003` for Monthly Office and Monthly warehouse-family selections.

- [ ] **Step 1: Write action-level failing test**

Create `app/dashboard/reports/new/checklist/frm-tsm-003/actions.test.ts`:

```ts
import assert from "node:assert/strict"

import { buildFrmTsm003Submission } from "./actions"

const result = buildFrmTsm003Submission({
  formCode: "FRM_TSM_003",
  areaCode: "office",
  period: "MONTHLY",
  periodKey: "2026-09",
  items: [
    {
      id: "air_conditioner",
      label: "Air Conditioner",
      condition: "BAIK",
      photos: [{ fileId: "file-1", url: "/api/photos/file-1" }],
      notes: "",
    },
  ],
})

assert.equal(result.isSafe, true)
assert.equal(result.payload.formCode, "FRM_TSM_003")
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npx tsx app/dashboard/reports/new/checklist/frm-tsm-003/actions.test.ts
```

Expected: FAIL because action file does not exist.

- [ ] **Step 3: Implement action helpers and server action**

Create `actions.ts` with:

```ts
export function buildFrmTsm003Submission(input: ChecklistPayload) {
  const validation = validateChecklistPayload(input)
  if (!validation.valid) {
    return { ok: false as const, errors: validation.errors }
  }

  return {
    ok: true as const,
    payload: input,
    isSafe: calculateChecklistIsSafe(input),
  }
}
```

Add a server action that updates the existing draft by `reportCode` and current session user.

- [ ] **Step 4: Modify area picker continue URL**

When selected checklist is Monthly, enable the button and link to:

```text
/dashboard/reports/new/checklist/frm-tsm-003?areaId=<areaId>&period=MONTHLY&workPermit=<workPermit>
```

Keep Weekly disabled for this first form unless a future weekly form route exists.

- [ ] **Step 5: Create form component**

Create a client component with one row per `FRM_TSM_003_ITEMS` item. Each item has a segmented condition control, file upload input for `BAIK` and `RUSAK`, and submit button disabled when required photos are missing.

- [ ] **Step 6: Run action test**

Run:

```powershell
npx tsx app/dashboard/reports/new/checklist/frm-tsm-003/actions.test.ts
```

Expected: PASS.

### Task 10: Verification And Finish

**Files:**
- Review all changed files.

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: verified branch state ready for review or commit.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npx tsx lib/google-drive/hierarchy-policy.spec.ts
npx tsx lib/google-drive/hierarchy-service.spec.ts
npx tsx lib/storage/photo-url.spec.ts
npx tsx app/api/photos/upload/route.spec.ts
npx tsx lib/checklists/payload.spec.ts
npx tsx lib/reports/drive-draft-service.spec.ts
npx tsx app/dashboard/reports/new/checklist/frm-tsm-003/actions.test.ts
```

Expected: every command exits 0.

- [ ] **Step 2: Run Prisma validation**

Run:

```powershell
pnpm prisma:validate
```

Expected: exit 0.

- [ ] **Step 3: Run typecheck, lint, and build**

Run:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Expected: every command exits 0.

- [ ] **Step 4: Run whitespace check**

Run:

```powershell
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering diff --check
```

Expected: no whitespace errors.

- [ ] **Step 5: Review intended files**

Run:

```powershell
git -c safe.directory=D:/MAGANG-ALFA/sparta-engineering status --short
```

Expected: only files from this plan are modified or created.

## Self-Review

Spec coverage:
- Google Drive root and proxy architecture are covered by Tasks 3 through 6.
- Draft-before-upload behavior is covered by Task 8.
- `FRM_TSM_003` JSON payload behavior is covered by Tasks 7 and 9.
- Prisma schema and docs are covered by Tasks 1 and 2.
- Final PDF generation is intentionally excluded; Task 5 creates the file upload foundation and schema fields for later PDF work.

Placeholder scan:
- The plan avoids open-ended placeholders and gives concrete files, signatures, commands, and expected outcomes.

Type consistency:
- `reportCode`, `formCode`, `periodKey`, `drivePhotoFileIds`, and `checklistPayload` are named consistently across schema, draft service, upload route, and payload tasks.
