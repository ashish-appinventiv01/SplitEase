import { Router } from "express";
import { UserController } from "./user.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { UserValidation } from "./dto/user-validation";

export class UserRoutes {
  public readonly router: Router;
  private readonly controller = new UserController();

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(AccessTokenMiddleware.handle);

    this.router.get("/profile", this.controller.getProfile);

    this.router.patch(
      "/profile",
      ValidateMiddleware.validateBody(UserValidation.updateUser),
      this.controller.updateProfile
    );

    this.router.delete(
      "/account",
      this.controller.deactivateAccount
    );
  }
}