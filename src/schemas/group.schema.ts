import mongoose, { type Model, type Types } from "mongoose";

export interface IGroupMember {
  userId: Types.ObjectId;
  joinedAt: Date;
}

export interface IGroup {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  members: IGroupMember[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GroupSchema {
  public static readonly schema = new mongoose.Schema<IGroup>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      members: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          joinedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

  static {
    this.schema.index({ createdBy: 1, createdAt: -1 });
    this.schema.index({ "members.userId": 1, isActive: 1 });
  }
}

export const GroupModel: Model<IGroup> =
  (mongoose.models.Group as Model<IGroup>) ||
  mongoose.model<IGroup>("Group", GroupSchema.schema);