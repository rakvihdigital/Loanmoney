# Money Pay

Loan application platform built with Next.js (App Router) + TypeScript + Tailwind CSS v4 + Supabase.
Applicants apply, upload KYC documents and pay a ₹299 application fee by UPI. Reviewers approve or decline
from an admin console. Approved applications go to the disclosed lending partner. Declined applications
with a confirmed payment are refunded.

## Rules enforced in the database (not just the UI)
- **Lender disclosure first.** Applications are refused until a lender name and RBI registration number are
  published in Admin → Settings. The disclosure appears on every page and is saved with each application.
- **Refund on decline.** Declining an application whose ₹299 payment was confirmed puts it in the refund queue.
  It stays there, with a due date, until a refund UTR is recorded. If the payment can't be found, the applicant
  is told why and pointed to the grievance officer.
- Approval requires payment confirmed and KYC reviewed. Declining requires a note to the applicant.
- One application under review per user. A UTR or payment screenshot can be used only once.
- All writes go through validated `security definer` RPCs. Applicants can read only their own rows, KYC and documents.
- Every step is written to `application_events` and shown as a timeline to the applicant and the admin.

## Setup
Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env.local   # URL + publishable key; service role key is server-only
npm run dev
```

1. Create a Supabase project and run **`supabase/schema.sql`** in the SQL Editor.
   The file is idempotent: run it on a new project, or re-run it to upgrade an existing installation (data is kept).
2. **Authentication → Sign In / Providers → Email → turn OFF "Confirm email".**
   Accounts log in with **mobile number + password**. Internally each account uses a hidden
   address like `m9876543210@phone.moneypay.invalid` (never emailed), so no SMS provider is needed.
   The user's real email is optional and saved separately.
3. Auth → URL Configuration: set Site URL (e.g. `http://localhost:3000`).
4. Create your admin account on `/apply` (mobile number + password), then promote it:
   ```sql
   insert into public.admin_users(user_id)
   select id from auth.users where raw_user_meta_data->>'phone' = '9876543210'
   on conflict do nothing;
   ```
5. Sign in at `/admin/login` (mobile number or email), then open **Settings**:
   - Lender legal name, type, RBI registration number, grievance officer name + email, refund window.
   - Payee name, UPI ID and QR image for collecting the fee.
6. The Overview tab shows a setup checklist until both are done. After that, applications are open.

### Upgrading from the previous version
Re-run `supabase/schema.sql`. It drops the old `submit_application*` / `review_application*` RPCs, adds the refund,
timeline and settings tables, backfills reference codes and timeline events, and moves previously declined applications
with a confirmed payment into the refund queue. Applications submitted before this version have no refund UPI ID; refund
them to the account that paid (the UTR is shown).

## Pages
| Route | What it is |
|---|---|
| `/` | Landing page |
| `/login` | Login hub, all by **mobile number + password**: **My loan** (approved borrowers, admin-generated password) and **Track application** (applicants) |
| `/borrower` | Borrower dashboard: loan amount, EMI, rate, tenure, next EMI, repayment schedule (CSV), lender, history |
| `/apply` | Sign up / sign in, 4-step application wizard, application timeline & refund status |
| `/admin/login` | Admin sign-in (admins only; no sign-up). `/admin` redirects here when signed out |
| `/admin` | Admin console: overview, review queue + review drawer, refunds, settings |
| `/how-it-works`, `/questions`, `/terms`, `/privacy` | Content and legal pages (read lender and refund details live from settings) |
| `/account/reset` | Password reset landing page |

## Code map
- `supabase/schema.sql` — tables, RLS, storage buckets/policies, RPCs
- `src/lib/settings-context.tsx` — public lender + payment settings shared by every page
- `src/lib/application-validation.ts` — client validation mirroring the `submit_loan_application` RPC
- `src/components/apply/*` — wizard, application card + timeline, portal
- `src/components/admin/*` — console shell, overview, applications table, review drawer, refunds, settings
- `src/app/globals.css` — design tokens (`@theme`) and component classes

## Checks
```bash
npm run typecheck
npm test          # validation unit tests (Node 22.6+ / 24)
npm run build
```

## Environment variables
| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | Public key (RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Signs 2-minute download links for borrower documents (`/api/borrower/document`). Never prefix with `NEXT_PUBLIC_`. On Vercel, add it as a normal (non-public) env var. |

## Borrower login (approved loans)
1. Admin → Applications → open an **approved** application → **Loan & borrower login**.
2. Enter the loan details from the lender (account no., amount, rate, tenure, dates, status). The EMI is calculated automatically.
3. Click **Generate password**. Share the password with the borrower; they log in with the **mobile number on their application**.
   The password is shown only once; only a bcrypt hash is stored. **Regenerate** creates a new one and signs out old sessions.
4. The borrower logs in at `/login` → **My loan** (mobile number + password).

The borrower portal (`/borrower`) has five tabs: **Overview** (next EMI, progress, outstanding),
**Repayments** (how to pay + schedule with Paid / Overdue / Due / Upcoming), **Documents** (KFS, sanction letter,
agreement, NOC), **Loan details** (disbursement, charges, lender) and **Account** (profile, change password, help).

Admin keeps it up to date from the same review panel, which has four tabs:
- **Loan**: amount, rate, tenure, dates, disbursement, charges, and *how to pay* (lender's method / https link / instructions).
- **EMIs**: mark each instalment paid (date, amount, reference) once the lender confirms it; undo if needed.
- **Documents**: upload PDFs/images (≤10 MB) to the private `loan-documents` bucket; upload the KFS first.
- **Login**: generate / regenerate the borrower password. Sessions last 12 hours; 5 wrong attempts lock the login for 15 minutes.

## Reset an applicant's password
Mobile-number accounts can't receive reset emails. Reset one in Supabase → SQL Editor:
```sql
update auth.users
   set encrypted_password = extensions.crypt('NewPassword123', extensions.gen_salt('bf'))
 where raw_user_meta_data->>'phone' = '9876543210';
```
Then tell the applicant the new password and ask them to keep it private.

## Operational notes
- This is manual UPI verification, not a payment gateway. A screenshot or UTR alone doesn't prove payment.
  Always check the receiving account before choosing "payment found".
- Refunds are sent manually from your UPI/bank app; record the refund UTR in Admin → Refunds.
- Collect fees into a business account in the company's name, and make sure the published lender details are
  accurate and that your arrangement with the lender permits this fee. These are your responsibility as operator.
- KYC review here is manual document checking. It isn't government verification.
- Files from abandoned submissions can stay in storage. Clean them up periodically according to your retention policy.
