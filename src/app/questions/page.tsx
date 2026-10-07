import Link from "next/link";
import { ArrowRight, ChevronDown, HelpCircle, ShieldCheck, Sparkles, MessageCircle } from "lucide-react";

export const metadata = {
  title: "FAQs & Support | Money Pay by Rakvih",
  description: "Find answers to common questions about document requirements, ₹299 fee, UPI QR payment, and review status.",
};

const faqs = [
  {
    question: "Which KYC documents do I need to submit?",
    answer: "All applicants must provide a valid identity document (Voter ID, Passport, or Driving Licence) and a current address proof. If you select Student, you must also provide your school/college name and a copy of your student ID card. Drivers must use their Driving Licence as their identity document."
  },
  {
    question: "What is the ₹299 fee used for?",
    answer: "The ₹299 fee is a fixed application processing fee. It covers manual review of your uploaded KYC documents and payment verification by our team. It is separate from your requested loan amount."
  },
  {
    question: "How long will it take for my application to be reviewed?",
    answer: "The expected review window is 24 to 48 hours after your submission. You can check your application status, approval state, and admin notes at any time by signing into your applicant portal."
  },
  {
    question: "How do I make the ₹299 payment?",
    answer: "Open your preferred UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.), scan the published QR code on the payment page, verify the payee name, and pay exactly ₹299. After completing payment, enter the 6–40 character UTR transaction reference and upload your receipt screenshot."
  },
  {
    question: "Does application acceptance guarantee loan payout?",
    answer: "Acceptance means your submitted documents and payment reference have passed manual verification. Loan eligibility, disbursement amounts, and terms are evaluated in a separate assessment step."
  },
  {
    question: "Can I see the reason if my application is rejected?",
    answer: "Yes. If an application is rejected, the reviewing admin is required to provide an explanatory note detailing the decision, which will be visible on your portal dashboard."
  },
  {
    question: "Are my uploaded KYC documents stored securely?",
    answer: "Yes. All uploaded KYC documents and payment receipts are stored in private, protected storage buckets. Document URLs generated for admin review are temporary signed URLs that automatically expire after 5 minutes."
  },
  {
    question: "Can I submit multiple applications at once?",
    answer: "No. Each applicant may have only one active application under review at a time. Transaction references (UTR numbers) cannot be reused across multiple submissions."
  }
];

export default function QuestionsPage() {
  const half = Math.ceil(faqs.length / 2);
  const leftFaqs = faqs.slice(0, half);
  const rightFaqs = faqs.slice(half);

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="eyebrow justify-center mb-3">
          <span /> HELP & SUPPORT
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-base text-slate-600 leading-relaxed">
          Everything you need to know about the Money Pay application process, document guidelines, and review timeline.
        </p>
      </div>

      {/* 2 Equal Columns FAQ Accordion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-16">
        {/* Column 1 */}
        <div className="space-y-4">
          {leftFaqs.map((item, index) => (
            <details
              key={index}
              className="group border border-slate-200/90 rounded-2xl bg-white/95 p-6 transition duration-200 open:shadow-md hover:border-blue-300"
            >
              <summary className="flex items-center justify-between gap-4 font-bold text-slate-900 text-base cursor-pointer list-none select-none">
                <span className="flex items-center gap-3">
                  <HelpCircle size={19} className="text-blue-600 shrink-0" />
                  {item.question}
                </span>
                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition transform shrink-0" />
              </summary>
              <p className="mt-4 text-xs md:text-sm text-slate-600 leading-relaxed pl-7 border-l-2 border-blue-200">
                {item.answer}
              </p>
            </details>
          ))}
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          {rightFaqs.map((item, index) => (
            <details
              key={index + half}
              className="group border border-slate-200/90 rounded-2xl bg-white/95 p-6 transition duration-200 open:shadow-md hover:border-blue-300"
            >
              <summary className="flex items-center justify-between gap-4 font-bold text-slate-900 text-base cursor-pointer list-none select-none">
                <span className="flex items-center gap-3">
                  <HelpCircle size={19} className="text-blue-600 shrink-0" />
                  {item.question}
                </span>
                <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition transform shrink-0" />
              </summary>
              <p className="mt-4 text-xs md:text-sm text-slate-600 leading-relaxed pl-7 border-l-2 border-blue-200">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Support Box */}
      <div className="max-w-3xl mx-auto border border-blue-200 bg-blue-50/70 rounded-3xl p-8 text-center flex flex-col items-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md">
          <MessageCircle size={24} />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Still have questions?</h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          Ready to submit your application? Jump straight to our applicant portal and complete your details in minutes.
        </p>
        <Link href="/apply" className="btn btn-yellow text-xs font-bold px-8 py-4 rounded-xl mt-6 inline-flex items-center gap-2 shadow-md shadow-amber-500/15">
          Start Application Now <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
