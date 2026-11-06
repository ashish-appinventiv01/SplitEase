import { Router } from "express";
import { ExportController } from "./export.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { GroupMembershipMiddleware } from "../../../middlewares/groupMembership.middleware";
import {
  createExportSchema,
  exportIdParamSchema,
} from "./dto/create-export.dto";
import { groupIdParamSchema } from "../group/dto/group-id.dto";

export class ExportRoutes {
  public readonly router: Router;
  private readonly controller = new ExportController();

  constructor() {
    this.router = Router({ mergeParams: true });
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(AccessTokenMiddleware.handle);

    this.router.post(
      "/groups/:groupId/exports",
      ValidateMiddleware.validateParams(groupIdParamSchema),
      ValidateMiddleware.validateBody(createExportSchema),
      GroupMembershipMiddleware.requireMember,
      this.controller.createExport
    );

    this.router.get(
      "/exports/:exportId",
      ValidateMiddleware.validateParams(exportIdParamSchema),
      this.controller.getExport
    );

    this.router.get(
      "/exports/:exportId/download",
      ValidateMiddleware.validateParams(exportIdParamSchema),
      this.controller.downloadExport
    );
  }
}
