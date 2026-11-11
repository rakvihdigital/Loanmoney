"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { errorText } from "@/lib/format";
import { Notice, SetupRequired } from "@/components/ui";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    // The recovery link signs the user in; wait for that session before allowing an update.
    supabase.auth.getSession().then(({ data }) => data.session && setReady(true));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabase) return <SetupRequired />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) return setMsg({ tone: "bad", text: "Password must be at least 8 characters." });
    if (password !== confirm) return setMsg({ tone: "bad", text: "Passwords do not match." });
    setBusy(true);
    const { error } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg({ tone: "bad", text: errorText(error) });
    else setMsg({ tone: "ok", text: "Password updated. You're signed in." });
  }

  return (
    <main className="shell py-10 sm:py-16">
      <div className="card mx-auto max-w-md p-7 sm:p-9">
        <span className="grid size-11 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
          <KeyRound size={19} />
        </span>
        <h1 className="display mt-6 text-3xl">Choose a new password</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted">
            Open this page from the reset link in your email. Link expired?{" "}
            <Link href="/apply?mode=signin" className="font-semibold text-brand hover:underline">
              Request a new one
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="pw">New password</label>
              <input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="pw2">Confirm password</label>
              <input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
            <button className="btn btn-dark btn-lg w-full" disabled={busy}>
              {busy && <Loader2 size={17} className="animate-spin" />} Update password
            </button>
            {msg?.tone === "ok" && (
              <Link href="/apply" className="btn btn-outline w-full">
                Go to my applications
              </Link>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
