import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getActivityLogs(_req: Request, res: Response) {
  try {
    const activityLogs = await prisma.activityLog.findMany({
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