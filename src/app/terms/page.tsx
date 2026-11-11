import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  Check,
  Clock3,
  FileSearch,
  Landmark,
  Lock,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionHead } from "@/components/section-head";
import { DisclosureCard } from "@/components/lender-disclosure";
import { GrievanceContact, LenderName, RefundDays } from "@/components/settings-text";

export const metadata: Metadata = {
  title: "Fees & terms",
  description: "Terms of use, the refundable ₹299 application fee, the lender relationship and grievance redressal.",
};

export default function TermsPage() {
  return (
    <main className="-mb-16">
      <PageHeader eyebrow="Fees & terms" title="Clear terms, in plain language." intro="What you're agreeing to when you apply with Money Pay. Short, honest and worth two minutes before you start." />

      {/* ======================= AT A GLANCE + 01–02 — white ======================= */}
      <section className="theme-light">
        <div className="shell py-14 sm:py-[4.5rem]">
          <SectionHead eyebrow="At a glance" title="The short" accent="version." />
          <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Glance icon={<Building2 size={18} />} value="Platform" label={<>We verify; <LenderName fallback="the lender" /> lends.</>} />
            <Glance icon={<BadgeIndianRupee size={18} />} value="₹299 once" label="Never taken from your loan." />
            <Glance
              icon={<RotateCcw size={18} />}
              value={
                <>
                  <RefundDays />
                  -day refund
                </>
              }
              label="Full refund if you're not approved."
            />
            <Glance icon={<Clock3 size={18} />} value="24–48 hours" label="Typical review time." />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <TermCard n="01" icon={<Building2 size={18} />} title="Who we are">
              <p>
                Money Pay is a loan application platform. We collect your application, verify your documents and payment, and pass approved applications to{" "}
                <strong>
                  <LenderName />
                </strong>
                .
              </p>
              <p>
                We are <strong>not a lender</strong>. All credit decisions, loan agreements, interest rates, charges and disbursements are made by the lender.
              </p>
            </TermCard>
            <TermCard n="02" icon={<UserCheck size={18} />} title="Eligibility">
              <Points
                items={[
                  "You must be between 18 and 120 years old and resident in India.",
                  "You must submit your own documents. Someone else's documents or false information lead to rejection and may be reported.",
                  "You may have one application under review at a time.",
                ]}
              />
            </TermCard>
          </div>
        </div>
      </section>

      {/* ============================ 03 FEE — blue ============================ */}
      <section className="section-blue overflow-hidden">
        <div className="shell grid items-center gap-10 py-14 sm:py-[4.5rem] lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <SectionHead eyebrow="03 · The application fee" title="One fee." accent="Fully refundable if you're declined." />
            <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-ink-2">
              A one-time fee of ₹299 per application, paid by UPI to the payee shown on the application page. It covers manual verification of your documents and
              payment.
            </p>
            <ul className="mt-6 space-y-3 text-[0.95rem] text-ink-2">
              {["It is not interest.", "It is never deducted from any loan.", "It is the only payment we will ever request from you."].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="card card-glow overflow-hidden">
            <div className="flex items-end justify-between gap-4 p-6 sm:p-8">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted">What happens to your ₹299</p>
                <p className="display mt-3 text-5xl sm:text-6xl">
                  <span className="text-champagne">₹299</span>
                </p>
              </div>
              <span className="chip border-gold/30 bg-gold-soft text-gold-ink">One-time</span>
            </div>
            <div className="perforated h-5 border-y border-dashed border-white/10" aria-hidden />
            <ul className="divide-y divide-white/[0.06]">
              <Outcome tone="ok" title="If you're approved" body="The fee covers the verification work, and your application goes to the lender." />
              <Outcome
                tone="gold"
                title="If you're not approved"
                body={
                  <>
                    The full ₹299 is refunded to your UPI ID within <RefundDays /> days of the decision. The refund reference appears on your application.
                  </>
                }
              />
              <Outcome tone="bad" title="If your payment can't be found" body="The application is declined and no refund is due. You can raise it with the grievance officer (section 07)." />
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== 04–07 — white ===================== */}
      <section className="theme-light">
        <div className="shell py-14 sm:py-[4.5rem]">
          <SectionHead eyebrow="Before & after you apply" title="Good to" accent="know." />
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            <TermCard n="04" icon={<FileSearch size={18} />} title="Review and decision">
              <p>We aim to review applications within 24–48 hours.</p>
              <p>
                Approval means your documents and payment were verified and your application was sent to the lender. <strong>It does not guarantee a loan.</strong>
              </p>
              <p>
                Before you sign, the lender shares a Key Fact Statement with the APR, all charges and the repayment schedule. The lender may decline or offer different
                terms.
              </p>
            </TermCard>
            <TermCard n="05" icon={<ShieldCheck size={18} />} title="Your responsibilities">
              <Points
                items={[
                  "Check the payee name before paying, and keep your UTR and screenshot.",
                  "Never share your UPI PIN, OTP or card details with anyone, including people claiming to be from us.",
                  "Don't pay any further fee to anyone claiming to act for Money Pay or the lender. Report it instead.",
                ]}
              />
            </TermCard>
            <TermCard n="06" icon={<Lock size={18} />} title="Your data">
              <p>We collect only what's needed to verify your application, keep documents in private storage, and share approved applications with the lender.</p>
              <Link href="/privacy" className="inline-flex items-center gap-1.5 font-semibold text-gold-ink hover:underline">
                Read the privacy policy <ArrowRight size={14} />
              </Link>
            </TermCard>
          </div>

          {/* 07 Grievance */}
          <div id="grievance" className="mt-14 grid scroll-mt-28 items-start gap-8 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <SectionHead eyebrow="07 · Grievance redressal" title="Something wrong?" accent="We'll fix it." />
              <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-ink-2">
                For any complaint about your application, fee or refund, contact <GrievanceContact />.
              </p>
              <ol className="mt-8">
                {[
                  [MessageSquareWarning, "Raise your complaint", "Email the grievance officer with your application reference and UTR."],
                  [Clock3, "Acknowledged in 2 working days", "You'll hear back that we've received it."],
                  [Check, "Resolved within 30 days", "We aim to close every complaint within 30 days."],
                  [Landmark, "Escalate if needed", "For complaints about the lender not resolved in 30 days, contact the RBI Integrated Ombudsman at cms.rbi.org.in."],
                ].map(([Icon, t, d], i, arr) => {
                  const I = Icon as typeof Check;
                  return (
                    <li key={t as string} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < arr.length - 1 && <span className="absolute bottom-0 left-5 top-11 w-px bg-gradient-to-b from-gold/50 to-gold/10" aria-hidden />}
                      <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-white text-gold shadow-sm">
                        <I size={16} />
                      </span>
                      <div className="pt-1.5">
                        <p className="font-semibold text-ink">{t as string}</p>
                        <p className="mt-0.5 text-[0.92rem] leading-relaxed text-muted">{d as string}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="space-y-4 lg:sticky lg:top-28">
              <DisclosureCard />
              <div className="card p-6">
                <p className="text-sm leading-relaxed text-muted">Ready to go? It takes about ten minutes, and you can track every step afterwards.</p>
                <Link href="/apply" className="btn btn-gold btn-lg mt-4 w-full">
                  Start your application <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Glance({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="card p-4 sm:p-6">
      <span className="grid size-10 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">{icon}</span>
      <p className="display mt-4 text-lg leading-tight sm:mt-5 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[0.8rem] leading-snug text-muted sm:text-sm">{label}</p>
    </div>
  );
}

function TermCard({ n, icon, title, children }: { n: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <article className="card group relative overflow-hidden p-6 sm:p-8">
      <span
        className="display pointer-events-none absolute right-6 top-5 select-none text-[3.25rem] leading-none text-ink/[0.06] transition group-hover:text-gold/20 sm:right-7 sm:text-[4rem]"
        aria-hidden
      >
        {n}
      </span>
      <span className="relative grid size-11 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">{icon}</span>
      <h2 className="display relative mt-5 text-xl sm:text-2xl">{title}</h2>
      <div className="relative mt-3 space-y-3 text-[0.95rem] leading-relaxed text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink">{children}</div>
    </article>
  );
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3">
          <span className="mt-[0.55rem] size-1.5 shrink-0 rounded-full bg-gold" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Outcome({ tone, title, body }: { tone: "ok" | "gold" | "bad"; title: string; body: React.ReactNode }) {
  const style = { ok: "bg-ok-soft text-ok", gold: "bg-gold-soft text-gold", bad: "bg-bad-soft text-bad" }[tone];
  const Icon = tone === "ok" ? Check : tone === "gold" ? RotateCcw : MessageSquareWarning;
  return (
    <li className="flex gap-4 px-6 py-5 sm:px-8">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${style}`}>
        <Icon size={16} />
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </li>
  );
}
