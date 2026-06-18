import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

export const getProducts = asyncHandler(async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  res.json(products);
});
