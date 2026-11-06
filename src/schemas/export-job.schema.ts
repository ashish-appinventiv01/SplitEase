import mongoose, { type Model, type Types } from "mongoose";
import { ExportStatus, ExportType } from "../enum/enum";

export interface IExportJob {
  groupId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  type: ExportType;
  status: ExportStatus;
  filePath?: string;
  fileName?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExportJobSchema {
  public static readonly schema = new mongoose.Schema<IExportJob>(
    {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true,
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        enum: Object.values(ExportType),
        required: true,
      },
      status: {
        type: String,
        enum: Object.values(ExportStatus),
        default: ExportStatus.QUEUED,
      },
      filePath: {
        type: String,
      },
      fileName: {
        type: String,
      },
      errorMessage: {
        type: String,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

  static {
    this.schema.index({ requestedBy: 1, createdAt: -1 });
  }
}

export const ExportJobModel: Model<IExportJob> =
  (mongoose.models.ExportJob as Model<IExportJob>) ||
  mongoose.model<IExportJob>("ExportJob", ExportJobSchema.schema);
