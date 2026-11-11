"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Smartphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { errorText } from "@/lib/format";
import { useSettings } from "@/lib/settings-context";
import { EMAIL_RE, isValidPhone, normalizePhone, phoneToAuthEmail } from "@/lib/phone-auth";
import { Notice } from "./ui";

type Mode = "signin" | "signup" | "forgot";

/** Applicant accounts: mobile number (required) + password; email optional. */
export function AuthCard({
  initialMode = "signup",
  title,
  subtitle,
  allowSignup = true,
}: {
  initialMode?: Mode;
  title?: string;
  subtitle?: string;
  allowSignup?: boolean;
}) {
  const { site } = useSettings();
  const [mode, setMode] = useState<Mode>(allowSignup ? initialMode : "signin");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setMsg(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setMsg(null);
    if (!isValidPhone(phone)) return setMsg({ tone: "bad", text: "Enter a valid 10-digit mobile number." });
    if (mode === "signup" && email.trim() && !EMAIL_RE.test(email.trim())) return setMsg({ tone: "bad", text: "Enter a valid email, or leave it empty." });
    if (password.length < 8) return setMsg({ tone: "bad", text: "Password must be at least 8 characters." });
    setBusy(true);
    try {
      const authEmail = phoneToAuthEmail(phone);
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
        if (error) throw /invalid login credentials/i.test(error.message) ? new Error("Incorrect mobile number or password.") : error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: { data: { phone: normalizePhone(phone), contact_email: email.trim() || null } },
        });
        if (error) throw /already registered|already exists/i.test(error.message) ? new Error("This mobile number already has an account. Log in instead.") : error;
        if (!data.session) {
          // Happens only if "Confirm email" is still switched on in Supabase.
          switchMode("signin");
          setMsg({ tone: "bad", text: "Account created, but sign-in is waiting for email confirmation. Ask the site owner to turn off “Confirm email” in Supabase, then log in." });
        }
      }
    } catch (err) {
      setMsg({ tone: "bad", text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  const heading = title ?? (mode === "signup" ? "Create your account" : mode === "signin" ? "Welcome back" : "Forgot your password?");
  const sub =
    subtitle ??
    (mode === "signup"
      ? "Use your mobile number. You'll use it to log in and track your application."
      : mode === "signin"
        ? "Log in with your mobile number and password."
        : "We'll help you reset it.");

  return (
    <div className="card mx-auto w-full max-w-md p-7 sm:p-9 animate-rise">
      <span className="grid size-11 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
        <Lock size={19} />
      </span>
      <h1 className="display mt-6 text-3xl">{heading}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{sub}</p>

      {mode === "forgot" ? (
        <div className="mt-7 space-y-4">
          <div className="well p-4 text-sm leading-relaxed text-ink-2">
            Contact our support team with your <strong className="text-ink">registered mobile number</strong> and we&rsquo;ll reset your password.
            {site?.support_email && (
              <a className="mt-2 flex items-center gap-2 font-semibold text-gold hover:underline" href={`mailto:${site.support_email}`}>
                <Mail size={15} /> {site.support_email}
              </a>
            )}
            {site?.support_phone && (
              <span className="mt-1 flex items-center gap-2 font-semibold text-ink">
                <Smartphone size={15} className="text-gold" /> {site.support_phone}
              </span>
            )}
          </div>
          <button type="button" className="btn btn-outline w-full" onClick={() => switchMode("signin")}>
            Back to log in
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="auth-phone">
              Mobile number
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center text-sm font-semibold text-muted">+91</span>
              <input
                id="auth-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className="!pl-12"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="98765 43210"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="label" htmlFor="auth-email">
                Email <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="auth-password">
                Password
              </label>
              {mode === "signin" && (
                <button type="button" className="mb-1.5 text-xs font-semibold text-gold hover:underline" onClick={() => switchMode("forgot")}>
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={show ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                className="!pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

          <button className="btn btn-gold btn-lg w-full" disabled={busy}>
            {busy ? <Loader2 size={17} className="animate-spin" /> : null}
            {mode === "signup" ? "Create account" : "Log in"}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>
      )}

      {mode !== "forgot" && (
        <p className="mt-6 text-center text-sm text-muted">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" className="font-semibold text-gold hover:underline" onClick={() => switchMode("signin")}>
                Log in
              </button>
            </>
          ) : allowSignup ? (
            <>
              New here?{" "}
              <button type="button" className="font-semibold text-gold hover:underline" onClick={() => switchMode("signup")}>
                Create an account
              </button>
            </>
          ) : null}
        </p>
      )}
    </div>
  );
}
