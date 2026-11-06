import mongoose from "mongoose";
import { ExpenseModel, type IExpense } from "../schemas/expense.schema";

export class ExpenseRepository {
  public async create(data: Partial<IExpense>): Promise<IExpense> {
    const expense = await ExpenseModel.create(data);
    return expense.toObject() as IExpense;
  }

  public async findById(expenseId: string): Promise<IExpense | null> {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return null;
    }

    return ExpenseModel.findOne({ _id: expenseId, isDeleted: false })
      .lean<IExpense>()
      .exec();
  }

  public async findByGroup(
    groupId: string,
    page: number,
    limit: number
  ): Promise<{ items: IExpense[]; total: number }> {
    const filter = {
      groupId: new mongoose.Types.ObjectId(groupId),
      isDeleted: false,
    };

    const [items, total] = await Promise.all([
      ExpenseModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<IExpense[]>()
        .exec(),
      ExpenseModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  public async findActiveByGroup(groupId: string): Promise<IExpense[]> {
    return ExpenseModel.find({
      groupId: new mongoose.Types.ObjectId(groupId),
      isDeleted: false,
    })
      .lean<IExpense[]>()
      .exec();
  }

  public async updateById(
    expenseId: string,
    updateData: Partial<IExpense>
  ): Promise<IExpense | null> {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return null;
    }

    return ExpenseModel.findOneAndUpdate(
      { _id: expenseId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .lean<IExpense>()
      .exec();
  }

  public async softDelete(expenseId: string): Promise<IExpense | null> {
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return null;
    }

    return ExpenseModel.findOneAndUpdate(
      { _id: expenseId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    )
      .lean<IExpense>()
      .exec();
  }
}
