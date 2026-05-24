import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type {
  PeriodConfidence,
  ProfileType,
  RegimeComparison,
  ReliefInputs,
} from '@taxlens/core';

/**
 * The flow state shared across Landing → Income → Result. Manual and upload
 * paths share `profileType`, and switching paths must not lose entries (PRD).
 * Result reads `comparison` from here. Client state only — React Context +
 * useState (no Redux/Zustand). The computed numbers are the backend's; we just
 * hold the latest result so /result can render without a refetch.
 */

/** Where the current comparison came from — drives whether the AI panel (which
 *  needs an 8-digit process `code`) is available. Manual compute is stateless. */
export type ComputationSource = 'manual' | 'sample' | 'statement';

/** Raw manual-entry field values, kept as the user typed them (naira strings)
 *  so switching away and back preserves exactly what was entered. */
export interface ManualDraft {
  grossInput: string;
  grossFrequency: 'annual' | 'monthly';
  rentInput: string;
  pensionInput: string;
  nhisInput: string;
  nhfInput: string;
  lifeInsuranceInput: string;
}

export const EMPTY_MANUAL_DRAFT: ManualDraft = {
  grossInput: '',
  grossFrequency: 'annual',
  rentInput: '',
  pensionInput: '',
  nhisInput: '',
  nhfInput: '',
  lifeInsuranceInput: '',
};

export interface IncomeContextValue {
  profileType: ProfileType | null;
  setProfileType: (value: ProfileType) => void;

  manualDraft: ManualDraft;
  setManualDraft: (next: ManualDraft) => void;

  comparison: RegimeComparison | null;
  /** The 8-digit process code when the result came from a statement upload. */
  statementCode: string | null;
  source: ComputationSource | null;
  /** Statement-only: how many months the upload covered + the derived trust
   *  level — drive the result's confidence note (B2) and period line (B3). */
  monthsCovered: number | null;
  periodConfidence: PeriodConfidence | null;
  setResult: (next: {
    comparison: RegimeComparison;
    source: ComputationSource;
    statementCode?: string;
    monthsCovered?: number;
    periodConfidence?: PeriodConfidence;
  }) => void;

  /** Wipe everything — backs the "Start over" critical action. */
  reset: () => void;
}

const IncomeContext = createContext<IncomeContextValue | null>(null);

export function IncomeProvider({ children }: { children: ReactNode }) {
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [manualDraft, setManualDraft] = useState<ManualDraft>(EMPTY_MANUAL_DRAFT);
  const [comparison, setComparison] = useState<RegimeComparison | null>(null);
  const [statementCode, setStatementCode] = useState<string | null>(null);
  const [source, setSource] = useState<ComputationSource | null>(null);
  const [monthsCovered, setMonthsCovered] = useState<number | null>(null);
  const [periodConfidence, setPeriodConfidence] = useState<PeriodConfidence | null>(null);

  const setResult = useCallback<IncomeContextValue['setResult']>((next) => {
    setComparison(next.comparison);
    setSource(next.source);
    setStatementCode(next.statementCode ?? null);
    setMonthsCovered(next.monthsCovered ?? null);
    setPeriodConfidence(next.periodConfidence ?? null);
  }, []);

  const reset = useCallback(() => {
    setProfileType(null);
    setManualDraft(EMPTY_MANUAL_DRAFT);
    setComparison(null);
    setStatementCode(null);
    setSource(null);
    setMonthsCovered(null);
    setPeriodConfidence(null);
  }, []);

  const value = useMemo<IncomeContextValue>(
    () => ({
      profileType,
      setProfileType,
      manualDraft,
      setManualDraft,
      comparison,
      statementCode,
      source,
      monthsCovered,
      periodConfidence,
      setResult,
      reset,
    }),
    [
      profileType,
      manualDraft,
      comparison,
      statementCode,
      source,
      monthsCovered,
      periodConfidence,
      setResult,
      reset,
    ],
  );

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
}

export function useIncomeContext(): IncomeContextValue {
  const ctx = useContext(IncomeContext);
  if (!ctx) {
    throw new Error('useIncomeContext must be used within IncomeProvider');
  }
  return ctx;
}

/** A relief input set with all zeros — manual-form base before the user types. */
export const ZERO_RELIEFS: ReliefInputs = {
  annualRentKobo: 0,
  pensionKobo: 0,
  nhisKobo: 0,
  nhfKobo: 0,
  lifeInsuranceKobo: 0,
};
