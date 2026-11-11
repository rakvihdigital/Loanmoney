"use client";

import { Building2, ShieldCheck } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

/** Thin bar shown above the navigation on every public page. */
export function DisclosureBar() {
  const { site, disclosed, loading } = useSettings();
  if (loading) return <div className="h-8 border-b border-white/[0.06] sm:h-9" />;
  return (
    <div className="relative border-b border-white/[0.06] bg-white/[0.015] text-[0.72rem] text-ink-2">
      <div className="shell flex min-h-8 items-center justify-center gap-2 py-1.5 text-center sm:min-h-9 sm:py-2">
        <ShieldCheck size={13} className="hidden shrink-0 text-gold sm:block" />
        {disclosed && site ? (
          <span className="truncate">
            <span className="hidden sm:inline">Loans are provided by </span>
            <strong className="font-semibold text-ink">{site.lender_name}</strong>
            <span className="hidden sm:inline">, an RBI-registered {site.lender_type === "Other RBI-regulated entity" ? "regulated entity" : site.lender_type}</span> · RBI Reg.{" "}
            <span className="font-mono text-gold-ink">{site.lender_reg_no}</span>
          </span>
        ) : (
          <span className="truncate">
            <span className="sm:hidden">Lender not published yet · applications closed</span>
            <span className="hidden sm:inline">Lender details have not been published yet. Applications open once they are.</span>
          </span>
        )}
      </div>
    </div>
  );
}

/** Full disclosure block used on the landing, apply and legal pages. */
export function DisclosureCard({ className = "" }: { className?: string }) {
  const { site, disclosed } = useSettings();
  return (
    <div className={`card card-glow p-6 sm:p-7 ${className}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold-soft text-gold">
          <Building2 size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">Lending partner</p>
          {disclosed && site ? (
            <>
              <p className="mt-1 text-base font-bold text-ink">{site.lender_name}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Type" value={site.lender_type} />
                <Row label="RBI registration" value={site.lender_reg_no} mono />
                {site.lender_website && (
                  <Row
                    label="Website"
                    value={
                      <a className="text-brand underline-offset-2 hover:underline" href={site.lender_website} target="_blank" rel="noopener noreferrer">
                        {site.lender_website.replace(/^https?:\/\//, "")}
                      </a>
                    }
                  />
                )}
                <Row label="Sourcing platform" value={site.company_name || "Money Pay"} />
              </dl>
              <p className="mt-4 border-t hairline pt-4 text-xs leading-relaxed text-muted">
                Grievance officer: <strong className="text-ink-2">{site.grievance_officer}</strong> ·{" "}
                <a className="text-brand hover:underline" href={`mailto:${site.grievance_email}`}>
                  {site.grievance_email}
                </a>
                {site.grievance_phone && <> · {site.grievance_phone}</>}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Lender details have not been published yet. Applications stay closed until the lending partner and its RBI registration are shown here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 sm:block">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`text-right font-semibold text-ink-2 sm:text-left ${mono ? "font-mono text-[0.82rem]" : ""}`}>{value}</dd>
    </div>
  );
}
