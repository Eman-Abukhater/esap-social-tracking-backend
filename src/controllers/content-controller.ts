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