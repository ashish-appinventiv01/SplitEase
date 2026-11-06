import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";
import { GroupRepository } from "../repositories/group.repository";

export class GroupMembershipMiddleware {
  private static readonly groupRepository = new GroupRepository();

  public static requireMember = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const groupId = String(req.params.groupId ?? "");
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError(
          "Access token is required",
          401,
          ErrorCode.UNAUTHORIZED
        );
      }

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
      }

      const isMember = await this.groupRepository.isActiveMember(
        groupId,
        userId
      );

      if (!isMember) {
        throw new AppError(
          "You are not a member of this group",
          403,
          ErrorCode.NOT_GROUP_MEMBER
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
