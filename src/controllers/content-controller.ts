import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";
import { GetContentQuerySchema } from "../lib/schemas";
import { z } from "zod";

export const getContentItems = asyncHandler(async (req, res) => {
  const {
    search,
    productId,
    status,
    platform,
    assignedToId,
    startDate,
    endDate,
    page: pageParam,
    pageSize: pageSizeParam,
  } = req.query as z.infer<typeof GetContentQuerySchema>;

  const where = {
    title: search ? { contains: search, mode: "insensitive" as const } : undefined,
    productId: productId ?? undefined,
    status: status ?? undefined,
    platforms: platform ? { has: platform } : undefined,
    assignedToId: assignedToId ?? undefined,
    scheduledDate:
      startDate || endDate
        ? {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          }
        : undefined,
  };

  const include = { product: true, createdBy: true, assignedTo: true };
  const orderBy = [{ order: "asc" as const }, { createdAt: "desc" as const }];

  if (pageParam !== undefined) {
    const page = pageParam;
    const pageSize = pageSizeParam ?? 20;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.contentItem.findMany({ where, include, orderBy, take: pageSize, skip }),
      prisma.contentItem.count({ where }),
    ]);

    return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  }

  const contentItems = await prisma.contentItem.findMany({ where, include, orderBy });
  res.json(contentItems);
});

export const createContentItem = asyncHandler(async (req, res) => {
  const actingUserId = req.actingUser!.id;
  const {
    title,
    description,
    type,
    productId,
    platforms,
    scheduledDate,
    assignedToId,
    priority,
    tags,
    mediaUrl,
    notes,
  } = req.body;

  const contentItem = await prisma.$transaction(async (tx) => {
    const maxResult = await tx.contentItem.aggregate({ _max: { order: true } });
    const nextOrder = (maxResult._max.order ?? 0) + 1000;

    return tx.contentItem.create({
      data: {
        title,
        description,
        type,
        productId,
        platforms,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        createdById: actingUserId,
        assignedToId,
        priority,
        tags: tags ?? [],
        mediaUrl: mediaUrl || null,
        notes: notes || null,
        order: nextOrder,
      },
      include: { product: true, createdBy: true, assignedTo: true },
    });
  });

  await prisma.activityLog.create({
    data: {
      entityType: "content",
      entityId: contentItem.id,
      contentItemId: contentItem.id,
      action: "created",
      newValue: { title: contentItem.title, status: contentItem.status },
      changedById: actingUserId,
    },
  });

  res.status(201).json(contentItem);
});

export const updateContentStatus = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const actingUserId = req.actingUser!.id;
  const { status } = req.body;

  const currentContentItem = await prisma.contentItem.findUnique({ where: { id } });

  if (!currentContentItem) {
    return res.status(404).json({ message: "Content item not found" });
  }

  const isPrivileged = req.actingUser?.role === "admin" || req.actingUser?.role === "manager";
  const isOwner =
    currentContentItem.createdById === req.actingUser?.id ||
    currentContentItem.assignedToId === req.actingUser?.id;
  if (!isPrivileged && !isOwner) {
    return res.status(403).json({ message: "You do not have permission to edit this item" });
  }

  const updatedContentItem = await prisma.contentItem.update({
    where: { id },
    data: {
      status,
      publishedDate:
        status === "published" ? new Date() : currentContentItem.publishedDate,
    },
    include: { product: true, createdBy: true, assignedTo: true },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "content",
      entityId: updatedContentItem.id,
      contentItemId: updatedContentItem.id,
      action: "status_changed",
      previousValue: { status: currentContentItem.status },
      newValue: { status: updatedContentItem.status },
      changedById: actingUserId,
    },
  });

  res.json(updatedContentItem);
});

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return value as Prisma.InputJsonValue;
}

function normalizeForComparison(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (Array.isArray(value)) return JSON.stringify([...value].sort());
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return String(value);
}

export const updateContentItem = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const actingUserId = req.actingUser!.id;
  const updateData = req.body;

  const currentContentItem = await prisma.contentItem.findUnique({ where: { id } });

  if (!currentContentItem) {
    return res.status(404).json({ message: "Content item not found" });
  }

  const isPrivileged = req.actingUser?.role === "admin" || req.actingUser?.role === "manager";
  const isOwner =
    currentContentItem.createdById === req.actingUser?.id ||
    currentContentItem.assignedToId === req.actingUser?.id;
  if (!isPrivileged && !isOwner) {
    return res.status(403).json({ message: "You do not have permission to edit this item" });
  }

  const previousValue: Record<string, Prisma.InputJsonValue> = {};
  const newValue: Record<string, Prisma.InputJsonValue> = {};

  Object.keys(updateData).forEach((key) => {
    const typedKey = key as keyof typeof currentContentItem;
    const oldValue = currentContentItem[typedKey];
    const newFieldValue = updateData[key];

    if (normalizeForComparison(oldValue) !== normalizeForComparison(newFieldValue)) {
      previousValue[key] = toJsonValue(oldValue);
      newValue[key] = toJsonValue(newFieldValue);
    }
  });

  if (Object.keys(newValue).length === 0) {
    return res.status(400).json({ message: "No changes detected" });
  }

  const updatedContentItem = await prisma.contentItem.update({
    where: { id },
    data: {
      ...updateData,
      scheduledDate: updateData.scheduledDate
        ? new Date(updateData.scheduledDate)
        : updateData.scheduledDate === null
        ? null
        : undefined,
      mediaUrl: updateData.mediaUrl === "" ? null : updateData.mediaUrl,
    },
    include: { product: true, createdBy: true, assignedTo: true },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "content",
      entityId: updatedContentItem.id,
      contentItemId: updatedContentItem.id,
      action: "updated",
      previousValue,
      newValue,
      changedById: actingUserId,
    },
  });

  res.json(updatedContentItem);
});

export const assignContentItem = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const actingUserId = req.actingUser!.id;
  const { assignedToId } = req.body;

  const currentContentItem = await prisma.contentItem.findUnique({ where: { id } });

  if (!currentContentItem) {
    return res.status(404).json({ message: "Content item not found" });
  }

  const updatedContentItem = await prisma.contentItem.update({
    where: { id },
    data: { assignedToId },
    include: { product: true, createdBy: true, assignedTo: true },
  });

  await prisma.activityLog.create({
    data: {
      entityType: "content",
      entityId: updatedContentItem.id,
      contentItemId: updatedContentItem.id,
      action: "assigned",
      previousValue: { assignedToId: currentContentItem.assignedToId },
      newValue: { assignedToId },
      changedById: actingUserId,
    },
  });

  res.json(updatedContentItem);
});

export const deleteContentItem = asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const actingUserId = req.actingUser!.id;

  const currentContentItem = await prisma.contentItem.findUnique({ where: { id } });

  if (!currentContentItem) {
    return res.status(404).json({ message: "Content item not found" });
  }

  const isPrivileged = req.actingUser?.role === "admin" || req.actingUser?.role === "manager";
  const isOwner =
    currentContentItem.createdById === req.actingUser?.id ||
    currentContentItem.assignedToId === req.actingUser?.id;
  if (!isPrivileged && !isOwner) {
    return res.status(403).json({ message: "You do not have permission to delete this item" });
  }

  await prisma.activityLog.create({
    data: {
      entityType: "content",
      entityId: currentContentItem.id,
      contentItemId: currentContentItem.id,
      action: "deleted",
      previousValue: { title: currentContentItem.title, status: currentContentItem.status },
      changedById: actingUserId,
    },
  });

  await prisma.contentItem.delete({ where: { id } });

  res.json({ message: "Content item deleted successfully" });
});
