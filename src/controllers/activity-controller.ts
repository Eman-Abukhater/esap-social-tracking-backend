import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { userId, productId, contentId } = req.query;

    const activityLogs = await prisma.activityLog.findMany({
      where: {
        changedById: userId ? String(userId) : undefined,

        contentItemId: contentId ? String(contentId) : undefined,

        contentItem: productId
          ? { productId: String(productId) }
          : undefined,
      },

      include: {
        changedBy: true,
        contentItem: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    res.json(activityLogs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch activity logs",
    });
  }
}