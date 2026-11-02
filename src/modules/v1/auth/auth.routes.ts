
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { AuthValidation } from "./dto/auth-validation";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";

export class AuthRoutes {
  public readonly router: Router;
  private readonly controller = new AuthController();

  constructor() {
    this.router = Router();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.post(
      "/signup",
      ValidateMiddleware.validate(AuthValidation.signup, "body"),
      this.controller.signup
    );

    this.router.post(
      "/login",
      ValidateMiddleware.validate(AuthValidation.login, "body"),
      this.controller.login
    );

    this.router.post(
      "/refresh",
      this.controller.refreshTokens
    );

    this.router.post(
      "/logout",
      AccessTokenMiddleware.handle,
      this.controller.logout
    );
  }
}
