"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CalendarClock, Eye, EyeOff, FileText, FlaskConical, KeyRound, Landmark, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import { borrowerLogin, DEMO_PHONE, getToken } from "@/lib/borrower";
import { AuthCard } from "./auth-card";
import { Notice } from "./ui";

type Tab = "loan" | "application";

export function LoginHub() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>(params.get("tab") === "application" ? "application" : "loan");

  // Already have a borrower session in this tab → straight to the dashboard
  useEffect(() => {
    if (getToken()) router.replace("/borrower");
  }, [router]);

  // Applicant signed in from the "Track application" tab → their applications
  useEffect(() => {
    if (tab === "application" && user) router.replace("/apply");
  }, [tab, user, router]);

  return (
    <main className="relative overflow-hidden">
      <div className="aurora pointer-events-none absolute inset-0 -top-40" aria-hidden />
      <div className="grid-lines pointer-events-none absolute inset-0 -top-40" aria-hidden />

      <div className="shell relative grid items-center gap-12 py-10 sm:py-16 lg:grid-cols-[1fr_440px] lg:py-20">
        {/* Left: what you get */}
        <div className="order-2 lg:order-1">
          <span className="eyebrow eyebrow-light">Welcome back</span>
          <h1 className="display mt-5 text-[2.3rem] leading-[1.05] sm:text-5xl">
            <span className="text-gradient">Your loan,</span> <span className="serif text-champagne">all in one place.</span>
          </h1>
          <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-ink-2">
            Approved borrowers log in with their mobile number and the password sent by our team. Still waiting on a decision? Use{" "}
            <button type="button" onClick={() => setTab("application")} className="font-semibold text-gold hover:underline">
              Track application
            </button>
            .
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              [Wallet, "Loan amount & EMI", "Sanctioned amount, interest rate and tenure."],
              [CalendarClock, "Repayment schedule", "Every instalment, with your next due date."],
              [Landmark, "Your lender", "Name, RBI registration and contact details."],
              [FileText, "Application history", "Every step from submission to disbursal."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Wallet;
              return (
                <li key={t as string} className="card flex gap-3 p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
                    <I size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t as string}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{d as string}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: login card */}
        <div className="order-1 lg:order-2">
          <div className="theme-light overflow-hidden rounded-[var(--radius-card)] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]">
            <div className="grid grid-cols-2 gap-1 border-b hairline bg-paper-2/70 p-1.5" role="tablist" aria-label="Login type">
              {(
                [
                  ["loan", "My loan", Wallet],
                  ["application", "Track application", FileText],
                ] as const
              ).map(([t, label, Icon]) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    tab === t ? "bg-white text-ink shadow-[0_1px_2px_rgb(11_20_48/0.08),0_6px_16px_-8px_rgb(11_20_48/0.25)]" : "text-muted hover:text-ink"
                  }`}
                >
                  <Icon size={15} className={tab === t ? "text-gold" : ""} /> {label}
                </button>
              ))}
            </div>
            <div className="bg-white">
              {tab === "loan" ? (
                <BorrowerForm />
              ) : !supabase ? (
                <div className="p-7 sm:p-9">
                  <Notice tone="warn">Demo mode: applicant accounts need Supabase. Open the application form to preview it.</Notice>
                  <Link href="/apply" className="btn btn-dark btn-lg mt-5 w-full">
                    Open application form <ArrowRight size={17} />
                  </Link>
                </div>
              ) : (
                <div className="[&>div]:!border-0 [&>div]:!shadow-none">
                  <AuthCard initialMode="signin" title="Track your application" subtitle="Log in with the mobile number and password you used to apply." />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function BorrowerForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await borrowerLogin(phone, password);
    if (res.ok) return router.replace("/borrower");
    setError(res.error);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} noValidate className="p-7 sm:p-9">
      <span className="grid size-12 place-items-center rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/20 to-gold/[0.04] text-gold">
        <KeyRound size={20} />
      </span>
      <h2 className="display mt-5 text-[1.75rem] leading-tight">Borrower login</h2>
      <p className="mt-1.5 text-sm text-muted">For approved loans. Use your mobile number and the password sent by our team.</p>

      {!supabase && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-gold/35 bg-gold-soft px-4 py-3 text-sm text-gold-ink">
          <FlaskConical size={17} className="mt-0.5 shrink-0" />
          <p>
            <strong>Demo:</strong> mobile number <span className="font-mono font-semibold">{DEMO_PHONE}</span> with any password.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="loan-phone">
            Mobile number
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center text-sm font-semibold text-muted">+91</span>
            <input
              id="loan-phone"
              type="tel"
              inputMode="numeric"
              className="!pl-12"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98765 43210"
            />
          </div>
          <p className="hint">The mobile number on your loan application.</p>
        </div>
        <div>
          <label className="label" htmlFor="loan-pw">
            Password
          </label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              id="loan-pw"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="!pl-10 !pr-11 font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-faint hover:text-ink"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        {error && <Notice tone="bad">{error}</Notice>}
        <button className="btn btn-gold btn-lg w-full" disabled={busy}>
          {busy ? <Loader2 size={17} className="animate-spin" /> : null} Log in to my loan {!busy && <ArrowRight size={17} />}
        </button>
      </div>

      <p className="mt-6 flex items-start gap-2.5 border-t hairline pt-5 text-xs leading-relaxed text-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-ok" />
        Lost your password? Contact support and we&rsquo;ll issue a new one. We will never ask you for a payment to access your loan.
      </p>
    </form>
  );
}
