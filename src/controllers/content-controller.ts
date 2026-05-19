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