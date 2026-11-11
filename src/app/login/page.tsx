import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginHub } from "@/components/login-hub";
import { Spinner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in with your mobile number: approved borrowers see their loan, applicants track their application.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginHub />
    </Suspense>
  );
}
