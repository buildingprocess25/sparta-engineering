/*
  Warnings:

  - A unique constraint covering the columns `[reportCode]` on the table `ChecklistReport` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "ChecklistReport" ADD COLUMN     "checklistPayload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "drivePhotoFileIds" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "finalPdfDriveUrl" TEXT,
ADD COLUMN     "finalPdfFolderUrl" TEXT,
ADD COLUMN     "formCode" TEXT,
ADD COLUMN     "reportCode" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "GoogleDriveFolderCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GoogleDriveFolderCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleDriveFolderCache_cacheKey_key" ON "GoogleDriveFolderCache"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistReport_reportCode_key" ON "ChecklistReport"("reportCode");

-- CreateIndex
CREATE INDEX "ChecklistReport_reportCode_idx" ON "ChecklistReport"("reportCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
