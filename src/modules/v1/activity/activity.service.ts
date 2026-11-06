import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ActivityType, ErrorCode } from "../../../enum/enum";
import { ActivityRepository } from "../../../repositories/activity.repository";
import { GroupRepository } from "../../../repositories/group.repository";
import { CommonUtils } from "../../../common/utils";

export class ActivityService {
  private readonly activityRepository = new ActivityRepository();
  private readonly groupRepository = new GroupRepository();

  public async record(params: {
    groupId: string;
    actorId: string;
    type: ActivityType;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.activityRepository.create(params);
  }

  public async listGroupActivities(
    groupId: string,
    userId: string,
    page = 1,
    limit = 20
  ) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const isMember = await this.groupRepository.isActiveMember(groupId, userId);
    if (!isMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.NOT_GROUP_MEMBER
      );
    }

    const pagination = CommonUtils.getPagination({ page, limit });
    const { items, total } = await this.activityRepository.findByGroup(
      groupId,
      pagination.page,
      pagination.limit
    );

    return {
      items: items.map((activity) => {
        const actor = activity.actorId as unknown as {
          _id?: unknown;
          name?: string;
          email?: string;
        };

        return {
          id: String((activity as typeof activity & { _id?: unknown })._id ?? ""),
          groupId: String(activity.groupId),
          type: activity.type,
          message: activity.message,
          metadata: activity.metadata ?? {},
          actor: {
            userId: String(actor?._id ?? activity.actorId),
            name: actor?.name,
            email: actor?.email,
          },
          createdAt: activity.createdAt,
        };
      }),
      ...CommonUtils.getPaginationMetadata(
        pagination.page,
        pagination.limit,
        total
      ),
    };
  }
}
