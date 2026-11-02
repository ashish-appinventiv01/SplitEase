import mongoose from "mongoose";
import { GroupModel, type IGroup } from "../schemas/group.schema";

export class GroupRepository {
  public async create(
    groupData: Partial<IGroup>
  ): Promise<IGroup> {
    const group = await GroupModel.create(groupData);
    return group.toObject() as IGroup;
  }

  public async findById(groupId: string): Promise<IGroup | null> {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return null;
    }

    return GroupModel.findById(groupId)
      .lean<IGroup>()
      .exec();
  }

  public async findByMember(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ items: IGroup[]; total: number }> {
    const filter = {
      "members.userId": new mongoose.Types.ObjectId(userId),
      isActive: true,
    };
  
    const [items, total] = await Promise.all([
      GroupModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<IGroup[]>()
        .exec(),
  
      GroupModel.countDocuments(filter).exec(),
    ]);
  
    return { items, total };
  }
  public async addMember(
    groupId: string,
    userId: string
  ): Promise<IGroup | null> {
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return null;
    }

    return GroupModel.findOneAndUpdate(
      {
        _id: groupId,
        isActive: true,
        "members.userId": {
          $ne: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $push: {
          members: {
            userId: new mongoose.Types.ObjectId(userId),
            joinedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .lean<IGroup>()
      .exec();
  }
  
}