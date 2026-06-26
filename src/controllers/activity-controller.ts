import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";
import { GetActivityQuerySchema } from "../lib/schemas";
import { z } from "zod";

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { userId, productId, contentId, page: pageParam, pageSize: pageSizeParam } =
    req.query as z.infer<typeof GetActivityQuerySchema>;

  const where = {
    changedById: userId ? String(userId) : undefined,
    contentItemId: contentId ? String(contentId) : undefined,
    contentItem: productId ? { productId: String(productId) } : undefined,
  };

  const page = pageParam ?? 1;
  const pageSize = pageSizeParam ?? 20;
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: { changedBy: true, contentItem: true },
      orderBy: { timestamp: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({ logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});
