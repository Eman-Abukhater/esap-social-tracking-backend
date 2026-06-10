-- AlterTable: add order column
ALTER TABLE "ContentItem" ADD COLUMN "order" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Initialize existing rows: assign order based on createdAt ASC (oldest = lowest order)
UPDATE "ContentItem" SET "order" = sub.rn * 1000.0
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "ContentItem"
) sub
WHERE "ContentItem".id = sub.id;

-- CreateIndex
CREATE INDEX "ContentItem_order_idx" ON "ContentItem"("order");
