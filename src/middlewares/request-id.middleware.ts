import { randomUUID } from "crypto";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

export class RequestIdMiddleware {
  public handle(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const requestId = randomUUID();

    req.requestId = requestId;

    res.setHeader("x-request-id", requestId);

    next();
  }
}