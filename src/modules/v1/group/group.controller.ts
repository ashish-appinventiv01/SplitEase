import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { GroupService } from "./group.service";

export class GroupController {
  private readonly groupService = new GroupService();

  public createGroup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.groupService.createGroup(
        req.user!.userId,
        req.body
      );

      ApiResponse.created(res, "Group created successfully", result);
    } catch (error) {
      next(error);
    }
  };
  public getMyGroups = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
  
      const result = await this.groupService.getMyGroups(
        req.user!.userId,
        page,
        limit
      );
  
      ApiResponse.success(res, "Groups fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public getGroupDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.groupService.getGroupDetails(
        req.params.groupId as string,
        req.user!.userId
      );
  
      ApiResponse.success(
        res,
        "Group details fetched successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  };

  public addMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.groupService.addMember(
        req.params.groupId as string,
        req.user!.userId,
        req.body.userId
      );
  
      ApiResponse.success(
        res,
        "Member added successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  };
}