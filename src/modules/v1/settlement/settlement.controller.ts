import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { SettlementService } from "./settlement.service";

export class SettlementController {
  private readonly settlementService = new SettlementService();

  public createSettlement = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.settlementService.createSettlement(
        req.params.groupId as string,
        req.user!.userId,
        req.body
      );

      ApiResponse.created(res, "Settlement created successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public listSettlements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.validatedQuery?.page ?? req.query.page) || 1;
      const limit = Number(req.validatedQuery?.limit ?? req.query.limit) || 20;

      const result = await this.settlementService.listSettlements(
        req.params.groupId as string,
        req.user!.userId,
        page,
        limit
      );

      ApiResponse.success(res, "Settlements fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public getSettlementDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.settlementService.getSettlementDetails(
        req.params.settlementId as string,
        req.user!.userId
      );

      ApiResponse.success(
        res,
        "Settlement details fetched successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  };
}
