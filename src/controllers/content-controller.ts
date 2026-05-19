import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getContentItems(_req: Request, res: Response) {
  try {
    const contentItems = await prisma.contentItem.findMany({
      include: {
        product: true,
        createdBy: true,
        assignedTo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(contentItems);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch content items",
    });
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
        previousValue: currentContentItem,
        newValue: updateData,
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