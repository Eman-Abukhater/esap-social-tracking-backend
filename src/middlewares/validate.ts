import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

type Source = "body" | "query";

function formatErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        message: result.error.issues[0]?.message ?? "Invalid request",
        errors: formatErrors(result.error),
      });
      return;
    }

    // Express 5: req.query is a getter-only on the prototype — use defineProperty
    // to shadow it with a writable own property so coerced values are visible.
    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
