BEGIN;

CREATE TABLE "ChecklistReportRevision" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reason" TEXT,
    "reviewerId" TEXT,
    "reviewerName" TEXT,
    "reviewStage" "ReportStatus",
    "requestedAt" TIMESTAMPTZ(3),
    "resubmittedAt" TIMESTAMPTZ(3),
    "previousPayload" JSONB NOT NULL,
    "resubmittedPayload" JSONB,
    CONSTRAINT "ChecklistReportRevision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ChecklistReportRevision_reportId_fkey" FOREIGN KEY ("reportId")
        REFERENCES "ChecklistReport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ChecklistReportRevision_reportId_requestedAt_idx"
    ON "ChecklistReportRevision"("reportId", "requestedAt");
CREATE UNIQUE INDEX "ChecklistReportRevision_one_open_per_report_idx"
    ON "ChecklistReportRevision"("reportId") WHERE "resubmittedAt" IS NULL;

WITH returned_reports AS (
    UPDATE "ChecklistReport"
    SET "status" = 'NEEDS_REVISION'
    WHERE "status" = 'DRAFT'
        AND "reportCode" IS NOT NULL
        AND jsonb_typeof("checklistPayload"->'formCode') = 'string'
    RETURNING "id", "checklistPayload"
)
INSERT INTO "ChecklistReportRevision" ("id", "reportId", "previousPayload")
SELECT 'legacy-' || "id", "id", "checklistPayload" FROM returned_reports;

COMMIT;
