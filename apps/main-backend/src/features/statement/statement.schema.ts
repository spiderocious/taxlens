import { z } from 'zod';

// Module 1 (upload path). The PDF arrives as multipart/form-data; multer puts
// the binary on req.file. This schema validates the accompanying text fields.
export const ParseStatementSchema = z
  .object({
    profileType: z.enum(['salary_earner', 'freelancer', 'mixed']),
  })
  .strict();

export type ParseStatementDto = z.infer<typeof ParseStatementSchema>;

// The 8-digit code in the path (:code). Numeric, exactly 8 digits.
export const CodeParamSchema = z.object({
  code: z.string().regex(/^\d{8}$/, 'must be an 8-digit code'),
});

// A3 — recompute from the user's reclassified selection. The ids the user marked
// as income; gross becomes their sum. Empty array is valid (= "none are income").
export const RecomputeSchema = z
  .object({
    inflowIds: z.array(z.string().min(1)),
  })
  .strict();

export type RecomputeDto = z.infer<typeof RecomputeSchema>;
