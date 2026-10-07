import Link from "next/link";
import { ShieldCheck, ArrowLeft, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | Money Pay by Rakvih",
  description: "Read the Terms and Conditions for using Rakvih Money Pay application and verification services.",
};

export default function TermsPage() {
  return (
    <main className="max-w-[1000px] mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline mb-4">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <span className="eyebrow mb-2"><span /> LEGAL & COMPLIANCE</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: October 2026 · Money Pay by Rakvih</p>
      </div>

      <div className="glass-card p-6 md:p-10 border border-slate-200/80 rounded-3xl bg-white/95 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> 1. Overview & Agreement
          </h2>
          <p>
            Welcome to <strong>Money Pay by Rakvih</strong>. By accessing our portal, filling out an application, or submitting documentation, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully before submitting your application.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" /> 2. Applicant Eligibility
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-2 text-slate-600">
            <li>Applicants must be Indian citizens residing in India.</li>
            <li>Applicants must be at least 18 years of age and not exceed 120 years of age.</li>
            <li>Applicants must provide valid government-issued KYC identification (Aadhaar, Voter ID, Passport, or Driving Licence).</li>
            <li>Student applicants must provide a valid Student Identity Card issued by an accredited institution.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-blue-600" /> 3. Application Processing Fee (₹299)
          </h2>
          <p>
            A non-refundable fee of <strong>₹299</strong> is required for manual document review, payment verification, and KYC evaluation. Payment must be made via the official published UPI QR code or designated UPI ID.
          </p>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
            <strong>Important Notice:</strong> Payment of the ₹299 application processing fee covers document evaluation and verification services only. Application acceptance does not guarantee automatic loan disbursement.
          </div>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> 4. Review Timeline & Verification
          </h2>
          <p>
            Expected review duration is <strong>24–48 hours</strong> from the time of submission. Submissions are reviewed manually by authorized administrators. Incomplete documents or mismatched UTR transaction numbers may lead to application rejection.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" /> 5. Data Privacy & Storage
          </h2>
          <p>
            Your uploaded documents are stored securely using private encrypted storage buckets. Temporary access links generated for admin review expire automatically after 5 minutes.
          </p>
        </section>

        <section className="pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Money Pay by Rakvih. All rights reserved.</p>
          <Link href="/privacy" className="text-blue-600 font-bold hover:underline">Read Privacy Policy →</Link>
        </section>
      </div>
    </main>
  );
}
