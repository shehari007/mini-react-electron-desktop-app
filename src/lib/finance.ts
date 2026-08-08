/**
 * Loan and investment maths.
 *
 * Amortization is computed period by period rather than with a closed-form
 * balance formula, because the schedule itself is the deliverable — and because
 * an extra payment changes the trajectory, which a closed form cannot express.
 */

export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface LoanResult {
  monthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  /** Months actually needed — shorter than the term when extra is paid. */
  months: number;
  schedule: AmortizationRow[];
  /** Interest saved and months cut, versus the same loan with no extra payment. */
  extraSavings: { interest: number; months: number } | null;
}

export interface LoanInput {
  principal: number;
  annualRatePercent: number;
  years: number;
  /** Additional amount paid every month, on top of the required payment. */
  extraMonthly?: number;
}

/**
 * Standard amortizing payment:  P · r / (1 − (1 + r)^−n)
 *
 * A zero rate divides by zero, so it is handled separately as a simple split.
 */
export function monthlyPayment(principal: number, annualRatePercent: number, years: number): number {
  const months = Math.round(years * 12);
  if (months <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / months;

  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
}

export function calculateLoan(input: LoanInput): LoanResult | null {
  const { principal, annualRatePercent, years, extraMonthly = 0 } = input;

  if (!Number.isFinite(principal) || principal <= 0) return null;
  if (!Number.isFinite(years) || years <= 0) return null;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return null;

  const scheduledMonths = Math.round(years * 12);
  const monthlyRate = annualRatePercent / 100 / 12;
  const basePayment = monthlyPayment(principal, annualRatePercent, years);
  const payment = basePayment + Math.max(0, extraMonthly);

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;

  // Cap the loop well past any realistic term so a pathological rate/payment
  // combination cannot spin forever.
  const maxPeriods = scheduledMonths + 1200;

  for (let period = 1; period <= maxPeriods && balance > 0.005; period += 1) {
    const interest = balance * monthlyRate;
    // The final payment is only whatever is left, not a full instalment.
    const thisPayment = Math.min(payment, balance + interest);
    const principalPart = thisPayment - interest;

    // A payment that does not cover the interest never amortizes — bail rather
    // than reporting a schedule that silently grows forever.
    if (principalPart <= 0) return null;

    balance -= principalPart;
    totalInterest += interest;
    totalPaid += thisPayment;

    schedule.push({
      period,
      payment: thisPayment,
      interest,
      principal: principalPart,
      balance: Math.max(0, balance),
    });
  }

  let extraSavings: LoanResult['extraSavings'] = null;
  if (extraMonthly > 0) {
    // Compare against the same loan without the extra payment.
    const baseline = calculateLoan({ principal, annualRatePercent, years });
    if (baseline) {
      extraSavings = {
        interest: baseline.totalInterest - totalInterest,
        months: baseline.months - schedule.length,
      };
    }
  }

  return {
    monthlyPayment: basePayment,
    totalInterest,
    totalPaid,
    months: schedule.length,
    schedule,
    extraSavings,
  };
}

/** Roll a monthly schedule up into calendar years, for the chart. */
export function yearlyTotals(schedule: readonly AmortizationRow[]): Array<{
  year: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const years: Array<{ year: number; principal: number; interest: number; balance: number }> = [];

  for (const row of schedule) {
    const yearIndex = Math.floor((row.period - 1) / 12);
    const bucket = years[yearIndex] ?? { year: yearIndex + 1, principal: 0, interest: 0, balance: 0 };
    bucket.principal += row.principal;
    bucket.interest += row.interest;
    // The balance shown is the one at the end of the year.
    bucket.balance = row.balance;
    years[yearIndex] = bucket;
  }

  return years;
}

// ─── Compound interest ────────────────────────────────────────────────────

export type CompoundFrequency = 1 | 2 | 4 | 12 | 365;

export const COMPOUND_OPTIONS = [
  { value: '1', label: 'Annually' },
  { value: '2', label: 'Twice a year' },
  { value: '4', label: 'Quarterly' },
  { value: '12', label: 'Monthly' },
  { value: '365', label: 'Daily' },
] as const;

export interface CompoundInput {
  initial: number;
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
  frequency: CompoundFrequency;
  /** Annual inflation, used to express the result in today's money. */
  inflationPercent?: number;
}

export interface CompoundYear {
  year: number;
  /** Everything paid in up to this point, including the initial amount. */
  contributed: number;
  /** Growth earned up to this point. */
  interest: number;
  balance: number;
  /** Balance discounted by inflation, or null when no rate was given. */
  realBalance: number | null;
}

export interface CompoundResult {
  finalBalance: number;
  totalContributed: number;
  totalInterest: number;
  realFinalBalance: number | null;
  years: CompoundYear[];
}

/**
 * Grow a balance month by month.
 *
 * Simulated rather than using the closed-form annuity formula because
 * contributions and a compounding frequency that differs from the contribution
 * frequency don't combine cleanly in one expression — and the year-by-year table
 * is needed anyway.
 */
export function calculateCompound(input: CompoundInput): CompoundResult | null {
  const { initial, monthlyContribution, annualRatePercent, years, frequency, inflationPercent = 0 } = input;

  if (!Number.isFinite(initial) || initial < 0) return null;
  if (!Number.isFinite(years) || years <= 0 || years > 100) return null;
  if (!Number.isFinite(annualRatePercent)) return null;

  const annualRate = annualRatePercent / 100;
  const totalMonths = Math.round(years * 12);

  let balance = initial;
  let contributed = initial;
  const rows: CompoundYear[] = [];

  for (let month = 1; month <= totalMonths; month += 1) {
    // Contribute at the start of the month, then apply growth.
    balance += monthlyContribution;
    contributed += monthlyContribution;

    // The periodic rate for this compounding frequency, applied for one month's
    // worth of periods.
    const periodsThisMonth = frequency / 12;
    const periodicRate = annualRate / frequency;
    balance *= (1 + periodicRate) ** periodsThisMonth;

    if (month % 12 === 0) {
      const year = month / 12;
      const realBalance =
        inflationPercent > 0 ? balance / (1 + inflationPercent / 100) ** year : null;

      rows.push({
        year,
        contributed,
        interest: balance - contributed,
        balance,
        realBalance,
      });
    }
  }

  const last = rows[rows.length - 1];

  return {
    finalBalance: balance,
    totalContributed: contributed,
    totalInterest: balance - contributed,
    realFinalBalance: last?.realBalance ?? null,
    years: rows,
  };
}
