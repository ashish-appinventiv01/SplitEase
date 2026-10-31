import "dotenv/config";

import type { Server as HttpServer } from "http";

import { App } from "./app";
import { configuration } from "./config/configuration";
import { Logger } from "./logger/logger";
import { RedisProvider } from "./providers/redis/redis.provider";
import { RabbitMQProvider } from "./providers/rabbitmq/rabbitmq.provider";
const SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM"] as const;

class Server {
  private readonly application = new App();
  private httpServer?: HttpServer;
  private isShuttingDown = false;
  private readonly redisProvider = RedisProvider.getInstance();
  private readonly rabbitmqProvider = RabbitMQProvider.getInstance();
  public async start(): Promise<void> {
    await this.application.initialize();
    await this.redisProvider.connect();
    await this.rabbitmqProvider.connect();
    this.httpServer = this.application.app.listen(configuration.PORT, () => {
      Logger.info(
        `SplitEase API running on http://localhost:${configuration.PORT}`
      );
    });

    for (const signal of SHUTDOWN_SIGNALS) {
      process.on(signal, () => {
        void this.shutdown(signal);
      });
    }
  }

  private async shutdown(signal: NodeJS.Signals): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    Logger.info(`Received ${signal}. Starting graceful shutdown`);

    try {
      await this.closeHttpServer();
      await this.application.disconnect();
      await this.redisProvider.disconnect();
      await this.rabbitmqProvider.disconnect();
      Logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      Logger.error("Graceful shutdown failed", { error: describe(error) });
      process.exit(1);
    }
  }

  private closeHttpServer(): Promise<void> {
    const httpServer = this.httpServer;
    if (!httpServer) return Promise.resolve();

    return new Promise((resolve, reject) => {
      httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function describe(error: unknown): unknown {
  return error instanceof Error ? error.message : error;
}

const server = new Server();

server.start().catch((error: unknown) => {
  Logger.error("Server startup failed", { error: describe(error) });
  process.exit(1);
});
