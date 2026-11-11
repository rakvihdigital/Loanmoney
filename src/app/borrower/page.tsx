import type { Metadata } from "next";
import { BorrowerDashboard } from "@/components/borrower-dashboard";

export const metadata: Metadata = {
  title: "My loan",
  robots: { index: false, follow: false },
};

export default function BorrowerPage() {
  return <BorrowerDashboard />;
}
