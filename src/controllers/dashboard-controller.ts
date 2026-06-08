import { Request, Response } from "express";
import { getDashboardStats } from "../services/analytics-service";

export async function getDashboardStatsHandler(req: Request, res: Response) {
  try {
    const { productId } = req.query;

    const stats = await getDashboardStats(
      productId ? String(productId) : undefined
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard stats",
    });
  }
}
