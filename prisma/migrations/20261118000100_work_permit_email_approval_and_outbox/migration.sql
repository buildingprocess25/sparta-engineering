-- AlterTable
ALTER TABLE "WorkPermitApprover" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "WorkPermitApprover" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkPermitApprovalToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permitId" TEXT NOT NULL,
    "approverNik" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "approvalRole" "WorkPermitApprovalRole" NOT NULL,
    "targetStage" "WorkPermitStatus" NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "decision" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkPermitApprovalToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DemoOutboxEmail" (
    "id" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoOutboxEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WorkPermitApprovalToken_token_key" ON "WorkPermitApprovalToken"("token");
CREATE INDEX IF NOT EXISTS "WorkPermitApprovalToken_token_idx" ON "WorkPermitApprovalToken"("token");
CREATE INDEX IF NOT EXISTS "WorkPermitApprovalToken_permitId_idx" ON "WorkPermitApprovalToken"("permitId");
CREATE INDEX IF NOT EXISTS "WorkPermitApprovalToken_targetStage_idx" ON "WorkPermitApprovalToken"("targetStage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DemoOutboxEmail_toEmail_idx" ON "DemoOutboxEmail"("toEmail");
CREATE INDEX IF NOT EXISTS "DemoOutboxEmail_sentAt_idx" ON "DemoOutboxEmail"("sentAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'WorkPermitApprovalToken_permitId_fkey'
    ) THEN
        ALTER TABLE "WorkPermitApprovalToken" ADD CONSTRAINT "WorkPermitApprovalToken_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "WorkPermit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
