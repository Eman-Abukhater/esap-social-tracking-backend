import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getProducts(_req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
}