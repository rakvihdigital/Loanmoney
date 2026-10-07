# Money Pay — Rakvih

Standalone Next.js App Router + TypeScript + Tailwind CSS + Supabase project.

## Included
- Redesigned cream, navy, blue and yellow layout with a custom application illustration, responsive typography, fee summary, account/payment panels and expandable FAQs.
- Applicant email/password registration and login.
- Fixed ₹299 application processing fee.
- Admin uploads a QR code and publishes the payee name / UPI ID.
- Applicant submits personal details, date of birth, residential address, loan amount, KYC documents, UTR and private payment screenshot.
- Students upload student ID and institution details. Drivers upload their driving licence. All applicants supply identity and address proof.
- KYC documents are private PNG/JPG/WebP/PDF files, maximum 5 MB each. Full document numbers are not collected in text fields; only the last four characters.
- Expected review window: 24–48 hours. Admin accepts or rejects with a note.
- Applicants see only their applications. Admin privileges enforced in PostgreSQL.
- Admin must verify payment and KYC before acceptance. Rejection requires a reason. Private document links expire after five minutes.
- One pending application per user; transaction references cannot be reused.
- QR image is public; payment screenshots are private with temporary signed URLs.
- Submission snapshots payment details for the admin audit trail.

## Start
Requires Node.js 20.9+.

```powershell
cd C:\Users\ADMIN\Desktop\Rakvih\money-pay
npm install
Copy-Item .env.example .env.local
# Fill in .env.local, then:
npm run dev
```

Open http://localhost:3000. Admin dashboard: http://localhost:3000/admin.
The public landing page previews without Supabase; submission requires configuration.

## Updating an existing installation
If you already ran an earlier schema, run ONLY `supabase/migrations/002_kyc.sql`.
It adds the private KYC table and bucket, new submission/review RPCs and disables the
old RPCs so clients cannot bypass document requirements. Existing records are preserved.
Earlier pending applications without KYC cannot be accepted; reject with an explanation
and ask the applicant to submit a new application with the required documents.

Fresh projects: run the complete `supabase/schema.sql` below; it includes the migration.

## Supabase setup
1. Create a Supabase project.
2. Run the complete `supabase/schema.sql` file ONCE in its SQL Editor (new project).
3. Copy the project URL and publishable key into `.env.local`.
   Do not put a service-role or secret key in a NEXT_PUBLIC variable.
4. Configure Auth > URL Configuration: Site URL = http://localhost:3000 for local use.
   Add your deployed URL before going live. Email confirmation is supported:
   users confirm their email and then sign in with their password.
5. Register the admin using the public registration form and confirm their email.
6. Promote ONLY your administrator by running this in Supabase SQL Editor:

```sql
insert into public.admin_users(user_id)
select id from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict do nothing;
```

7. Sign in at /admin. Add the payee name, UPI ID, and PNG/JPG/WebP QR image (max 2 MB).
8. Users pay exactly ₹299 in their UPI app, enter the transaction reference, and upload
   a payment screenshot (max 5 MB). Admin checks the receiving account and reviews.
9. Admin decisions appear when applicants return to the page or press Refresh.

## Validation
`npm run typecheck` and `npm run build`.

## Manual acceptance checks with a configured Supabase project
- Confirm a normal applicant cannot access the admin dashboard or call the review RPC.
- Publish a QR as admin; verify it appears on the applicant page.
- Submit an application with a valid screenshot and transaction reference.
- Confirm another applicant cannot read its record or private screenshot.
- Confirm duplicate transaction references and a second pending application are rejected.
- Verify Accept is blocked unless payment receipt is checked; reject requires a reason.
- Accept/reject as admin; applicant sees the decision and note on refresh.
- Confirm payment configuration changes during submission cause a reload error.

## KYC validation checks
Run with Node.js 24:
`node --experimental-strip-types --test tests/kyc-validation.test.mjs`

Verified locally: six validation tests and production build.
Not verified live: Supabase migrations, RLS, actual storage uploads and RPC decisions
because no project credentials are configured.

With your configured Supabase project, also verify:
- Student submission without a student ID is rejected.
- Driver submission with an identity type other than driving licence is rejected.
- Identity and address proofs must belong to the signed-in applicant.
- Another applicant cannot query KYC details or obtain document signed URLs.
- Legacy submission/review RPCs are unavailable to authenticated and anonymous users.
- Admin acceptance fails without both payment and KYC confirmations.
- Old applications missing KYC cannot be accepted.
- Consent and applicant/KYC data are written atomically by the new submission RPC.

## Operational notes
This is manual UPI verification, not a payment gateway. A screenshot or UTR alone does
not prove payment. Check the actual receiving account. QR uploads do not generate or
validate QR payment content: upload the genuine recipient QR and matching UPI details.
Review time is an estimate; there is no automatic acceptance or automatic loan payout.
Refund handling, lender disclosures, loan terms, and support contact should be finalized
by the operator before collecting real payments. The reference's five-minute promise
and guaranteed/no-score loan claims are not used.

No production Supabase account or credentials are bundled. Auth and RLS need the above setup.
Unused KYC and proof uploads from failed submissions may remain in storage; clean these up periodically
with a trusted admin maintenance job, retaining submitted proofs according to your retention policy.

## Main files
- `src/components/landing.tsx`: redesigned landing sections, application preview and FAQs
- `src/components/money-pay.tsx`: frontend, applicant flow and admin dashboard
- `src/app/page.tsx`: public page
- `src/app/admin/page.tsx`: admin page
- `src/lib/supabase.ts`: browser client (publishable key + RLS)
- `src/app/globals.css`: Tailwind + shared styling
- `supabase/schema.sql`: tables, policies, buckets and secure RPCs

Documentation used:
- https://nextjs.org/docs/app/getting-started/installation
- https://tailwindcss.com/docs/installation/framework-guides/nextjs
- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs


KYC collection supports manual document review. It does not perform government verification or certify regulatory KYC compliance. The operator must define appropriate document, privacy and retention requirements before collecting real records.