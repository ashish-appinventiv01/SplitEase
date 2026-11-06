import mongoose from "mongoose";
import { ActivityModel, type IActivity } from "../schemas/activity.schema";
import type { ActivityType } from "../enum/enum";

export class ActivityRepository {
  public async create(data: {
    groupId: string;
    actorId: string;
    type: ActivityType;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<IActivity> {
    const activity = await ActivityModel.create({
      groupId: new mongoose.Types.ObjectId(data.groupId),
      actorId: new mongoose.Types.ObjectId(data.actorId),
      type: data.type,
      message: data.message,
      metadata: data.metadata,
    });

    return activity.toObject() as IActivity;
  }

  public async findByGroup(
    groupId: string,
    page: number,
    limit: number
  ): Promise<{ items: IActivity[]; total: number }> {
    const filter = {
      groupId: new mongoose.Types.ObjectId(groupId),
    };

    const [items, total] = await Promise.all([
      ActivityModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "actorId", select: "name email" })
        .lean<IActivity[]>()
        .exec(),
      ActivityModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }
}
