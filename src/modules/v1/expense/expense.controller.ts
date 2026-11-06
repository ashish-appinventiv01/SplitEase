import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../../common/responses";
import { ExpenseService } from "./expense.service";

export class ExpenseController {
  private readonly expenseService = new ExpenseService();

  public createExpense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.expenseService.createExpense(
        req.params.groupId as string,
        req.user!.userId,
        req.body
      );

      ApiResponse.created(res, "Expense created successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public listGroupExpenses = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = Number(req.validatedQuery?.page ?? req.query.page) || 1;
      const limit = Number(req.validatedQuery?.limit ?? req.query.limit) || 20;

      const result = await this.expenseService.listGroupExpenses(
        req.params.groupId as string,
        req.user!.userId,
        page,
        limit
      );

      ApiResponse.success(res, "Expenses fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public getExpenseDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.expenseService.getExpenseDetails(
        req.params.expenseId as string,
        req.user!.userId
      );

      ApiResponse.success(res, "Expense details fetched successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public updateExpense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.expenseService.updateExpense(
        req.params.expenseId as string,
        req.user!.userId,
        req.body
      );

      ApiResponse.success(res, "Expense updated successfully", result);
    } catch (error) {
      next(error);
    }
  };

  public deleteExpense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.expenseService.deleteExpense(
        req.params.expenseId as string,
        req.user!.userId
      );

      ApiResponse.success(res, "Expense deleted successfully", result);
    } catch (error) {
      next(error);
    }
  };
}
