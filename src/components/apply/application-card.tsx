"use client";

import { Check, Clock3, RotateCcw, X, CircleSlash } from "lucide-react";
import type { Application, ApplicationEvent, SiteSettings } from "@/lib/types";
import { addDays, dateOnly, dateTime, rupees } from "@/lib/format";
import { RefundBadge, StatusBadge } from "../ui";

type Step = { title: string; detail: string; state: "done" | "active" | "todo" | "bad"; at?: string; icon?: "refund" | "no" };

export function buildTimeline(a: Application, events: ApplicationEvent[], refundDays: number): Step[] {
  const find = (k: ApplicationEvent["kind"]) => events.find((e) => e.kind === k);
  const steps: Step[] = [{ title: "Application submitted", detail: `₹${a.fee} fee · UTR ${a.transaction_id}`, state: "done", at: a.created_at }];

  if (a.status === "pending") {
    steps.push({ title: "Documents & payment check", detail: "Our team is verifying your KYC documents and payment.", state: "active" });
    steps.push({ title: "Decision", detail: `Expected by ${dateOnly(addDays(a.created_at, 2))}`, state: "todo" });
    return steps;
  }

  steps.push({ title: "Documents & payment checked", detail: "Review complete.", state: "done", at: a.reviewed_at ?? undefined });

  if (a.status === "accepted") {
    steps.push({
      title: "Approved — sent to lender",
      detail: a.lender_name ? `${a.lender_name} will contact you with your Key Fact Statement and loan offer.` : "The lender will contact you with your loan offer.",
      state: "done",
      at: a.reviewed_at ?? undefined,
    });
    return steps;
  }

  steps.push({ title: "Not approved", detail: a.admin_note || "See the note from our team.", state: "bad", at: a.reviewed_at ?? undefined });

  if (a.refund_status === "pending") {
    const due = a.reviewed_at ? dateOnly(addDays(a.reviewed_at, refundDays)) : `${refundDays} days`;
    steps.push({ title: "Refund in progress", detail: `₹${a.fee} to ${a.refund_upi_id ?? "your UPI ID"} · due by ${due}`, state: "active", icon: "refund", at: find("refund_due")?.created_at });
  } else if (a.refund_status === "refunded") {
    steps.push({ title: "Refunded", detail: `₹${a.fee} sent · refund UTR ${a.refund_reference}`, state: "done", icon: "refund", at: a.refunded_at ?? undefined });
  } else {
    const ev = find("no_refund");
    if (ev) steps.push({ title: "No refund issued", detail: ev.note, state: "bad", icon: "no", at: ev.created_at });
  }
  return steps;
}

export function Timeline({ steps }: { steps: Step[] }) {
  return (
    <ol>
      {steps.map((s, i) => (
        <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-1.75rem)] w-px bg-line" aria-hidden />}
          <span
            className={`relative grid size-7 shrink-0 place-items-center rounded-full ${
              s.state === "done" ? "bg-ok text-paper" : s.state === "active" ? "bg-brand-soft text-brand ring-2 ring-brand/30" : s.state === "bad" ? "bg-bad-soft text-bad" : "bg-white/[0.05] text-faint"
            }`}
          >
            {s.icon === "refund" ? (
              <RotateCcw size={13} strokeWidth={2.5} />
            ) : s.icon === "no" ? (
              <CircleSlash size={13} />
            ) : s.state === "done" ? (
              <Check size={14} strokeWidth={3} />
            ) : s.state === "bad" ? (
              <X size={14} strokeWidth={3} />
            ) : s.state === "active" ? (
              <Clock3 size={13} strokeWidth={2.5} />
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className={`text-sm font-semibold ${s.state === "todo" ? "text-muted" : "text-ink"}`}>{s.title}</p>
            <p className="mt-0.5 break-words text-sm leading-relaxed text-muted">{s.detail}</p>
            {s.at && <p className="mt-1 text-xs text-faint">{dateTime(s.at)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ApplicationCard({ a, events, site, highlight = false }: { a: Application; events: ApplicationEvent[]; site: SiteSettings | null; highlight?: boolean }) {
  const steps = buildTimeline(a, events, site?.refund_days ?? 7);
  return (
    <article className={`card overflow-hidden ${highlight ? "card-glow" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b hairline bg-gradient-to-r from-white/[0.04] to-transparent px-5 py-5 sm:px-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Loan application</p>
          <p className="display mt-1 text-3xl">{rupees(a.requested_amount)}</p>
          <p className="text-sm text-muted">
            {a.category} · submitted {dateOnly(a.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={a.status} />
          <RefundBadge status={a.refund_status} />
        </div>
      </div>
      <div className="grid gap-8 px-5 py-6 sm:px-7 md:grid-cols-[1fr_260px]">
        <Timeline steps={steps} />
        <dl className="well space-y-3 self-start p-4 text-sm">
          <Item k="Fee paid" v={`₹${a.fee}`} />
          <Item k="UTR" v={a.transaction_id} mono />
          <Item k="Paid to" v={a.payee_name} />
          {a.refund_upi_id && <Item k="Refund UPI" v={a.refund_upi_id} mono />}
          {a.lender_name && <Item k="Lender" v={a.lender_name} />}
          {a.admin_note && a.status !== "rejected" && (
            <div className="border-t hairline pt-3">
              <dt className="text-xs text-muted">Note from our team</dt>
              <dd className="mt-1 leading-relaxed">{a.admin_note}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}

function Item({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-muted">{k}</dt>
      <dd className={`truncate text-right font-semibold ${mono ? "font-mono text-xs" : ""}`}>{v}</dd>
    </div>
  );
}
