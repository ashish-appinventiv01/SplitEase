import { type Express } from "express";
import { AppError } from "./common/errors";
import { ApiResponse } from "./common/responses";
import { ErrorCode } from "./enum/enum";
import { APP_CONSTANTS } from "./common/constant";
import { AuthRoutes } from "./modules/v1/auth/auth.routes";
import { UserRoutes } from "./modules/v1/user/user.routes";
import { GroupRoutes } from "./modules/v1/group/group.routes";
import { ExpenseRoutes } from "./modules/v1/expense/expense.routes";
import { BalanceRoutes } from "./modules/v1/balance/balance.routes";
import { SettlementRoutes } from "./modules/v1/settlement/settlement.routes";
import { ExportRoutes } from "./modules/v1/export/export.routes";
import { RateLimitMiddleware } from "./middlewares/rateLimit.middleware";
import { DatabaseProvider } from "./providers/database/database.provider";
import { RedisProvider } from "./providers/redis/redis.provider";

export function registerRoutes(app: Express): void {
  app.get("/health", (_req, res) => {
    const mongoReady = DatabaseProvider.getInstance().isConnected();
    const redisReady = RedisProvider.getInstance().isConnected();

    const healthy = mongoReady && redisReady;

    res.status(healthy ? 200 : 503).json({
      statusCode: healthy ? 200 : 503,
      message: healthy ? "OK" : "Degraded",
      data: {
        mongo: mongoReady ? "up" : "down",
        redis: redisReady ? "up" : "down",
      },
    });
  });

  app.get("/", (_req, res) => {
    res.send("SplitEase API");
  });

  app.get("/test-error", (_req, _res, next) => {
    next(new AppError("This is a test error", 400, ErrorCode.VALIDATION_ERROR));
  });

  app.get(`${APP_CONSTANTS.API_PREFIX}/test`, (_req, res) => {
    return ApiResponse.success(res, "API Version", {
      version: "1.0.0",
    });
  });

  const authRateLimit = RateLimitMiddleware.create({
    keyPrefix: "rl:auth",
    windowSeconds: 60,
    maxRequests: 30,
  });

  app.use(`${APP_CONSTANTS.API_PREFIX}/auth`, authRateLimit, new AuthRoutes().router);
  app.use(`${APP_CONSTANTS.API_PREFIX}/users`, new UserRoutes().router);
  app.use(`${APP_CONSTANTS.API_PREFIX}/groups`, new GroupRoutes().router);
  app.use(`${APP_CONSTANTS.API_PREFIX}`, new ExpenseRoutes().router);
  app.use(`${APP_CONSTANTS.API_PREFIX}`, new BalanceRoutes().router);
  app.use(`${APP_CONSTANTS.API_PREFIX}`, new SettlementRoutes().router);
  app.use(`${APP_CONSTANTS.API_PREFIX}`, new ExportRoutes().router);
}
