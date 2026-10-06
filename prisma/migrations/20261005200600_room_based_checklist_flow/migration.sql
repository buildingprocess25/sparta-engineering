-- AlterEnum
ALTER TYPE "ChecklistPeriod" ADD VALUE 'QUARTERLY';
ALTER TYPE "ChecklistPeriod" ADD VALUE 'SEMESTER';

-- DropForeignKey
ALTER TABLE "AreaChecklistAvailability" DROP CONSTRAINT "AreaChecklistAvailability_areaId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ChecklistReport_areaId_period_periodKey_formCode_key";

-- AlterTable
ALTER TABLE "ChecklistReport" ADD COLUMN IF NOT EXISTS "roomId" TEXT;

-- DropTable
DROP TABLE IF EXISTS "AreaChecklistAvailability";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomFormAvailability" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "formCode" TEXT NOT NULL,
    "period" "ChecklistPeriod" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RoomFormAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_areaId_idx" ON "Room"("areaId");

-- CreateIndex
CREATE INDEX "Room_isActive_idx" ON "Room"("isActive");

-- CreateIndex
CREATE INDEX "RoomFormAvailability_roomId_idx" ON "RoomFormAvailability"("roomId");

-- CreateIndex
CREATE INDEX "RoomFormAvailability_period_idx" ON "RoomFormAvailability"("period");

-- CreateIndex
CREATE UNIQUE INDEX "RoomFormAvailability_roomId_formCode_period_key" ON "RoomFormAvailability"("roomId", "formCode", "period");

-- CreateIndex
CREATE INDEX "ChecklistReport_roomId_idx" ON "ChecklistReport"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistReport_areaId_roomId_period_periodKey_formCode_key" ON "ChecklistReport"("areaId", "roomId", "period", "periodKey", "formCode");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomFormAvailability" ADD CONSTRAINT "RoomFormAvailability_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistReport" ADD CONSTRAINT "ChecklistReport_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
