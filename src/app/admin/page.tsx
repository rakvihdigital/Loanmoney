import MoneyPay from "@/components/money-pay";

export const metadata = {
  title: "Admin Dashboard | Money Pay",
  description: "Administrator control center for managing payment QR settings and reviewing applicant KYC.",
};

export default function AdminPage() {
  return <MoneyPay admin />;
}
