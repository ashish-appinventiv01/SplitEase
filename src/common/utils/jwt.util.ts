import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { configuration } from "../../config/configuration";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  sid: string;
  jti: string;
}

export class JwtUtil {
  public static generateAccessToken(
    userId: string,
    sessionId: string
  ): string {
    return jwt.sign(
      {
        sub: userId,
        sid: sessionId,
      },
      configuration.JWT_ACCESS_SECRET,
      {
        expiresIn: "1m",
      }
    );
  }

  public static generateRefreshToken(
    userId: string,
    sessionId: string,
    tokenId: string = randomUUID()
  ): string {
    return jwt.sign(
      {
        sub: userId,
        sid: sessionId,
        jti: tokenId,
      },
      configuration.JWT_REFRESH_SECRET,
      {
        expiresIn: "2m",
      }
    );
  }

  public static verifyAccessToken(
    token: string
  ): AccessTokenPayload {
    const payload = jwt.verify(
      token,
      configuration.JWT_ACCESS_SECRET
    );

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string"
    ) {
      throw new Error("Invalid access token payload");
    }

    return payload as AccessTokenPayload;
  }

  public static verifyRefreshToken(
    token: string
  ): RefreshTokenPayload {
    const payload = jwt.verify(
      token,
      configuration.JWT_REFRESH_SECRET
    );

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.jti !== "string"
    ) {
      throw new Error("Invalid refresh token payload");
    }

    return payload as RefreshTokenPayload;
  }
}