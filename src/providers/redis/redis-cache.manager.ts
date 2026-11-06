import { RedisProvider } from "./redis.provider";
import { Logger } from "../../logger/logger";

export class RedisCacheManager {
  private readonly redis = RedisProvider.getInstance().getClient();

  private readonly BALANCE_PREFIX = "balance:group:";
  private readonly BALANCE_TTL_SECONDS = 5 * 60;

  private getBalanceKey(groupId: string): string {
    return `${this.BALANCE_PREFIX}${groupId}`;
  }

  public async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      Logger.warn("Redis cache get failed", {
        key,
        error: error instanceof Error ? error.message : error,
      });
      return null;
    }
  }

  public async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error) {
      Logger.warn("Redis cache set failed", {
        key,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      Logger.warn("Redis cache delete failed", {
        key,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  public async getGroupBalances<T>(groupId: string): Promise<T | null> {
    return this.getJson<T>(this.getBalanceKey(groupId));
  }

  public async setGroupBalances(
    groupId: string,
    value: unknown
  ): Promise<void> {
    await this.setJson(
      this.getBalanceKey(groupId),
      value,
      this.BALANCE_TTL_SECONDS
    );
  }

  public async invalidateGroupBalances(groupId: string): Promise<void> {
    await this.delete(this.getBalanceKey(groupId));
  }
}
