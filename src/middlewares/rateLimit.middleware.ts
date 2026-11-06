import type { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";
import { RedisProvider } from "../providers/redis/redis.provider";
import { Logger } from "../logger/logger";

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix: string;
}

export class RateLimitMiddleware {
  public static create(options: RateLimitOptions) {
    const redis = RedisProvider.getInstance().getClient();

    return async (
      req: Request,
      _res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const identity =
          req.user?.userId ??
          String(req.headers.device_id ?? req.ip ?? "anonymous");
        const key = `${options.keyPrefix}:${identity}`;

        const count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, options.windowSeconds);
        }

        if (count > options.maxRequests) {
          throw new AppError(
            "Too many requests. Please try again later.",
            429,
            ErrorCode.TOO_MANY_ATTEMPTS
          );
        }

        next();
      } catch (error) {
        if (error instanceof AppError) {
          next(error);
          return;
        }

        Logger.warn("Rate limit skipped due to Redis error", {
          error: error instanceof Error ? error.message : error,
        });
        next();
      }
    };
  }
}
