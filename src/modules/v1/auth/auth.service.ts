
import { randomUUID } from "node:crypto";
import { UserRepository } from "../../../repositories/user.repository";
import { SessionRepository } from "../../../repositories/session.repository";
import { PasswordUtil } from "../../../common/utils/password.util";
import { JwtUtil } from "../../../common/utils/jwt.util";
import { RedisSessionManager } from "../../../providers/redis/redis-session.manager";
import { AppError } from "../../../common/errors";
import type { SignupDto } from "./dto/signup.dto";
import type { LoginDto } from "./dto/login.dto";
import type { AuthResponse } from "./interfaces/auth-response.interface";
import type { IAuthService } from "./interfaces/auth.interface";
import { ErrorCode } from "../../../enum/enum";

export class AuthService implements IAuthService {
  private readonly userRepository = new UserRepository();
  private readonly sessionRepository = new SessionRepository();
  private readonly redisSessionManager = new RedisSessionManager();

  public async signup(
    payload: SignupDto,
    deviceId: string,
    deviceType: number
  ): Promise<AuthResponse> {
    const email = payload.email.toLowerCase().trim();

    if (await this.userRepository.existsByEmail(email)) {
      throw new AppError(
        "An account with this email already exists",
        409,
        ErrorCode.CONFLICT
      );
    }

    const passwordHash = await PasswordUtil.hash(payload.password);

    await this.userRepository.create({
      name: payload.name.trim(),
      email,
      passwordHash,
      isEmailVerified: false,
      isActive: true,
    });

    return this.login(
      {
        email,
        password: payload.password,
      },
      deviceId,
      deviceType
    );
  }

  public async login(
    payload: LoginDto,
    deviceId: string,
    deviceType: number
  ): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(payload.email);

    // Use the same error for an unknown email and a wrong password.
    if (
      !user ||
      !user.passwordHash ||
      !(await PasswordUtil.compare(payload.password, user.passwordHash))
    ) {
      throw new AppError(
        "Invalid email or password",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "This account is inactive",
        403,
        ErrorCode.UNAUTHORIZED
      );
    }

    const userId = String(
      (user as typeof user & { _id?: unknown })._id ?? ""
    );

    // A new login on the same device replaces its previous session.
    const existingSessions =
      await this.sessionRepository.findActiveSessionsByUserAndDevice(
        userId,
        deviceId
      );

    for (const existingSession of existingSessions) {
      const existingSessionId = String(
        (existingSession as typeof existingSession & { _id?: unknown })._id ?? ""
      );

      if (existingSessionId) {
        await this.redisSessionManager.deleteSession(existingSessionId);
        await this.sessionRepository.revoke(existingSessionId);
      }
    }
    const refreshTokenId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.sessionRepository.create({
      userId: user._id as never,
      deviceId,
      deviceType,
      refreshTokenId,
      isRevoked: false,
      expiresAt,
    });

    const sessionId = String(
      (session as typeof session & { _id?: unknown })._id ?? ""
    );

    const accessToken = JwtUtil.generateAccessToken(userId, sessionId);
    const refreshToken = JwtUtil.generateRefreshToken(
      userId,
      sessionId,
      refreshTokenId
    );

    await this.redisSessionManager.storeSession(
      sessionId,
      refreshTokenId
    );

    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
      },
      tokens: {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: 900,
      },
    };
  }


  public async refreshTokens(
    refreshToken: string
  ): Promise<AuthResponse> {
    let payload;

    try {
      payload = JwtUtil.verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(
        "Invalid or expired refresh token",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const session = await this.sessionRepository.findById(payload.sid);

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

    const storedTokenId = await this.redisSessionManager.getSession(
      payload.sid
    );

    if (!storedTokenId) {
      throw new AppError(
        "Session is no longer active",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    if (
      storedTokenId !== payload.jti ||
      session.refreshTokenId !== payload.jti
    ) {
      await this.sessionRepository.revoke(payload.sid);
      await this.redisSessionManager.deleteSession(payload.sid);

      throw new AppError(
        "Refresh token reuse detected",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      await this.sessionRepository.revoke(payload.sid);
      await this.redisSessionManager.deleteSession(payload.sid);

      throw new AppError(
        "User account is unavailable",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    const newTokenId = randomUUID();
    const currentTokenId = payload.jti;

    await this.rotateRefreshToken(
      payload.sid,
      currentTokenId,
      newTokenId
    );

    return {
      user: {
        id: payload.sub,
        name: user.name,
        email: user.email,
      },
      tokens: {
        accessToken: JwtUtil.generateAccessToken(payload.sub, payload.sid),
        refreshToken: JwtUtil.generateRefreshToken(
          payload.sub,
          payload.sid,
          newTokenId
        ),
        tokenType: "Bearer",
        expiresIn: 900,
      },
    };
  }


  /**
   * Rotate Redis and Mongo together. Redis swaps first with a compare-and-set.
   * If Mongo does not commit that same id, Redis is restored to the previous id.
   * When the restore cannot be confirmed, both copies are revoked.
   */
  private async rotateRefreshToken(
    sessionId: string,
    currentTokenId: string,
    newTokenId: string
  ): Promise<void> {
    const rotatedInRedis = await this.redisSessionManager.rotateRefreshToken(
      sessionId,
      currentTokenId,
      newTokenId
    );

    if (!rotatedInRedis) {
      throw new AppError(
        "Refresh token reuse detected",
        401,
        ErrorCode.UNAUTHORIZED
      );
    }

    try {
      const updatedSession = await this.sessionRepository.rotateRefreshToken(
        sessionId,
        currentTokenId,
        newTokenId
      );

      if (!updatedSession) {
        await this.revertRefreshTokenRotation(
          sessionId,
          newTokenId,
          currentTokenId
        );

        throw new AppError(
          "Unable to update session",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      await this.revertRefreshTokenRotation(
        sessionId,
        newTokenId,
        currentTokenId
      );
      throw error;
    }
  }

  private async revertRefreshTokenRotation(
    sessionId: string,
    appliedTokenId: string,
    previousTokenId: string
  ): Promise<void> {
    try {
      const session = await this.sessionRepository.findById(sessionId);

      if (
        session &&
        !session.isRevoked &&
        session.refreshTokenId === appliedTokenId
      ) {
        return;
      }

      if (
        session &&
        !session.isRevoked &&
        session.refreshTokenId === previousTokenId
      ) {
        const restored = await this.redisSessionManager.rotateRefreshToken(
          sessionId,
          appliedTokenId,
          previousTokenId
        );

        if (restored) {
          return;
        }
      }
    } catch {
      // Invalidate both copies below when the session state cannot be read.
    }

    await this.sessionRepository.revoke(sessionId);
    await this.redisSessionManager.deleteSession(sessionId);
  }

  public async logout(
    userId: string,
    sessionId: string
  ): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);

    // Make logout idempotent: an already-removed session needs no action.
    if (!session) {
      await this.redisSessionManager.deleteSession(sessionId);
      return;
    }

    // Prevent one user from revoking another user's session.
    if (String(session.userId) !== userId) {
      throw new AppError(
        "Session does not belong to this user",
        403,
        ErrorCode.UNAUTHORIZED
      );
    }

    await this.sessionRepository.revoke(sessionId);
    await this.redisSessionManager.deleteSession(sessionId);
  }


}
