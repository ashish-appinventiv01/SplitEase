import { Router } from "express";
import { ExpenseController } from "./expense.controller";
import { AccessTokenMiddleware } from "../../../middlewares/accessToken.middleware";
import { ValidateMiddleware } from "../../../middlewares/validate.middleware";
import { GroupMembershipMiddleware } from "../../../middlewares/groupMembership.middleware";
import { ExpenseValidation } from "./dto/expense-validation";

export class ExpenseRoutes {
  public readonly router: Router;
  private readonly controller = new ExpenseController();

  constructor() {
    this.router = Router({ mergeParams: true });
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.use(AccessTokenMiddleware.handle);

    this.router.post(
      "/groups/:groupId/expenses",
      ValidateMiddleware.validateParams(ExpenseValidation.groupIdParam),
      ValidateMiddleware.validateBody(ExpenseValidation.createExpense),
      GroupMembershipMiddleware.requireMember,
      this.controller.createExpense
    );

    this.router.get(
      "/groups/:groupId/expenses",
      ValidateMiddleware.validateParams(ExpenseValidation.groupIdParam),
      ValidateMiddleware.validateQuery(ExpenseValidation.paginationQuery),
      GroupMembershipMiddleware.requireMember,
      this.controller.listGroupExpenses
    );

    this.router.get(
      "/expenses/:expenseId",
      ValidateMiddleware.validateParams(ExpenseValidation.expenseIdParam),
      this.controller.getExpenseDetails
    );

    this.router.patch(
      "/expenses/:expenseId",
      ValidateMiddleware.validateParams(ExpenseValidation.expenseIdParam),
      ValidateMiddleware.validateBody(ExpenseValidation.updateExpense),
      this.controller.updateExpense
    );

    this.router.delete(
      "/expenses/:expenseId",
      ValidateMiddleware.validateParams(ExpenseValidation.expenseIdParam),
      this.controller.deleteExpense
    );
  }
}
