-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'manager', 'contributor');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('post', 'video', 'reel', 'carousel');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('planned', 'in_progress', 'review', 'done', 'published');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('LinkedIn', 'X', 'Instagram', 'TikTok', 'YouTube', 'Facebook');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('content', 'product');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('created', 'updated', 'status_changed', 'assigned', 'deleted');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'planned',
    "platforms" "Platform"[],
    "scheduledDate" TIMESTAMP(3),
    "publishedDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "tags" TEXT[],
    "mediaUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "contentItemId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "changedById" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ContentItem_productId_idx" ON "ContentItem"("productId");

-- CreateIndex
CREATE INDEX "ContentItem_status_idx" ON "ContentItem"("status");

-- CreateIndex
CREATE INDEX "ContentItem_assignedToId_idx" ON "ContentItem"("assignedToId");

-- CreateIndex
CREATE INDEX "ContentItem_createdAt_idx" ON "ContentItem"("createdAt");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
