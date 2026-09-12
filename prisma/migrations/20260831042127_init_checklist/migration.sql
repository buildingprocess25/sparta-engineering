-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ES', 'COORD', 'MANAGER', 'REQUESTER', 'ADMIN_HO', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AreaType" AS ENUM ('OFFICE', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING_COORD', 'PENDING_MANAGER', 'PENDING_REQUESTER', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('BAIK', 'CLEAN', 'REPAIR', 'RUSAK', 'TIDAK_ADA');

-- CreateTable
CREATE TABLE "User" (
    "NIK" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "branchName" TEXT NOT NULL,
    "location" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ES',
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("NIK")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AreaType" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistReport" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING_COORD',
    "isSafe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ChecklistReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "notes" TEXT,
    "photoUrls" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistReport_authorId_idx" ON "ChecklistReport"("authorId");

-- CreateIndex
CREATE INDEX "ChecklistReport_areaId_idx" ON "ChecklistReport"("areaId");

-- CreateIndex
CREATE INDEX "ChecklistReport_status_idx" ON "ChecklistReport"("status");

-- CreateIndex
CREATE INDEX "ChecklistItem_reportId_idx" ON "ChecklistItem"("reportId");

-- AddForeignKey
ALTER TABLE "ChecklistReport" ADD CONSTRAINT "ChecklistReport_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistReport" ADD CONSTRAINT "ChecklistReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("NIK") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ChecklistReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
