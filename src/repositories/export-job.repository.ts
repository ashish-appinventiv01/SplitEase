import mongoose from "mongoose";
import {
  ExportJobModel,
  type IExportJob,
} from "../schemas/export-job.schema";
import type { ExportStatus } from "../enum/enum";

export class ExportJobRepository {
  public async create(data: Partial<IExportJob>): Promise<IExportJob> {
    const job = await ExportJobModel.create(data);
    return job.toObject() as IExportJob;
  }

  public async findById(jobId: string): Promise<IExportJob | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return null;
    }

    return ExportJobModel.findById(jobId).lean<IExportJob>().exec();
  }

  public async updateStatus(
    jobId: string,
    status: ExportStatus,
    extra: Partial<Pick<IExportJob, "filePath" | "fileName" | "errorMessage">> = {}
  ): Promise<IExportJob | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return null;
    }

    return ExportJobModel.findByIdAndUpdate(
      jobId,
      { $set: { status, ...extra } },
      { new: true }
    )
      .lean<IExportJob>()
      .exec();
  }
}
