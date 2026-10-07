"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutDashboard, LogOut, Menu, Wallet, X, User as UserIcon, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/";
    }
  };

  return (
    <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-[1360px] mx-auto px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <Link href="/" className="brand hover:opacity-90 transition">
          <span className="brand-icon shadow-md shadow-amber-500/20">
            <Wallet size={23} strokeWidth={2.2} />
          </span>
          <span>
            money<span className="brand-pay">pay</span>
            <small>BY RAKVIH</small>
          </span>
        </Link>

        <nav className="site-nav hidden md:flex items-center gap-8 text-xs font-semibold">
          <Link
            href="/"
            className={`relative py-1 transition duration-200 ${
              isActive("/") && pathname === "/"
                ? "text-blue-600 font-bold"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Home
            {isActive("/") && pathname === "/" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
            )}
          </Link>
          <Link
            href="/how-it-works"
            className={`relative py-1 transition duration-200 ${
              isActive("/how-it-works")
                ? "text-blue-600 font-bold"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            How it works
            {isActive("/how-it-works") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
            )}
          </Link>
          <Link
            href="/questions"
            className={`relative py-1 transition duration-200 ${
              isActive("/questions")
                ? "text-blue-600 font-bold"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            FAQs
            {isActive("/questions") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in" />
            )}
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 py-1 transition duration-200 ${
              isActive("/admin")
                ? "text-blue-600 font-bold"
                : "text-slate-500 hover:text-blue-600"
            }`}
          >
            <LayoutDashboard size={15} /> Admin
          </Link>

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <Link
                href="/apply"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80 hover:bg-blue-100 transition shadow-xs"
              >
                <UserIcon size={14} /> My Application
              </Link>
              <button
                onClick={() => void handleSignOut()}
                className="text-slate-500 hover:text-red-600 p-2 rounded-lg transition hover:bg-slate-100 flex items-center gap-1"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/apply"
              className="nav-apply flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition duration-200"
            >
              Apply now <ArrowRight size={15} />
            </Link>
          )}
        </nav>

        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/apply"
            className="text-xs font-bold bg-blue-600 text-white px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm"
          >
            Apply <ArrowRight size={13} />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="bg-white/98 backdrop-blur-lg border-b border-slate-200 px-6 py-5 shadow-xl flex flex-col gap-4 md:hidden animate-fade-in">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold ${pathname === "/" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            Home
          </Link>
          <Link
            href="/apply"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold ${pathname === "/apply" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            Application Portal
          </Link>
          <Link
            href="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold ${pathname === "/how-it-works" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            How It Works
          </Link>
          <Link
            href="/questions"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold ${pathname === "/questions" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            FAQs & Support
          </Link>
          <Link
            href="/terms"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold ${pathname === "/terms" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            Terms & Conditions
          </Link>
          <Link
            href="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold ${pathname === "/privacy" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            Privacy Policy
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 text-sm font-semibold flex items-center gap-2 ${pathname === "/admin" ? "text-blue-600 font-bold" : "text-slate-700"}`}
          >
            <LayoutDashboard size={16} /> Admin Dashboard
          </Link>
          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                void handleSignOut();
              }}
              className="py-2 text-left text-sm text-red-600 font-semibold flex items-center gap-2 border-t border-slate-100 pt-3"
            >
              <LogOut size={16} /> Sign Out ({user.email})
            </button>
          )}
        </div>
      )}
    </header>
  );
}
