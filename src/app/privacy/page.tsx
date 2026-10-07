import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, Database, Key } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Money Pay by Rakvih",
  description: "Learn how Rakvih Money Pay protects and encrypts your personal information and uploaded KYC documents.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-[1000px] mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline mb-4">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <span className="eyebrow mb-2"><span /> PRIVACY & SECURITY</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: October 2026 · Money Pay by Rakvih</p>
      </div>

      <div className="glass-card p-6 md:p-10 border border-slate-200/80 rounded-3xl bg-white/95 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock size={20} className="text-blue-600" /> 1. Information We Collect
          </h2>
          <p>
            When you submit an application through <strong>Money Pay by Rakvih</strong>, we collect personal and financial verification details strictly required to process your request:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
            <li><strong>Personal Identifiers:</strong> Full legal name, 10-digit mobile number, date of birth, residential address, city, state, and PIN code.</li>
            <li><strong>KYC Documents:</strong> Identity document (Voter ID, Passport, Driving Licence, or Student ID) and residential address proof.</li>
            <li><strong>Payment Receipt Proof:</strong> UPI UTR/transaction reference number and screenshot of payment confirmation.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database size={20} className="text-blue-600" /> 2. How We Store & Protect Data
          </h2>
          <p>
            All submitted identity and address documents are stored in private, encrypted cloud storage buckets. We enforce zero-trust access control protocols:
          </p>
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 font-medium space-y-2">
            <p>🔒 <strong>Private Buckets:</strong> Document files are not publicly accessible on the web.</p>
            <p>⏳ <strong>Short-Lived Signed URLs:</strong> When an administrator reviews your file, a temporary signed URL is generated that automatically expires after 5 minutes.</p>
          </div>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Key size={20} className="text-blue-600" /> 3. Data Usage & Disclosure
          </h2>
          <p>
            We do not sell, rent, or trade your personal information or uploaded KYC documents to third parties for marketing purposes. Data is used exclusively by authorized administrators for evaluating your application status.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-slate-200/80">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" /> 4. Applicant Rights & Inquiries
          </h2>
          <p>
            You have the right to request clarification or deletion of your submitted records after application evaluation completes. For privacy inquiries, please contact the Money Pay support team.
          </p>
        </section>

        <section className="pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Money Pay by Rakvih. All rights reserved.</p>
          <Link href="/terms" className="text-blue-600 font-bold hover:underline">Read Terms and Conditions →</Link>
        </section>
      </div>
    </main>
  );
}
