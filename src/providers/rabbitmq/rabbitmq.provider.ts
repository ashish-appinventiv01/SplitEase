import amqp, { type Channel, type ChannelModel } from "amqplib";

import { configuration } from "../../config/configuration";
import { Logger } from "../../logger/logger";

export class RabbitMQProvider {
  private static instance: RabbitMQProvider;

  private connection?: ChannelModel;
  private channel?: Channel;

  private constructor() {}

  public static getInstance(): RabbitMQProvider {
    if (!RabbitMQProvider.instance) {
      RabbitMQProvider.instance = new RabbitMQProvider();
    }

    return RabbitMQProvider.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected()) return;

    const connection = await amqp.connect(configuration.rabbitmqUrl);

    try {
      const channel = await connection.createChannel();

      this.connection = connection;
      this.channel = channel;

      connection.on("error", (error: Error) => {
        Logger.error("RabbitMQ connection error", {
          error: error.message,
        });
      });

      connection.on("close", () => {
        this.clear();
        Logger.warn("RabbitMQ connection closed");
      });

      Logger.info("RabbitMQ connected successfully");
    } catch (error) {
      await connection.close();
      throw error;
    }
  }

  public getChannel(): Channel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel is not connected");
    }

    return this.channel;
  }

  public isConnected(): boolean {
    return Boolean(this.connection && this.channel);
  }

  public async disconnect(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;

    this.clear();

    if (channel) await channel.close();
    if (connection) await connection.close();

    Logger.info("RabbitMQ disconnected");
  }

  private clear(): void {
    this.connection = undefined;
    this.channel = undefined;
  }
}
