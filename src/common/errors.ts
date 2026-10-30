import { ErrorCode } from "../enum/enum";


export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: ErrorCode;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
    ) {
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}