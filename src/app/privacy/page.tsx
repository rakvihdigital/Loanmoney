import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { GrievanceContact, LenderName } from "@/components/settings-text";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What we collect, why, who can see it and how to ask for it to be deleted.",
};

export default function PrivacyPage() {
  return (
    <main>
      <PageHeader eyebrow="Legal" title="Privacy policy" intro="What we collect, why we collect it, and who can see it." />
      <section className="shell py-10">
        <article className="prose-legal max-w-3xl">
          <h2>What we collect</h2>
          <ul>
            <li><strong>Account:</strong> your email address and a password (stored hashed by our authentication provider).</li>
            <li><strong>Application:</strong> name, mobile number, date of birth, address, category, amount requested and, for students, your institution.</li>
            <li><strong>Documents:</strong> images or PDFs of your ID, address proof and student ID. For your ID number we keep only the last four characters as text.</li>
            <li><strong>Payment:</strong> the UTR, your payment screenshot and the UPI ID you give us for refunds.</li>
          </ul>

          <h2>Why we collect it</h2>
          <p>To verify your identity, address and payment; to make a decision on your application; to refund you if you&rsquo;re not approved; and to pass approved applications to the lender.</p>

          <h2>Who can see it</h2>
          <ul>
            <li>You, when signed in to your account.</li>
            <li>Our authorised reviewers. Documents are stored in private storage, and reviewer links expire after five minutes.</li>
            <li><LenderName fallback="The lending partner" />, for applications that are approved, so it can assess and offer a loan.</li>
          </ul>
          <p>We don&rsquo;t sell your data or share it for marketing.</p>

          <h2>Consent</h2>
          <p>We record when you give consent to the document review. You can withdraw consent before a decision is made by contacting us; your application will then be closed.</p>

          <h2>How long we keep it</h2>
          <p>We keep application records and documents for as long as required by law and our lender&rsquo;s record-keeping obligations, then delete them.</p>

          <h2>Your rights</h2>
          <p>You can ask for a copy of your data, a correction, or deletion where the law allows. Contact <GrievanceContact />.</p>
        </article>
      </section>
    </main>
  );
}
