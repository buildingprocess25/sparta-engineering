/*
  Warnings:

  - A unique constraint covering the columns `[areaId,period,periodKey,formCode]` on the table `ChecklistReport` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChecklistReport_areaId_period_periodKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistReport_areaId_period_periodKey_formCode_key" ON "ChecklistReport"("areaId", "period", "periodKey", "formCode");
