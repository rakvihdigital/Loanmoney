"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FileStack, FlaskConical, LayoutDashboard, LogOut, Menu, RefreshCw, RotateCcw, Settings2, ShieldX, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DEMO_ADMIN_KEY, signOut, useSession } from "@/lib/use-session";
import { useSettings } from "@/lib/settings-context";
import { errorText } from "@/lib/format";
import { accountLabel } from "@/lib/phone-auth";
import { APPLICATION_COLUMNS, type Application, type DashboardStats } from "@/lib/types";
import { Logo, Notice, Spinner } from "../ui";
import { Overview } from "./overview";
import { ApplicationsPanel } from "./applications-panel";
import { RefundsPanel } from "./refunds-panel";
import { SettingsPanel } from "./settings-panel";
import { ApplicationDrawer } from "./application-drawer";
import { demoApps, demoStats } from "./demo-data";

export type Tab = "overview" | "applications" | "refunds" | "settings";

export type AdminCtx = {
  apps: Application[];
  stats: DashboardStats | null;
  reload: () => Promise<void>;
  open: (id: string) => void;
  go: (tab: Tab, filter?: string) => void;
  toast: (tone: "ok" | "bad", text: string) => void;
  /** True when Supabase is not configured: sample data, changes stay in memory. */
  demo: boolean;
  /** Demo mode only: update an application in local state. */
  patch: (id: string, changes: Partial<Application>) => void;
};

export function AdminConsole() {
  const router = useRouter();
  const { user, ready } = useSession();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [demoAuthed, setDemoAuthed] = useState<boolean | null>(null);

  // Demo mode: the console opens only after "signing in" on /admin/login.
  useEffect(() => {
    if (supabase) return;
    let ok = false;
    try {
      ok = sessionStorage.getItem(DEMO_ADMIN_KEY) === "1";
    } catch {}
    setDemoAuthed(ok);
    if (!ok) router.replace("/admin/login");
  }, [router]);

  // Live mode: must be signed in…
  useEffect(() => {
    if (supabase && ready && !user) router.replace("/admin/login");
  }, [ready, user, router]);

  // …and listed in admin_users.
  useEffect(() => {
    if (!supabase || !user) return setIsAdmin(null);
    let alive = true;
    supabase.rpc("is_admin").then(({ data, error }) => alive && setIsAdmin(!error && data === true));
    return () => {
      alive = false;
    };
  }, [user]);

  if (!supabase) return demoAuthed ? <Console email="demo@moneypay.local" demo /> : <Spinner label="Opening sign in…" />;
  if (!ready || !user) return <Spinner label="Checking your session…" />;
  if (isAdmin === null) return <Spinner label="Checking access…" />;
  if (!isAdmin)
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="card w-full max-w-md p-8 text-center">
          <ShieldX size={32} className="mx-auto text-bad" />
          <h1 className="display mt-4 text-2xl">No admin access</h1>
          <p className="mt-2 text-sm text-muted">{accountLabel(user)} is not an administrator. Ask the owner to add you to admin_users.</p>
          <button type="button" className="btn btn-outline mt-6" onClick={() => void signOut("/admin/login")}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </main>
    );
  return <Console email={accountLabel(user)} />;
}

function Console({ email, demo = false }: { email: string; demo?: boolean }) {
  const { reload: reloadSettings } = useSettings();
  const [tab, setTab] = useState<Tab>("overview");
  const [filter, setFilter] = useState("pending");
  const [apps, setApps] = useState<Application[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  const reload = useCallback(async () => {
    if (demo) {
      setApps((prev) => {
        const list = prev.length ? prev : demoApps();
        setStats(demoStats(list));
        return list;
      });
      setLoaded(true);
      return;
    }
    if (!supabase) return;
    setRefreshing(true);
    try {
      const [a, s] = await Promise.all([
        supabase.from("applications").select(APPLICATION_COLUMNS).order("created_at", { ascending: false }).limit(1000),
        supabase.rpc("admin_dashboard_stats"),
      ]);
      if (a.error) throw a.error;
      if (s.error) throw s.error;
      setApps((a.data ?? []) as unknown as Application[]);
      setStats(s.data as DashboardStats);
    } catch (err) {
      setMsg({ tone: "bad", text: errorText(err) });
    } finally {
      setLoaded(true);
      setRefreshing(false);
    }
  }, [demo]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [navOpen]);

  useEffect(() => {
    void reload();
    const t = window.setInterval(() => void reload(), 60_000);
    return () => window.clearInterval(t);
  }, [reload]);

  const ctx: AdminCtx = {
    apps,
    stats,
    reload,
    open: setOpenId,
    go: (t, f) => {
      setTab(t);
      if (f) setFilter(f);
    },
    toast: (tone, text) => setMsg({ tone, text }),
    demo,
    patch: (id, changes) =>
      setApps((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...changes } : a));
        setStats(demoStats(next));
        return next;
      }),
  };

  const refundCount = apps.filter((a) => a.refund_status === "pending").length;
  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const openApp = apps.find((a) => a.id === openId) ?? null;

  const go = (t: Tab) => {
    setTab(t);
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-white/[0.06] bg-[#05070d]/85 backdrop-blur-xl lg:sticky lg:top-0 lg:block lg:h-screen">
        <AdminSidebar tab={tab} go={go} email={email} demo={demo} pendingCount={pendingCount} refundCount={refundCount} />
      </aside>

      {/* Mobile sidebar drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${navOpen ? "" : "pointer-events-none"}`} aria-hidden={!navOpen}>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={navOpen ? 0 : -1}
          onClick={() => setNavOpen(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${navOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
          className={`absolute inset-y-0 left-0 w-[86%] max-w-[300px] border-r border-white/10 bg-[#06080f]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar tab={tab} go={go} email={email} demo={demo} pendingCount={pendingCount} refundCount={refundCount} onClose={() => setNavOpen(false)} />
        </aside>
      </div>

      <div className="min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b hairline bg-paper/75 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] lg:hidden"
                aria-label="Open menu"
                aria-expanded={navOpen}
                onClick={() => setNavOpen(true)}
              >
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <h1 className="display truncate text-lg leading-tight sm:text-xl">{TITLES[tab][0]}</h1>
                <p className="hidden truncate text-xs text-muted sm:block">{TITLES[tab][1]}</p>
              </div>
            </div>
            <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={() => void Promise.all([reload(), reloadSettings()])} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-7 sm:py-6">
          {demo && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-gold-ink">
              <FlaskConical size={18} className="mt-0.5 shrink-0" />
              <p>
                <strong>Demo mode</strong>: sample data only. Changes are not saved. Add your Supabase keys to <code className="font-mono text-xs">.env.local</code> and
                restart the server to go live; the admin login will then be required.
              </p>
            </div>
          )}
          {msg && (
            <div className="mb-5">
              <Notice tone={msg.tone} onClose={() => setMsg(null)}>
                {msg.text}
              </Notice>
            </div>
          )}
          {!loaded ? (
            <Spinner />
          ) : tab === "overview" ? (
            <Overview ctx={ctx} />
          ) : tab === "applications" ? (
            <ApplicationsPanel ctx={ctx} filter={filter} setFilter={setFilter} />
          ) : tab === "refunds" ? (
            <RefundsPanel ctx={ctx} />
          ) : (
            <SettingsPanel ctx={ctx} />
          )}
        </main>
      </div>

      {openApp && <ApplicationDrawer key={openApp.id} app={openApp} ctx={ctx} onClose={() => setOpenId(null)} />}
    </div>
  );
}

const TITLES: Record<Tab, [string, string]> = {
  overview: ["Overview", "Your review queue at a glance"],
  applications: ["Applications", "Review documents, payments and decide"],
  refunds: ["Refunds", "Send and record refunds for declined applications"],
  settings: ["Settings", "Lender disclosure, grievance contact and payment details"],
};

function AdminSidebar({
  tab,
  go,
  email,
  demo,
  pendingCount,
  refundCount,
  onClose,
}: {
  tab: Tab;
  go: (t: Tab) => void;
  email: string;
  demo: boolean;
  pendingCount: number;
  refundCount: number;
  onClose?: () => void;
}) {
  const { site, payment, disclosed } = useSettings();
  const steps = [disclosed, Boolean(site?.grievance_officer && site?.grievance_email), Boolean(payment?.qr_path && payment?.upi_id)];
  const done = steps.filter(Boolean).length;
  const live = done === steps.length;
  const initials = (email.split("@")[0] || "A").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "AD";

  const Item = ({ t, label, icon: Icon, badge, gold = false }: { t: Tab; label: string; icon: typeof LayoutDashboard; badge?: number; gold?: boolean }) => {
    const on = tab === t;
    return (
      <button
        type="button"
        onClick={() => go(t)}
        aria-current={on ? "page" : undefined}
        className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[0.88rem] font-semibold transition ${
          on ? "bg-gradient-to-r from-gold/[0.13] via-gold/[0.04] to-transparent text-ink shadow-[inset_2px_0_0_var(--color-gold)]" : "text-ink-2 hover:bg-white/[0.04] hover:text-ink"
        }`}
      >
        <span
          className={`grid size-8 place-items-center rounded-lg border transition ${
            on ? "border-gold/30 bg-gold-soft text-gold" : "border-white/[0.07] bg-white/[0.03] text-muted group-hover:text-ink-2"
          }`}
        >
          <Icon size={15} />
        </span>
        {label}
        {!!badge && (
          <span className={`ml-auto min-w-6 rounded-full px-1.5 py-0.5 text-center text-[0.68rem] font-bold ${gold ? "bg-gold text-[#1a1406]" : "bg-white/10 text-ink-2"}`}>{badge}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/[0.06] px-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted">Admin</span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04]" aria-label="Close menu">
            <X size={17} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Status */}
        <button type="button" onClick={() => go("settings")} className="well mb-5 block w-full p-3.5 text-left transition hover:border-white/15">
          {live ? (
            <>
              <span className="flex items-center gap-2 text-xs font-semibold text-ok">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-ok" />
                </span>
                Applications open
              </span>
              <span className="mt-1 block truncate text-xs text-muted">{site?.lender_name}</span>
            </>
          ) : (
            <>
              <span className="flex items-center justify-between text-xs font-semibold text-gold-ink">
                Setup {done} of {steps.length}
                <span className="text-faint">Finish →</span>
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <span className="block h-full rounded-full bg-gradient-to-r from-gold to-brand" style={{ width: `${(done / steps.length) * 100}%` }} />
              </span>
              <span className="mt-2 block text-[0.7rem] leading-snug text-muted">Applications are closed until setup is complete.</span>
            </>
          )}
        </button>

        <p className="px-2.5 pb-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-faint">Workspace</p>
        <nav className="space-y-1" aria-label="Admin">
          <Item t="overview" label="Overview" icon={LayoutDashboard} />
          <Item t="applications" label="Applications" icon={FileStack} badge={pendingCount} />
          <Item t="refunds" label="Refunds" icon={RotateCcw} badge={refundCount} gold />
        </nav>

        <p className="px-2.5 pb-2 pt-6 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-faint">Configure</p>
        <nav className="space-y-1" aria-label="Configuration">
          <Item t="settings" label="Settings" icon={Settings2} />
          <Link
            href="/"
            target="_blank"
            className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-[0.88rem] font-semibold text-ink-2 transition hover:bg-white/[0.04] hover:text-ink"
          >
            <span className="grid size-8 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-muted group-hover:text-ink-2">
              <ExternalLink size={15} />
            </span>
            View public site
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-black text-[#1a1406]"
            style={{ background: "linear-gradient(145deg,#f6e3b4,#c9a35a)" }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{email}</p>
            <p className="text-[0.7rem] text-muted">{demo ? "Demo mode" : "Administrator"}</p>
          </div>
          <button type="button" onClick={() => void signOut("/admin/login")} className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/[0.06] hover:text-ink" aria-label="Sign out" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
