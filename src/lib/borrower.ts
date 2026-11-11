"use client";

import { supabase } from "./supabase";
import type { BorrowerPortalData } from "./types";
import { isValidPhone, normalizePhone } from "./phone-auth.ts";

/** Borrower sessions are separate from applicant (Supabase Auth) accounts:
 *  mobile number + admin-generated password → short-lived token kept in this tab. */
const KEY = "mp-borrower-token";

export const DEMO_PHONE = "9876543210";
export const DEMO_TOKEN = "demo";

export function getToken() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function setToken(t: string | null) {
  try {
    if (t) sessionStorage.setItem(KEY, t);
    else sessionStorage.removeItem(KEY);
  } catch {}
}

export async function borrowerLogin(phone: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isValidPhone(phone)) return { ok: false, error: "Enter your 10-digit mobile number." };
  if (!password) return { ok: false, error: "Enter the password you received." };
  const mobile = normalizePhone(phone);
  if (!supabase) {
    if (mobile !== DEMO_PHONE) return { ok: false, error: `Demo mode: use mobile number ${DEMO_PHONE} with any password.` };
    setToken(DEMO_TOKEN);
    return { ok: true };
  }
  const { data, error } = await supabase.rpc("borrower_login", { p_phone: mobile, p_password: password.trim() });
  if (error) return { ok: false, error: error.message };
  const res = data as { token?: string; error?: string };
  if (!res.token) return { ok: false, error: res.error ?? "Could not sign in." };
  setToken(res.token);
  return { ok: true };
}

export async function borrowerPortal(): Promise<{ data: BorrowerPortalData } | { error: string }> {
  const token = getToken();
  if (!token) return { error: "signed-out" };
  if (!supabase) {
    if (token !== DEMO_TOKEN) return { error: "signed-out" };
    const { demoPortal } = await import("./borrower-demo");
    return { data: demoPortal() };
  }
  const { data, error } = await supabase.rpc("borrower_portal", { p_token: token });
  if (error) return { error: error.message };
  const res = data as BorrowerPortalData & { error?: string };
  if (res.error) {
    setToken(null);
    return { error: res.error };
  }
  return { data: res };
}

export async function borrowerLogout() {
  const token = getToken();
  setToken(null);
  if (supabase && token) await supabase.rpc("borrower_logout", { p_token: token });
}

export async function borrowerChangePassword(current: string, next: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  const token = getToken();
  if (!token) return { ok: false, error: "Your session has ended. Please log in again." };
  if (!supabase) return { ok: true };
  const { data, error } = await supabase.rpc("borrower_change_password", { p_token: token, p_current: current, p_new: next });
  if (error) return { ok: false, error: error.message };
  const res = data as { ok?: boolean; error?: string };
  return res.ok ? { ok: true } : { ok: false, error: res.error ?? "Could not change the password." };
}

/** Asks the server for a 2-minute private download link to one of this borrower's documents. */
export async function borrowerDocumentUrl(id: string): Promise<{ url: string } | { error: string }> {
  const token = getToken();
  if (!token) return { error: "Your session has ended. Please log in again." };
  if (!supabase) return { error: "Demo mode: documents download once Supabase is connected." };
  try {
    const res = await fetch("/api/borrower/document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, id }),
    });
    const body = (await res.json()) as { url?: string; error?: string };
    return body.url ? { url: body.url } : { error: body.error ?? "Could not open the document." };
  } catch {
    return { error: "Could not reach the server. Check your connection." };
  }
}
