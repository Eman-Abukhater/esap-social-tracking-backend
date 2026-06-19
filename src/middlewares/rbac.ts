import { NextFunction, Request, Response } from "express";
import { UserRole } from "../generated/prisma/client";

declare global {
  namespace Express {
    interface Request {
      actingUser?: { id: string; role: UserRole };
    }
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
