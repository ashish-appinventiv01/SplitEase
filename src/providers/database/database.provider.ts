import mongoose from "mongoose";

import { configuration } from "../../config/configuration";
import { Logger } from "../../logger/logger";

export class DatabaseProvider {
  private static instance: DatabaseProvider;

  private constructor() {}

  public static getInstance(): DatabaseProvider {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = new DatabaseProvider();
    }

    return DatabaseProvider.instance;
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(configuration.MONGODB_URI);

      Logger.info("MongoDB connected successfully");
    } catch (error) {
      Logger.error("MongoDB connection failed", {
        error: error instanceof Error ? error.message : error,
      });

      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await mongoose.disconnect();

    Logger.info("MongoDB disconnected");
  }

  public getConnectionStatus(): string {
    const states: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return states[mongoose.connection.readyState] ?? "unknown";
  }
}