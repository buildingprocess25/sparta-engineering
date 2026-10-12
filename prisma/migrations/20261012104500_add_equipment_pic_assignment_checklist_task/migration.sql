-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'OVERDUE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN IF NOT EXISTS "handler" TEXT;

-- AlterTable
ALTER TABLE "ChecklistReport" ADD COLUMN IF NOT EXISTS "equipmentId" TEXT,
ADD COLUMN IF NOT EXISTS "taskId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Equipment" (
    "id" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "roomId" TEXT,
    "areaId" TEXT,
    "name" TEXT NOT NULL,
    "unitNo" INTEGER NOT NULL DEFAULT 1,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PicAssignment" (
    "id" TEXT NOT NULL,
    "userNik" TEXT NOT NULL,
    "equipmentId" TEXT,
    "roomId" TEXT,
    "formCode" TEXT NOT NULL,
    "period" "ChecklistPeriod" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PicAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ChecklistTask" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "targetDate" TIMESTAMPTZ(3) NOT NULL,
    "periodKey" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ChecklistTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Equipment_branchName_idx" ON "Equipment"("branchName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Equipment_roomId_idx" ON "Equipment"("roomId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Equipment_areaId_idx" ON "Equipment"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Equipment_branchName_name_unitNo_key" ON "Equipment"("branchName", "name", "unitNo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PicAssignment_userNik_idx" ON "PicAssignment"("userNik");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PicAssignment_equipmentId_idx" ON "PicAssignment"("equipmentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PicAssignment_roomId_idx" ON "PicAssignment"("roomId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PicAssignment_period_idx" ON "PicAssignment"("period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChecklistTask_assignmentId_idx" ON "ChecklistTask"("assignmentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChecklistTask_status_idx" ON "ChecklistTask"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChecklistTask_periodKey_idx" ON "ChecklistTask"("periodKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChecklistTask_assignmentId_periodKey_key" ON "ChecklistTask"("assignmentId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChecklistReport_taskId_key" ON "ChecklistReport"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChecklistReport_equipmentId_idx" ON "ChecklistReport"("equipmentId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistReport_taskId_fkey') THEN
        ALTER TABLE "ChecklistReport" ADD CONSTRAINT "ChecklistReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ChecklistTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistReport_equipmentId_fkey') THEN
        ALTER TABLE "ChecklistReport" ADD CONSTRAINT "ChecklistReport_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Equipment_roomId_fkey') THEN
        ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Equipment_areaId_fkey') THEN
        ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PicAssignment_userNik_fkey') THEN
        ALTER TABLE "PicAssignment" ADD CONSTRAINT "PicAssignment_userNik_fkey" FOREIGN KEY ("userNik") REFERENCES "User"("NIK") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PicAssignment_equipmentId_fkey') THEN
        ALTER TABLE "PicAssignment" ADD CONSTRAINT "PicAssignment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PicAssignment_roomId_fkey') THEN
        ALTER TABLE "PicAssignment" ADD CONSTRAINT "PicAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistTask_assignmentId_fkey') THEN
        ALTER TABLE "ChecklistTask" ADD CONSTRAINT "ChecklistTask_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "PicAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
