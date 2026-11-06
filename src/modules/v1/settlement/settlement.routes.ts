import { Router } from "express";
import { SettlementController } from "./settlement.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { GroupMembershipMiddleware } from "../../../middlewares/groupMembership.middleware";
import {
  createSettlementSchema,
  settlementIdParamSchema,
} from "./dto/create-settlement.dto";
import {
  groupIdParamSchema,
  paginationQuerySchema,
} from "../group/dto/group-id.dto";

export class SettlementRoutes {
  public readonly router: Router;
  private readonly controller = new SettlementController();

  constructor() {
    this.router = Router({ mergeParams: true });
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(AccessTokenMiddleware.handle);

    this.router.post(
      "/groups/:groupId/settlements",
      ValidateMiddleware.validateParams(groupIdParamSchema),
      ValidateMiddleware.validateBody(createSettlementSchema),
      GroupMembershipMiddleware.requireMember,
      this.controller.createSettlement
    );

    this.router.get(
      "/groups/:groupId/settlements",
      ValidateMiddleware.validateParams(groupIdParamSchema),
      ValidateMiddleware.validateQuery(paginationQuerySchema),
      GroupMembershipMiddleware.requireMember,
      this.controller.listSettlements
    );

    this.router.get(
      "/settlements/:settlementId",
      ValidateMiddleware.validateParams(settlementIdParamSchema),
      this.controller.getSettlementDetails
    );
  }
}
