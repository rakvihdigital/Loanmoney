"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Mail, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "./ui";
import { useSettings } from "@/lib/settings-context";
import { FEE } from "@/lib/types";

export function Footer() {
  const pathname = usePathname();
  const { site, disclosed } = useSettings();
  if (pathname.startsWith("/admin")) return null;
  const days = site?.refund_days ?? 7;

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-white/[0.06] bg-navy">
      <div className="aurora pointer-events-none absolute inset-x-0 bottom-0 h-[360px] opacity-50 [mask-image:linear-gradient(to_top,#000_40%,transparent)]" aria-hidden />
      <div className="divider-glow absolute inset-x-0 top-0" aria-hidden />

      <div className="shell relative grid grid-cols-2 gap-x-6 gap-y-10 pb-10 pt-12 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Money Pay is a loan application platform. We verify your application;{" "}
            {disclosed ? <span className="text-ink-2">{site?.lender_name}</span> : "our lending partner"} makes every credit decision and disburses every loan.
          </p>
          <Link href="/apply" className="btn btn-gold btn-sm mt-5">
            Start your application <ArrowUpRight size={14} />
          </Link>
        </div>
        <FooterCol
          title="Platform"
          links={[
            ["/apply", "Apply"],
            ["/how-it-works", "How it works"],
            ["/questions", "FAQs"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["/terms", "Fees & terms"],
            ["/privacy", "Privacy policy"],
            ["/terms#grievance", "Grievance redressal"],
          ]}
        />
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-faint">Contact</h3>
          <ul className="mt-5 space-y-3 text-sm text-ink-2">
            {site?.support_email && (
              <li>
                <a className="inline-flex items-center gap-2 hover:text-ink" href={`mailto:${site.support_email}`}>
                  <Mail size={14} className="text-gold" /> {site.support_email}
                </a>
              </li>
            )}
            {site?.support_phone && (
              <li className="inline-flex items-center gap-2">
                <Phone size={14} className="text-gold" /> {site.support_phone}
              </li>
            )}
            {site?.grievance_officer ? (
              <li className="well p-3.5 text-xs leading-relaxed">
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  <ShieldCheck size={13} className="text-gold" /> Grievance officer
                </span>
                <span className="mt-1 block">{site.grievance_officer}</span>
                <a className="text-brand-ink hover:underline" href={`mailto:${site.grievance_email}`}>
                  {site.grievance_email}
                </a>
              </li>
            ) : (
              <li className="text-muted">Contact details will appear here once published.</li>
            )}
            {site?.company_address && <li className="text-xs text-faint">{site.company_address}</li>}
          </ul>
        </div>
      </div>

      {/* Disclosures — above the divider line */}
      <div className="shell relative space-y-2.5 pb-8 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">Fee &amp; refund:</span> a one-time application fee of ₹{FEE} is charged for document and payment verification. If your application is not
          approved, the full ₹{FEE} is refunded to your UPI ID within {days} days. The fee is not interest and is not deducted from any loan.
        </p>
        {disclosed && site && (
          <p>
            <span className="text-muted">Lender:</span> {site.lender_name} ({site.lender_type}, RBI Reg. No. {site.lender_reg_no}). Loan amount, interest rate, tenure and all
            other terms are set by the lender and shown in a Key Fact Statement before you sign any loan agreement.
          </p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/[0.06]">
        <div className="shell flex flex-col items-start gap-2 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site?.company_name || "Money Pay"}. All rights reserved.
          </p>
          <p className="text-muted">
            Designed and developed by{" "}
            <a
              href="https://www.rakvih.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#f5c542] transition-[color,text-shadow] duration-300 hover:text-[#ffd970] hover:[text-shadow:0_0_8px_rgb(245_197_66/0.95),0_0_20px_rgb(245_197_66/0.65),0_0_36px_rgb(245_197_66/0.4)] focus-visible:[text-shadow:0_0_8px_rgb(245_197_66/0.95),0_0_20px_rgb(245_197_66/0.65)]"
            >
              Rakvih
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-faint">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-ink-2 transition hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
