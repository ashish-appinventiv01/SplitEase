import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ErrorCode, ExportStatus, ExportType } from "../../../enum/enum";
import { CommonUtils } from "../../../common/utils";
import { ExportJobRepository } from "../../../repositories/export-job.repository";
import { GroupRepository } from "../../../repositories/group.repository";
import { ExpenseRepository } from "../../../repositories/expense.repository";
import { SettlementRepository } from "../../../repositories/settlement.repository";
import { Logger } from "../../../logger/logger";

export class ExportService {
  private readonly exportJobRepository = new ExportJobRepository();
  private readonly groupRepository = new GroupRepository();
  private readonly expenseRepository = new ExpenseRepository();
  private readonly settlementRepository = new SettlementRepository();
  private readonly exportDir = path.resolve(process.cwd(), "exports");

  public async createExportJob(
    groupId: string,
    requesterId: string,
    type: ExportType
  ) {
    await this.requireMembership(groupId, requesterId);

    const job = await this.exportJobRepository.create({
      groupId: new mongoose.Types.ObjectId(groupId),
      requestedBy: new mongoose.Types.ObjectId(requesterId),
      type,
      status: ExportStatus.QUEUED,
    });

    const jobId = String((job as typeof job & { _id?: unknown })._id ?? "");

    setImmediate(() => {
      void this.processExportJob(jobId);
    });

    return this.toResponse(job);
  }

  public async getExportJob(exportId: string, requesterId: string) {
    const job = await this.exportJobRepository.findById(exportId);

    if (!job) {
      throw new AppError("Export job not found", 404, ErrorCode.NOT_FOUND);
    }

    if (String(job.requestedBy) !== requesterId) {
      const isMember = await this.groupRepository.isActiveMember(
        String(job.groupId),
        requesterId
      );

      if (!isMember) {
        throw new AppError(
          "You are not allowed to view this export",
          403,
          ErrorCode.FORBIDDEN
        );
      }
    }

    return this.toResponse(job);
  }

  public async getDownloadPath(exportId: string, requesterId: string) {
    const job = await this.exportJobRepository.findById(exportId);

    if (!job) {
      throw new AppError("Export job not found", 404, ErrorCode.NOT_FOUND);
    }

    const isMember = await this.groupRepository.isActiveMember(
      String(job.groupId),
      requesterId
    );

    if (!isMember && String(job.requestedBy) !== requesterId) {
      throw new AppError(
        "You are not allowed to download this export",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (job.status !== ExportStatus.DONE || !job.filePath) {
      throw new AppError(
        "Export is not ready for download",
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    return {
      filePath: job.filePath,
      fileName: job.fileName ?? path.basename(job.filePath),
    };
  }

  private async processExportJob(jobId: string): Promise<void> {
    try {
      await this.exportJobRepository.updateStatus(
        jobId,
        ExportStatus.PROCESSING
      );

      const job = await this.exportJobRepository.findById(jobId);
      if (!job) return;

      await fs.mkdir(this.exportDir, { recursive: true });

      const fileName = `${job.type.toLowerCase()}-${jobId}.csv`;
      const filePath = path.join(this.exportDir, fileName);

      const csv =
        job.type === ExportType.EXPENSES
          ? await this.buildExpenseCsv(String(job.groupId))
          : await this.buildSettlementCsv(String(job.groupId));

      await fs.writeFile(filePath, csv, "utf8");

      await this.exportJobRepository.updateStatus(jobId, ExportStatus.DONE, {
        filePath,
        fileName,
        errorMessage: undefined,
      });
    } catch (error) {
      Logger.error("Export job failed", {
        jobId,
        error: error instanceof Error ? error.message : error,
      });

      await this.exportJobRepository.updateStatus(jobId, ExportStatus.FAILED, {
        errorMessage:
          error instanceof Error ? error.message : "Export processing failed",
      });
    }
  }

  private async buildExpenseCsv(groupId: string): Promise<string> {
    const expenses = await this.expenseRepository.findActiveByGroup(groupId);
    const lines = [
      "expenseId,description,amountPaise,amountRupees,paidBy,splitType,createdAt",
    ];

    for (const expense of expenses) {
      lines.push(
        [
          String((expense as typeof expense & { _id?: unknown })._id ?? ""),
          this.escapeCsv(expense.description),
          String(expense.amountPaise),
          String(CommonUtils.paiseToRupees(expense.amountPaise)),
          String(expense.paidBy),
          expense.splitType,
          expense.createdAt.toISOString(),
        ].join(",")
      );
    }

    return `${lines.join("\n")}\n`;
  }

  private async buildSettlementCsv(groupId: string): Promise<string> {
    const settlements =
      await this.settlementRepository.findAllByGroup(groupId);
    const lines = [
      "settlementId,fromUserId,toUserId,amountPaise,amountRupees,note,createdAt",
    ];

    for (const settlement of settlements) {
      lines.push(
        [
          String(
            (settlement as typeof settlement & { _id?: unknown })._id ?? ""
          ),
          String(settlement.fromUserId),
          String(settlement.toUserId),
          String(settlement.amountPaise),
          String(CommonUtils.paiseToRupees(settlement.amountPaise)),
          this.escapeCsv(settlement.note ?? ""),
          settlement.createdAt.toISOString(),
        ].join(",")
      );
    }

    return `${lines.join("\n")}\n`;
  }

  private escapeCsv(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private async requireMembership(groupId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const isMember = await this.groupRepository.isActiveMember(
      groupId,
      userId
    );

    if (!isMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.NOT_GROUP_MEMBER
      );
    }
  }

  private toResponse(job: {
    _id?: unknown;
    groupId: mongoose.Types.ObjectId;
    requestedBy: mongoose.Types.ObjectId;
    type: ExportType;
    status: ExportStatus;
    fileName?: string;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: String(job._id ?? ""),
      groupId: String(job.groupId),
      requestedBy: String(job.requestedBy),
      type: job.type,
      status: job.status,
      fileName: job.fileName,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
