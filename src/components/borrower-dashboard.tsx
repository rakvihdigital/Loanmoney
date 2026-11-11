"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Hourglass,
  KeyRound,
  Landmark,
  LayoutGrid,
  Loader2,
  LogOut,
  Mail,
  Percent,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { borrowerChangePassword, borrowerDocumentUrl, borrowerLogout, borrowerPortal } from "@/lib/borrower";
import { dateOnly, dateTime, rupees } from "@/lib/format";
import { formatPhone } from "@/lib/phone-auth";
import { progress as getProgress, schedule, totals, withStatus, type ScheduleRowWithStatus } from "@/lib/loan-math";
import { DOCUMENT_KINDS, REPAYMENT_METHODS, type BorrowerPortalData, type LoanStatus } from "@/lib/types";
import { Notice, Spinner } from "./ui";

type Tab = "overview" | "repayments" | "documents" | "details" | "account";
const TABS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "repayments", label: "Repayments", icon: CalendarClock },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "details", label: "Loan details", icon: ReceiptText },
  { id: "account", label: "Account", icon: UserRound },
];

const STATUS: Record<LoanStatus, { label: string; cls: string }> = {
  sanctioned: { label: "Sanctioned", cls: "border-gold/30 bg-gold-soft text-gold-ink" },
  disbursed: { label: "Disbursed", cls: "border-brand/30 bg-brand-soft text-brand-ink" },
  active: { label: "Active · repaying", cls: "border-ok/30 bg-ok-soft text-ok" },
  closed: { label: "Closed", cls: "border-white/15 bg-white/[0.06] text-ink-2" },
};

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const todayIso = () => new Date().toISOString().slice(0, 10);

export function BorrowerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<BorrowerPortalData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t as Tab);
    let alive = true;
    borrowerPortal().then((res) => {
      if (!alive) return;
      if ("data" in res) setData(res.data);
      else if (res.error === "signed-out") router.replace("/login");
      else setError(res.error);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  function go(t: Tab) {
    setTab(t);
    const u = new URL(window.location.href);
    u.searchParams.set("tab", t);
    window.history.replaceState(null, "", u);
    document.getElementById("loan-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function logout() {
    await borrowerLogout();
    router.replace("/login");
  }

  // Schedule + payment status, shared by several tabs
  const rows = useMemo<ScheduleRowWithStatus[]>(() => {
    const l = data?.loan;
    if (!l?.sanctioned_amount || l.interest_rate == null || !l.tenure_months || !l.first_emi_date) return [];
    return withStatus(schedule(l.sanctioned_amount, Number(l.interest_rate), l.tenure_months, l.first_emi_date), data?.payments ?? [], todayIso());
  }, [data]);

  if (error)
    return (
      <main className="shell py-20">
        <div className="card mx-auto max-w-md p-8 text-center">
          <Notice tone="warn">{error}</Notice>
          <Link href="/login" className="btn btn-gold mt-6">
            Log in again
          </Link>
        </div>
      </main>
    );
  if (!data) return <Spinner label="Loading your loan…" />;

  const { application: a, loan, site } = data;
  const firstName = a.full_name.split(" ")[0];
  const status = STATUS[loan?.status ?? "sanctioned"];
  const lender = { name: site?.lender_name || a.lender_name || "Your lender", reg: site?.lender_reg_no || a.lender_reg_no, type: site?.lender_type };
  const pg = loan?.sanctioned_amount ? getProgress(rows, loan.sanctioned_amount) : null;

  return (
    <main className="-mb-16">
      {/* ===================== Summary — blue ===================== */}
      <section className="relative overflow-hidden">
        <div className="aurora pointer-events-none absolute inset-0 -top-40" aria-hidden />
        <div className="grid-lines pointer-events-none absolute inset-0 -top-40" aria-hidden />
        <div className="shell relative pb-8 pt-8 sm:pb-10 sm:pt-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="eyebrow eyebrow-light">My loan</span>
              <h1 className="display mt-4 text-[2.2rem] leading-tight sm:text-5xl">
                <span className="text-gradient">Hello,</span> <span className="serif text-champagne">{firstName}.</span>
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-muted">
                <span className={`chip border ${status.cls}`}>{status.label}</span>
                {pg?.overdueCount ? (
                  <span className="chip border-bad/30 bg-bad-soft text-bad">
                    <CircleAlert size={12} /> {pg.overdueCount} EMI overdue
                  </span>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={() => void logout()} className="btn btn-outline btn-sm">
              <LogOut size={14} /> Log out
            </button>
          </div>

          {loan?.sanctioned_amount ? (
            <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <Kpi icon={<BadgeIndianRupee size={17} />} label="Sanctioned amount" value={rupees(loan.sanctioned_amount)} />
              <Kpi icon={<CalendarClock size={17} />} label="Monthly EMI" value={loan.emi_amount ? rupees(loan.emi_amount) : "—"} gold />
              <Kpi icon={<Percent size={17} />} label="Interest rate" value={loan.interest_rate != null ? `${Number(loan.interest_rate)}% p.a.` : "—"} />
              <Kpi icon={<Hourglass size={17} />} label="Tenure" value={loan.tenure_months ? `${loan.tenure_months} months` : "—"} />
            </div>
          ) : (
            <div className="card mt-7 flex items-start gap-4 p-5 sm:p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold-soft text-gold">
                <Clock3 size={18} />
              </span>
              <div>
                <p className="font-semibold text-ink">Your application is approved.</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {lender.name} is preparing your loan. The amount, EMI and repayment schedule will appear here once they&rsquo;re confirmed.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===================== Tabs ===================== */}
      <section className="theme-light min-h-[60vh]">
        <div id="loan-tabs" className="sticky top-[68px] z-20 scroll-mt-20 border-b hairline bg-paper/90 backdrop-blur-xl sm:top-[76px]">
          <div className="shell">
            <nav className="-mb-px flex gap-1 overflow-x-auto pr-6 [mask-image:linear-gradient(90deg,#000_82%,transparent)] [scrollbar-width:none] sm:pr-0 sm:[mask-image:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Loan sections">
              {TABS.map(({ id, label, icon: Icon }) => {
                const on = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => go(id)}
                    className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-4 text-sm font-semibold transition sm:px-4 ${
                      on ? "text-ink" : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={16} className={on ? "text-gold" : ""} />
                    {label}
                    {id === "documents" && data.documents.length > 0 && (
                      <span className="rounded-full bg-paper-2 px-1.5 text-[0.68rem] font-bold text-ink-2">{data.documents.length}</span>
                    )}
                    {on && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-gold/40 via-gold to-gold/40" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="shell py-8 sm:py-10">
          {tab === "overview" && <OverviewTab data={data} rows={rows} pg={pg} lender={lender.name} go={go} />}
          {tab === "repayments" && <RepaymentsTab data={data} rows={rows} lender={lender.name} />}
          {tab === "documents" && <DocumentsTab data={data} />}
          {tab === "details" && <DetailsTab data={data} lender={lender} />}
          {tab === "account" && <AccountTab data={data} onLogout={() => void logout()} />}
        </div>
      </section>
    </main>
  );
}

/* ================================================================ Overview */

function OverviewTab({
  data,
  rows,
  pg,
  lender,
  go,
}: {
  data: BorrowerPortalData;
  rows: ScheduleRowWithStatus[];
  pg: ReturnType<typeof getProgress> | null;
  lender: string;
  go: (t: Tab) => void;
}) {
  const { loan, application: a } = data;
  const next = rows.find((r) => r.status === "overdue") ?? rows.find((r) => r.status === "due");
  const pct = pg && pg.total ? Math.round((pg.paidCount / pg.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        {/* Next EMI */}
        {next ? (
          <div className={`section-blue theme-dark overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-7 ${next.status === "overdue" ? "ring-2 ring-bad/50" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <span
                  className={`grid size-12 place-items-center rounded-2xl border ${
                    next.status === "overdue" ? "border-bad/40 bg-bad-soft text-bad" : "border-gold/30 bg-gold-soft text-gold"
                  }`}
                >
                  {next.status === "overdue" ? <CircleAlert size={20} /> : <CalendarDays size={20} />}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {next.status === "overdue" ? "Overdue EMI" : "Next EMI"} · {next.no} of {rows.length}
                  </p>
                  <p className="display mt-1 text-3xl text-ink">{rupees(next.emi)}</p>
                  <p className={`text-sm ${next.status === "overdue" ? "font-semibold text-bad" : "text-muted"}`}>
                    {next.status === "overdue" ? "Was due " : "Due "}
                    {fmtDate(next.date)}
                  </p>
                </div>
              </div>
              <button type="button" className="btn btn-gold" onClick={() => go("repayments")}>
                How to pay <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : rows.length > 0 ? (
          <div className="card flex items-center gap-4 p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-ok-soft text-ok">
              <Check size={22} strokeWidth={3} />
            </span>
            <div>
              <p className="font-semibold text-ink">All EMIs are paid.</p>
              <p className="text-sm text-muted">Your NOC will appear under Documents once {lender} closes the loan.</p>
            </div>
          </div>
        ) : (
          <div className="card p-6 text-sm text-muted">Your EMI schedule will appear here once the lender confirms your loan amount, rate, tenure and first EMI date.</div>
        )}

        {/* Progress */}
        {pg && rows.length > 0 && (
          <div className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="display text-lg">Repayment progress</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {pg.paidCount} of {pg.total} EMIs paid
                </p>
              </div>
              <p className="display text-3xl text-ink">{pct}%</p>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full rounded-full bg-gradient-to-r from-gold to-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Stat k="Paid so far" v={rupees(pg.paidAmount)} />
              <Stat k="Outstanding principal" v={rupees(pg.outstanding)} />
              <Stat k="Overdue" v={pg.overdueCount ? `${pg.overdueCount} · ${rupees(pg.overdueAmount)}` : "None"} bad={pg.overdueCount > 0} />
            </dl>
          </div>
        )}

        {loan?.note && (
          <div className="card border-gold/30 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-ink">Message from our team</p>
            <p className="mt-2 leading-relaxed text-ink-2">{loan.note}</p>
          </div>
        )}
      </div>

      <aside className="min-w-0 space-y-4">
        <QuickLink icon={<CalendarClock size={18} />} title="Repayment schedule" sub="Every EMI and its status" onClick={() => go("repayments")} />
        <QuickLink
          icon={<FileText size={18} />}
          title="Loan documents"
          sub={data.documents.length ? `${data.documents.length} available to download` : "Key Fact Statement, sanction letter, agreement"}
          onClick={() => go("documents")}
        />
        <QuickLink icon={<ReceiptText size={18} />} title="Loan details & charges" sub="Disbursement, fees, prepayment" onClick={() => go("details")} />
        <QuickLink icon={<KeyRound size={18} />} title="Change password" sub="Keep your account secure" onClick={() => go("account")} />
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Application history</p>
          <ol className="mt-4">
            {[
              { t: "Application submitted", d: a.created_at },
              { t: "Approved and sent to lender", d: a.reviewed_at },
              ...(loan?.disbursed_on ? [{ t: "Loan disbursed", d: loan.disbursed_on }] : []),
              ...(loan?.status === "closed" ? [{ t: "Loan closed", d: loan.updated_at }] : []),
            ].map((s, i, arr) => (
              <li key={s.t} className="relative flex gap-3 pb-4 last:pb-0">
                {i < arr.length - 1 && <span className="absolute bottom-0 left-[11px] top-7 w-px bg-line" aria-hidden />}
                <span className="relative grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{s.t}</p>
                  <p className="text-xs text-muted">{s.d ? (s.d.length === 10 ? fmtDate(s.d) : dateTime(s.d)) : "—"}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

/* ================================================================ Repayments */

function RepaymentsTab({ data, rows, lender }: { data: BorrowerPortalData; rows: ScheduleRowWithStatus[]; lender: string }) {
  const loan = data.loan;
  const t = totals(rows);

  function downloadCsv() {
    const lines = [
      "No,Due date,EMI,Principal,Interest,Balance,Status,Paid on,Reference",
      ...rows.map((r) => [r.no, r.date, r.emi, r.principal, r.interest, r.balance, r.status, r.payment?.paid_on ?? "", r.payment?.reference ?? ""].join(",")),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "repayment-schedule.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* How to pay */}
      <div className="card card-glow p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
              <Wallet size={19} />
            </span>
            <div>
              <h2 className="display text-xl">How to pay your EMI</h2>
              <p className="mt-1 text-sm font-semibold text-ink-2">
                {loan?.repayment_method ? REPAYMENT_METHODS[loan.repayment_method] : "Your lender will share the payment method."}
              </p>
            </div>
          </div>
          {loan?.repayment_link && (
            <a href={loan.repayment_link} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
              Pay on {lender}&rsquo;s site <ExternalLink size={15} />
            </a>
          )}
        </div>
        {loan?.repayment_details && <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-2">{loan.repayment_details}</p>}
        <p className="mt-5 flex items-start gap-2 border-t hairline pt-4 text-xs leading-relaxed text-muted">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" />
          EMIs are paid only to {lender}. Never pay an EMI to a personal account or UPI ID, even if someone asks in our name.
        </p>
      </div>

      {/* Schedule */}
      {rows.length === 0 ? (
        <div className="card p-6 text-sm text-muted">The repayment schedule will appear once your loan amount, interest rate, tenure and first EMI date are confirmed.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-3 pt-6">
            <div>
              <h2 className="display text-lg">Repayment schedule</h2>
              <p className="mt-0.5 text-xs text-muted">Paid EMIs are confirmed by our team after the lender receives them.</p>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={downloadCsv}>
              <Download size={14} /> Download
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-[0.7rem] uppercase tracking-wide text-muted">
                <tr className="border-y hairline bg-paper/60">
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-3 py-3 font-semibold">Due date</th>
                  <th className="px-3 py-3 text-right font-semibold">EMI</th>
                  <th className="px-3 py-3 text-right font-semibold">Principal</th>
                  <th className="px-3 py-3 text-right font-semibold">Interest</th>
                  <th className="px-3 py-3 text-right font-semibold">Balance</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.no} className={r.status === "due" ? "bg-gold-soft/60" : r.status === "overdue" ? "bg-bad-soft/60" : ""}>
                    <td className="px-6 py-3 font-semibold">{r.no}</td>
                    <td className="px-3 py-3">{fmtDate(r.date)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{rupees(r.emi)}</td>
                    <td className="px-3 py-3 text-right text-ink-2">{rupees(r.principal)}</td>
                    <td className="px-3 py-3 text-right text-ink-2">{rupees(r.interest)}</td>
                    <td className="px-3 py-3 text-right text-ink-2">{rupees(r.balance)}</td>
                    <td className="px-6 py-3">
                      <StatusPill r={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-line text-sm font-semibold">
                <tr>
                  <td className="px-6 py-3" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-3 text-right">{rupees(t.paid)}</td>
                  <td className="px-3 py-3 text-right">{rupees(t.paid - t.interest)}</td>
                  <td className="px-3 py-3 text-right">{rupees(t.interest)}</td>
                  <td className="px-6 py-3" colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="px-6 pb-5 pt-3 text-xs leading-relaxed text-muted">
            Calculated on a reducing balance at {Number(loan?.interest_rate)}% a year. Your Key Fact Statement and loan agreement are the final reference.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusPill({ r }: { r: ScheduleRowWithStatus }) {
  if (r.status === "paid")
    return (
      <span className="inline-flex flex-col">
        <span className="chip w-fit border-ok/30 bg-ok-soft text-ok">
          <Check size={12} strokeWidth={3} /> Paid
        </span>
        <span className="mt-1 text-[0.68rem] text-muted">
          {fmtDate(r.payment?.paid_on)}
          {r.payment?.reference ? ` · ${r.payment.reference}` : ""}
        </span>
      </span>
    );
  if (r.status === "overdue")
    return (
      <span className="chip border-bad/30 bg-bad-soft text-bad">
        <CircleAlert size={12} /> Overdue
      </span>
    );
  if (r.status === "due") return <span className="chip border-gold/40 bg-white text-gold-ink">Due next</span>;
  return <span className="chip border-line bg-paper text-muted">Upcoming</span>;
}

/* ================================================================ Documents */

function DocumentsTab({ data }: { data: BorrowerPortalData }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const docs = data.documents;

  async function open(id: string) {
    setMsg("");
    setBusy(id);
    const res = await borrowerDocumentUrl(id);
    setBusy(null);
    if ("url" in res) window.location.href = res.url;
    else setMsg(res.error);
  }

  return (
    <div className="space-y-6">
      {msg && (
        <Notice tone="warn" onClose={() => setMsg("")}>
          {msg}
        </Notice>
      )}
      {docs.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-paper-2 text-muted">
            <FileText size={22} />
          </span>
          <p className="font-semibold text-ink">No documents yet</p>
          <p className="max-w-sm text-sm text-muted">Your Key Fact Statement, sanction letter and loan agreement will appear here as soon as they&rsquo;re issued.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <li key={d.id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
                  <FileText size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{d.title}</p>
                  <p className="text-xs text-muted">{DOCUMENT_KINDS[d.kind]}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">Added {dateOnly(d.uploaded_at)}</p>
              <button type="button" className="btn btn-outline btn-sm mt-3 w-full" disabled={busy === d.id} onClick={() => void open(d.id)}>
                {busy === d.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ok" />
        Documents are stored privately. Each download link works for two minutes and only for you.
      </p>
    </div>
  );
}

/* ================================================================ Loan details */

function DetailsTab({ data, lender }: { data: BorrowerPortalData; lender: { name: string; reg: string | null; type?: string } }) {
  const l = data.loan;
  const a = data.application;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <InfoCard icon={<ReceiptText size={18} />} title="Loan">
        <Row k="Loan account no." v={l?.loan_account_no || "—"} mono />
        <Row k="Status" v={STATUS[l?.status ?? "sanctioned"].label} />
        <Row k="Sanctioned amount" v={l?.sanctioned_amount ? rupees(l.sanctioned_amount) : "—"} />
        <Row k="Interest rate" v={l?.interest_rate != null ? `${Number(l.interest_rate)}% a year` : "—"} />
        <Row k="Tenure" v={l?.tenure_months ? `${l.tenure_months} months` : "—"} />
        <Row k="Monthly EMI" v={l?.emi_amount ? rupees(l.emi_amount) : "—"} />
        <Row k="First EMI date" v={fmtDate(l?.first_emi_date)} />
      </InfoCard>
      <InfoCard icon={<Wallet size={18} />} title="Disbursement">
        <Row k="Disbursed on" v={fmtDate(l?.disbursed_on)} />
        <Row k="Amount credited" v={l?.disbursed_amount != null ? rupees(l.disbursed_amount) : "—"} />
        <Row k="Credited to" v={l?.disbursed_to || "—"} />
        <Row k="Amount requested" v={rupees(a.requested_amount)} />
        <Row k="Applied on" v={dateOnly(a.created_at)} />
      </InfoCard>
      <InfoCard icon={<Percent size={18} />} title="Charges">
        <Row k="Lender processing fee" v={l?.processing_fee != null ? rupees(l.processing_fee) : "—"} />
        <Row k="APR (all-in yearly cost)" v={l?.apr != null ? `${Number(l.apr)}%` : "—"} />
        <Text k="Late payment" v={l?.late_fee} />
        <Text k="Prepayment / closure" v={l?.prepayment_terms} />
        <p className="pt-3 text-xs leading-relaxed text-muted">These are set by the lender and listed in your Key Fact Statement.</p>
      </InfoCard>
      <InfoCard icon={<Building2 size={18} />} title="Your lender">
        <div className="py-2.5">
          <p className="font-bold text-ink">{lender.name}</p>
          {lender.reg && (
            <p className="mt-1 text-sm text-muted">
              {lender.type ?? "RBI-registered"} · RBI Reg. No. <span className="font-mono text-ink-2">{lender.reg}</span>
            </p>
          )}
          {data.site?.lender_website && (
            <a className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink hover:underline" href={data.site.lender_website} target="_blank" rel="noopener noreferrer">
              Visit website <ExternalLink size={13} />
            </a>
          )}
        </div>
      </InfoCard>
    </div>
  );
}

/* ================================================================ Account */

function AccountTab({ data, onLogout }: { data: BorrowerPortalData; onLogout: () => void }) {
  const a = data.application;
  const site = data.site;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  async function change(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!current) return setMsg({ tone: "bad", text: "Enter your current password." });
    if (next.length < 8) return setMsg({ tone: "bad", text: "New password must be at least 8 characters." });
    if (next !== confirm) return setMsg({ tone: "bad", text: "The new passwords don't match." });
    setBusy(true);
    const res = await borrowerChangePassword(current, next);
    setBusy(false);
    if (!res.ok) return setMsg({ tone: "bad", text: res.error });
    setCurrent("");
    setNext("");
    setConfirm("");
    setMsg({ tone: "ok", text: "Password changed. Other devices have been signed out." });
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <div className="space-y-5">
        <InfoCard icon={<UserRound size={18} />} title="Profile">
          <Row k="Name" v={a.full_name} />
          <Row k="Mobile number" v={formatPhone(a.phone)} />
          <Row k="Email" v={a.contact_email || "—"} />
          <Row k="Category" v={a.category} />
          <p className="pt-3 text-xs leading-relaxed text-muted">To change these details, contact support.</p>
        </InfoCard>

        <InfoCard icon={<Landmark size={18} />} title="Help & support">
          <ul className="space-y-3 py-2.5 text-sm">
            {site?.support_email && (
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-gold" />
                <a className="text-ink-2 hover:underline" href={`mailto:${site.support_email}`}>
                  {site.support_email}
                </a>
              </li>
            )}
            {site?.support_phone && (
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-gold" /> <span className="text-ink-2">{site.support_phone}</span>
              </li>
            )}
            {site?.grievance_officer && (
              <li className="well p-3.5 text-xs leading-relaxed text-muted">
                <span className="font-semibold text-ink">Grievance officer</span> · {site.grievance_officer} ·{" "}
                <a className="font-semibold text-gold-ink hover:underline" href={`mailto:${site.grievance_email}`}>
                  {site.grievance_email}
                </a>
              </li>
            )}
            {!site?.support_email && !site?.support_phone && !site?.grievance_officer && <li className="text-muted">Support contacts will appear here.</li>}
          </ul>
        </InfoCard>
      </div>

      <div className="space-y-5">
        <form onSubmit={change} noValidate className="card p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
              <KeyRound size={18} />
            </span>
            <h2 className="display text-lg">Change password</h2>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="pw-current">
                Current password
              </label>
              <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pw-new">
                New password
              </label>
              <input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="label" htmlFor="pw-confirm">
                Confirm new password
              </label>
              <input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
            <button className="btn btn-dark w-full" disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} Update password
            </button>
          </div>
        </form>

        <button type="button" className="btn btn-outline w-full" onClick={onLogout}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </div>
  );
}

/* ================================================================ Pieces */

function Kpi({ icon, label, value, gold = false }: { icon: React.ReactNode; label: string; value: string; gold?: boolean }) {
  return (
    <div className={`card p-4 sm:p-5 ${gold ? "card-glow" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted sm:text-[0.7rem]">{label}</p>
        <span className="hidden size-8 place-items-center rounded-lg border border-gold/20 bg-gold-soft/60 text-gold sm:grid">{icon}</span>
      </div>
      <p className={`display mt-3 text-[1.35rem] leading-none sm:text-3xl ${gold ? "text-champagne" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Stat({ k, v, bad = false }: { k: string; v: string; bad?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className={`mt-0.5 font-semibold ${bad ? "text-bad" : "text-ink"}`}>{v}</dd>
    </div>
  );
}

function QuickLink({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="card group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-muted">{sub}</span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-gold" />
    </button>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">{icon}</span>
        <h2 className="display text-lg">{title}</h2>
      </div>
      <div className="divide-y divide-line text-sm">{children}</div>
    </div>
  );
}

function Row({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-muted">{k}</span>
      <span className={`text-right font-semibold text-ink ${mono ? "font-mono text-[0.85rem]" : ""}`}>{v}</span>
    </div>
  );
}

function Text({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div className="py-2.5">
      <p className="text-muted">{k}</p>
      <p className="mt-0.5 font-medium leading-relaxed text-ink">{v || "—"}</p>
    </div>
  );
}
