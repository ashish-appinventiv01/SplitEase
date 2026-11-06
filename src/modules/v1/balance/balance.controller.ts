import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { BalanceService } from "./balance.service";

export class BalanceController {
  private readonly balanceService = new BalanceService();

  public getGroupBalances = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.balanceService.getGroupBalances(
        req.params.groupId as string,
        req.user!.userId
      );

      ApiResponse.success(res, "Group balances fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public getMyBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.balanceService.getMyBalance(
        req.params.groupId as string,
        req.user!.userId
      );

      ApiResponse.success(res, "Balance fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };
}
