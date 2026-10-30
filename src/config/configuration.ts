
import { z } from "zod";

const environmentSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  MONGODB_URI: z.string().url(),

  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
});

export class Configuration {
  private readonly result: z.infer<typeof environmentSchema>;

  constructor() {
    const result = environmentSchema.safeParse(process.env);

    if (!result.success) {
      console.error("Invalid environment configuration:");
      process.exit(1);
    }

    this.result = result.data;
    // console.log("result", result);
    // console.log("result.data", result.data);
    // console.log("this.result", this.result);
  }

  public get NodeEnv(): string {
    return this.result.NODE_ENV;
  }

  public get MONGODB_URI(): string {
    return this.result.MONGODB_URI;
  }

  public get JWT_ACCESS_SECRET(): string {
    return this.result.JWT_ACCESS_SECRET;
  }

  public get JWT_REFRESH_SECRET(): string {
    return this.result.JWT_REFRESH_SECRET;
  }

  public get PORT(): number {
    return this.result.PORT;
  }
}

export const configuration = new Configuration();
