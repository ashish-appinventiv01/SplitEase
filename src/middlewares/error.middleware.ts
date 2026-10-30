import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";
import { ErrorMessage } from "../common/constant";

export class ErrorMiddleware {
    public handle(
        error: Error,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): void {
        const isAppError = error instanceof AppError;

        const statusCode = isAppError ? error.statusCode : 500;

        const code = isAppError
            ? error.code
            : ErrorCode.INTERNAL_SERVER_ERROR;

        const message = ErrorMessage[code];

        if (statusCode === 500) {
            console.error(error);
        }

        res.status(statusCode).json({
            statusCode,
            code,
            message,
        });
    }
}