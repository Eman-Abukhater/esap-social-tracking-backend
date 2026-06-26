import { NextFunction, Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { logger } from "./logger";

type RouteHandler = (req: Request, res: Response) => Promise<unknown>;

export function asyncHandler(fn: RouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch((error: unknown) => {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        if (!res.headersSent) {
          res.status(400).json({ message: "Referenced record does not exist" });
        }
        return;
      }

      logger.error({ err: error, method: req.method, path: req.path, params: req.params }, "Request failed");
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error" });
      }
    });
  };
}
