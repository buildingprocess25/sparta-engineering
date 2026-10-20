-- CreateEnum
CREATE TYPE "WorkPermitStatus" AS ENUM ('PENDING_MANAGER', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "ChecklistReport" ADD COLUMN     "workPermitId" TEXT;

-- CreateTable
CREATE TABLE "WorkPermit" (
    "id" TEXT NOT NULL,
    "permitCode" TEXT NOT NULL,
    "formCode" TEXT NOT NULL DEFAULT 'SAT/FRM/MED/003_Rev:000_180225',
    "kegiatan" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "picSat" TEXT NOT NULL,
    "kontraktor" TEXT,
    "workDate" DATE NOT NULL,
    "duration" TEXT NOT NULL,
    "workers" JSONB NOT NULL DEFAULT '[]',
    "safetyPayload" JSONB NOT NULL DEFAULT '{}',
    "catatanPasca" TEXT,
    "status" "WorkPermitStatus" NOT NULL DEFAULT 'PENDING_MANAGER',
    "applicantNik" TEXT NOT NULL,
    "applicantSignedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "managerNik" TEXT,
    "managerSignedAt" TIMESTAMPTZ(3),
    "managerNotes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WorkPermit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkPermit_permitCode_key" ON "WorkPermit"("permitCode");

-- CreateIndex
CREATE INDEX "WorkPermit_applicantNik_idx" ON "WorkPermit"("applicantNik");

-- CreateIndex
CREATE INDEX "WorkPermit_managerNik_idx" ON "WorkPermit"("managerNik");

-- CreateIndex
CREATE INDEX "WorkPermit_workDate_idx" ON "WorkPermit"("workDate");

-- CreateIndex
CREATE INDEX "WorkPermit_status_idx" ON "WorkPermit"("status");

-- CreateIndex
CREATE INDEX "ChecklistReport_workPermitId_idx" ON "ChecklistReport"("workPermitId");

-- AddForeignKey
ALTER TABLE "ChecklistReport" ADD CONSTRAINT "ChecklistReport_workPermitId_fkey" FOREIGN KEY ("workPermitId") REFERENCES "WorkPermit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPermit" ADD CONSTRAINT "WorkPermit_applicantNik_fkey" FOREIGN KEY ("applicantNik") REFERENCES "User"("NIK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkPermit" ADD CONSTRAINT "WorkPermit_managerNik_fkey" FOREIGN KEY ("managerNik") REFERENCES "User"("NIK") ON DELETE SET NULL ON UPDATE CASCADE;
