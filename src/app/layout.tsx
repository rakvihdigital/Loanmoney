import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SettingsProvider } from "@/lib/settings-context";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Money Pay — Apply for a loan with a regulated lender", template: "%s · Money Pay" },
  description:
    "Apply online in minutes. Your application is reviewed within 24–48 hours and the ₹299 application fee is refunded in full if you are not approved.",
};

export const viewport: Viewport = { themeColor: "#06080f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${sora.variable} ${instrument.variable}`}>
      <body className="flex min-h-screen flex-col">
        <div className="ambient" aria-hidden />
        <SettingsProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </SettingsProvider>
      </body>
    </html>
  );
}
