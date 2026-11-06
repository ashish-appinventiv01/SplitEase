import mongoose, { type Model, type Types } from "mongoose";

export interface ISettlement {
  groupId: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  amountPaise: number;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class SettlementSchema {
  public static readonly schema = new mongoose.Schema<ISettlement>(
    {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true,
      },
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
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
      note: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

  static {
    this.schema.index({ groupId: 1, createdAt: -1 });
  }
}

export const SettlementModel: Model<ISettlement> =
  (mongoose.models.Settlement as Model<ISettlement>) ||
  mongoose.model<ISettlement>("Settlement", SettlementSchema.schema);
