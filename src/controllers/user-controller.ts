import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(users);
});
