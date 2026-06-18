import { getDashboardStats } from "../services/analytics-service";
import { asyncHandler } from "../lib/async-handler";

export const getDashboardStatsHandler = asyncHandler(async (req, res) => {
  const { productId } = req.query;
  const stats = await getDashboardStats(productId ? String(productId) : undefined);
  res.json(stats);
});
