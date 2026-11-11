import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CarFront, Check, FileCheck2, GraduationCap, ImageIcon, QrCode, ScanSearch, UserPlus, UserRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DisclosureCard } from "@/components/lender-disclosure";
import { LenderName, RefundDays } from "@/components/settings-text";

export const metadata: Metadata = {
  title: "How it works",
  description: "The four steps from account to decision, what documents you need, and how the refundable ₹299 fee works.",
};

const STEPS = [
  {
    icon: UserPlus,
    title: "Create your account",
    body: "Sign up with your email and a password. Your account keeps your application private and lets you come back to check your status at any time.",
  },
  {
    icon: FileCheck2,
    title: "Add your details and documents",
    body: "Enter your name, mobile number, date of birth, address and the amount you need. Upload a government ID and an address proof. We only ask for the last four characters of your ID number, never the full number.",
  },
  {
    icon: QrCode,
    title: "Pay the ₹299 application fee",
    body: "Scan the QR with any UPI app and pay ₹299. Check that the payee name matches what's shown on the page. Then enter the UTR from your UPI app, upload the payment screenshot, and give us a UPI ID for refunds.",
  },
  {
    icon: ScanSearch,
    title: "Review and decision in 24–48 hours",
    body: "Our team checks your documents and confirms the payment in our account. If approved, your application goes to the lender, who contacts you with a loan offer and Key Fact Statement. If not approved, you get a note explaining why and a full refund.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="-mb-16">
      <PageHeader
        eyebrow="How it works"
        title="From application to decision, step by step."
        intro="Most people finish in about ten minutes. Have your ID, an address proof and a UPI app ready."
      />

      {/* ============================ STEPS — white ============================ */}
      <section className="theme-light">
        <div className="shell py-14 sm:py-[4.5rem]">
          <SectionHead eyebrow="The process" title="Four steps." accent="No surprises." />
          <ol className="mt-9 grid gap-4 md:grid-cols-2">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="card group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-0.5 sm:p-8">
                <span
                  className="display pointer-events-none absolute right-5 top-4 select-none text-[3.75rem] leading-none text-ink/[0.06] transition group-hover:text-gold/20 sm:right-7 sm:top-5 sm:text-[4.75rem]"
                  aria-hidden
                >
                  0{i + 1}
                </span>
                <div className="relative flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
                    <Icon size={19} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-gold-ink">Step {i + 1}</span>
                </div>
                <h2 className="display relative mt-5 text-xl sm:text-2xl">{title}</h2>
                <p className="relative mt-3 text-[0.95rem] leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========================== DOCUMENTS — blue ========================== */}
      <section className="section-blue overflow-hidden">
        <div className="shell grid items-center gap-10 py-14 sm:py-[4.5rem] lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <SectionHead eyebrow="Documents" title="What you'll" accent="need." />
            <p className="mt-4 max-w-md leading-relaxed text-ink-2">
              Clear photos or PDFs. Every applicant needs an ID and an address proof; some categories need one more.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {["Clear & readable", "Up to 5 MB each", "PNG · JPG · WebP · PDF"].map((t) => (
                <li key={t} className="chip border-white/10 bg-white/[0.05] text-ink-2">
                  <ImageIcon size={12} className="text-gold" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card divide-y divide-white/[0.07] overflow-hidden">
            <DocRow icon={<FileCheck2 size={18} />} who="Everyone" what="Voter ID, passport or driving licence, plus a current address proof (utility bill, bank statement or rent agreement)." />
            <DocRow icon={<GraduationCap size={18} />} who="Students" what="Your institution's name and a valid student ID card, in addition to the above." />
            <DocRow icon={<CarFront size={18} />} who="Drivers" what="Your driving licence must be the ID document you upload." />
            <DocRow icon={<UserRound size={18} />} who="Unemployed" what="Just KYC: your ID and a current address proof. Nothing more." />
          </div>
        </div>
      </section>

      {/* ============================ FEE — white ============================ */}
      <section className="theme-light">
        <div className="shell py-14 sm:py-[4.5rem]">
          <SectionHead eyebrow="The fee" title="₹299," accent="refundable if you're not approved." />
          <div className="mt-9 grid items-start gap-6 lg:grid-cols-2">
            <div className="card card-glow p-6 sm:p-8">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-muted">Application fee</p>
              <p className="display mt-2 text-5xl">
                <span className="text-champagne">₹299</span>
                <span className="ml-2 text-base font-medium text-muted">once</span>
              </p>
              <ul className="mt-6 space-y-3.5 text-[0.95rem] leading-relaxed text-ink-2">
                <Point>Paid once, by UPI, to the payee shown on the application page.</Point>
                <Point>It pays for manual checks of your documents and payment. It is not interest and is not taken from your loan.</Point>
                <Point>
                  If your application is not approved, the full ₹299 goes back to the UPI ID you give us within <RefundDays /> days. The refund reference appears on your
                  application.
                </Point>
                <Point>If we can&rsquo;t find your payment, no refund is due. Contact the grievance officer with your UTR and we&rsquo;ll look into it.</Point>
                <Point>We will never ask you for any other payment.</Point>
              </ul>
            </div>
            <div>
              <DisclosureCard />
              <p className="mt-5 px-1 text-[0.95rem] leading-relaxed text-muted">
                <LenderName fallback="The lender" /> makes the credit decision, sets the interest rate and tenure, and pays out the loan. You&rsquo;ll get a Key Fact
                Statement with the full cost before you sign anything.
              </p>
              <Link href="/apply" className="btn btn-gold btn-lg mt-6 w-full sm:w-auto">
                Start your application <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

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

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
        <Check size={12} strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function DocRow({ icon, who, what }: { icon: React.ReactNode; who: string; what: string }) {
  return (
    <div className="flex gap-4 p-5 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-brand/25 to-transparent text-brand-ink">{icon}</span>
      <div>
        <h3 className="font-bold text-ink">{who}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{what}</p>
      </div>
    </div>
  );
}
