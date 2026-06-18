import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

export const getProducts = asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  res.json(products);
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;

  if (!name || !description || !color) {
    res.status(400).json({ message: "name, description, and color are required" });
    return;
  }

  const product = await prisma.product.create({
    data: { name, description, color },
  });

  res.status(201).json(product);
});
