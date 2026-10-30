import { APP_CONSTANTS } from "./constant";
import type { PaginationMetadata, PaginationOptions, PaginationResult } from "../interfaces/pagination.interface";

function requireInt(value: number, min: number, message: string): void {
    if (!Number.isSafeInteger(value) || value < min) throw new Error(message);
}

export class CommonUtils {
    public static rupeesToPaise(amount: number): number {
        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error("Amount must be a finite, non-negative number");
        }

        const paise = Math.round(amount * 100);
        if (!Number.isSafeInteger(paise)) throw new Error("Amount exceeds the supported range");
        return paise;
    }

    public static paiseToRupees(amount: number): number {
        requireInt(amount, 0, "Amount must be a non-negative integer in paise");
        return amount / 100;
    }

    public static splitEqually(totalPaise: number, memberCount: number): number[] {
        requireInt(totalPaise, 0, "Total amount must be a non-negative integer in paise");
        requireInt(memberCount, 1, "Member count must be a positive integer");

        const baseShare = Math.floor(totalPaise / memberCount);
        const remainder = totalPaise % memberCount;
        return Array.from({ length: memberCount }, (_, index) => baseShare + (index < remainder ? 1 : 0));
    }

    public static getPagination(options: Partial<PaginationOptions> = {}): PaginationResult {
        const page = options.page ?? APP_CONSTANTS.PAGINATION.DEFAULT_PAGE;
        const requestedLimit = options.limit ?? APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

        requireInt(page, 1, "Page must be a positive integer");
        requireInt(requestedLimit, 1, "Limit must be a positive integer");

        const limit = Math.min(requestedLimit, APP_CONSTANTS.PAGINATION.MAX_LIMIT);
        const order = options.order ?? "desc";
        if (order !== "asc" && order !== "desc") throw new Error("Order must be asc or desc");

        return { page, limit, skip: (page - 1) * limit, sortBy: options.sortBy, order };
    }

    public static getPaginationMetadata(page: number, limit: number, total: number): PaginationMetadata {
        requireInt(page, 1, "Invalid pagination metadata");
        requireInt(limit, 1, "Invalid pagination metadata");
        requireInt(total, 0, "Invalid pagination metadata");

        return { page, limit, total, totalPages: Math.ceil(total / limit) };
    }
}
