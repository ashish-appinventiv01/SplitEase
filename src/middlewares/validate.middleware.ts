import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";

type Source = "body" | "query" | "params";

export class ValidateMiddleware {
  private validate(schema: ZodType, source: Source) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const message = result.error.issues.map((issue) => issue.message).join(", ");
        next(new AppError(message, 400, ErrorCode.VALIDATION_ERROR));
        return;
      }

      const data = result.data as Record<string, unknown>;
      if (source === "body") req.body = data;
      else if (source === "query") req.validatedQuery = data;
      else req.validatedParams = data;

      next();
    };
  }

  public validateBody(schema: ZodType) {
    return this.validate(schema, "body");
  }

  public validateQuery(schema: ZodType) {
    return this.validate(schema, "query");
  }

  public validateParams(schema: ZodType) {
    return this.validate(schema, "params");
  }
}
