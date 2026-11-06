import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { ActivityService } from "./activity.service";

export class ActivityController {
  private readonly activityService = new ActivityService();

  public listGroupActivities = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.validatedQuery?.page ?? req.query.page) || 1;
      const limit = Number(req.validatedQuery?.limit ?? req.query.limit) || 20;

      const result = await this.activityService.listGroupActivities(
        req.params.groupId as string,
        req.user!.userId,
        page,
        limit
      );

      ApiResponse.success(res, "Activities fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };
}
