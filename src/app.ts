
import express, { type Express } from "express";
import { registerRoutes } from "./app.routes";
import { ErrorMiddleware } from "./middlewares/error.middleware";

export class App {
    public readonly app: Express;
    private readonly errorMiddleware: ErrorMiddleware;

    constructor() {
        this.app = express();
        this.errorMiddleware = new ErrorMiddleware();

        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    private configureMiddleware(): void {
        this.app.use(express.json());
    }

    private configureRoutes(): void {
        registerRoutes(this.app);
    }

    private configureErrorHandling(): void {
        this.app.use(this.errorMiddleware.handle);
    }
}
