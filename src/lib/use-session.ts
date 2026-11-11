"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Current Supabase user; `ready` is false until the first session check finishes. */
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}

export const DEMO_ADMIN_KEY = "mp-admin-demo";

export async function signOut(redirectTo = "/") {
  try {
    sessionStorage.removeItem(DEMO_ADMIN_KEY);
  } catch {}
  await supabase?.auth.signOut();
  window.location.href = redirectTo;
}
