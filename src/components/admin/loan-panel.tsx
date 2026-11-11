"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Copy, ExternalLink, FileText, KeyRound, Loader2, ReceiptText, RefreshCw, Save, Trash2, TriangleAlert, Undo2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dateOnly, dateTime, errorText, rupees } from "@/lib/format";
import { formatPhone } from "@/lib/phone-auth";
import { emi, schedule } from "@/lib/loan-math";
import {
  DOCUMENT_KINDS,
  REPAYMENT_METHODS,
  type Application,
  type BorrowerAccess,
  type Loan,
  type LoanDocument,
  type LoanDocumentKind,
  type LoanPayment,
  type LoanStatus,
  type RepaymentMethod,
} from "@/lib/types";
import { Notice } from "../ui";
import type { AdminCtx } from "./admin-console";

type Form = {
  loan_account_no: string;
  sanctioned_amount: string;
  interest_rate: string;
  tenure_months: string;
  first_emi_date: string;
  disbursed_on: string;
  status: LoanStatus;
  note: string;
  disbursed_amount: string;
  disbursed_to: string;
  processing_fee: string;
  apr: string;
  late_fee: string;
  prepayment_terms: string;
  repayment_method: RepaymentMethod;
  repayment_details: string;
  repayment_link: string;
};

const EMPTY: Form = {
  loan_account_no: "",
  sanctioned_amount: "",
  interest_rate: "",
  tenure_months: "",
  first_emi_date: "",
  disbursed_on: "",
  status: "sanctioned",
  note: "",
  disbursed_amount: "",
  disbursed_to: "",
  processing_fee: "",
  apr: "",
  late_fee: "",
  prepayment_terms: "",
  repayment_method: "",
  repayment_details: "",
  repayment_link: "",
};

const str = (v: unknown) => (v == null ? "" : String(v));
const today = () => new Date().toISOString().slice(0, 10);

function fromLoan(l: Loan): Form {
  return {
    loan_account_no: l.loan_account_no ?? "",
    sanctioned_amount: str(l.sanctioned_amount),
    interest_rate: l.interest_rate != null ? String(Number(l.interest_rate)) : "",
    tenure_months: str(l.tenure_months),
    first_emi_date: l.first_emi_date ?? "",
    disbursed_on: l.disbursed_on ?? "",
    status: l.status,
    note: l.note ?? "",
    disbursed_amount: str(l.disbursed_amount),
    disbursed_to: l.disbursed_to ?? "",
    processing_fee: str(l.processing_fee),
    apr: l.apr != null ? String(Number(l.apr)) : "",
    late_fee: l.late_fee ?? "",
    prepayment_terms: l.prepayment_terms ?? "",
    repayment_method: l.repayment_method ?? "",
    repayment_details: l.repayment_details ?? "",
    repayment_link: l.repayment_link ?? "",
  };
}

/** Strong, readable password for demo mode (live mode generates it in the database). */
function demoPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let out = "";
  bytes.forEach((b, i) => {
    out += alphabet[b % alphabet.length];
    if (i === 3 || i === 7) out += "-";
  });
  return out;
}

type Tab = "loan" | "emis" | "docs" | "login";
const TABS: { id: Tab; label: string; icon: typeof ReceiptText }[] = [
  { id: "loan", label: "Loan", icon: ReceiptText },
  { id: "emis", label: "EMIs", icon: CalendarClock },
  { id: "docs", label: "Documents", icon: FileText },
  { id: "login", label: "Login", icon: KeyRound },
];

export function LoanPanel({ app, ctx }: { app: Application; ctx: AdminCtx }) {
  const live = !ctx.demo && Boolean(supabase);
  const [tab, setTab] = useState<Tab>("loan");
  const [form, setForm] = useState<Form>({ ...EMPTY, sanctioned_amount: String(app.requested_amount) });
  const [saved, setSaved] = useState<Form | null>(null); // last saved loan (drives the EMI schedule)
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [docs, setDocs] = useState<LoanDocument[]>([]);
  const [access, setAccess] = useState<BorrowerAccess | null>(null);
  const [loading, setLoading] = useState(live);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!live) return;
    let alive = true;
    Promise.all([
      supabase!.from("loans").select("*").eq("application_id", app.id).maybeSingle(),
      supabase!.from("borrower_access").select("application_id,issued_at,last_login_at,locked_until").eq("application_id", app.id).maybeSingle(),
      supabase!.from("loan_payments").select("instalment_no,paid_on,amount,reference").eq("application_id", app.id).order("instalment_no"),
      supabase!.from("loan_documents").select("id,kind,title,uploaded_at,path").eq("application_id", app.id).order("uploaded_at", { ascending: false }),
    ]).then(([l, b, p, d]) => {
      if (!alive) return;
      if (l.data) {
        const f = fromLoan(l.data as Loan);
        setForm(f);
        setSaved(f);
      }
      setAccess((b.data as BorrowerAccess) ?? null);
      setPayments((p.data as LoanPayment[]) ?? []);
      setDocs((d.data as LoanDocument[]) ?? []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [app.id, live]);

  return (
    <section className="card overflow-hidden">
      <div className="px-5 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Loan & borrower</h3>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto border-b hairline px-3 [scrollbar-width:none]" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setErr("");
            }}
            className={`relative flex shrink-0 items-center gap-1.5 px-3 py-3 text-sm font-semibold transition ${tab === id ? "text-ink" : "text-muted hover:text-ink"}`}
          >
            <Icon size={15} className={tab === id ? "text-gold" : ""} /> {label}
            {id === "emis" && payments.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[0.65rem]">{payments.length}</span>}
            {id === "docs" && docs.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[0.65rem]">{docs.length}</span>}
            {tab === id && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-gold" />}
          </button>
        ))}
      </div>

      <div className="p-5">
        {err && (
          <div className="mb-4">
            <Notice tone="bad" onClose={() => setErr("")}>
              {err}
            </Notice>
          </div>
        )}
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </p>
        ) : tab === "loan" ? (
          <LoanTab app={app} ctx={ctx} live={live} form={form} setForm={setForm} onSaved={setSaved} setErr={setErr} />
        ) : tab === "emis" ? (
          <EmiTab app={app} ctx={ctx} live={live} saved={saved} payments={payments} setPayments={setPayments} setErr={setErr} goLoan={() => setTab("loan")} />
        ) : tab === "docs" ? (
          <DocsTab app={app} ctx={ctx} live={live} docs={docs} setDocs={setDocs} setErr={setErr} />
        ) : (
          <LoginTab app={app} live={live} access={access} setAccess={setAccess} setErr={setErr} />
        )}
      </div>
    </section>
  );
}

/* ================================================================ Loan */

function LoanTab({
  app,
  ctx,
  live,
  form,
  setForm,
  onSaved,
  setErr,
}: {
  app: Application;
  ctx: AdminCtx;
  live: boolean;
  form: Form;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  onSaved: (f: Form) => void;
  setErr: (s: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const preview = emi(Number(form.sanctioned_amount), Number(form.interest_rate), Number(form.tenure_months));
  const num = (v: string) => v.replace(/\D/g, "");
  const dec = (v: string) => v.replace(/[^\d.]/g, "");

  async function save() {
    setErr("");
    if (form.repayment_link && !/^https:\/\//.test(form.repayment_link)) return setErr("The payment link must start with https://");
    if (!live) {
      onSaved(form);
      return ctx.toast("ok", "Demo: loan details saved for this session.");
    }
    setSaving(true);
    const { error } = await supabase!.rpc("admin_save_loan", { p_id: app.id, p: form });
    setSaving(false);
    if (error) return setErr(errorText(error));
    onSaved(form);
    ctx.toast("ok", `Loan details saved for ${app.full_name}. They see them on their next login.`);
  }

  return (
    <div className="space-y-6">
      <Group title="Loan">
        <F label="Loan account no." id="ln-acc">
          <input id="ln-acc" className="font-mono" maxLength={40} value={form.loan_account_no} onChange={(e) => set("loan_account_no", e.target.value)} placeholder="From the lender" />
        </F>
        <F label="Status" id="ln-status">
          <select id="ln-status" value={form.status} onChange={(e) => set("status", e.target.value)}>
            <option value="sanctioned">Sanctioned</option>
            <option value="disbursed">Disbursed</option>
            <option value="active">Active (repaying)</option>
            <option value="closed">Closed</option>
          </select>
        </F>
        <F label="Sanctioned amount (₹)" id="ln-amt">
          <input id="ln-amt" inputMode="numeric" value={form.sanctioned_amount} onChange={(e) => set("sanctioned_amount", num(e.target.value))} />
        </F>
        <F label="Interest rate (% a year)" id="ln-rate">
          <input id="ln-rate" inputMode="decimal" value={form.interest_rate} onChange={(e) => set("interest_rate", dec(e.target.value))} placeholder="e.g. 14" />
        </F>
        <F label="Tenure (months)" id="ln-ten">
          <input id="ln-ten" inputMode="numeric" value={form.tenure_months} onChange={(e) => set("tenure_months", num(e.target.value))} placeholder="e.g. 12" />
        </F>
        <F label="EMI (calculated)" id="ln-emi">
          <div id="ln-emi" className="flex h-[46px] items-center rounded-[0.85rem] border border-white/10 bg-white/[0.02] px-4 font-semibold text-gold">
            {preview ? rupees(preview) : "—"}
          </div>
        </F>
        <F label="First EMI date" id="ln-first">
          <input id="ln-first" type="date" value={form.first_emi_date} onChange={(e) => set("first_emi_date", e.target.value)} />
        </F>
      </Group>

      <Group title="Disbursement">
        <F label="Disbursed on" id="ln-disb">
          <input id="ln-disb" type="date" value={form.disbursed_on} onChange={(e) => set("disbursed_on", e.target.value)} />
        </F>
        <F label="Amount credited (₹)" id="ln-damt">
          <input id="ln-damt" inputMode="numeric" value={form.disbursed_amount} onChange={(e) => set("disbursed_amount", num(e.target.value))} placeholder="After lender charges" />
        </F>
        <div className="sm:col-span-2">
          <F label="Credited to" id="ln-dto">
            <input id="ln-dto" maxLength={60} value={form.disbursed_to} onChange={(e) => set("disbursed_to", e.target.value)} placeholder="e.g. HDFC Bank ••4321 (last 4 digits only)" />
          </F>
        </div>
      </Group>

      <Group title="Charges (from the Key Fact Statement)">
        <F label="Lender processing fee (₹)" id="ln-pf">
          <input id="ln-pf" inputMode="numeric" value={form.processing_fee} onChange={(e) => set("processing_fee", num(e.target.value))} />
        </F>
        <F label="APR (%)" id="ln-apr">
          <input id="ln-apr" inputMode="decimal" value={form.apr} onChange={(e) => set("apr", dec(e.target.value))} placeholder="All-in yearly cost" />
        </F>
        <div className="sm:col-span-2">
          <F label="Late payment charges" id="ln-late">
            <input id="ln-late" maxLength={300} value={form.late_fee} onChange={(e) => set("late_fee", e.target.value)} placeholder="e.g. ₹500 per missed EMI" />
          </F>
        </div>
        <div className="sm:col-span-2">
          <F label="Prepayment / closure terms" id="ln-pre">
            <input id="ln-pre" maxLength={500} value={form.prepayment_terms} onChange={(e) => set("prepayment_terms", e.target.value)} placeholder="e.g. No charge after 6 EMIs" />
          </F>
        </div>
      </Group>

      <Group title="How the borrower pays">
        <F label="Method" id="ln-method">
          <select id="ln-method" value={form.repayment_method} onChange={(e) => set("repayment_method", e.target.value)}>
            <option value="">Not set yet</option>
            {Object.entries(REPAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </F>
        <F label="Lender's payment link (optional)" id="ln-link">
          <input id="ln-link" type="url" maxLength={300} value={form.repayment_link} onChange={(e) => set("repayment_link", e.target.value.trim())} placeholder="https://" />
        </F>
        <div className="sm:col-span-2">
          <F label="Instructions for the borrower" id="ln-howto">
            <textarea
              id="ln-howto"
              rows={2}
              maxLength={1000}
              value={form.repayment_details}
              onChange={(e) => set("repayment_details", e.target.value)}
              placeholder="e.g. EMIs are auto-debited from your registered account on the 5th."
            />
          </F>
        </div>
        <p className="text-xs text-warn sm:col-span-2">Only the lender&rsquo;s official account or link. Never a personal account or UPI ID.</p>
      </Group>

      <F label="Message to borrower (optional)" id="ln-note">
        <textarea id="ln-note" rows={2} maxLength={1000} value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Shown on their Overview tab." />
      </F>

      <button type="button" className="btn btn-dark" disabled={saving} onClick={() => void save()}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save loan details
      </button>
    </div>
  );
}

/* ================================================================ EMIs */

function EmiTab({
  app,
  ctx,
  live,
  saved,
  payments,
  setPayments,
  setErr,
  goLoan,
}: {
  app: Application;
  ctx: AdminCtx;
  live: boolean;
  saved: Form | null;
  payments: LoanPayment[];
  setPayments: React.Dispatch<React.SetStateAction<LoanPayment[]>>;
  setErr: (s: string) => void;
  goLoan: () => void;
}) {
  const rows = useMemo(() => {
    if (!saved?.sanctioned_amount || !saved.interest_rate || !saved.tenure_months || !saved.first_emi_date) return [];
    return schedule(Number(saved.sanctioned_amount), Number(saved.interest_rate), Number(saved.tenure_months), saved.first_emi_date);
  }, [saved]);
  const [editing, setEditing] = useState<number | null>(null);
  const [paidOn, setPaidOn] = useState(today());
  const [amount, setAmount] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  if (!rows.length)
    return (
      <div className="text-sm text-muted">
        Save the sanctioned amount, interest rate, tenure and first EMI date in the{" "}
        <button type="button" className="font-semibold text-gold hover:underline" onClick={goLoan}>
          Loan tab
        </button>{" "}
        to see the EMI schedule.
      </div>
    );

  const byNo = new Map(payments.map((p) => [p.instalment_no, p]));
  const t = today();

  function startMark(no: number, emiAmt: number) {
    setEditing(no);
    setPaidOn(t);
    setAmount(String(emiAmt));
    setRef("");
  }

  async function record(no: number) {
    setErr("");
    const amt = Number(amount);
    if (!(amt > 0)) return setErr("Enter the amount paid.");
    if (!paidOn || paidOn > t) return setErr("Enter the date it was paid (not in the future).");
    const p: LoanPayment = { instalment_no: no, paid_on: paidOn, amount: amt, reference: ref.trim() };
    if (live) {
      setBusy(true);
      const { error } = await supabase!.rpc("admin_record_payment", { p_id: app.id, p_instalment: no, p_paid_on: paidOn, p_amount: amt, p_reference: ref.trim() });
      setBusy(false);
      if (error) return setErr(errorText(error));
    }
    setPayments((list) => [...list.filter((x) => x.instalment_no !== no), p].sort((a, b) => a.instalment_no - b.instalment_no));
    setEditing(null);
    ctx.toast("ok", `EMI ${no} marked paid${live ? "" : " (demo, not saved)"}.`);
  }

  async function undo(no: number) {
    setErr("");
    if (live) {
      const { error } = await supabase!.rpc("admin_remove_payment", { p_id: app.id, p_instalment: no });
      if (error) return setErr(errorText(error));
    }
    setPayments((list) => list.filter((x) => x.instalment_no !== no));
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        {payments.length} of {rows.length} paid. Mark an EMI paid once the lender confirms it was received.
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border hairline">
        {rows.map((r) => {
          const p = byNo.get(r.no);
          const overdue = !p && r.date < t;
          return (
            <li key={r.no} className={`px-3.5 py-3 text-sm ${overdue ? "bg-bad-soft/40" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 font-semibold text-muted">{r.no}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {rupees(r.emi)} <span className="font-normal text-muted">· due {dateOnly(r.date + "T00:00:00")}</span>
                  </p>
                  {p ? (
                    <p className="text-xs text-ok">
                      Paid {dateOnly(p.paid_on + "T00:00:00")} · {rupees(p.amount)}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  ) : overdue ? (
                    <p className="text-xs font-semibold text-bad">Overdue</p>
                  ) : null}
                </div>
                {p ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => void undo(r.no)} title="Undo">
                    <Undo2 size={14} /> Undo
                  </button>
                ) : editing !== r.no ? (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => startMark(r.no, r.emi)}>
                    <Check size={14} /> Mark paid
                  </button>
                ) : null}
              </div>
              {editing === r.no && (
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
                  <input type="date" aria-label="Paid on" value={paidOn} max={t} onChange={(e) => setPaidOn(e.target.value)} />
                  <input inputMode="numeric" aria-label="Amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="Amount" />
                  <input aria-label="Reference" maxLength={60} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Reference (optional)" />
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ok btn-sm" disabled={busy} onClick={() => void record(r.no)}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ================================================================ Documents */

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

function DocsTab({
  app,
  ctx,
  live,
  docs,
  setDocs,
  setErr,
}: {
  app: Application;
  ctx: AdminCtx;
  live: boolean;
  docs: LoanDocument[];
  setDocs: React.Dispatch<React.SetStateAction<LoanDocument[]>>;
  setErr: (s: string) => void;
}) {
  const [kind, setKind] = useState<LoanDocumentKind>("kfs");
  const [title, setTitle] = useState(DOCUMENT_KINDS.kfs);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function upload() {
    setErr("");
    if (!file) return setErr("Choose a PDF or image to upload.");
    if (!EXT[file.type]) return setErr("Use a PDF, PNG, JPG or WebP file.");
    if (file.size > 10 * 1024 * 1024) return setErr("The file must be 10 MB or smaller.");
    if (title.trim().length < 2) return setErr("Give the document a name.");
    setBusy(true);
    try {
      let doc: LoanDocument;
      if (live) {
        const path = `${app.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
        const up = await supabase!.storage.from("loan-documents").upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        const { data, error } = await supabase!.rpc("admin_add_loan_document", { p_id: app.id, p_kind: kind, p_title: title.trim(), p_path: path });
        if (error) {
          await supabase!.storage.from("loan-documents").remove([path]);
          throw error;
        }
        doc = { id: data as string, kind, title: title.trim(), uploaded_at: new Date().toISOString(), path };
      } else {
        doc = { id: crypto.randomUUID(), kind, title: title.trim(), uploaded_at: new Date().toISOString() };
      }
      setDocs((d) => [doc, ...d]);
      setFile(null);
      setInputKey((k) => k + 1);
      ctx.toast("ok", `${doc.title} added${live ? "" : " (demo, not saved)"}. The borrower can download it from their Documents tab.`);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function view(d: LoanDocument) {
    if (!live || !d.path) return ctx.toast("bad", "Demo: files open once Supabase is connected.");
    const { data, error } = await supabase!.storage.from("loan-documents").createSignedUrl(d.path, 120);
    if (error) return setErr(errorText(error));
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function remove(d: LoanDocument) {
    setErr("");
    if (live) {
      const { data, error } = await supabase!.rpc("admin_remove_loan_document", { p_doc: d.id });
      if (error) return setErr(errorText(error));
      await supabase!.storage.from("loan-documents").remove([data as string]);
    }
    setDocs((list) => list.filter((x) => x.id !== d.id));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border hairline bg-white/[0.02] p-4">
        <p className="text-sm font-semibold text-ink">Add a document</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <F label="Type" id="doc-kind">
            <select
              id="doc-kind"
              value={kind}
              onChange={(e) => {
                const k = e.target.value as LoanDocumentKind;
                setKind(k);
                setTitle(k === "other" ? "" : DOCUMENT_KINDS[k]);
              }}
            >
              {Object.entries(DOCUMENT_KINDS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </F>
          <F label="Name shown to borrower" id="doc-title">
            <input id="doc-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </F>
          <div className="sm:col-span-2">
            <F label="File (PDF or image, up to 10 MB)" id="doc-file">
              <input
                key={inputKey}
                id="doc-file"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink"
              />
            </F>
          </div>
        </div>
        <button type="button" className="btn btn-dark btn-sm mt-4" disabled={busy} onClick={() => void upload()}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-muted">No documents yet. Upload the Key Fact Statement first; the RBI requires borrowers to receive it.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border hairline">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold-soft text-gold">
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{d.title}</p>
                <p className="text-xs text-muted">
                  {DOCUMENT_KINDS[d.kind]} · {dateOnly(d.uploaded_at)}
                </p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void view(d)} title="Open">
                <ExternalLink size={14} />
              </button>
              <button type="button" className="btn btn-ghost btn-sm text-bad" onClick={() => void remove(d)} title="Remove">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================================================================ Login */

function LoginTab({
  app,
  live,
  access,
  setAccess,
  setErr,
}: {
  app: Application;
  live: boolean;
  access: BorrowerAccess | null;
  setAccess: React.Dispatch<React.SetStateAction<BorrowerAccess | null>>;
  setErr: (s: string) => void;
}) {
  const [issuing, setIssuing] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const loginId = formatPhone(app.phone);
  const shareText = password
    ? `Your Money Pay loan login\nMobile number: ${loginId}\nPassword: ${password}\nLog in at ${typeof window !== "undefined" ? window.location.origin : ""}/login (My loan)`
    : "";

  async function issue() {
    setErr("");
    setConfirmRegen(false);
    setIssuing(true);
    try {
      if (!live) {
        setPassword(demoPassword());
      } else {
        const { data, error } = await supabase!.rpc("admin_issue_borrower_password", { p_id: app.id });
        if (error) throw error;
        setPassword(data as string);
      }
      setAccess((a) => ({ application_id: app.id, issued_at: new Date().toISOString(), last_login_at: a?.last_login_at ?? null, locked_until: null }));
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setIssuing(false);
    }
  }

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">Borrower login</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Logs in with mobile <span className="font-mono text-ink-2">{loginId}</span>
            {access ? (
              <>
                {" "}
                · password issued {dateTime(access.issued_at)}
                {access.last_login_at ? ` · last login ${dateTime(access.last_login_at)}` : " · not logged in yet"}
              </>
            ) : (
              " · no password issued yet"
            )}
          </p>
        </div>
        {!access ? (
          <button type="button" className="btn btn-gold btn-sm" disabled={issuing} onClick={() => void issue()}>
            {issuing ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Generate password
          </button>
        ) : confirmRegen ? (
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmRegen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-bad btn-sm" disabled={issuing} onClick={() => void issue()}>
              {issuing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Yes, regenerate
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmRegen(true)}>
            <RefreshCw size={14} /> Regenerate
          </button>
        )}
      </div>
      {confirmRegen && (
        <p className="mt-3 flex items-start gap-2 text-xs text-warn">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" /> The old password stops working and the borrower is logged out everywhere.
        </p>
      )}
      {password && (
        <div className="mt-4 rounded-xl border border-gold/35 bg-gold-soft/60 p-4">
          <p className="text-xs font-semibold text-gold-ink">Share these with {app.full_name}. The password is shown only once.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Cred label="Mobile number" value={loginId} copied={copied === "id"} onCopy={() => copy(app.phone, "id")} />
            <Cred label="Password" value={password} copied={copied === "pw"} onCopy={() => copy(password, "pw")} />
          </div>
          <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => copy(shareText, "all")}>
            {copied === "all" ? <Check size={14} className="text-ok" /> : <Copy size={14} />} Copy message for borrower
          </button>
        </div>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted">Borrowers can change this password themselves from their Account tab.</p>
    </div>
  );
}

/* ================================================================ Pieces */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-faint">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function F({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Cred({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <button type="button" onClick={onCopy} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-paper/60 px-3 py-2.5 text-left">
      <span className="min-w-0">
        <span className="block text-[0.65rem] uppercase tracking-wide text-muted">{label}</span>
        <span className="block truncate font-mono text-sm font-semibold text-ink">{value}</span>
      </span>
      {copied ? <Check size={15} className="shrink-0 text-ok" /> : <Copy size={15} className="shrink-0 text-faint" />}
    </button>
  );
}
