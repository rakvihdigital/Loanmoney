import type { BorrowerPortalData } from "./types";
import { emi } from "./loan-math.ts";

/** Sample loan shown only in demo mode (no Supabase configured). */
export function demoPortal(): BorrowerPortalData {
  const now = Date.now();
  const iso = (daysAgo: number) => new Date(now - daysAgo * 864e5).toISOString();
  const date = (daysFromNow: number) => new Date(now + daysFromNow * 864e5).toISOString().slice(0, 10);
  const monthly = emi(90000, 14, 12);
  return {
    application: {
      ref_code: "",
      full_name: "Karthik N",
      phone: "9876543210",
      category: "Employed",
      requested_amount: 100000,
      created_at: iso(70),
      reviewed_at: iso(68),
      lender_name: "Example Finance Pvt Ltd",
      lender_reg_no: "N-14.03268",
      admin_note: "",
      contact_email: "karthik@example.com",
    },
    loan: {
      loan_account_no: "LN-2026-00125",
      sanctioned_amount: 90000,
      interest_rate: 14,
      tenure_months: 12,
      emi_amount: monthly,
      first_emi_date: date(-36),
      disbursed_on: date(-66),
      status: "active",
      note: "Your EMI is collected by auto-debit on the due date. Keep enough balance in your registered bank account a day before.",
      updated_at: iso(66),
      disbursed_amount: 88200,
      disbursed_to: "HDFC Bank ••4321",
      processing_fee: 1800,
      apr: 17.6,
      late_fee: "₹500 per missed EMI, plus 2% a month on the overdue amount.",
      prepayment_terms: "Prepay or close any time after 6 EMIs with no foreclosure charge.",
      repayment_method: "auto_debit",
      repayment_details: "EMIs are auto-debited from your HDFC Bank account ending 4321 on the due date. To change the account, contact the lender.",
      repayment_link: "",
    },
    payments: [
      { instalment_no: 1, paid_on: date(-36), amount: monthly, reference: "NACH-88213" },
      { instalment_no: 2, paid_on: date(-6), amount: monthly, reference: "NACH-90457" },
    ],
    documents: [
      { id: "demo-kfs", kind: "kfs", title: "Key Fact Statement", uploaded_at: iso(67) },
      { id: "demo-sanction", kind: "sanction_letter", title: "Sanction letter", uploaded_at: iso(67) },
      { id: "demo-agreement", kind: "agreement", title: "Loan agreement", uploaded_at: iso(66) },
    ],
    site: {
      lender_name: "Example Finance Pvt Ltd",
      lender_type: "NBFC",
      lender_reg_no: "N-14.03268",
      lender_website: "",
      support_email: "support@example.com",
      support_phone: "",
      grievance_officer: "Grievance Officer",
      grievance_email: "grievance@example.com",
      grievance_phone: "",
    },
    events: [
      { kind: "submitted", note: "Application submitted", created_at: iso(70) },
      { kind: "accepted", note: "", created_at: iso(68) },
      { kind: "loan_updated", note: "Loan details updated (disbursed)", created_at: iso(66) },
    ],
  };
}
