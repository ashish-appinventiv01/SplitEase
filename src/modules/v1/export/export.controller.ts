import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { ExportService } from "./export.service";

export class ExportController {
  private readonly exportService = new ExportService();

  public createExport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.exportService.createExportJob(
        req.params.groupId as string,
        req.user!.userId,
        req.body.type
      );

      ApiResponse.created(res, "Export job queued successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public getExport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.exportService.getExportJob(
        req.params.exportId as string,
        req.user!.userId
      );

      ApiResponse.success(res, "Export job fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public downloadExport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.exportService.getDownloadPath(
        req.params.exportId as string,
        req.user!.userId
      );

      res.download(result.filePath, result.fileName);
    } catch (error) {
      next(error);
    }
  };
}
