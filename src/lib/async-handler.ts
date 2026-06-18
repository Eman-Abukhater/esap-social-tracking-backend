import { NextFunction, Request, Response } from "express";

type RouteHandler = (req: Request, res: Response) => Promise<unknown>;

export function asyncHandler(fn: RouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch((error: unknown) => {
      console.error(`${req.method} ${req.path} failed`, {
        error,
        params: req.params,
      });
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error" });
      }
    });
  };
}
