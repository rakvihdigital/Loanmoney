"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, Info, Loader2, RotateCcw, XCircle, X } from "lucide-react";
import type { ApplicationStatus, RefundStatus } from "@/lib/types";

export function Logo({ dark: _dark = true, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Money Pay home">
      <span
        className="relative grid size-9 place-items-center overflow-hidden rounded-[0.7rem] text-[#1a1406] shadow-[0_8px_24px_-8px_rgb(227_194_125/0.7),inset_0_1px_0_rgb(255_255_255/0.6)]"
        style={{ background: "linear-gradient(145deg,#f6e3b4 0%,#e3c27d 45%,#b8924a 100%)" }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18V7.5l8 6 8-6V18" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="display text-[1.15rem] tracking-[-0.04em] text-ink">
            money<span className="text-champagne">pay</span>
          </span>
        </span>
      )}
    </Link>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === "accepted")
    return (
      <span className="chip bg-ok-soft text-ok border-ok/15">
        <CheckCircle2 size={13} /> Approved
      </span>
    );
  if (status === "rejected")
    return (
      <span className="chip bg-bad-soft text-bad border-bad/15">
        <XCircle size={13} /> Not approved
      </span>
    );
  return (
    <span className="chip bg-warn-soft text-warn border-warn/15">
      <Clock3 size={13} /> Under review
    </span>
  );
}

export function RefundBadge({ status }: { status: RefundStatus }) {
  if (status === "pending")
    return (
      <span className="chip bg-gold-soft text-gold-ink border-gold/25">
        <RotateCcw size={12} /> Refund due
      </span>
    );
  if (status === "refunded")
    return (
      <span className="chip bg-ok-soft text-ok border-ok/15">
        <CheckCircle2 size={12} /> Refunded
      </span>
    );
  return null;
}

export function Notice({
  tone = "info",
  children,
  onClose,
}: {
  tone?: "info" | "ok" | "bad" | "warn";
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const styles = {
    info: "bg-brand-soft text-brand-ink border-brand/15",
    ok: "bg-ok-soft text-ok border-ok/20",
    bad: "bg-bad-soft text-bad border-bad/20",
    warn: "bg-warn-soft text-warn border-warn/20",
  }[tone];
  const Icon = tone === "ok" ? CheckCircle2 : tone === "bad" ? AlertCircle : tone === "warn" ? AlertCircle : Info;
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium animate-fade ${styles}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 leading-relaxed">{children}</div>
      {onClose && (
        <button type="button" aria-label="Dismiss" onClick={onClose} className="opacity-60 hover:opacity-100">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-20 text-sm font-medium text-muted">
      <Loader2 className="animate-spin text-brand" size={28} />
      {label}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id + "-error"} className="field-error">
      <AlertCircle size={13} className="shrink-0" /> {message}
    </p>
  );
}

export function SetupRequired() {
  return (
    <div className="shell py-20">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <span className="eyebrow eyebrow-light">Setup required</span>
        <h1 className="display mt-3 text-3xl">Connect Supabase to continue</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Add <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">.env.local</code>, run{" "}
          <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-xs">supabase/schema.sql</code>, then restart the dev server.
        </p>
      </div>
    </div>
  );
}
