import mongoose, { type Model, type Types } from "mongoose";
import { SplitType } from "../enum/enum";

export interface IExpenseSplit {
  userId: Types.ObjectId;
  amountPaise: number;
  percent?: number;
}

export interface IExpense {
  groupId: Types.ObjectId;
  createdBy: Types.ObjectId;
  paidBy: Types.ObjectId;
  description: string;
  amountPaise: number;
  splitType: SplitType;
  splits: IExpenseSplit[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpenseSchema {
  public static readonly schema = new mongoose.Schema<IExpense>(
    {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 500,
      },
      amountPaise: {
        type: Number,
        required: true,
        min: 1,
        validate: {
          validator: Number.isInteger,
          message: "amountPaise must be an integer",
        },
      },
      splitType: {
        type: String,
        enum: Object.values(SplitType),
        required: true,
      },
      splits: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          amountPaise: {
            type: Number,
            required: true,
            min: 0,
            validate: {
              validator: Number.isInteger,
              message: "split amountPaise must be an integer",
            },
          },
          percent: {
            type: Number,
            min: 0,
            max: 100,
          },
        },
      ],
      isDeleted: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

  static {
    this.schema.index({ groupId: 1, isDeleted: 1, createdAt: -1 });
  }
}

export const ExpenseModel: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense>) ||
  mongoose.model<IExpense>("Expense", ExpenseSchema.schema);
