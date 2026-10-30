import winston from "winston";

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

const isDevelopment = process.env.NODE_ENV !== "production";

const SENSITIVE_KEYS = [
  "authorization",
  "x-access-token",
  "x-refresh-token",
  "password",
  "passwordHash",
  "token",
];

function simplifyStack(stack: unknown): string | undefined {
  if (typeof stack !== "string") return undefined;

  const frames = stack
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("at "));
  const appFrames = frames.filter(
    (line) => line.includes("/src/") && !line.includes("node_modules")
  );
  const chosen = appFrames.length > 0 ? appFrames : frames.slice(0, 1);
  if (chosen.length === 0) return undefined;

  return chosen
    .map((line) => {
      const named = line.match(/^at (.+?) \((.+)\)$/);
      const location = named?.[2] ?? line.slice(3);
      const srcAt = location.lastIndexOf("/src/");
      const file = srcAt >= 0 ? location.slice(srcAt + 1) : location;
      const name = named?.[1];
      const where = name && name !== "<anonymous>" ? `${name} (${file})` : file;
      return `  at ${where}`;
    })
    .join("\n");
}

const developmentFormat = printf(({ level, message, timestamp, stack }) => {
  const line = `${timestamp} [${level}]: ${message}`;
  const origin = simplifyStack(stack);
  return origin ? `${line}\n${origin}` : line;
});

const redact = winston.format((info) => {
  for (const key of SENSITIVE_KEYS) {
    if (key in info) info[key] = "[REDACTED]";
  }
  return info;
});

const instance = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: combine(
    timestamp(),
    errors({ stack: true }),
    redact(),
    ...(isDevelopment ? [colorize(), developmentFormat] : [json()])
  ),
  transports: [new winston.transports.Console()],
});

type LogMethod = (message: string, metadata?: object) => void;

function bind(level: "info" | "warn" | "error" | "debug"): LogMethod {
  return (message, metadata) => instance[level](message, metadata);
}

export class Logger {
  public static readonly info = bind("info");
  public static readonly warn = bind("warn");
  public static readonly error = bind("error");
  public static readonly debug = bind("debug");
}
