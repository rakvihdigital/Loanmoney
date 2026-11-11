import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { GrievanceContact, RefundDays } from "@/components/settings-text";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about the refundable ₹299 fee, documents, review times, refunds and the lender.",
};

const GROUPS: { title: string; items: [string, React.ReactNode][] }[] = [
  {
    title: "The fee",
    items: [
      ["What is the ₹299 fee for?", "It covers the manual review of your documents and the check that your payment reached our account. It is not interest, it is not part of your loan, and it is the only payment we ask for."],
      ["Do I get it back if I'm not approved?", <>Yes. If your application is declined, the full ₹299 is refunded to the UPI ID you gave us within <RefundDays /> days. Your application page shows the refund reference once it&rsquo;s sent.</>],
      ["What if my payment can't be found?", <>If the UTR you entered doesn&rsquo;t match a ₹299 payment in our account, the application is declined without a refund. If you were charged, contact <GrievanceContact /> with your UTR and screenshot.</>],
      ["Someone asked me for another fee to release my loan.", <>That isn&rsquo;t us. We never ask for any payment other than the ₹299 application fee, and never for your UPI PIN or OTP. Don&rsquo;t pay. Report it to <GrievanceContact /> and the cybercrime helpline 1930.</>],
    ],
  },
  {
    title: "Your application",
    items: [
      ["How long does a decision take?", "Usually 24–48 hours after you submit. Your application page updates as it moves through review."],
      ["Does approval mean I'll get a loan?", "Approval means your documents and payment are verified and your application has been sent to the lender. The lender decides the final amount, interest rate and tenure, and gives you a Key Fact Statement before you sign. It can still decline."],
      ["Can I apply again?", "Yes, once your current application has a decision. You can only have one application under review at a time."],
      ["Can I change my application after submitting?", "No. If something is wrong, wait for the decision; if declined you'll be refunded and can apply again with the correct details."],
    ],
  },
  {
    title: "Documents & privacy",
    items: [
      ["What documents do I need?", "A voter ID, passport or driving licence, plus a current address proof. Students also need a student ID card. Drivers must use their driving licence as ID."],
      ["Why only the last four characters of my ID number?", "We don't need your full ID number in a text field, so we don't collect it. Your uploaded document is enough to verify you."],
      ["Who can see my documents?", "Only you and our authorised reviewers. Files are kept in private storage; reviewer links expire after five minutes. Approved applications are shared with the lender."],
    ],
  },
];

export default function QuestionsPage() {
  return (
    <main>
      <PageHeader eyebrow="FAQs" title="Questions, answered plainly." intro="If something isn't covered here, contact our support or grievance team using the details in the footer." />
      <section className="shell py-12 sm:py-14">
        <div className="mx-auto max-w-4xl space-y-10">
          {GROUPS.map((g) => (
            <div key={g.title} id={g.title.replace(/\W+/g, "-").toLowerCase()}>
              <h2 className="display text-3xl">{g.title}</h2>
              <div className="mt-5 divide-y divide-line border-y hairline">
                {g.items.map(([q, a]) => (
                  <details key={q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                      {q}
                      <Plus size={18} className="shrink-0 text-muted transition group-open:rotate-45" />
                    </summary>
                    <div className="mt-3 pr-8 text-sm leading-relaxed text-muted">{a}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
          <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <p className="font-semibold">Ready to apply?</p>
            <Link href="/apply" className="btn btn-dark">
              Start your application
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
