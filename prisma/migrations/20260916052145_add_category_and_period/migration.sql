/*
  Warnings:

  - A unique constraint covering the columns `[areaId,period,periodKey]` on the table `ChecklistReport` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('PREVENTIVE', 'INCIDENTAL');

-- AlterTable
ALTER TABLE "ChecklistReport" ADD COLUMN     "category" "ReportCategory" NOT NULL DEFAULT 'PREVENTIVE',
ADD COLUMN     "period" "ChecklistPeriod",
ADD COLUMN     "periodKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistReport_areaId_period_periodKey_key" ON "ChecklistReport"("areaId", "period", "periodKey");
