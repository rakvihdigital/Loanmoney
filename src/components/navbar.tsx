"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronRight, FileText, HelpCircle, Home, ListOrdered, LogIn, LogOut, Menu, Shield, X } from "lucide-react";
import { Logo } from "./ui";
import { DisclosureBar } from "./lender-disclosure";
import { signOut, useSession } from "@/lib/use-session";
import { useSettings } from "@/lib/settings-context";
import { getToken } from "@/lib/borrower";
import { accountLabel } from "@/lib/phone-auth";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/how-it-works", label: "How it works", icon: ListOrdered },
  { href: "/questions", label: "FAQs", icon: HelpCircle },
  { href: "/terms", label: "Fees & terms", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [hasLoan, setHasLoan] = useState(false);

  useEffect(() => setHasLoan(Boolean(getToken())), [pathname]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <DisclosureBar />
      <header className="sticky top-0 z-40 px-3 pt-2 sm:px-5 sm:pt-3">
        <div
          className={`mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-3 rounded-2xl border px-3 transition-all duration-300 sm:h-16 sm:px-5 ${
            scrolled || open
              ? "border-white/10 bg-[#0a0e18]/80 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-2xl"
              : "border-transparent bg-transparent"
          }`}
        >
          <Logo />
          <DesktopNav pathname={pathname} />
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                <Link href="/apply" className="btn btn-outline btn-sm">
                  My applications
                </Link>
                <button type="button" onClick={() => void signOut()} className="btn btn-ghost btn-sm" aria-label="Sign out">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <>
                <Link href={hasLoan ? "/borrower" : "/login"} className="btn btn-outline btn-sm">
                  <LogIn size={14} /> {hasLoan ? "My loan" : "Login"}
                </Link>
                <Link href="/apply" className="btn btn-gold btn-sm">
                  Apply now <ArrowUpRight size={14} />
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 lg:hidden">
            {!open && !user && (
              <>
                {!pathname.startsWith("/login") && (
                  <Link
                    href={hasLoan ? "/borrower" : "/login"}
                    aria-label={hasLoan ? "My loan" : "Login"}
                    className="btn btn-outline btn-sm !px-2.5 min-[400px]:!px-3"
                  >
                    <LogIn size={15} />
                    <span className="hidden min-[400px]:inline">{hasLoan ? "My loan" : "Login"}</span>
                  </Link>
                )}
                {!pathname.startsWith("/apply") && (
                  <Link href="/apply" className="btn btn-gold btn-sm !px-3">
                    Apply now
                  </Link>
                )}
              </>
            )}
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-ink"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>
      <MobileSidebar open={open} onClose={close} active={active} signedIn={Boolean(user)} email={accountLabel(user)} />
    </>
  );
}

/**
 * Desktop navigation: plain links with a gold "light bar" that sits under the
 * current page and glides to whichever link you hover, with a soft glow behind it.
 */
function DesktopNav({ pathname }: { pathname: string }) {
  const navRef = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [bar, setBar] = useState({ left: 0, width: 0, show: false, ready: false });
  const activeHref = LINKS.find((l) => (l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)))?.href ?? null;
  const target = hover ?? activeHref;

  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const el = target ? nav.querySelector<HTMLElement>(`[data-href="${target}"]`) : null;
    if (!el) return setBar((b) => ({ ...b, show: false }));
    setBar((b) => ({ left: el.offsetLeft, width: el.offsetWidth, show: true, ready: b.ready || b.show }));
  }, [target]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <nav ref={navRef} className="relative hidden items-center lg:flex" aria-label="Main" onMouseLeave={() => setHover(null)}>
      {/* soft glow behind the targeted link */}
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 h-9 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(227_194_125/0.16),transparent)] ${
          bar.ready ? "transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]" : ""
        } ${bar.show ? "opacity-100" : "opacity-0"}`}
        style={{ left: bar.left - 8, width: bar.width + 16 }}
      />
      {/* gold light bar */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -bottom-[7px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_12px_rgb(227_194_125/0.9)] ${
          bar.ready ? "transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]" : ""
        } ${bar.show ? "opacity-100" : "opacity-0"}`}
        style={{ left: bar.left + 6, width: Math.max(bar.width - 12, 0) }}
      />
      {LINKS.map((l, i) => {
        const isActive = l.href === activeHref;
        const isTarget = l.href === target;
        return (
          <span key={l.href} className="flex items-center">
            {i > 0 && <span aria-hidden className="mx-1 size-[3px] rounded-full bg-white/15" />}
            <Link
              href={l.href}
              data-href={l.href}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => setHover(l.href)}
              onFocus={() => setHover(l.href)}
              onBlur={() => setHover(null)}
              className={`relative whitespace-nowrap px-3.5 py-2 text-[0.85rem] font-semibold tracking-[-0.005em] transition-colors duration-200 focus-visible:outline-none ${
                isTarget ? "text-ink" : isActive ? "text-ink/90" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}

function MobileSidebar({
  open,
  onClose,
  active,
  signedIn,
  email,
}: {
  open: boolean;
  onClose: () => void;
  active: (href: string) => boolean;
  signedIn: boolean;
  email: string;
}) {
  const { site, disclosed } = useSettings();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 right-0 flex w-[86%] max-w-[340px] flex-col border-l border-white/10 bg-[#080b14]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="aurora pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex h-16 items-center justify-between border-b border-white/[0.07] px-5">
          <Logo />
          <button type="button" onClick={onClose} tabIndex={open ? 0 : -1} className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
          <p className="px-3 pb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-faint">Menu</p>
          {[...LINKS, { href: "/privacy", label: "Privacy", icon: Shield }].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              tabIndex={open ? 0 : -1}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-[0.95rem] font-semibold transition ${
                active(href) ? "bg-gradient-to-r from-gold/[0.14] to-transparent text-ink shadow-[inset_2px_0_0_var(--color-gold)]" : "text-ink-2 hover:bg-white/[0.04]"
              }`}
            >
              <span className={`grid size-9 place-items-center rounded-lg border ${active(href) ? "border-gold/30 bg-gold-soft text-gold" : "border-white/[0.08] bg-white/[0.03] text-muted"}`}>
                <Icon size={16} />
              </span>
              {label}
              <ChevronRight size={16} className="ml-auto text-faint" />
            </Link>
          ))}

          <div className="well mx-1 mt-5 p-4 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-ink-2">Lending partner</p>
            {disclosed && site ? (
              <p className="mt-1">
                {site.lender_name} · RBI Reg. No. <span className="font-mono text-gold-ink">{site.lender_reg_no}</span>
              </p>
            ) : (
              <p className="mt-1">Not published yet. Applications open once it is.</p>
            )}
          </div>
        </nav>

        <div className="relative space-y-2 border-t border-white/[0.07] p-4">
          {signedIn ? (
            <>
              <p className="truncate px-1 pb-1 text-xs text-muted">Signed in as {email}</p>
              <Link href="/apply" tabIndex={open ? 0 : -1} className="btn btn-gold w-full">
                My applications
              </Link>
              <button type="button" tabIndex={open ? 0 : -1} className="btn btn-outline w-full" onClick={() => void signOut()}>
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/apply" tabIndex={open ? 0 : -1} className="btn btn-gold w-full">
                Start your application <ArrowUpRight size={15} />
              </Link>
              <Link href="/login" tabIndex={open ? 0 : -1} className="btn btn-outline w-full">
                <LogIn size={15} /> Login
              </Link>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
