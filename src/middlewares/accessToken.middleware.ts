
import type { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../common/utils/jwt.util";
import { RedisSessionManager } from "../providers/redis/redis-session.manager";
import { SessionRepository } from "../repositories/session.repository";
import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";

export class AccessTokenMiddleware {
  private static readonly redisSessionManager =
    new RedisSessionManager();

  private static readonly sessionRepository =
    new SessionRepository();

  public static handle = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        throw new AppError(
          "Access token is required",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      const accessToken = authorization.substring(7).trim();

      if (!accessToken) {
        throw new AppError(
          "Access token is required",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      let payload;

      try {
        payload = JwtUtil.verifyAccessToken(accessToken);
      } catch {
        throw new AppError(
          "Invalid or expired access token",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      const session = await this.sessionRepository.findById(
        payload.sid
      );

      if (
        !session ||
        session.isRevoked ||
        session.expiresAt.getTime() <= Date.now() ||
        String(session.userId) !== payload.sub
      ) {
        throw new AppError(
          "Session is invalid or expired",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      const isActive =
        await this.redisSessionManager.isSessionActive(payload.sid);

      if (!isActive) {
        throw new AppError(
          "Session is no longer active",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      req.user = {
        userId: payload.sub,
        sessionId: payload.sid,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
