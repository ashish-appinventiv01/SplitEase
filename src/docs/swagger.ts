import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { configuration } from "../config/configuration";
import { openApiDocument } from "./openapi";

export function setupSwagger(app: Express): void {
  if (configuration.NodeEnv === "production") return;

  app.get("/api-docs.json", (_req, res) => {
    res.json(openApiDocument);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "SplitEase API",
    })
  );
}
