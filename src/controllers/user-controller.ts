import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(users);
});
