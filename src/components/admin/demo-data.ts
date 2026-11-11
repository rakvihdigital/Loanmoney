// Sample data for the admin console's demo mode (only used when Supabase is NOT configured).
import type { Application, DashboardStats, Kyc } from "@/lib/types";

const H = 3600e3;

function app(i: number, hoursAgo: number, o: Partial<Application>): Application {
  const created = new Date(Date.now() - hoursAgo * H).toISOString();
  return {
    id: `demo-${i}`,
    ref_code: `MP-DEMO000${i}`,
    user_id: `demo-user-${i}`,
    full_name: "Sample Applicant",
    phone: "9876543210",
    category: "Employed",
    requested_amount: 50000,
    transaction_id: `42819201829${i}`,
    proof_path: "",
    fee: 299,
    payee_name: "Your Business Name",
    upi_id: "business@bank",
    status: "pending",
    payment_verified: false,
    kyc_verified: false,
    admin_note: "",
    reviewed_at: null,
    created_at: created,
    refund_upi_id: `applicant${i}@okaxis`,
    refund_status: "not_applicable",
    refund_reference: null,
    refunded_at: null,
    lender_name: null,
    lender_reg_no: null,
    ...o,
  };
}

const reviewed = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString();

export function demoApps(): Application[] {
  return [
    app(1, 3, { full_name: "Asha Rao", category: "Self-employed", requested_amount: 75000 }),
    app(2, 20, { full_name: "Ravi Kumar", category: "Student", requested_amount: 20000 }),
    app(3, 55, { full_name: "Imran Ali", category: "Driver", requested_amount: 40000 }),
    app(4, 72, { full_name: "Meena Sharma", status: "rejected", payment_verified: true, refund_status: "pending", admin_note: "Address proof is older than 3 months. Please reapply with a recent bill.", reviewed_at: reviewed(60) }),
    app(5, 120, { full_name: "Karthik N", status: "accepted", payment_verified: true, kyc_verified: true, requested_amount: 100000, reviewed_at: reviewed(110) }),
    app(6, 150, { full_name: "Priya Verma", status: "rejected", payment_verified: true, refund_status: "refunded", refund_reference: "RFD5512098733", refunded_at: reviewed(100), admin_note: "Name on ID does not match the application.", reviewed_at: reviewed(140) }),
    app(7, 200, { full_name: "Sanjay Patel", status: "accepted", payment_verified: true, kyc_verified: true, category: "Employed", requested_amount: 150000, reviewed_at: reviewed(185) }),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function demoStats(apps: Application[]): DashboardStats {
  const now = Date.now();
  const reviewedApps = apps.filter((a) => a.reviewed_at);
  const avg = reviewedApps.length
    ? Math.round((reviewedApps.reduce((s, a) => s + (new Date(a.reviewed_at!).getTime() - new Date(a.created_at).getTime()), 0) / reviewedApps.length / H) * 10) / 10
    : null;
  const series = [1, 0, 2, 1, 0, 1, 1, 0, 2, 0, 1, 1, 0, 1];
  return {
    total: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    accepted: apps.filter((a) => a.status === "accepted").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
    overdue: apps.filter((a) => a.status === "pending" && now - new Date(a.created_at).getTime() > 48 * H).length,
    refunds_pending: apps.filter((a) => a.refund_status === "pending").length,
    refunds_pending_amount: apps.filter((a) => a.refund_status === "pending").reduce((s, a) => s + a.fee, 0),
    refunded_amount: apps.filter((a) => a.refund_status === "refunded").reduce((s, a) => s + a.fee, 0),
    fees_retained: apps.filter((a) => a.status === "accepted").reduce((s, a) => s + a.fee, 0),
    accepted_volume: apps.filter((a) => a.status === "accepted").reduce((s, a) => s + a.requested_amount, 0),
    avg_review_hours: avg,
    daily: series.map((count, i) => ({ day: new Date(now - (13 - i) * 864e5).toISOString().slice(0, 10), count })),
  };
}

export const DEMO_KYC: Kyc = {
  dob: "1996-04-12",
  address: "12, 4th Cross, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  identity_type: "Voter ID",
  identity_last4: "AB12",
  institution: null,
  identity_path: "",
  identity_back_path: null,
  address_path: "",
  student_path: null,
  consent_at: new Date().toISOString(),
};
