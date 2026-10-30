export class commonUtils {
    public static ruppeeToPaise(amount: number): number {
        return amount * 100;
    }

    public static paiseToRuppee(amount: number): number {
        return amount / 100;
    }

    public static getPagination(
        page: number = 1,
        limit: number = 20
      ) {
        const currentPage = Math.max(1, Math.floor(page));
        const currentLimit = Math.min(
          100,
          Math.max(1, Math.floor(limit))
        );
    
        return {
          page: currentPage,
          limit: currentLimit,
          skip: (currentPage - 1) * currentLimit
        };
      }
}