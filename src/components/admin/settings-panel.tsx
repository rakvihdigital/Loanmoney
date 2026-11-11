"use client";

import { useState, type FormEvent } from "react";
import { Building2, Loader2, QrCode } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings-context";
import { errorText } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { FileDrop, IMAGE_TYPES } from "../file-drop";
import type { AdminCtx } from "./admin-console";

const EMPTY: SiteSettings = {
  lender_name: "",
  lender_type: "NBFC",
  lender_reg_no: "",
  lender_website: "",
  company_name: "Money Pay",
  company_address: "",
  support_email: "",
  support_phone: "",
  grievance_officer: "",
  grievance_email: "",
  grievance_phone: "",
  refund_days: 7,
};

export function SettingsPanel({ ctx }: { ctx: AdminCtx }) {
  const { site, payment, qrUrl, reload } = useSettings();
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
      <LenderForm key={JSON.stringify(site)} initial={site ?? EMPTY} ctx={ctx} reload={reload} />
      <PaymentForm key={payment?.qr_path ?? "none"} initial={payment} qrUrl={qrUrl} ctx={ctx} reload={reload} />
    </div>
  );
}

function LenderForm({ initial, ctx, reload }: { initial: SiteSettings; ctx: AdminCtx; reload: () => Promise<void> }) {
  const [s, setS] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof SiteSettings, v: string | number) => setS((p) => ({ ...p, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (ctx.demo) return ctx.toast("bad", "Demo mode: connect Supabase to save lender settings.");
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_site_settings", { p: s });
    setBusy(false);
    if (error) return ctx.toast("bad", errorText(error));
    await reload();
    ctx.toast("ok", "Lender disclosure published. It now shows on every page.");
  }

  const input = (k: keyof SiteSettings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`s-${k}`}>
        {label}
      </label>
      <input id={`s-${k}`} value={String(s[k] ?? "")} onChange={(e) => set(k, e.target.value)} {...props} />
    </div>
  );

  return (
    <form onSubmit={save} className="card p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
          <Building2 size={18} />
        </span>
        <div>
          <h2 className="font-bold">Lender disclosure &amp; grievance</h2>
          <p className="mt-1 text-sm text-muted">Shown on every page. Applications stay closed until the lender name and RBI registration are saved.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{input("lender_name", "Lender legal name *", { required: true, placeholder: "e.g. Example Finance Private Limited" })}</div>
        <div>
          <label className="label" htmlFor="s-type">
            Lender type *
          </label>
          <select id="s-type" value={s.lender_type} onChange={(e) => set("lender_type", e.target.value)}>
            <option>NBFC</option>
            <option>Bank</option>
            <option>Other RBI-regulated entity</option>
          </select>
        </div>
        {input("lender_reg_no", "RBI registration (CoR) no. *", { required: true, className: "font-mono", placeholder: "e.g. N-14.03xxx" })}
        <div className="sm:col-span-2">{input("lender_website", "Lender website", { type: "url", placeholder: "https://" })}</div>
      </div>

      <h3 className="mt-8 border-t hairline pt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted">Grievance officer</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {input("grievance_officer", "Name *", { required: true })}
        {input("grievance_email", "Email *", { type: "email", required: true })}
        {input("grievance_phone", "Phone")}
      </div>

      <h3 className="mt-8 border-t hairline pt-6 text-xs font-bold uppercase tracking-[0.14em] text-muted">Your company</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {input("company_name", "Company name")}
        {input("support_email", "Support email", { type: "email" })}
        {input("support_phone", "Support phone")}
        <div>
          <label className="label" htmlFor="s-days">
            Refund window (days) *
          </label>
          <input id="s-days" type="number" min={1} max={30} value={s.refund_days} onChange={(e) => set("refund_days", Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">{input("company_address", "Registered address")}</div>
      </div>

      <button className="btn btn-dark mt-7" disabled={busy}>
        {busy && <Loader2 size={15} className="animate-spin" />} Save &amp; publish
      </button>
    </form>
  );
}

function PaymentForm({
  initial,
  qrUrl,
  ctx,
  reload,
}: {
  initial: { qr_path: string | null; payee_name: string; upi_id: string } | null;
  qrUrl: string | null;
  ctx: AdminCtx;
  reload: () => Promise<void>;
}) {
  const [payee, setPayee] = useState(initial?.payee_name ?? "");
  const [upi, setUpi] = useState(initial?.upi_id ?? "");
  const [qr, setQr] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (ctx.demo) return ctx.toast("bad", "Demo mode: connect Supabase to publish payment details.");
    if (!supabase) return;
    setBusy(true);
    try {
      let path = initial?.qr_path ?? null;
      if (qr) {
        const ext = qr.type === "image/png" ? "png" : qr.type === "image/webp" ? "webp" : "jpg";
        path = `admin/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("payment-qr").upload(path, qr, { contentType: qr.type });
        if (error) throw error;
      }
      const { error } = await supabase.rpc("admin_update_payment_settings", { p_payee_name: payee, p_upi_id: upi, p_qr_path: path });
      if (error) throw error;
      await reload();
      ctx.toast("ok", "Payment details published.");
    } catch (err) {
      ctx.toast("bad", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="card p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gradient-to-br from-gold/20 to-gold/[0.03] text-gold">
          <QrCode size={18} />
        </span>
        <div>
          <h2 className="font-bold">Payment collection</h2>
          <p className="mt-1 text-sm text-muted">Where applicants pay the ₹299 fee. Use a business account in the company&rsquo;s name.</p>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <div className="size-44 rounded-2xl border hairline bg-paper p-2.5">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="Current payment QR" className="size-full rounded-lg object-contain" />
          ) : (
            <div className="grid size-full place-items-center text-center text-xs text-muted">No QR published</div>
          )}
        </div>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="p-payee">
            Payee name *
          </label>
          <input id="p-payee" required maxLength={100} value={payee} onChange={(e) => setPayee(e.target.value)} placeholder="Name shown in UPI apps" />
        </div>
        <div>
          <label className="label" htmlFor="p-upi">
            UPI ID *
          </label>
          <input id="p-upi" required className="font-mono" maxLength={120} value={upi} onChange={(e) => setUpi(e.target.value.trim())} placeholder="business@bank" />
        </div>
        <FileDrop id="p-qr" label={initial?.qr_path ? "Replace QR image" : "QR image"} hint="PNG, JPG or WebP · up to 2 MB" types={IMAGE_TYPES} maxBytes={2 * 1024 * 1024} file={qr} onChange={setQr} required={!initial?.qr_path} />
        <p className="text-xs leading-relaxed text-muted">
          Changing the QR blocks submissions from applicants who loaded the old one, so they re-check the payee before submitting.
        </p>
      </div>
      <button className="btn btn-dark mt-6" disabled={busy}>
        {busy && <Loader2 size={15} className="animate-spin" />} Publish payment details
      </button>
    </form>
  );
}
