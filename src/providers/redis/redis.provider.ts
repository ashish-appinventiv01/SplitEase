import { createClient, type RedisClientType } from "redis";

import { configuration } from "../../config/configuration";
import { Logger } from "../../logger/logger";

export class RedisProvider {
  private static instance: RedisProvider;

  private readonly client: RedisClientType;

  private constructor() {
    this.client = createClient({
      url: configuration.redisUrl,
    });

    this.client.on("error", (error) => {
      Logger.error("Redis client error", {
        error: error.message,
      });
    });
  }

  public static getInstance(): RedisProvider {
    if (!RedisProvider.instance) {
      RedisProvider.instance = new RedisProvider();
    }

    return RedisProvider.instance;
  }

  public async connect(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    await this.client.connect();

    Logger.info("Redis connected successfully");
  }

  public async disconnect(): Promise<void> {
    if (!this.client.isOpen) {
      return;
    }

    await this.client.quit();

    Logger.info("Redis disconnected");
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isConnected(): boolean {
    return this.client.isReady;
  }
}