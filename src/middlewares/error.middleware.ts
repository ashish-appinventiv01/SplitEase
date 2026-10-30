import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";
import { ErrorMessage } from "../common/constant";
import { Logger } from "../logger/logger";

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

        const message = isAppError ? error.message : ErrorMessage[code];

        const logMessage = `${code} ${statusCode} requestId=${_req.requestId ?? "none"}: ${error.message}`;

        if (statusCode >= 500) {
            Logger.error(logMessage, { stack: error.stack });
        } else {
            Logger.warn(logMessage, { stack: error.stack });
        }

        res.status(statusCode).json({
            statusCode,
            code,
            message,
        });
    }
}