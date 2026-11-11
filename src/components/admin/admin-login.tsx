"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, FileLock2, FlaskConical, Loader2, Lock, RotateCcw, ShieldCheck, UserRound, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DEMO_ADMIN_KEY } from "@/lib/use-session";
import { errorText } from "@/lib/format";
import { isPhoneAuthEmail, loginIdentifierToEmail } from "@/lib/phone-auth";
import { Logo, Notice } from "../ui";


export function AdminLogin() {
  const router = useRouter();
  const demo = !supabase;
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  // Already signed in as an admin? Go straight to the console.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (demo) {
        try {
          if (sessionStorage.getItem(DEMO_ADMIN_KEY) === "1") return router.replace("/admin");
        } catch {}
      } else {
        const { data } = await supabase!.auth.getSession();
        if (data.session) {
          const { data: isAdmin } = await supabase!.rpc("is_admin");
          if (isAdmin === true) return router.replace("/admin");
        }
      }
      if (alive) setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [demo, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const authEmail = loginIdentifierToEmail(email);
    if (!authEmail) return setMsg({ tone: "bad", text: "Enter your mobile number or email." });

    if (mode === "forgot") {
      if (demo) return setMsg({ tone: "ok", text: "Demo mode: password reset emails are sent once Supabase is connected." });
      if (isPhoneAuthEmail(authEmail))
        return setMsg({ tone: "ok", text: "Accounts that use a mobile number are reset by the site owner in Supabase. See “Reset a password” in the README." });
      setBusy(true);
      const { error } = await supabase!.auth.resetPasswordForEmail(authEmail, { redirectTo: `${window.location.origin}/account/reset` });
      setBusy(false);
      if (error) return setMsg({ tone: "bad", text: errorText(error) });
      return setMsg({ tone: "ok", text: "If this email belongs to an admin, a reset link is on its way." });
    }

    if (!password) return setMsg({ tone: "bad", text: "Enter your password." });
    setBusy(true);
    try {
      if (demo) {
        try {
          sessionStorage.setItem(DEMO_ADMIN_KEY, "1");
        } catch {}
        router.replace("/admin");
        return;
      }
      const { error } = await supabase!.auth.signInWithPassword({ email: authEmail, password });
      if (error) throw error;
      const { data: isAdmin, error: adminError } = await supabase!.rpc("is_admin");
      if (adminError) throw adminError;
      if (isAdmin !== true) {
        await supabase!.auth.signOut();
        throw new Error("This account doesn't have admin access.");
      }
      router.replace("/admin");
    } catch (err) {
      const text = errorText(err);
      setMsg({ tone: "bad", text: /invalid login credentials/i.test(text) ? "Incorrect login or password." : text });
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------------------------ Brand panel */}
      <section className="section-blue relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <div className="noise pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative flex items-center gap-3">
          <Logo />
          <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-2">Admin</span>
        </div>

        <div className="relative max-w-lg">
          <span className="eyebrow eyebrow-light">Admin console</span>
          <h1 className="display mt-6 text-5xl leading-[1.04] xl:text-6xl">
            <span className="text-gradient">Review every application</span> <span className="serif text-champagne">with confidence.</span>
          </h1>
          <ul className="mt-10 space-y-4">
            {[
              [Users, "Review queue", "Applications, documents and payments in one place."],
              [RotateCcw, "Refund tracking", "Declined with a confirmed payment? It's queued until refunded."],
              [FileLock2, "Private documents", "KYC files open through links that expire in five minutes."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof Users;
              return (
                <li key={t as string} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
                    <I size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{t as string}</p>
                    <p className="mt-0.5 text-sm text-muted">{d as string}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* mini console preview */}
        <div className="relative grid max-w-lg grid-cols-3 gap-3" aria-hidden>
          {[
            ["Awaiting review", "12", "text-warn"],
            ["Approved", "248", "text-ok"],
            ["Refunds due", "3", "text-gold"],
          ].map(([l, v, c]) => (
            <div key={l} className="card p-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted">{l}</p>
              <p className={`display mt-2 text-2xl ${c}`}>{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Form */}
      <section className="theme-light relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="theme-dark rounded-xl bg-[#0a1230] px-2.5 py-1.5 lg:hidden">
            <Logo />
          </div>
          <span className="hidden lg:block" />
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink">
            <ArrowLeft size={15} /> Back to website
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
          <div className="w-full max-w-[400px] animate-rise">
            <span className="grid size-12 place-items-center rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/20 to-gold/[0.04] text-gold shadow-[0_10px_30px_-12px_rgb(184_138_46/0.6)]">
              <Lock size={20} />
            </span>
            <h2 className="display mt-6 text-[2rem] leading-tight">{mode === "signin" ? "Admin sign in" : "Reset password"}</h2>
            <p className="mt-2 text-[0.95rem] text-muted">
              {mode === "signin" ? "Restricted to authorised reviewers." : "We'll email a secure reset link to your admin address."}
            </p>

            {demo && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/35 bg-gold-soft px-4 py-3 text-sm text-gold-ink">
                <FlaskConical size={17} className="mt-0.5 shrink-0" />
                <p>
                  <strong>Demo mode.</strong> Supabase isn&rsquo;t connected, so any mobile number or email with any password opens the demo console.
                </p>
              </div>
            )}

            <form onSubmit={submit} noValidate className="mt-7 space-y-4">
              <div>
                <label className="label" htmlFor="admin-email">
                  Mobile number or email
                </label>
                <div className="relative">
                  <UserRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                  <input
                    id="admin-email"
                    type="text"
                    autoComplete="username"
                    className="!pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="98765 43210 or admin@company.com"
                    disabled={checking}
                  />
                </div>
              </div>

              {mode === "signin" && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="label" htmlFor="admin-password">
                      Password
                    </label>
                    <button
                      type="button"
                      className="mb-1.5 text-xs font-semibold text-gold-ink hover:underline"
                      onClick={() => {
                        setMode("forgot");
                        setMsg(null);
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                    <input
                      id="admin-password"
                      type={show ? "text" : "password"}
                      autoComplete="current-password"
                      className="!pl-10 !pr-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={checking}
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
              )}

              {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

              <button className="btn btn-gold btn-lg w-full" disabled={busy || checking}>
                {busy || checking ? <Loader2 size={17} className="animate-spin" /> : null}
                {mode === "signin" ? "Sign in to console" : "Send reset link"}
                {!busy && !checking && <ArrowRight size={17} />}
              </button>

              {mode === "forgot" && (
                <button
                  type="button"
                  className="w-full text-center text-sm font-semibold text-muted hover:text-ink"
                  onClick={() => {
                    setMode("signin");
                    setMsg(null);
                  }}
                >
                  Back to sign in
                </button>
              )}
            </form>

            <p className="mt-8 flex items-start gap-2.5 border-t hairline pt-6 text-xs leading-relaxed text-muted">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-ok" />
              Admin access is granted from the database by the owner. New accounts can&rsquo;t be created here.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
