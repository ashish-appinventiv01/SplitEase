import { type Express } from 'express';
import { AppError } from './common/errors';
import { ApiResponse } from './common/responses';
import { ErrorCode } from './enum/enum';
import { APP_CONSTANTS } from './common/constant';
import { AuthRoutes } from './modules/v1/auth/auth.routes';
import { UserRoutes } from './modules/v1/user/user.routes';

export function registerRoutes(app: Express): void {
    app.get('/', (req, res) => {
        res.send('Hello World');
    });

    // app.get('/health', (req, res) => {
    //     res.send('OK');
    // });
    app.get("/test-error", (_req, _res, next) => {
        next(new AppError("This is a test error", 400, ErrorCode.VALIDATION_ERROR));
    });
    app.get(`${APP_CONSTANTS.API_PREFIX}/test`, (_req, res) => {
        return ApiResponse.success(res, "API Version", {
            version: "1.0.0"
        });
    })
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
    app.use(`${APP_CONSTANTS.API_PREFIX}/auth`,new AuthRoutes().router);

    app.use(
        `${APP_CONSTANTS.API_PREFIX}/users`,
        new UserRoutes().router
      );
}