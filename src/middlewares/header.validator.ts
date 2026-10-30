import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ErrorMessage } from "../common/constant";
import { AppError } from "../common/errors";
import { ErrorCode } from "../enum/enum";

const deviceId = ErrorMessage[ErrorCode.DEVICE_ID_REQUIRED];
const deviceType = ErrorMessage[ErrorCode.DEVICE_TYPE_REQUIRED];
const timezone = ErrorMessage[ErrorCode.TIMEZONE_REQUIRED];
const lang = ErrorMessage[ErrorCode.LANG_REQUIRED];

const deviceHeadersSchema = z.object({
  device_id: z.string({ error: deviceId }).trim().min(1, deviceId),
  device_type: z.coerce
    .number({ error: deviceType })
    .int(deviceType)
    .refine((value) => [1, 2, 3].includes(value), deviceType),
  timezone: z.string({ error: timezone }).trim().min(1, timezone),
  lang: z.enum(["en", "hi"], { error: lang }),
});

export class HeaderValidator {
  public validate(req: Request, _res: Response, next: NextFunction): void {
    const result = deviceHeadersSchema.safeParse({
      device_id: req.headers.device_id,
      device_type: req.headers.device_type,
      timezone: req.headers.timezone,
      lang: req.headers.lang,
    });

    if (!result.success) {
      const message = result.error.issues[0].message;
      return next(new AppError(message, 400, ErrorCode.VALIDATION_ERROR));
    }

    next();
  }
}
