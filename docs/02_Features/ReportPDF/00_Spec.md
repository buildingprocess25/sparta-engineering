# Report PDF status and approvals

Status: Active. Updated: 2026-11-17.

## Behavior

Every PDF is generated from the current persisted report status, checklist, and
approval history. Submitting a checklist does not make the document final.
The document is labeled `Laporan Final` only when the report is `COMPLETED`
and the current review cycle has recorded approvals from Coordinator and Manager,
plus Requester for a spare-part proposal. A spare-part proposal is a Form 065
with `jenis = PENGGANTIAN_SPARE_PART`, including the legacy followUpData shape.
Other documents are labeled `Laporan Pemeriksaan` and show their current status.
Completed legacy reports without recorded approvals remain non-final; the system
does not invent signatories or approval times.

PDF pages show the current status, including waiting for parts, waiting for PB,
and work in progress. The approval section lists actual recorded reviewer names,
NIK, roles, decisions, stages, and timestamps (WIB), including revision and
rejection decisions. Prior decisions remain visible as history. Only decisions
after the last revision request qualify for current approval signatures.

## Data and delivery

The source is ChecklistReport.approvalHistory as described in the architecture
data model. Decisions are read defensively; malformed entries do not establish
approval. The HTTP PDF endpoint and Drive upload use the same report-to-PDF
mapper, finality policy, and filename policy.

Application PDF links always open `/api/reports/[reportCode]/pdf`. This endpoint
reads current data and returns `Cache-Control: private, no-store` to prevent a
previously submitted document from being reused after a review transition.
Drive copies are snapshots, not the source for application preview links.
Drive upload persists its URL only if the report has not changed during PDF
generation. Uploaded filenames say Final only when the finality policy passes.

The TS028 PDF identifies the Pallet Mover battery checklist. The distinct TS068
PDF identifies the Forklift battery checklist and uses its own official NRA.

## Validation

Regression coverage renders and inspects real PDFs for pending, completed,
missing-approval, revision, rejection, and spare-part cases. It checks reviewer
identity and time, changed status on regeneration, and distinct battery NRAs.
Pure policy tests cover invalid history and approval cycle boundaries.
