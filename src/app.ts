
import express, { type Express } from "express";
import { registerRoutes } from "./app.routes";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import { RequestIdMiddleware } from "./middlewares/request-id.middleware";
export class App {
    public readonly app: Express;
    private readonly errorMiddleware: ErrorMiddleware;
    private readonly requestIdMiddleware: RequestIdMiddleware;
    constructor() {
        this.app = express();
        this.errorMiddleware = new ErrorMiddleware();
        this.requestIdMiddleware = new RequestIdMiddleware();

        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    private configureMiddleware(): void {
        this.app.use(this.requestIdMiddleware.handle);
        this.app.use(express.json());
    }

    private configureRoutes(): void {
        registerRoutes(this.app);
    }

    private configureErrorHandling(): void {
        this.app.use(this.errorMiddleware.handle);
    }
}
