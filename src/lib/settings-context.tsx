"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { PaymentSettings, SiteSettings } from "./types";

type SettingsState = {
  site: SiteSettings | null;
  payment: PaymentSettings | null;
  loading: boolean;
  /** Lender name + RBI registration published → applications are open. */
  disclosed: boolean;
  qrUrl: string | null;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsState>({
  site: null,
  payment: null,
  loading: true,
  disclosed: false,
  qrUrl: null,
  reload: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  const reload = useCallback(async () => {
    if (!supabase) return;
    const [s, p] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("payment_settings").select("qr_path,payee_name,upi_id,fee").eq("id", 1).maybeSingle(),
    ]);
    if (s.data) setSite(s.data as SiteSettings);
    if (p.data) setPayment(p.data as PaymentSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload().catch(() => setLoading(false));
  }, [reload]);

  const disclosed = Boolean(site?.lender_name?.trim() && site?.lender_reg_no?.trim());
  const qrUrl =
    payment?.qr_path && supabase ? supabase.storage.from("payment-qr").getPublicUrl(payment.qr_path).data.publicUrl : null;

  return (
    <SettingsContext.Provider value={{ site, payment, loading, disclosed, qrUrl, reload }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
