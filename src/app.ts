
import express, { type Express } from "express";
import { registerRoutes } from "./app.routes";
import { ErrorMiddleware } from "./middlewares/error.middleware";
import { RequestIdMiddleware } from "./middlewares/request-id.middleware";
import { HeaderValidator } from "./middlewares/header.validator";
import { DatabaseProvider } from "./providers/database/database.provider";
export class App {
    public readonly app: Express;
    private readonly errorMiddleware: ErrorMiddleware;
    private readonly requestIdMiddleware: RequestIdMiddleware;
    private readonly headerValidator: HeaderValidator;
    private readonly database: DatabaseProvider;
    constructor() {
        this.app = express();
        this.errorMiddleware = new ErrorMiddleware();
        this.requestIdMiddleware = new RequestIdMiddleware();
        this.headerValidator = new HeaderValidator();
        this.database = DatabaseProvider.getInstance();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
     
    }

    public initialize(): Promise<void> {
        return this.database.connect();
    }

    public disconnect(): Promise<void> {
        return this.database.disconnect();
    }

    private configureMiddleware(): void {
        this.app.use(this.requestIdMiddleware.handle);
        this.app.use(express.json());
        this.app.use(this.headerValidator.validate);
    }

    private configureRoutes(): void {
        registerRoutes(this.app);
    }

    private configureErrorHandling(): void {
        this.app.use(this.errorMiddleware.handle);
    }
}
