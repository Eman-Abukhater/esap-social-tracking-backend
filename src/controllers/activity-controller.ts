import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/async-handler";

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { userId, productId, contentId } = req.query;

  const activityLogs = await prisma.activityLog.findMany({
    where: {
      changedById: userId ? String(userId) : undefined,
      contentItemId: contentId ? String(contentId) : undefined,
      contentItem: productId ? { productId: String(productId) } : undefined,
    },
    include: { changedBy: true, contentItem: true },
    orderBy: { timestamp: "desc" },
  });

  res.json(activityLogs);
});
