import { z } from 'zod';

// Module 1 (upload path). v1 accepts the extracted text or a base64 PDF and
// returns classified inflows for the user to confirm/correct before compute.
// Real extraction (pdf parse + classifier) is downstream work; the contract is
// fixed here so the frontend can build against it.
export const ParseStatementSchema = z.object({
  // base64-encoded PDF payload; bounded to keep the stateless service cheap.
  pdfBase64: z.string().min(1).max(15_000_000),
  filename: z.string().max(255).optional(),
});

export type ParseStatementDto = z.infer<typeof ParseStatementSchema>;
