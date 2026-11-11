"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Clock3, FileSearch, RotateCcw, ThumbsUp, XCircle } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { formatPhone } from "@/lib/phone-auth";
import { addDays, rupees, timeAgo } from "@/lib/format";
import type { AdminCtx } from "./admin-console";

export function Overview({ ctx }: { ctx: AdminCtx }) {
  const { stats, apps } = ctx;
  const { site, payment, disclosed } = useSettings();
  if (!stats) return null;
  const refundDays = site?.refund_days ?? 7;
  const now = Date.now();
  const overdue = apps.filter((a) => a.status === "pending" && now - new Date(a.created_at).getTime() > 48 * 3600e3);
  const lateRefunds = apps.filter((a) => a.refund_status === "pending" && a.reviewed_at && new Date(addDays(a.reviewed_at, refundDays)).getTime() < now);
  const setup = [
    { done: disclosed, label: "Publish lender name & RBI registration" },
    { done: Boolean(site?.grievance_officer && site?.grievance_email), label: "Add grievance officer contact" },
    { done: Boolean(payment?.qr_path && payment?.upi_id), label: "Publish payment QR & UPI ID" },
  ];
  const setupDone = setup.every((s) => s.done);

  return (
    <div className="space-y-4">
      {!setupDone && (
        <section className="card card-glow p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-lg">Finish setup to open applications</h2>
            <span className="chip border-gold/30 bg-gold-soft text-gold-ink">{setup.filter((x) => x.done).length} of {setup.length} done</span>
          </div>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-gold to-brand" style={{ width: `${(setup.filter((x) => x.done).length / setup.length) * 100}%` }} /></div>
          <ul className="mt-4 space-y-2.5">
            {setup.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                {s.done ? <CheckCircle2 size={17} className="text-ok" /> : <Circle size={17} className="text-faint" />}
                <span className={s.done ? "text-muted line-through" : "font-medium"}>{s.label}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-dark btn-sm mt-5" onClick={() => ctx.go("settings")}>
            Open settings <ArrowRight size={14} />
          </button>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi icon={<Clock3 size={17} />} label="Awaiting review" value={stats.pending} foot={stats.overdue ? `${stats.overdue} older than 48 h` : "All within 48 h"} alert={stats.overdue > 0} onClick={() => ctx.go("applications", "pending")} />
        <Kpi icon={<ThumbsUp size={17} />} label="Approved" value={stats.accepted} foot={`${rupees(stats.accepted_volume)} requested`} onClick={() => ctx.go("applications", "accepted")} />
        <Kpi icon={<XCircle size={17} />} label="Not approved" value={stats.rejected} foot={`${stats.total} applications in total`} onClick={() => ctx.go("applications", "rejected")} />
        <Kpi
          icon={<RotateCcw size={17} />}
          label="Refunds due"
          value={stats.refunds_pending}
          foot={stats.refunds_pending ? `${rupees(stats.refunds_pending_amount)} to send` : `${rupees(stats.refunded_amount)} refunded so far`}
          alert={lateRefunds.length > 0}
          onClick={() => ctx.go("refunds")}
        />
      </section>

      <KycPending ctx={ctx} />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-lg">New applications <span className="text-muted">· 14 days</span></h2>
            <p className="text-sm text-muted">
              Avg. review time <strong className="text-ink">{stats.avg_review_hours != null ? `${stats.avg_review_hours} h` : "—"}</strong>
            </p>
          </div>
          <DailyBars data={stats.daily} />
        </section>

        <section className="card p-6">
          <h2 className="display text-lg">Needs attention</h2>
          {overdue.length === 0 && lateRefunds.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 size={16} className="text-ok" /> Nothing overdue. Nice work.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {lateRefunds.map((a) => (
                <AttentionRow key={"r" + a.id} icon={<RotateCcw size={15} />} title={`Refund overdue · ${a.full_name}`} sub={`${formatPhone(a.phone)} · ₹${a.fee} to ${a.refund_upi_id ?? "—"}`} onClick={() => ctx.open(a.id)} />
              ))}
              {overdue.map((a) => (
                <AttentionRow key={a.id} icon={<AlertTriangle size={15} />} title={`Review overdue · ${a.full_name}`} sub={`${formatPhone(a.phone)} · submitted ${timeAgo(a.created_at)}`} onClick={() => ctx.open(a.id)} />
              ))}
            </ul>
          )}
        </section>
      </div>

    </div>
  );
}

function Kpi({ icon, label, value, foot, alert = false, onClick }: { icon: React.ReactNode; label: string; value: number; foot: string; alert?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`card group overflow-hidden p-4 text-left sm:p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] ${alert ? "card-glow" : ""}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-gold/15" aria-hidden />
      <div className="relative flex items-center justify-between">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted sm:text-[0.7rem] sm:tracking-[0.14em]">{label}</p>
        <span className="hidden size-8 shrink-0 place-items-center rounded-xl sm:grid sm:size-9 border border-gold/20 bg-gradient-to-br from-gold/15 to-transparent text-gold">{icon}</span>
      </div>
      <p className="display relative mt-3 text-[2rem] leading-none sm:text-[2.6rem]">{value.toLocaleString("en-IN")}</p>
      <p className={`relative mt-2.5 flex items-center gap-1.5 text-[0.7rem] font-medium sm:mt-3 sm:text-xs ${alert ? "text-bad" : "text-muted"}`}>
        {alert && <AlertTriangle size={13} />} {foot}
      </p>
    </button>
  );
}

function AttentionRow({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-start gap-3 py-3 text-left hover:opacity-80">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-bad-soft text-bad">{icon}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{title}</span>
          <span className="block truncate text-xs text-muted">{sub}</span>
        </span>
      </button>
    </li>
  );
}

/** Single-series bar chart: one hue, thin rounded bars, hover tooltip, recessive axis. */
function DailyBars({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(4, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <figure className="mt-4">
      <div className="relative h-40">
        {[0.5, 1].map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${t * 100}%` }}>
            <span className="absolute -top-2.5 right-0 pl-1 text-[0.65rem] text-faint">{Math.round(max * t)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end gap-1.5 pr-6 sm:gap-2.5">
          {data.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-7 rounded-t-[4px] bg-gradient-to-t from-brand/70 to-brand transition group-hover:from-gold/70 group-hover:to-gold"
                style={{ height: d.count ? `${(d.count / max) * 100}%` : "2px", opacity: d.count ? 1 : 0.25 }}
              />
              <div className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg border border-white/10 bg-surface px-2.5 py-1.5 text-xs text-ink shadow-lg group-hover:block">
                <strong>{d.count}</strong> on {fmt(d.day)}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between pr-6 text-[0.68rem] text-faint">
        <span>{data[0] && fmt(data[0].day)}</span>
        <span>{data.at(-1) && fmt(data.at(-1)!.day)}</span>
      </div>
      <figcaption className="sr-only">
        {total} applications in the last 14 days: {data.map((d) => `${fmt(d.day)} ${d.count}`).join(", ")}
      </figcaption>
    </figure>
  );
}

/** Docs each category must provide, as listed on the application form. */
function requiredDocs(category: string) {
  if (category === "Student") return ["ID proof", "Address proof", "Student ID"];
  if (category === "Driver") return ["Driving licence", "Address proof"];
  return ["ID proof", "Address proof"];
}

function KycPending({ ctx }: { ctx: AdminCtx }) {
  const now = Date.now();
  const list = ctx.apps
    .filter((a) => a.status === "pending" && !a.kyc_verified)
    .sort((x, y) => x.created_at.localeCompare(y.created_at));
  const shown = list.slice(0, 6);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
            <FileSearch size={17} />
          </span>
          <div>
            <h2 className="display text-lg leading-tight">KYC pending</h2>
            <p className="text-xs text-muted">Documents waiting to be checked, oldest first</p>
          </div>
          <span className={`chip ml-1 ${list.length ? "border-warn/30 bg-warn-soft text-warn" : "border-ok/30 bg-ok-soft text-ok"}`}>{list.length}</span>
        </div>
        {list.length > shown.length && (
          <button type="button" className="text-sm font-semibold text-gold hover:underline" onClick={() => ctx.go("applications", "pending")}>
            View all {list.length}
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="flex items-center gap-2 px-6 pb-6 pt-4 text-sm text-muted">
          <CheckCircle2 size={16} className="text-ok" /> All KYC documents have been checked.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-t hairline">
          {shown.map((a) => {
            const late = now - new Date(a.created_at).getTime() > 48 * 3600e3;
            const initials = a.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-ink-2">{initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{a.full_name}</p>
                  <p className="truncate text-xs text-muted">
                    <span className="whitespace-nowrap">{formatPhone(a.phone)}</span> · {a.category}
                    <span className="sm:hidden">
                      {" · "}
                      <span className={late ? "font-semibold text-bad" : ""}>{timeAgo(a.created_at)}</span>
                    </span>
                  </p>
                </div>
                <div className="hidden flex-wrap gap-1.5 md:flex">
                  {requiredDocs(a.category).map((d) => (
                    <span key={d} className="chip border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.65rem] font-semibold text-ink-2">
                      {d}
                    </span>
                  ))}
                </div>
                <span className={`hidden w-20 shrink-0 text-right text-xs sm:block ${late ? "font-semibold text-bad" : "text-muted"}`}>{timeAgo(a.created_at)}</span>
                <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={() => ctx.open(a.id)}>
                  <span className="sm:hidden">Review</span>
                  <span className="hidden sm:inline">Review KYC</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

