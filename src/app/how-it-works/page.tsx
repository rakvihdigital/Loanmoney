import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  GraduationCap,
  CarFront,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Sparkles,
  Lock
} from "lucide-react";

export const metadata = {
  title: "How It Works | Money Pay by Rakvih",
  description: "Understand the application process, category KYC requirements, ₹299 fee policy, and 24-48 hr review.",
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-12 pb-0">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <span className="eyebrow justify-center mb-3">
          <span /> TRANSPARENT & EASY
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          How Money Pay Works
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Our 3-step application portal makes submitting your details, uploading required documents, and completing the ₹299 application fee fast and straightforward.
        </p>
      </div>

      {/* 3 Steps Overview */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card p-8 border border-slate-200/90 rounded-3xl bg-white shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl mb-6 shadow-inner">
            01
          </div>
          <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">Step One</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Submit Personal & KYC Details</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Create an applicant account or sign in. Fill in your name, contact number, residential address, requested loan amount, and select your applicant category.
          </p>
          <ul className="mt-5 space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> State & PIN code validation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Last 4 digits of Identity document
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Direct category-based uploads
            </li>
          </ul>
        </div>

        <div className="card p-8 border border-slate-200/90 rounded-3xl bg-white shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl mb-6 shadow-inner">
            02
          </div>
          <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Step Two</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Pay ₹299 Fee via Published UPI QR</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Scan the official published UPI payment QR code using Google Pay, PhonePe, Paytm, or any UPI app. Pay exactly ₹299 application processing fee.
          </p>
          <ul className="mt-5 space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Exact ₹299 fixed fee
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Enter 6–40 char UTR reference
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Upload payment screenshot receipt
            </li>
          </ul>
        </div>

        <div className="card p-8 border border-slate-200/90 rounded-3xl bg-white shadow-sm hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl mb-6 shadow-inner">
            03
          </div>
          <span className="text-xs font-bold tracking-widest text-emerald-600 uppercase">Step Three</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Admin Verification & Decision</h2>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Authorized administrators manually verify receiving account funds and inspect document authenticity. Review decisions are published to your portal within 24–48 hours.
          </p>
          <ul className="mt-5 space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> 24–48 hr estimated review window
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Detailed admin decision notes
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" /> Real-time status badge tracking
            </li>
          </ul>
        </div>
      </div>

      {/* Category Document Requirements */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-8 md:p-12 mb-16 shadow-sm">
        <div className="max-w-2xl mb-10">
          <span className="eyebrow mb-2">DOCUMENT CHECKLIST</span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Requirements by Applicant Category
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Please make sure all document uploads are clear, uncropped PNG, JPG, WebP or PDF files under 5 MB each.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <GraduationCap size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Student Applicant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Requires valid Student ID card, Institution Name, Identity Proof, and Address Proof.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <CarFront size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Driver Applicant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Requires Driving Licence as Identity document, plus residential Address Proof.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Briefcase size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Employed / Self-Employed</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Requires Government Identity proof (Voter ID, Passport, DL) and Address proof.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Wallet size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Unemployed Applicant</h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Requires standard Identity document and residential Address document for KYC review.
            </p>
          </div>
        </div>
      </section>

      {/* Fee & Policy Notice Banner - Clean Bottom Margin */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 mb-4 relative overflow-hidden shadow-lg">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-4">
            <ShieldAlert size={16} /> Important Policy & Disclosures
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Application Processing Fee & Assessment
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            The ₹299 fee is non-refundable and strictly covers manual document evaluation and administrative processing. Application acceptance confirms initial document approval; final loan terms, eligibility, and disbursement are subject to separate operator assessment.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/apply" className="btn btn-yellow text-xs font-bold px-6 py-3.5 rounded-xl shadow-md shadow-amber-500/15">
              Go to Application Portal <ArrowRight size={16} />
            </Link>
            <Link href="/questions" className="px-6 py-3.5 rounded-xl border border-slate-700 text-xs font-semibold hover:border-slate-500 transition text-slate-200">
              Read FAQs & Questions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
