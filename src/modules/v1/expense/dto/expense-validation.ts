import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
} from "./create-expense.dto";
import {
  groupIdParamSchema,
  paginationQuerySchema,
} from "../../group/dto/group-id.dto";

export class ExpenseValidation {
  public static readonly createExpense = createExpenseSchema;
  public static readonly updateExpense = updateExpenseSchema;
  public static readonly expenseIdParam = expenseIdParamSchema;
  public static readonly groupIdParam = groupIdParamSchema;
  public static readonly paginationQuery = paginationQuerySchema;
}
