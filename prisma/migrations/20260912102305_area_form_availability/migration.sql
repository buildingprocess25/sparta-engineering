-- CreateEnum
CREATE TYPE "ChecklistPeriod" AS ENUM ('MONTHLY', 'WEEKLY');

-- AlterTable
ALTER TABLE "Area" ADD COLUMN     "code" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing global areas before enforcing NOT NULL and unique.
UPDATE "Area"
SET "code" = CASE lower("name")
  WHEN 'office' THEN 'office'
  WHEN 'whc' THEN 'whc'
  WHEN 'wh' THEN 'wh'
  WHEN 'depo' THEN 'depo'
  WHEN 'bulky' THEN 'bulky'
  WHEN 'store hub' THEN 'store_hub'
  WHEN 'gudang anak' THEN 'gudang_anak'
  ELSE lower(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '_', 'g'))
END
WHERE "code" IS NULL;

WITH duplicate_area_codes AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "code"
      ORDER BY "createdAt", "id"
    ) AS duplicate_index
  FROM "Area"
)
UPDATE "Area"
SET "code" = "Area"."code" || '_' || left("Area"."id", 8)
FROM duplicate_area_codes
WHERE "Area"."id" = duplicate_area_codes."id"
  AND duplicate_area_codes.duplicate_index > 1;

ALTER TABLE "Area" ALTER COLUMN "code" SET NOT NULL;

-- CreateTable
CREATE TABLE "AreaChecklistAvailability" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "period" "ChecklistPeriod" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AreaChecklistAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AreaChecklistAvailability_period_idx" ON "AreaChecklistAvailability"("period");

-- CreateIndex
CREATE UNIQUE INDEX "AreaChecklistAvailability_areaId_period_key" ON "AreaChecklistAvailability"("areaId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Area_code_key" ON "Area"("code");

-- CreateIndex
CREATE INDEX "Area_type_idx" ON "Area"("type");

-- CreateIndex
CREATE INDEX "Area_isActive_idx" ON "Area"("isActive");

-- AddForeignKey
ALTER TABLE "AreaChecklistAvailability" ADD CONSTRAINT "AreaChecklistAvailability_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
