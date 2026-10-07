import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Money Pay | Rakvih — Dedicated Application Portal",
  description: "Submit your loan application, pay the ₹299 application fee, upload KYC documents, and track your review.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <div className="flex-1 w-full">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
