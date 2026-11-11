"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/use-session";
import { useSettings } from "@/lib/settings-context";
import { errorText } from "@/lib/format";
import { accountLabel } from "@/lib/phone-auth";
import { APPLICATION_COLUMNS, type Application, type ApplicationEvent } from "@/lib/types";
import { AuthCard } from "../auth-card";
import { DisclosureCard } from "../lender-disclosure";
import { Notice, Spinner } from "../ui";
import type { User } from "@supabase/supabase-js";
import { ApplicationWizard } from "./application-wizard";
import { ApplicationCard } from "./application-card";

export function ApplicantPortal() {
  const params = useSearchParams();
  const { user, ready } = useSession();
  const { site, payment, disclosed, loading: settingsLoading, reload: reloadSettings } = useSettings();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !user) return;
    setRefreshing(true);
    try {
      const { data, error: e1 } = await supabase.from("applications").select(APPLICATION_COLUMNS).eq("user_id", user.id).order("created_at", { ascending: false });
      if (e1) throw e1;
      const list = (data ?? []) as unknown as Application[];
      setApps(list);
      if (list.length) {
        const { data: ev, error: e2 } = await supabase
          .from("application_events")
          .select("id,application_id,kind,note,created_at")
          .in("application_id", list.map((a) => a.id))
          .order("created_at");
        if (e2) throw e2;
        setEvents((ev ?? []) as ApplicationEvent[]);
      }
      setError("");
    } catch (err) {
      setError(errorText(err));
      setApps((prev) => prev ?? []);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (!supabase)
    return (
      <main className="shell py-8 sm:py-10">
        <div className="mb-6">
          <span className="eyebrow eyebrow-light">Demo mode</span>
          <h1 className="display mt-5 text-4xl sm:text-5xl">
            <span className="text-gradient">Let&rsquo;s get you</span> <span className="serif text-champagne">started.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted">Preview of the application form. Submitting is disabled until Supabase is connected.</p>
        </div>
        <ApplicationWizard user={{ id: "demo" } as User} demo onSubmitted={() => {}} />
      </main>
    );
  if (!ready || settingsLoading) return <Spinner />;

  if (!user) {
    return (
      <main className="shell grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_440px]">
        <div className="order-2 lg:order-1">
          <span className="eyebrow">Apply in four steps</span>
          <h1 className="display mt-6 text-4xl leading-[1.05] sm:text-5xl"><span className="text-gradient">Your application, start to decision,</span> <span className="serif text-champagne">in one place.</span></h1>
          <p className="mt-4 max-w-lg text-muted">
            Create an account so you can submit securely, return later, and see every update, including your refund if you&rsquo;re not approved.
          </p>
          <DisclosureCard className="mt-8 max-w-xl" />
        </div>
        <div className="order-1 lg:order-2">
          <AuthCard initialMode={params.get("mode") === "signin" ? "signin" : "signup"} />
        </div>
      </main>
    );
  }

  if (apps === null) return <Spinner label="Loading your applications…" />;

  const pending = apps.find((a) => a.status === "pending");
  const paymentsReady = Boolean(payment?.qr_path && payment.upi_id && payment.payee_name);
  const canApply = !pending && disclosed && paymentsReady;
  const showWizard = canApply && (creating || apps.length === 0);

  return (
    <main className="shell py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{showWizard ? "New application" : "My applications"}</span>
          <h1 className="display mt-5 text-4xl sm:text-5xl">{showWizard ? (<><span className="text-gradient">Let&rsquo;s get you</span> <span className="serif text-champagne">started.</span></>) : <span className="text-gradient">Your applications</span>}</h1>
          <p className="mt-2 text-sm text-muted">Signed in as {accountLabel(user)}</p>
        </div>
        {!showWizard && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline" onClick={() => void Promise.all([load(), reloadSettings()])} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh
            </button>
            {canApply && (
              <button type="button" className="btn btn-dark" onClick={() => setCreating(true)}>
                <Plus size={16} /> New application
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6">
          <Notice tone="bad" onClose={() => setError("")}>
            {error}
          </Notice>
        </div>
      )}

      {!disclosed && (
        <div className="mb-6">
          <Notice tone="warn">Applications are closed until the lending partner&rsquo;s details are published. Please check back soon.</Notice>
        </div>
      )}
      {disclosed && !paymentsReady && !pending && (
        <div className="mb-6">
          <Notice tone="warn">Payment details are being set up. Please check back shortly.</Notice>
        </div>
      )}

      {justSubmitted && (
        <div className="card mb-8 flex flex-col gap-4 border-ok/25 bg-ok-soft/40 p-6 sm:flex-row sm:items-center animate-rise">
          <CheckCircle2 size={36} className="shrink-0 text-ok" />
          <div className="flex-1">
            <h2 className="text-lg font-bold">Application submitted</h2>
            <p className="mt-1 text-sm text-ink-2">
              We&rsquo;ll review it within 24–48 hours. This page updates automatically when you come back.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setJustSubmitted(null)}>
            Dismiss
          </button>
        </div>
      )}

      {showWizard ? (
        <>
          <ApplicationWizard
            user={user}
            onSubmitted={(ref) => {
              setCreating(false);
              setJustSubmitted(ref);
              window.scrollTo({ top: 0, behavior: "smooth" });
              void load();
            }}
          />
          {apps.length > 0 && (
            <button type="button" className="btn btn-ghost mt-6" onClick={() => setCreating(false)}>
              Cancel and view my applications
            </button>
          )}
        </>
      ) : apps.length ? (
        <div className="space-y-6">
          {apps.map((a) => (
            <ApplicationCard key={a.id} a={a} site={site} events={events.filter((e) => e.application_id === a.id)} highlight={a.ref_code === justSubmitted} />
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-sm text-muted">You haven&rsquo;t submitted an application yet.</div>
      )}
    </main>
  );
}
