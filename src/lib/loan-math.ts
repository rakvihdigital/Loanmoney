/** Loan maths shared by the admin form and the borrower dashboard.
 *  Matches the EMI formula in admin_save_loan (supabase/schema.sql). */

export function emi(principal: number, annualRatePct: number, months: number): number {
  if (!(principal > 0) || !(months > 0) || annualRatePct < 0) return 0;
  const r = annualRatePct / 1200;
  if (r === 0) return Math.round(principal / months);
  const f = Math.pow(1 + r, months);
  return Math.round((principal * r * f) / (f - 1));
}

export type ScheduleRow = { no: number; date: string; emi: number; principal: number; interest: number; balance: number };

/** Monthly reducing-balance schedule. The last row absorbs rounding so the balance ends at 0. */
export function schedule(principal: number, annualRatePct: number, months: number, firstEmiDate: string): ScheduleRow[] {
  const payment = emi(principal, annualRatePct, months);
  if (!payment || !/^\d{4}-\d{2}-\d{2}$/.test(firstEmiDate)) return [];
  const r = annualRatePct / 1200;
  const [y, m, d] = firstEmiDate.split("-").map(Number);
  const rows: ScheduleRow[] = [];
  let balance = principal;
  for (let i = 0; i < months; i++) {
    const interest = Math.round(balance * r);
    let principalPart = payment - interest;
    let amount = payment;
    if (i === months - 1 || principalPart > balance) {
      principalPart = balance;
      amount = balance + interest;
    }
    balance = Math.max(0, balance - principalPart);
    rows.push({ no: i + 1, date: addMonths(y, m, d, i), emi: amount, principal: principalPart, interest, balance });
  }
  return rows;
}

/** YYYY-MM-DD for (y, m, d) plus n months; clamps to the month's last day (31 Jan + 1 → 28/29 Feb). */
export function addMonths(y: number, m: number, d: number, n: number): string {
  const total = m - 1 + n;
  const year = y + Math.floor(total / 12);
  const month = (total % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(d, last);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function totals(rows: ScheduleRow[]) {
  return rows.reduce((t, r) => ({ paid: t.paid + r.emi, interest: t.interest + r.interest }), { paid: 0, interest: 0 });
}

/** First instalment on or after `today` (YYYY-MM-DD), or null when all are past. */
export function nextInstalment(rows: ScheduleRow[], today: string): ScheduleRow | null {
  return rows.find((r) => r.date >= today) ?? null;
}

export type InstalmentStatus = "paid" | "overdue" | "due" | "upcoming";
export type ScheduleRowWithStatus = ScheduleRow & { status: InstalmentStatus; payment?: { paid_on: string; amount: number; reference: string } };

/** Marks each instalment paid / overdue / due (the first unpaid one not yet late) / upcoming. */
export function withStatus(
  rows: ScheduleRow[],
  payments: { instalment_no: number; paid_on: string; amount: number; reference: string }[],
  today: string,
): ScheduleRowWithStatus[] {
  const byNo = new Map(payments.map((p) => [p.instalment_no, p]));
  let dueMarked = false;
  return rows.map((r) => {
    const payment = byNo.get(r.no);
    if (payment) return { ...r, status: "paid" as const, payment };
    if (r.date < today) return { ...r, status: "overdue" as const };
    if (!dueMarked) {
      dueMarked = true;
      return { ...r, status: "due" as const };
    }
    return { ...r, status: "upcoming" as const };
  });
}

/** Repayment progress: how many EMIs are paid, how much was paid, and principal still outstanding. */
export function progress(rows: ScheduleRowWithStatus[], sanctioned: number) {
  const paid = rows.filter((r) => r.status === "paid");
  const principalPaid = paid.reduce((s, r) => s + r.principal, 0);
  return {
    paidCount: paid.length,
    total: rows.length,
    paidAmount: paid.reduce((s, r) => s + (r.payment?.amount ?? r.emi), 0),
    outstanding: Math.max(0, sanctioned - principalPaid),
    overdueCount: rows.filter((r) => r.status === "overdue").length,
    overdueAmount: rows.filter((r) => r.status === "overdue").reduce((s, r) => s + r.emi, 0),
  };
}
