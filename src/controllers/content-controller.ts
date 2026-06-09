import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

export async function getContentItems(req: Request, res: Response) {
  try {
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
    } = req.query;

    const where = {
      title: search
        ? { contains: String(search), mode: "insensitive" as const }
        : undefined,
      productId: productId ? String(productId) : undefined,
      status: status ? (String(status) as any) : undefined,
      platforms: platform ? { has: String(platform) as any } : undefined,
      assignedToId: assignedToId ? String(assignedToId) : undefined,
      scheduledDate:
        startDate || endDate
          ? {
              gte: startDate ? new Date(String(startDate)) : undefined,
              lte: endDate ? new Date(String(endDate)) : undefined,
            }
          : undefined,
    };

    const include = { product: true, createdBy: true, assignedTo: true };
    const orderBy = { createdAt: "desc" as const };

    if (pageParam !== undefined) {
      const page = Math.max(1, parseInt(String(pageParam), 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(String(pageSizeParam), 10) || 20));
      const skip = (page - 1) * pageSize;

      const [items, total] = await Promise.all([
        prisma.contentItem.findMany({ where, include, orderBy, take: pageSize, skip }),
        prisma.contentItem.count({ where }),
      ]);

      return res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    }

    const contentItems = await prisma.contentItem.findMany({ where, include, orderBy });
    res.json(contentItems);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch content items" });
  }
}

export async function createContentItem(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      type,
      productId,
      platforms,
      scheduledDate,
      createdById,
      assignedToId,
      priority,
      tags,
      mediaUrl,
      notes,
    } = req.body;

    if (
      !title ||
      !description ||
      !type ||
      !productId ||
      !createdById ||
      !assignedToId ||
      !priority
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const contentItem = await prisma.contentItem.create({
      data: {
        title,
        description,
        type,
        productId,
        platforms,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        createdById,
        assignedToId,
        priority,
        tags: tags || [],
        mediaUrl,
        notes,
      },
      include: {
        product: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "content",
        entityId: contentItem.id,
        contentItemId: contentItem.id,
        action: "created",
        newValue: {
          title: contentItem.title,
          status: contentItem.status,
        },
        changedById: createdById,
      },
    });

    res.status(201).json(contentItem);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create content item",
    });
  }
}
export async function updateContentStatus(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { status, changedById } = req.body;

    if (!status || !changedById) {
      return res.status(400).json({
        message: "Status and changedById are required",
      });
    }

    const currentContentItem = await prisma.contentItem.findUnique({
      where: { id },
    });

    if (!currentContentItem) {
      return res.status(404).json({
        message: "Content item not found",
      });
    }

    const updatedContentItem = await prisma.contentItem.update({
      where: { id },
      data: {
        status,
        publishedDate:
          status === "published" ? new Date() : currentContentItem.publishedDate,
      },
      include: {
        product: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "content",
        entityId: updatedContentItem.id,
        contentItemId: updatedContentItem.id,
        action: "status_changed",
        previousValue: {
          status: currentContentItem.status,
        },
        newValue: {
          status: updatedContentItem.status,
        },
        changedById,
      },
    });

    res.json(updatedContentItem);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update content status",
    });
  }
}
function toJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value as Prisma.InputJsonValue;
}
export async function updateContentItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { changedById, ...updateData } = req.body;

    if (!changedById) {
      return res.status(400).json({
        message: "changedById is required",
      });
    }

    const currentContentItem = await prisma.contentItem.findUnique({
      where: { id },
    });

    if (!currentContentItem) {
      return res.status(404).json({
        message: "Content item not found",
      });
    }

    const previousValue: Record<string, Prisma.InputJsonValue> = {};
    const newValue: Record<string, Prisma.InputJsonValue> = {};

    Object.keys(updateData).forEach((key) => {
      const typedKey = key as keyof typeof currentContentItem;

      const oldValue = currentContentItem[typedKey];
      const newFieldValue = updateData[key];

      if (String(oldValue) !== String(newFieldValue)) {
        previousValue[key] = toJsonValue(oldValue);
        newValue[key] = toJsonValue(newFieldValue);
      }
    });

    if (Object.keys(newValue).length === 0) {
      return res.status(400).json({
        message: "No changes detected",
      });
    }

    const updatedContentItem = await prisma.contentItem.update({
      where: { id },
      data: {
        ...updateData,
        scheduledDate: updateData.scheduledDate
          ? new Date(updateData.scheduledDate)
          : undefined,
      },
      include: {
        product: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "content",
        entityId: updatedContentItem.id,
        contentItemId: updatedContentItem.id,
        action: "updated",
        previousValue,
        newValue,
        changedById,
      },
    });

    res.json(updatedContentItem);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update content item",
    });
  }
}

export async function assignContentItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { assignedToId, changedById } = req.body;

    if (!assignedToId || !changedById) {
      return res.status(400).json({
        message: "assignedToId and changedById are required",
      });
    }

    const currentContentItem = await prisma.contentItem.findUnique({
      where: { id },
    });

    if (!currentContentItem) {
      return res.status(404).json({
        message: "Content item not found",
      });
    }

    const updatedContentItem = await prisma.contentItem.update({
      where: { id },
      data: {
        assignedToId,
      },
      include: {
        product: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        entityType: "content",
        entityId: updatedContentItem.id,
        contentItemId: updatedContentItem.id,
        action: "assigned",
        previousValue: {
          assignedToId: currentContentItem.assignedToId,
        },
        newValue: {
          assignedToId,
        },
        changedById,
      },
    });

    res.json(updatedContentItem);
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign content item",
    });
  }
}

export async function deleteContentItem(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const { changedById } = req.body;

    if (!changedById) {
      return res.status(400).json({
        message: "changedById is required",
      });
    }

    const currentContentItem = await prisma.contentItem.findUnique({
      where: { id },
    });

    if (!currentContentItem) {
      return res.status(404).json({
        message: "Content item not found",
      });
    }

    await prisma.activityLog.create({
      data: {
        entityType: "content",
        entityId: currentContentItem.id,
        contentItemId: currentContentItem.id,
        action: "deleted",
        previousValue: {
          title: currentContentItem.title,
          status: currentContentItem.status,
        },
        changedById,
      },
    });

    await prisma.contentItem.delete({
      where: { id },
    });

    res.json({
      message: "Content item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete content item",
    });
  }
}