import { NextFunction, Request, Response } from "express";
import { UserRole } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      actingUser?: { id: string; role: UserRole };
    }
  }
}

/**
 * There is no session layer (see CLAUDE.md), so the acting user is identified
 * by `changedById`/`createdById` in the request body. This loads that user and
 * attaches it to `req.actingUser` so `requireRole` can check permissions.
 */
export async function loadActingUser(req: Request, res: Response, next: NextFunction) {
  try {
    const actingUserId = req.body?.changedById ?? req.body?.createdById;

    if (!actingUserId) {
      return res.status(400).json({
        message: "changedById is required",
      });
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: String(actingUserId) },
      select: { id: true, role: true },
    });

    if (!actingUser) {
      return res.status(404).json({
        message: "Acting user not found",
      });
    }

    req.actingUser = actingUser;
    next();
  } catch (error) {
    console.error("loadActingUser failed", { error, actingUserId: req.body?.changedById ?? req.body?.createdById });
    res.status(500).json({
      message: "Failed to verify acting user",
    });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.actingUser || !roles.includes(req.actingUser.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}
