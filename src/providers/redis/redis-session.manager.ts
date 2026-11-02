
import { RedisProvider } from "./redis.provider";

export class RedisSessionManager {
  private readonly redis = RedisProvider.getInstance().getClient();

  private readonly SESSION_PREFIX = "session:";
  private readonly SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

  /**
   * Swap the refresh-token id only when it still matches the expected value.
   * KEYS[1] session key, ARGV[1] expected id, ARGV[2] next id, ARGV[3] TTL seconds.
   */
  private static readonly ROTATE_REFRESH_TOKEN_SCRIPT = `
    local current = redis.call("GET", KEYS[1])
    if current ~= ARGV[1] then
      return 0
    end
    redis.call("SET", KEYS[1], ARGV[2], "EX", ARGV[3])
    return 1
  `;

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  /**
   * Store the latest refresh-token ID for a session.
   */
  public async storeSession(
    sessionId: string,
    refreshTokenId: string
  ): Promise<void> {
    await this.redis.set(
      this.getSessionKey(sessionId),
      refreshTokenId,
      {
        EX: this.SESSION_TTL_SECONDS,
      }
    );
  }

  /**
   * Retrieve the latest refresh-token ID.
   */
  public async getSession(
    sessionId: string
  ): Promise<string | null> {
    return this.redis.get(this.getSessionKey(sessionId));
  }

  /**
   * Delete a session from Redis.
   */
  public async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(this.getSessionKey(sessionId));
  }

  /**
   * Replace the refresh-token id only if it is still the expected value.
   * Returns false when another request already rotated or removed it.
   */
  public async rotateRefreshToken(
    sessionId: string,
    expectedRefreshTokenId: string,
    nextRefreshTokenId: string
  ): Promise<boolean> {
    const result = await this.redis.eval(
      RedisSessionManager.ROTATE_REFRESH_TOKEN_SCRIPT,
      {
        keys: [this.getSessionKey(sessionId)],
        arguments: [
          expectedRefreshTokenId,
          nextRefreshTokenId,
          String(this.SESSION_TTL_SECONDS),
        ],
      }
    );

    return Number(result) === 1;
  }

  /**
   * Check whether a session exists in Redis.
   */
  public async isSessionActive(sessionId: string): Promise<boolean> {
    const refreshTokenId = await this.getSession(sessionId);
    return refreshTokenId !== null;
  }
}
