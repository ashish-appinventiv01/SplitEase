import { Router } from "express";
import { GroupController } from "./group.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { GroupMembershipMiddleware } from "../../../middlewares/groupMembership.middleware";
import { GroupValidation } from "./dto/group-validation";

export class GroupRoutes {
  public readonly router: Router;
  private readonly controller = new GroupController();

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(AccessTokenMiddleware.handle);

    this.router.post(
      "/",
      ValidateMiddleware.validateBody(GroupValidation.createGroup),
      this.controller.createGroup
    );

    this.router.get(
      "/",
      ValidateMiddleware.validateQuery(GroupValidation.paginationQuery),
      this.controller.getMyGroups
    );

    this.router.get(
      "/:groupId",
      ValidateMiddleware.validateParams(GroupValidation.groupIdParam),
      this.controller.getGroupDetails
    );

    this.router.patch(
      "/:groupId",
      ValidateMiddleware.validateParams(GroupValidation.groupIdParam),
      ValidateMiddleware.validateBody(GroupValidation.updateGroup),
      this.controller.updateGroup
    );

    this.router.delete(
      "/:groupId",
      ValidateMiddleware.validateParams(GroupValidation.groupIdParam),
      this.controller.deleteGroup
    );

    this.router.post(
      "/:groupId/members",
      ValidateMiddleware.validateParams(GroupValidation.groupIdParam),
      ValidateMiddleware.validateBody(GroupValidation.addMember),
      this.controller.addMember
    );

    this.router.delete(
      "/:groupId/members/:userId",
      ValidateMiddleware.validateParams(GroupValidation.removeMemberParam),
      this.controller.removeMember
    );

    this.router.get(
      "/:groupId/activities",
      ValidateMiddleware.validateParams(GroupValidation.groupIdParam),
      ValidateMiddleware.validateQuery(GroupValidation.paginationQuery),
      GroupMembershipMiddleware.requireMember,
      this.controller.listActivities
    );
  }
}
