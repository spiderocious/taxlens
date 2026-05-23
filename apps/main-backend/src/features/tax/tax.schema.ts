import { z } from 'zod';

// All money fields are integer kobo (1 NGN = 100 kobo). Reject decimals — the
// frontend multiplies naira by 100 before sending (see QA handoff money table).
const Kobo = z.number().int().nonnegative();

export const ReliefInputsSchema = z.object({
  annualRentKobo: Kobo,
  pensionKobo: Kobo,
  nhisKobo: Kobo,
  nhfKobo: Kobo,
  lifeInsuranceKobo: Kobo,
});

export const IncomeInputSchema = z.object({
  profileType: z.enum(['salary_earner', 'freelancer', 'mixed']),
  grossAnnualKobo: Kobo,
  reliefs: ReliefInputsSchema,
});

export type IncomeInputDto = z.infer<typeof IncomeInputSchema>;
