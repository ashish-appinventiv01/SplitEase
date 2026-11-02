import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { UserService } from "./user.service";

export class UserController {
  private readonly userService = new UserService();

  public getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.userService.getProfile(
        req.user!.userId
      );

      ApiResponse.success(res, "Profile fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.userService.updateProfile(
        req.user!.userId,
        req.body
      );

      ApiResponse.success(res, "Profile updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public deactivateAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.userService.deactivateAccount(req.user!.userId);

      ApiResponse.success(res, "Account deactivated successfully", null);
    } catch (error) {
      next(error);
    }
  };
}