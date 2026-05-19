import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
}