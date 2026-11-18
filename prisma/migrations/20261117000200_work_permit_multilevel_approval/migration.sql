-- AlterEnum
ALTER TYPE "WorkPermitStatus" ADD VALUE IF NOT EXISTS 'PENDING_P2K3';
ALTER TYPE "WorkPermitStatus" ADD VALUE IF NOT EXISTS 'PENDING_SECRETARY';

-- CreateEnum
CREATE TYPE "WorkPermitApprovalRole" AS ENUM ('P2K3', 'DELEGATE', 'SECRETARY');

-- AlterTable
ALTER TABLE "WorkPermit" ADD COLUMN IF NOT EXISTS "applicantName" TEXT;
ALTER TABLE "WorkPermit" ADD COLUMN IF NOT EXISTS "approvalHistory" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkPermitApprover" (
    "id" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "userNik" TEXT NOT NULL,
    "approvalRole" "WorkPermitApprovalRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkPermitApprover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkPermitApprover_branchName_idx" ON "WorkPermitApprover"("branchName");
CREATE INDEX IF NOT EXISTS "WorkPermitApprover_userNik_idx" ON "WorkPermitApprover"("userNik");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkPermitApprover_branchName_userNik_approvalRole_key" ON "WorkPermitApprover"("branchName", "userNik", "approvalRole");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'WorkPermitApprover_userNik_fkey'
    ) THEN
        ALTER TABLE "WorkPermitApprover" ADD CONSTRAINT "WorkPermitApprover_userNik_fkey" FOREIGN KEY ("userNik") REFERENCES "User"("NIK") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
