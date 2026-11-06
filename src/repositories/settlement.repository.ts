import mongoose from "mongoose";
import {
  SettlementModel,
  type ISettlement,
} from "../schemas/settlement.schema";

export class SettlementRepository {
  public async create(data: Partial<ISettlement>): Promise<ISettlement> {
    const settlement = await SettlementModel.create(data);
    return settlement.toObject() as ISettlement;
  }

  public async findById(settlementId: string): Promise<ISettlement | null> {
    if (!mongoose.Types.ObjectId.isValid(settlementId)) {
      return null;
    }

    return SettlementModel.findById(settlementId).lean<ISettlement>().exec();
  }

  public async findByGroup(
    groupId: string,
    page: number,
    limit: number
  ): Promise<{ items: ISettlement[]; total: number }> {
    const filter = {
      groupId: new mongoose.Types.ObjectId(groupId),
    };

    const [items, total] = await Promise.all([
      SettlementModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<ISettlement[]>()
        .exec(),
      SettlementModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  public async findAllByGroup(groupId: string): Promise<ISettlement[]> {
    return SettlementModel.find({
      groupId: new mongoose.Types.ObjectId(groupId),
    })
      .lean<ISettlement[]>()
      .exec();
  }
}
