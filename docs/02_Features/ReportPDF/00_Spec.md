# Report PDF status and approvals

Status: Active. Updated: 2026-11-24.

## Behavior

Every PDF is generated from the current persisted report status, checklist,
follow-up details (Form 014 / Form 065 / Repair Tanpa Biaya), `approvalHistory`,
`executionHistory`, and completion evidence (`completionEvidence`). Submitting a
checklist does not make the document final.
The document is labeled `Laporan Final` only when the report is `COMPLETED`
and the current review cycle has recorded approvals from Coordinator and Manager,
plus Requester whenever Form 014 or Form 065 is required (`requiresRequesterReview`).
Other documents are labeled `Laporan Pemeriksaan` and show their current status.
Completed legacy reports without recorded approvals remain non-final; the system
does not invent signatories or approval times.

PDF pages show the current status, including waiting for PJU, waiting for parts,
waiting for PB, and work in progress. The PDF includes:
- Checklist item results & general notes
- Follow-up summary (Form 014 material estimates, Form 065 equipment identity,
  analysis, action, spare parts, or explicit Repair Tanpa Biaya)
- Recorded reviewer approvals (Coordinator, Manager, and Requester when
  applicable) with actual names, NIK, roles, decisions, stages, and timestamps (WIB)
- Execution history (`PROCESS_PJU`, `PROCESS_PB`, `PICKUP_STOCK`, `START_WORK`,
  `FINISH_WORK`) with actor names, NIK, references/notes, and server WIB timestamps
- Completion evidence summary (Form 014 actual purchase amount in Rp & evidence
  photo counts; Form 065 unit handover confirmation/recipient & evidence photo
  counts) plus embedded checklist and completion evidence photos

## Data and delivery

The source is `ChecklistReport` (`checklistPayload`, `approvalHistory`,
`executionHistory`) via a shared `buildReportPdfData` mapper used identically by
`GET /api/reports/[reportCode]/pdf` and Google Drive sync (`generateAndUploadReportPdf`).
Approval decisions accept both `{ approverNik, approverName, role }` and legacy
`{ reviewerId, reviewerName, reviewerRole }` shapes defensively.

Both `/api/reports/[reportCode]/pdf` and `/api/photos/[fileId]` require an
authenticated session and enforce report access authorization (`ADMIN_HO` /
`SUPER_ADMIN`, same-branch `COORD` / `MANAGER` / `REQUESTER`, or owning `ES`).
The PDF endpoint returns `Cache-Control: private, no-store`.
Google Drive sync runs on submission, follow-up completion, review decisions,
and execution transitions (`COMPLETED`, etc.) and updates `finalPdfDriveUrl` /
`finalPdfFolderUrl`.

The TS028 PDF identifies the Pallet Mover battery checklist. The distinct TS068
PDF identifies the Forklift battery checklist and uses its own official NRA.

## Validation

Regression coverage renders and inspects real PDFs for pending, completed,
missing-approval, revision, rejection, Form 014/065, execution history, completion
evidence, and authorization cases. It checks reviewer identity (including
Requester) and WIB time, changed status on regeneration, and distinct battery NRAs.
