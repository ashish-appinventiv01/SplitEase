import { Router } from "express";
import { BalanceController } from "./balance.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { GroupMembershipMiddleware } from "../../../middlewares/groupMembership.middleware";
import { groupIdParamSchema } from "../group/dto/group-id.dto";

export class BalanceRoutes {
  public readonly router: Router;
  private readonly controller = new BalanceController();

  constructor() {
    this.router = Router({ mergeParams: true });
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(AccessTokenMiddleware.handle);

    this.router.get(
      "/groups/:groupId/balances",
      ValidateMiddleware.validateParams(groupIdParamSchema),
      GroupMembershipMiddleware.requireMember,
      this.controller.getGroupBalances
    );

    this.router.get(
      "/groups/:groupId/balances/me",
      ValidateMiddleware.validateParams(groupIdParamSchema),
      GroupMembershipMiddleware.requireMember,
      this.controller.getMyBalance
    );
  }
}
