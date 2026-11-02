
import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../../common/responses";

export class AuthController {
  private readonly authService = new AuthService();

  public signup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deviceId = String(req.headers.device_id);
      const deviceType = Number(req.headers.device_type);
  
      const result = await this.authService.signup(
        req.body,
        deviceId,
        deviceType
      );
  
      ApiResponse.created(
        res,
        "Account created successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deviceId = String(req.headers.device_id);
      const deviceType = Number(req.headers.device_type);

      const result = await this.authService.login(
        req.body,
        deviceId,
        deviceType
      );

      res.status(200).json(
        ApiResponse.success(res, "Login successful", result)
      );
    } catch (error) {
      next(error);
    }
  };

  public refreshTokens = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.headers["x-refresh-token"];

      if (typeof refreshToken !== "string" || !refreshToken.trim()) {
        res.status(401).json({
          statusCode: 401,
          message: "Refresh token is required",
        });
        return;
      }

      const result = await this.authService.refreshTokens(refreshToken);

      res.status(200).json(
        ApiResponse.success(res, "Tokens refreshed successfully", result)
      );
    } catch (error) {
      next(error);
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedUser = req.user;

      if (!authenticatedUser) {
        res.status(401).json({
          statusCode: 401,
          message: "Authentication required",
        });
        return;
      }

      await this.authService.logout(
        authenticatedUser.userId,
        authenticatedUser.sessionId
      );

      res.status(200).json(
        ApiResponse.success(res, "Logout successful", null)
      );
    } catch (error) {
      next(error);
    }
  };
}
