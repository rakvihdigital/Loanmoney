"use client";

import { useState } from "react";
import { Check, Copy, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings-context";
import { addDays, dateOnly, errorText, rupees } from "@/lib/format";
import type { Application } from "@/lib/types";
import { formatPhone } from "@/lib/phone-auth";
import type { AdminCtx } from "./admin-console";

export function RefundsPanel({ ctx }: { ctx: AdminCtx }) {
  const { site } = useSettings();
  const days = site?.refund_days ?? 7;
  const due = ctx.apps
    .filter((a) => a.refund_status === "pending")
    .sort((x, y) => new Date(x.reviewed_at ?? x.created_at).getTime() - new Date(y.reviewed_at ?? y.created_at).getTime());
  const done = ctx.apps
    .filter((a) => a.refund_status === "refunded")
    .sort((x, y) => new Date(y.refunded_at ?? 0).getTime() - new Date(x.refunded_at ?? 0).getTime())
    .slice(0, 25);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Refunds to send" value={String(due.length)} />
        <Tile label="Amount owed" value={rupees(due.reduce((s, a) => s + a.fee, 0))} />
        <Tile label="Refund window" value={`${days} days`} />
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b hairline px-6 py-4 font-bold">Due</h2>
        {due.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No refunds waiting. Declined applications with a confirmed payment appear here automatically.</p>
        ) : (
          <ul className="divide-y divide-line">
            {due.map((a) => (
              <RefundRow key={a.id} a={a} days={days} ctx={ctx} />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="card overflow-hidden">
          <h2 className="border-b hairline px-6 py-4 font-bold">Recently refunded</h2>
          <ul className="divide-y divide-line text-sm">
            {done.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => ctx.open(a.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-left hover:bg-white/[0.03]">
                  <span className="min-w-40 flex-1 font-semibold">{a.full_name}</span>
                  <span className="font-mono text-xs text-muted">{a.refund_reference}</span>
                  <span className="text-xs text-muted">{a.refunded_at && dateOnly(a.refunded_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function RefundRow({ a, days, ctx }: { a: Application; days: number; ctx: AdminCtx }) {
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const dueAt = addDays(a.reviewed_at ?? a.created_at, days);
  const late = new Date(dueAt).getTime() < Date.now();

  async function save() {
    if (ctx.demo) {
      ctx.patch(a.id, { refund_status: "refunded", refund_reference: ref.toUpperCase(), refunded_at: new Date().toISOString() });
      ctx.toast("ok", `Demo: refund recorded for ${a.full_name}. Not saved.`);
      return;
    }
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_mark_refunded", { p_id: a.id, p_reference: ref });
    setBusy(false);
    if (error) return ctx.toast("bad", errorText(error));
    ctx.toast("ok", `Refund recorded for ${a.full_name}.`);
    await ctx.reload();
  }

  return (
    <li className="grid gap-4 px-6 py-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="font-semibold hover:underline" onClick={() => ctx.open(a.id)}>
            {a.full_name}
          </button>
          <span className="text-xs text-muted">{formatPhone(a.phone)}</span>
          <span className={`chip ${late ? "bg-bad-soft text-bad" : "bg-gold-soft text-gold-ink"}`}>{late ? "Overdue" : "Due"} {dateOnly(dueAt)}</span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-2">
          ₹{a.fee} to
          {a.refund_upi_id ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 font-mono text-[0.82rem] font-semibold hover:text-brand"
              onClick={() => {
                void navigator.clipboard.writeText(a.refund_upi_id!);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {a.refund_upi_id} {copied ? <Check size={13} className="text-ok" /> : <Copy size={13} className="text-faint" />}
            </button>
          ) : (
            <span className="text-muted">the account that paid (UTR {a.transaction_id})</span>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <input className="font-mono lg:!w-48" value={ref} maxLength={40} onChange={(e) => setRef(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} placeholder="Refund UTR" aria-label={`Refund UTR for ${a.full_name}`} />
        <button type="button" className="btn btn-dark shrink-0" disabled={busy || ref.length < 6} onClick={() => void save()}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Mark refunded
        </button>
      </div>
    </li>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}
