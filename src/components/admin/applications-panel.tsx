"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { rupees, timeAgo } from "@/lib/format";
import { RefundBadge, StatusBadge } from "../ui";
import { formatPhone } from "@/lib/phone-auth";
import type { AdminCtx } from "./admin-console";

const FILTERS = [
  ["pending", "Under review"],
  ["accepted", "Approved"],
  ["rejected", "Not approved"],
  ["all", "All"],
] as const;

export function ApplicationsPanel({ ctx, filter, setFilter }: { ctx: AdminCtx; filter: string; setFilter: (f: string) => void }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = ctx.apps.filter((a) => filter === "all" || a.status === filter);
    // Oldest first for the review queue, newest first otherwise
    if (filter === "pending") list.reverse();
    if (!needle) return list;
    return list.filter((a) =>
      [a.full_name, a.phone, a.transaction_id, a.refund_upi_id ?? ""].some((s) => s.toLowerCase().includes(needle)),
    );
  }, [ctx.apps, filter, q]);

  const count = (f: string) => ctx.apps.filter((a) => f === "all" || a.status === f).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-1 rounded-xl border hairline bg-white/[0.03] p-1 sm:flex">
          {FILTERS.map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-3.5 ${filter === f ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {label} <span className={`ml-1 text-xs ${filter === f ? "text-paper/60" : "text-faint"}`}>{count(f)}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input className="!pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, mobile or UTR" aria-label="Search applications" />
        </div>
      </div>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted">{q ? "No applications match your search." : "No applications here yet."}</p>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <thead className="border-b hairline bg-white/[0.02] text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Applicant</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">UTR</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((a) => {
                  const late = a.status === "pending" && Date.now() - new Date(a.created_at).getTime() > 48 * 3600e3;
                  return (
                    <tr key={a.id} onClick={() => ctx.open(a.id)} className="cursor-pointer transition hover:bg-white/[0.03]">
                      <td className="px-5 py-3.5">
                        <button type="button" className="text-left font-semibold hover:underline" onClick={() => ctx.open(a.id)}>
                          {a.full_name}
                        </button>
                        <p className="text-xs text-muted">
                          {formatPhone(a.phone)} · {a.category}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-semibold">{rupees(a.requested_amount)}</td>
                      <td className="px-5 py-3.5 font-mono text-xs">{a.transaction_id}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={a.status} />
                          <RefundBadge status={a.refund_status} />
                        </div>
                      </td>
                      <td className={`px-5 py-3.5 text-xs ${late ? "font-semibold text-bad" : "text-muted"}`}>{timeAgo(a.created_at)}</td>
                      <td className="pr-4 text-faint">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Mobile list */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => ctx.open(a.id)} className="w-full px-4 py-4 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{a.full_name}</p>
                        <p className="text-xs text-muted">
                          {formatPhone(a.phone)} · {timeAgo(a.created_at)}
                        </p>
                      </div>
                      <p className="font-semibold">{rupees(a.requested_amount)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusBadge status={a.status} />
                      <RefundBadge status={a.refund_status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
