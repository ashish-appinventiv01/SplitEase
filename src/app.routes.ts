import { type Express } from 'express';
import { AppError } from './common/errors';
import { ApiResponse } from './common/responses';

export function registerRoutes(app: Express): void {
    app.get('/', (req, res) => {
        res.send('Hello World');
    });

    app.get('/health', (req, res) => {
        res.send('OK');
    });
    app.get("/test-error", (_req, _res, next) => {
        next(new AppError("This is a test error", 400));
    });
    app.get("/test-created", (_req, res) => {
        const user = {
            id: "124",
            name: "Rahul"
        };

        return ApiResponse.created(
            res,
            "User created successfully",
            user
        );
    });
}