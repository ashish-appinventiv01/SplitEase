import { z } from "zod";
import { ExportType } from "../../../../enum/enum";

export const createExportSchema = z.object({
  type: z.enum(ExportType),
});

export const exportIdParamSchema = z.object({
  exportId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid export ID"),
});
