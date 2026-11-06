import mongoose, { type Model, type Types } from "mongoose";
import { ActivityType } from "../enum/enum";

export interface IActivity {
  groupId: Types.ObjectId;
  actorId: Types.ObjectId;
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ActivitySchema {
  public static readonly schema = new mongoose.Schema<IActivity>(
    {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true,
      },
      actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        enum: Object.values(ActivityType),
        required: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
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

export const ActivityModel: Model<IActivity> =
  (mongoose.models.Activity as Model<IActivity>) ||
  mongoose.model<IActivity>("Activity", ActivitySchema.schema);
