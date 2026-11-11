"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  BadgeIndianRupee,
  Bike,
  Laptop,
  Smartphone,
  Sprout,
  ArrowUpRight,
  BadgeCheck,
  Briefcase,
  CarFront,
  Check,
  Clock3,
  FileLock2,
  GraduationCap,
  Landmark,
  Lock,
  Plus,
  RotateCcw,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { DisclosureCard } from "./lender-disclosure";
import { FEE } from "@/lib/types";

const MARQUEE = [
  { label: "Students", icon: GraduationCap },
  { label: "Delivery partners", icon: Bike },
  { label: "Drivers", icon: CarFront },
  { label: "Salaried professionals", icon: Briefcase },
  { label: "Shop owners", icon: Store },
  { label: "Freelancers", icon: Laptop },
  { label: "Gig workers", icon: Smartphone },
  { label: "Unemployed", icon: UserRound },
  { label: "First-time borrowers", icon: Sprout },
];

export function Landing() {
  const { site, disclosed } = useSettings();
  const days = site?.refund_days ?? 7;

  return (
    <main className="-mb-16 overflow-x-clip">
      {/* ============================== HERO ============================== */}
      <section className="relative">
        <div className="aurora pointer-events-none absolute inset-0 -top-40" aria-hidden />
        <div className="grid-lines pointer-events-none absolute inset-0 -top-40" aria-hidden />
        <div className="noise pointer-events-none absolute inset-0" aria-hidden />

        <div className="shell relative grid items-center gap-12 pb-14 pt-5 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16 xl:grid-cols-[1.08fr_.92fr]">
          <div className="animate-rise">
            <span className="eyebrow eyebrow-light !text-[0.62rem] sm:!text-[0.68rem]">Easy loan applications for everyone</span>
            <div className="mt-4 flex items-center gap-3 min-[380px]:gap-4 sm:mt-5 sm:gap-8 lg:gap-14 xl:block">
              <h1 className="display min-w-0 flex-1 text-[2.05rem] leading-[1.06] min-[380px]:text-[2.25rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[4.6rem] lg:leading-[1.03] xl:text-[4.6rem] 2xl:text-[5.1rem]">
                <span className="text-gradient">Credit for your</span>
                <br className="max-lg:hidden" />{" "}
                <span className="text-gradient">next chapter,</span>
                <br />
                <span className="serif text-champagne whitespace-nowrap text-[1.12em] leading-none">done right.</span>
              </h1>
              <MiniPhone />
            </div>
            <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-relaxed text-ink-2 sm:mt-5 sm:text-lg">
              Apply in about ten minutes. We verify your documents within <span className="whitespace-nowrap">24–48 hours</span> and hand them to{" "}
              {disclosed ? <strong className="font-semibold text-ink">{site?.lender_name}</strong> : "our RBI-registered lending partner"}. One ₹{FEE} fee, refunded
              in full if you&rsquo;re not approved.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <Link href="/apply" className="btn btn-gold btn-lg !px-3 sm:!px-6">
                <span className="sm:hidden">Apply now</span>
                <span className="hidden sm:inline">Start your application</span> <ArrowRight size={18} />
              </Link>
              <Link href="/how-it-works" className="btn btn-on-dark btn-lg !px-3 sm:!px-6">
                <span className="sm:hidden">How it works</span>
                <span className="hidden sm:inline">See how it works</span>
              </Link>
            </div>
            <div className="mt-6 grid max-w-xl grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:mt-9">
              {[
                ["24–48h", "Review time"],
                [`₹${FEE}`, "One-time fee"],
                [`${days} days`, "Refund window"],
                ["0", "Hidden charges"],
              ].map(([v, l]) => (
                <div key={l} className="bg-paper/85 px-2.5 py-3 backdrop-blur sm:px-4 sm:py-4">
                  <p className="display whitespace-nowrap text-[0.95rem] text-ink sm:text-xl">{v}</p>
                  <p className="mt-0.5 text-[0.6rem] font-medium leading-tight text-muted sm:text-[0.7rem]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <HeroPhone days={days} disclosed={disclosed} />
        </div>
      </section>

      {/* ============================ MARQUEE ============================= */}
      <section className="relative border-y border-white/[0.06] bg-white/[0.015] py-4" aria-label="Who can apply">
        <div className="mask-fade-x overflow-hidden">
          <div className="flex w-max animate-marquee whitespace-nowrap text-sm font-semibold text-muted">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
                {MARQUEE.map(({ label, icon: Icon }) => (
                  <span key={label} className="flex items-center gap-8 pr-8">
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-7 place-items-center rounded-lg border border-gold/20 bg-gold-soft/60 text-gold">
                        <Icon size={14} />
                      </span>
                      {label}
                    </span>
                    <span className="size-1 rounded-full bg-white/20" aria-hidden />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= BENTO ============================== */}
      <section className="theme-light">
        <div className="shell py-14 sm:py-[4.5rem]">
        <SectionHead eyebrow="Why Money Pay" title="Everything a loan application should be." accent="And nothing it shouldn't." />
        <div className="mt-9 grid gap-4 md:grid-cols-6">
          <article className="card card-glow group overflow-hidden p-7 sm:p-9 md:col-span-4 md:row-span-2">
            <div className="flex h-full flex-col gap-8 lg:flex-row lg:items-center">
              <div className="flex-1">
                <IconTile>
                  <RotateCcw size={18} />
                </IconTile>
                <h3 className="display mt-5 text-3xl leading-tight sm:text-4xl">
                  <span className="text-gradient">Not approved?</span> <span className="serif text-champagne">Full refund.</span>
                </h3>
                <p className="mt-4 max-w-sm leading-relaxed text-muted">
                  If your application is declined, your ₹{FEE} goes straight back to your UPI ID within {days} days. The refund reference appears on your application.
                </p>
              </div>
              <Receipt days={days} />
            </div>
          </article>

          <article className="card group p-7 md:col-span-2">
            <div className="flex items-start justify-between">
              <IconTile>
                <Clock3 size={18} />
              </IconTile>
              <Ring />
            </div>
            <h3 className="display mt-5 text-xl">Decision in 24–48 hours</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">Real people review every application, with notes you can read.</p>
          </article>

          <article className="card group p-7 md:col-span-2">
            <div className="flex items-start justify-between">
              <IconTile>
                <FileLock2 size={18} />
              </IconTile>
              <span className="chip border-line bg-paper font-mono text-ink-2">
                <Lock size={11} className="text-gold" /> 04:59
              </span>
            </div>
            <h3 className="display mt-5 text-xl">Documents stay private</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">Private storage. Reviewer links expire after five minutes.</p>
          </article>

          <article className="card group p-7 md:col-span-3">
            <IconTile>
              <Landmark size={18} />
            </IconTile>
            <h3 className="display mt-5 text-xl">A regulated lender, named upfront</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {disclosed && site ? (
                <>
                  Every loan is issued by <span className="text-ink-2">{site.lender_name}</span>, RBI Reg. No.{" "}
                  <span className="font-mono text-gold-ink">{site.lender_reg_no}</span>.
                </>
              ) : (
                "Applications open only once the lender and its RBI registration are published on this site."
              )}
            </p>
          </article>

          <article className="card group p-7 md:col-span-3">
            <IconTile>
              <BadgeCheck size={18} />
            </IconTile>
            <h3 className="display mt-5 text-xl">One payment. Ever.</h3>
            <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2 text-ink-2">
                <Check size={15} className="text-ok" /> ₹{FEE} application fee
              </li>
              {["“Approval” fee", "“Insurance” fee", "“Release” fee"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-faint line-through decoration-bad/60">
                  <X size={15} className="text-bad" /> {t}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
      </section>

      {/* ========================== WHO CAN APPLY ========================== */}
      <section className="section-blue overflow-hidden">
        <div className="shell py-14 sm:py-[4.5rem]">
        <SectionHead eyebrow="Who can apply" title="Built for how India" accent="actually earns." />
        <div className="mt-9 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {[
            { icon: GraduationCap, t: "Students", d: "ID, address proof and your student ID card." },
            { icon: CarFront, t: "Drivers", d: "Driving licence as ID, plus address proof." },
            { icon: Briefcase, t: "Salaried", d: "Any government ID and address proof." },
            { icon: Store, t: "Self-employed", d: "Shop owners, freelancers, gig workers." },
            { icon: UserRound, t: "Unemployed", d: "Just KYC: your ID and address proof." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card group p-4 transition duration-300 last:col-span-2 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:p-6 lg:last:col-span-1">
              <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-brand/25 to-transparent text-brand-ink transition group-hover:from-gold/30 group-hover:text-gold sm:size-12 sm:rounded-2xl">
                <Icon size={19} />
              </span>
              <h3 className="mt-4 text-[0.95rem] font-bold text-ink sm:mt-5 sm:text-base">{t}</h3>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-muted sm:mt-1.5 sm:text-sm">{d}</p>
            </div>
          ))}
        </div>
      </div>
      </section>

      {/* ============================= PROCESS ============================ */}
      <section className="theme-light relative overflow-hidden">
        <div className="shell relative py-14 sm:py-[4.5rem]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead eyebrow="The process" title="Four steps." accent="No surprises." />
            <Link href="/how-it-works" className="btn btn-outline">
              The full process <ArrowUpRight size={15} />
            </Link>
          </div>
          <ol className="relative mt-9 grid gap-0 md:grid-cols-4 md:gap-6">
            <span className="divider-glow absolute left-0 right-0 top-6 hidden md:block" aria-hidden />
            {[
              ["Create your account", "Email and password. Takes 30 seconds."],
              ["Add details & documents", "Personal details, address and ID matched to your category."],
              [`Pay ₹${FEE} by UPI`, "Scan, pay, then add the UTR, a screenshot and your refund UPI ID."],
              ["Decision in 24–48h", `Approved: sent to the lender. Not approved: refunded within ${days} days.`],
            ].map(([t, d], i) => (
              <li key={t} className="relative flex gap-4 pb-7 last:pb-0 md:block md:pb-0">
                {i < 3 && <span className="absolute bottom-0 left-6 top-12 w-px bg-gradient-to-b from-gold/40 to-brand/20 md:hidden" aria-hidden />}
                <span className="relative grid size-12 shrink-0 place-items-center rounded-full border border-gold/40 bg-paper font-display text-sm font-semibold text-gold shadow-[0_0_30px_-6px_rgb(227_194_125/0.6)]">
                  0{i + 1}
                </span>
                <div className="pt-1.5 md:pt-0">
                  <h3 className="display text-lg md:mt-4">{t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted md:mt-2">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* =============================== FEE =============================== */}
      <section className="section-blue overflow-hidden">
        <div className="shell py-14 sm:py-[4.5rem]">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHead eyebrow="The fee, explained" title="One fee." accent="Refunded if you're declined." />
            <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-ink-2 sm:text-lg">
              The ₹{FEE} pays for real people to check your documents and payment. It is not interest, it is never taken from your loan, and it is the only payment
              we will ever ask you for.
            </p>
          </div>

          <div className="card card-glow overflow-hidden">
            <div className="p-6 sm:p-8">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted">Fee breakdown</p>
              <p className="display mt-3 text-6xl">
                <span className="text-champagne">₹{FEE}</span>
                <span className="ml-2 text-base font-medium text-muted">once</span>
              </p>
            </div>
            <div className="perforated h-5 border-y border-dashed border-white/10" aria-hidden />
            <dl className="divide-y divide-white/[0.06] text-sm">
              {[
                ["If approved", "Covers verification. Your application goes to the lender."],
                ["If not approved", `Full ₹${FEE} back to your UPI ID within ${days} days.`],
                ["If payment isn't found", "No refund due. Contact the grievance officer with your UTR."],
                ["Loan interest & charges", "Set by the lender, shown in a Key Fact Statement before you sign."],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 px-6 py-3.5 sm:grid-cols-[170px_1fr] sm:gap-6 sm:px-8">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-faint">{k}</dt>
                  <dd className="text-ink-2">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
      </section>

      {/* ========================= LENDER + FAQ ============================ */}
      <section className="theme-light">
        <div className="shell py-14 sm:py-[4.5rem]">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <SectionHead eyebrow="Good to know" title="Clear answers," accent="up front." />
            <DisclosureCard className="mt-7" />
          </div>
          <div className="self-end border-y border-line">
            {[
              ["Does approval mean I get a loan?", "Approval means your documents and payment are verified and your application is sent to the lender. The lender decides the final amount, interest rate and tenure, and shows you a Key Fact Statement before you sign."],
              ["When do I get my refund?", `Within ${days} days of the decision, to the UPI ID you give us. The refund reference appears on your application.`],
              ["Who sees my documents?", "Only you and our authorised reviewers. Files sit in private storage, and review links expire after five minutes."],
              ["Can I apply again?", "Yes, once your current application has a decision. One application can be under review at a time."],
            ].map(([q, a]) => (
              <details key={q} className="group border-b border-line py-5 last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.02rem] font-semibold text-ink">
                  {q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line-strong text-muted transition group-open:rotate-45 group-open:border-gold/40 group-open:text-gold">
                    <Plus size={16} />
                  </span>
                </summary>
                <p className="mt-3 pr-12 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
            <div className="border-t border-line py-5">
              <Link href="/questions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-gold-ink">
                All FAQs <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* =============================== CTA =============================== */}
      <section className="theme-light pb-14 sm:pb-[4.5rem]">
        <div className="shell">
        <div className="theme-dark section-blue card-glow relative overflow-hidden rounded-[var(--radius-card)] px-6 py-12 text-center shadow-[0_40px_80px_-40px_rgb(11_20_48/0.7)] sm:px-14 sm:py-16">
          <div className="aurora pointer-events-none absolute inset-0" aria-hidden />
          <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="relative">
            <h2 className="display mx-auto max-w-3xl text-[2.1rem] leading-[1.05] sm:text-6xl">
              <span className="text-gradient">Ready when</span> <span className="serif text-champagne">you are.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-ink-2">Easy, fast and hassle-free to apply. Keep your ID, an address proof and any UPI app handy.</p>
            <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-2.5 text-left sm:gap-3 lg:grid-cols-4">
              {[
                [BadgeIndianRupee, "Request up to", "₹5,00,000"],
                [FileCheck2, "Minimum", "documents"],
                [ShieldCheck, "Safe &", "secure"],
                [Clock3, "Decision in", "24–48 hours"],
              ].map(([Icon, a, b]) => {
                const I = Icon as typeof Clock3;
                return (
                  <li key={a as string} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
                      <I size={16} />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[0.7rem] text-muted">{a as string}</span>
                      <span className="block whitespace-nowrap text-[0.82rem] font-semibold text-ink sm:text-sm">{b as string}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link href="/apply" className="btn btn-gold btn-lg mt-8">
              Apply now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------- pieces */

function SectionHead({ eyebrow, title, accent }: { eyebrow: string; title: string; accent?: string }) {
  return (
    <div className="max-w-2xl">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="display mt-4 text-[2.1rem] leading-[1.06] sm:text-[2.9rem]">
        <span className="text-gradient">{title}</span>
        {accent && (
          <>
            {" "}
            <span className="serif text-champagne text-[1.08em]">{accent}</span>
          </>
        )}
      </h2>
    </div>
  );
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-11 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.02] text-gold shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
      {children}
    </span>
  );
}

function Ring() {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="size-14 -rotate-90" aria-hidden>
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dca6" />
          <stop offset="1" stopColor="#7b93ff" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-line)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.32} />
    </svg>
  );
}

function Receipt({ days }: { days: number }) {
  return (
    <div className="theme-dark relative mx-auto w-full max-w-[290px] shrink-0 rotate-[2deg] transition duration-500 group-hover:rotate-0">
      <div className="rounded-2xl border border-white/10 bg-[#111727] p-5 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9)]">
        <div className="flex items-center justify-between">
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-faint">Refund</span>
          <span className="text-[0.68rem] font-semibold text-muted">Money Pay</span>
        </div>
        <p className="display mt-4 text-4xl text-ink">₹{FEE}.00</p>
        <p className="mt-1 text-xs text-muted">to asha@okaxis</p>
        <div className="perforated -mx-5 my-5 h-4 border-y border-dashed border-white/10" aria-hidden />
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-faint">Reason</dt>
            <dd className="text-ink-2">Application declined</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-faint">Window</dt>
            <dd className="text-ink-2">Within {days} days</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-faint">Refund UTR</dt>
            <dd className="font-mono text-ink-2">RFD5512098733</dd>
          </div>
        </dl>
      </div>
      <span className="absolute -right-3 -top-3 rotate-[10deg] rounded-lg border-2 border-ok/70 bg-ok-soft px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em] text-ok shadow-lg">
        Refunded
      </span>
    </div>
  );
}

/** Compact phone shown beside the headline below the lg breakpoint. Everything is
 *  sized in em, so changing the root font-size per breakpoint scales the whole mockup. */
function MiniPhone() {
  return (
    <div className="relative mb-[1.6em] mt-[1.4em] shrink-0 text-[8.4px] min-[380px]:text-[9.2px] min-[420px]:text-[10px] sm:text-[12.5px] md:text-[14px] lg:text-[16px] xl:hidden" aria-hidden>
      <div className="absolute inset-[10%] translate-y-[8%] rounded-[3em] bg-brand/45 blur-2xl" />
      <div className="relative w-[14.2em] rotate-[4deg] animate-float rounded-[2.5em] border border-white/15 bg-gradient-to-b from-[#1b2236] to-[#0b0f1a] p-[0.55em] shadow-[0_2.5em_5em_-1.5em_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.15)]">
        <div className="relative overflow-hidden rounded-[2em] border border-white/[0.06] bg-[#080b14] px-[1.1em] pb-[1.2em] pt-[2.5em]">
          <div className="absolute left-1/2 top-[0.75em] h-[1.15em] w-[4.4em] -translate-x-1/2 rounded-full bg-black" />
          <div className="pointer-events-none absolute -right-[4em] -top-[4em] size-[11em] rounded-full bg-brand/30 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[0.75em] leading-tight text-faint">Good evening</p>
              <p className="text-[1.05em] font-bold leading-tight text-ink">Asha Rao</p>
            </div>
            <span className="grid size-[2.2em] place-items-center rounded-full bg-gradient-to-br from-gold to-[#b8924a] text-[0.85em] font-black text-[#1a1406]">AR</span>
          </div>

          <div className="relative mt-[0.9em] rounded-[1.3em] border border-white/10 bg-gradient-to-br from-[#1a2240] via-[#121830] to-[#0d1120] p-[0.95em]">
            <span className="inline-flex items-center gap-[0.3em] rounded-full border border-warn/25 bg-warn-soft px-[0.6em] py-[0.15em] text-[0.72em] font-bold text-warn">
              <Clock3 className="size-[1em]" /> In review
            </span>
            <p className="display mt-[0.45em] text-[1.9em] leading-none text-ink">₹75,000</p>
            <div className="mt-[0.75em] h-[0.35em] overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold to-brand" />
            </div>
          </div>

          <ul className="relative mt-[0.95em] space-y-[0.65em]">
            {[
              ["Submitted", true],
              ["Documents verified", true],
              ["Payment check", false],
            ].map(([t, done]) => (
              <li key={t as string} className="flex items-center gap-[0.55em]">
                <span
                  className={`grid size-[1.45em] shrink-0 place-items-center rounded-full ${done ? "bg-ok text-paper" : "border border-brand bg-brand-soft"}`}
                >
                  {done ? <Check className="size-[0.85em]" strokeWidth={3} /> : <span className="size-[0.4em] rounded-full bg-brand-ink" />}
                </span>
                <span className="truncate text-[0.82em] font-semibold text-ink-2">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-[0.95em] flex items-center gap-[0.45em] rounded-[0.9em] border border-gold/20 bg-gold-soft/70 px-[0.6em] py-[0.5em]">
            <RotateCcw className="size-[1em] shrink-0 text-gold" />
            <span className="text-[0.72em] font-semibold leading-tight text-gold-ink">Refund protected</span>
          </div>
        </div>
      </div>

      {/* Floating badges — same as desktop, scaled with the phone */}
      <div className="absolute -right-[0.4em] -top-[1.1em] flex items-center gap-[0.5em] whitespace-nowrap rounded-[0.9em] border border-white/10 bg-[#0d1220] px-[0.8em] py-[0.5em] shadow-[0_1.2em_2.4em_-1em_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.06)]">
        <span className="relative flex size-[0.6em]">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex size-[0.6em] rounded-full bg-ok" />
        </span>
        <span className="text-[max(0.95em,9px)] font-semibold text-ink">Decision in 24–48h</span>
      </div>
      <div className="absolute -bottom-[1.4em] -left-[1.6em] flex items-center gap-[0.6em] whitespace-nowrap rounded-[1em] border border-white/10 bg-[#0d1220] px-[0.8em] py-[0.6em] shadow-[0_1.2em_2.4em_-1em_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.06)]">
        <span className="grid size-[2.1em] place-items-center rounded-[0.6em] bg-ok-soft text-ok">
          <BadgeCheck className="size-[1.15em]" />
        </span>
        <span className="leading-tight">
          <span className="block text-[max(0.95em,9px)] font-bold text-ink">Documents verified</span>
          <span className="hidden text-[0.78em] text-muted sm:block">Reviewed by a person, not a bot</span>
        </span>
      </div>
    </div>
  );
}

function HeroPhone({ days, disclosed }: { days: number; disclosed: boolean }) {
  return (
    <div className="relative mx-auto hidden w-full max-w-[420px] animate-rise [animation-delay:150ms] xl:mr-0 xl:block">
      <div className="absolute inset-x-6 bottom-0 top-10 rounded-[3rem] bg-brand/30 blur-3xl" aria-hidden />

      <div className="relative mx-auto w-[320px] animate-float">
        <div className="rounded-[3rem] border border-white/15 bg-gradient-to-b from-[#1b2236] to-[#0b0f1a] p-2.5 shadow-[0_50px_100px_-30px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.15)]">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.06] bg-[#080b14] px-5 pb-6 pt-11">
            <div className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden />
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/30 blur-3xl" aria-hidden />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[0.65rem] text-faint">Good evening</p>
                <p className="text-sm font-bold text-ink">Asha Rao</p>
              </div>
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-gold to-[#b8924a] text-xs font-black text-[#1a1406]">AR</span>
            </div>

            <div className="relative mt-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2240] via-[#121830] to-[#0d1120] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[0.62rem] font-semibold text-muted">Personal loan</span>
                <span className="chip border-warn/25 bg-warn-soft px-2 py-0.5 text-[0.6rem] text-warn">
                  <Clock3 size={10} /> In review
                </span>
              </div>
              <p className="display mt-4 text-[2.1rem] leading-none text-ink">₹75,000</p>
              <p className="mt-1.5 text-[0.68rem] text-muted">Requested · Self-employed</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-gold to-brand" />
              </div>
              <div className="mt-2 flex justify-between text-[0.6rem] text-faint">
                <span>Submitted</span>
                <span className="text-ink-2">Checking</span>
                <span>Decision</span>
              </div>
            </div>

            <ol className="relative mt-5 space-y-4">
              {[
                ["Application submitted", "Today, 10:42", "done"],
                ["Documents verified", "Today, 14:05", "done"],
                ["Payment confirmation", "In progress", "active"],
              ].map(([t, s, st]) => (
                <li key={t} className="flex items-center gap-3">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full ${
                      st === "done" ? "bg-ok text-paper" : "animate-pulse-ring border border-brand bg-brand-soft"
                    }`}
                  >
                    {st === "done" ? <Check size={12} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-brand-ink" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.75rem] font-semibold text-ink">{t}</p>
                    <p className="text-[0.62rem] text-faint">{s}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold-soft/70 p-3">
              <RotateCcw size={15} className="shrink-0 text-gold" />
              <p className="text-[0.66rem] leading-snug text-ink-2">
                <span className="font-semibold text-gold-ink">Refund protected.</span> ₹{FEE} back within {days} days if declined.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute hidden items-center rounded-2xl border border-white/10 bg-[#0d1220] shadow-[0_24px_50px_-18px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.06)] sm:flex -bottom-5 -left-3 gap-3 px-4 py-3 xl:-left-10 2xl:-left-16">
        <span className="grid size-9 place-items-center rounded-xl bg-ok-soft text-ok">
          <BadgeCheck size={17} />
        </span>
        <div>
          <p className="text-[0.8rem] font-bold text-ink">Documents verified</p>
          <p className="text-[0.68rem] text-muted">Reviewed by a person, not a bot</p>
        </div>
      </div>
      <div className="absolute hidden items-center rounded-2xl border border-white/10 bg-[#0d1220] shadow-[0_24px_50px_-18px_rgb(0_0_0/0.95),inset_0_1px_0_rgb(255_255_255/0.06)] sm:flex -right-3 top-0 gap-2.5 px-3.5 py-2.5 xl:-right-2 2xl:-right-12">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-ok" />
        </span>
        <p className="text-[0.75rem] font-semibold text-ink">{disclosed ? "RBI-registered lender" : "Decision in 24–48h"}</p>
      </div>
    </div>
  );
}
