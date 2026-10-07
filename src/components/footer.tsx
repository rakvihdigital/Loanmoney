import Link from "next/link";
import { ArrowRight, Wallet, ShieldCheck, Lock, Clock, Mail, CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 text-slate-400 pt-14 pb-8 px-6 lg:px-12 mt-10">
      {/* Footer Top Header */}
      <div className="max-w-[1360px] mx-auto pb-10 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <Link href="/" className="brand">
            <span className="brand-icon shadow-md shadow-amber-500/20">
              <Wallet size={24} />
            </span>
            <span>
              money<span className="text-blue-400 font-extrabold">pay</span>
              <small className="text-slate-400 tracking-wider">BY RAKVIH</small>
            </span>
          </Link>
          <p className="mt-2 text-xs text-slate-400 max-w-md leading-relaxed font-medium">
            Fast, transparent & encrypted application verification portal for applicants across India.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-full text-xs font-semibold text-slate-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Verification Systems Active
          </span>
          <Link
            href="/apply"
            className="btn btn-yellow text-xs font-extrabold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 hover:-translate-y-0.5 transition duration-200"
          >
            Apply Now <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Footer 4-Column Links Grid */}
      <div className="max-w-[1360px] mx-auto py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-slate-800/80 text-xs">
        {/* Col 1: About & Security */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">About Money Pay</h3>
          <p className="text-slate-400 leading-relaxed">
            Rakvih Money Pay provides structured manual KYC document evaluation and payment reference verification for loan applicants.
          </p>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white text-[11px]">
              <Lock size={14} className="text-emerald-400" /> Private Encrypted Storage
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              All documents are stored encrypted in private storage buckets with temporary 5-minute admin access links.
            </p>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Portal Navigation</h3>
          <ul className="space-y-2.5 text-slate-300 font-semibold">
            <li>
              <Link href="/" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5">
                <span>•</span> Home Portal
              </Link>
            </li>
            <li>
              <Link href="/apply" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5">
                <span>•</span> Application & Payment Form
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5">
                <span>•</span> How Money Pay Works
              </Link>
            </li>
            <li>
              <Link href="/questions" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5">
                <span>•</span> FAQs & Support Center
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5 text-slate-400">
                <span>•</span> Admin Management Panel
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal & Compliance */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Legal & Policies</h3>
          <ul className="space-y-2.5 text-slate-300 font-semibold">
            <li>
              <Link href="/terms" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5">
                <span>•</span> Terms & Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5">
                <span>•</span> Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5 text-slate-400">
                <span>•</span> ₹299 Processing Fee Terms
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-blue-400 transition duration-200 flex items-center gap-1.5 text-slate-400">
                <span>•</span> Category Document Guidelines
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Verification Info & Support */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-white tracking-wide uppercase">Verification Desk</h3>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-400 shrink-0" />
              <span>Review Time: <strong>24–48 Hours</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>Processing Fee: <strong>₹299 Fixed</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-blue-400 shrink-0" />
              <span>Support Email: <strong className="text-slate-200">support@rakvih.com</strong></span>
            </div>
          </div>
          <Link
            href="/apply"
            className="mt-3 inline-block w-full text-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 font-bold transition duration-200"
          >
            Check Application Status →
          </Link>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-[1360px] mx-auto pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-slate-500">
        <div className="space-y-1">
          <p className="font-semibold text-slate-400">© {new Date().getFullYear()} Money Pay by Rakvih. All rights reserved.</p>
          <div className="flex gap-4 text-[11px] font-semibold text-slate-400">
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/questions" className="hover:underline">FAQs</Link>
          </div>
        </div>
        <p className="max-w-xl text-[11px] leading-relaxed text-slate-500 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          The ₹299 application processing fee is strictly non-refundable and covers manual document evaluation and administrative processing. Application acceptance confirms initial document approval; final loan terms, eligibility, and disbursement are subject to separate operator assessment.
        </p>
      </div>
    </footer>
  );
}
