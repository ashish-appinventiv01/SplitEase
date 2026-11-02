import { Router } from "express";
import { GroupController } from "./group.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
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
    this.controller.getMyGroups
  );
}
}