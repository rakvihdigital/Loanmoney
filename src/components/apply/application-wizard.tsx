"use client";

import { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  Check,
  CircleCheckBig,
  Copy,
  FileCheck2,
  Loader2,
  QrCode,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettings } from "@/lib/settings-context";
import { errorText, rupees } from "@/lib/format";
import { CATEGORIES, FEE, IDENTITY_TYPES } from "@/lib/types";
import { STEP_FIELDS, firstStepWithError, validateApplication, type ApplicationInput, type Errors } from "@/lib/application-validation";
import { FileDrop, IMAGE_TYPES } from "../file-drop";
import { FieldError, Notice } from "../ui";

const STEPS = [
  { title: "About you", icon: UserRound },
  { title: "Documents", icon: FileCheck2 },
  { title: "Payment", icon: QrCode },
  { title: "Review", icon: CircleCheckBig },
];

const AMOUNTS = [10000, 25000, 50000, 100000];

type Files = { identity: File | null; identity_back: File | null; address: File | null; student: File | null; proof: File | null };

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf" };

export function ApplicationWizard({ user, onSubmitted, demo = false }: { user: User; onSubmitted: (ref: string) => void; demo?: boolean }) {
  const { site, payment, qrUrl } = useSettings();
  const accountPhone = typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "";
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<Files>({ identity: null, identity_back: null, address: null, student: null, proof: null });
  const [v, setV] = useState({
    full_name: "",
    phone: accountPhone,
    dob: "",
    category: "Employed",
    requested_amount: "25000",
    address: "",
    city: "",
    state: "",
    pincode: "",
    identity_type: "Voter ID",
    identity_last4: "",
    institution: "",
    kyc_consent: false,
    transaction_id: "",
    refund_upi_id: "",
    payment_consent: false,
  });

  const input: ApplicationInput = useMemo(
    () => ({
      ...v,
      identity_type: v.category === "Driver" ? "Driving licence" : v.identity_type,
      files: { identity: !!files.identity, address: !!files.address, student: !!files.student, proof: !!files.proof },
    }),
    [v, files],
  );

  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    if (errors[k as string]) setErrors(({ [k as string]: _drop, ...rest }) => rest);
  };
  const setFile = (k: keyof Files, f: File | null, errKey: string) => {
    setFiles((p) => ({ ...p, [k]: f }));
    if (errors[errKey]) setErrors(({ [errKey]: _drop, ...rest }) => rest);
  };

  function stepErrors(i: number) {
    const all = validateApplication(input);
    return Object.fromEntries(Object.entries(all).filter(([k]) => STEP_FIELDS[i].includes(k)));
  }

  function next() {
    const e = stepErrors(step);
    setErrors(e);
    if (Object.keys(e).length) return focusFirst(e);
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function focusFirst(e: Errors) {
    const key = Object.keys(e)[0];
    setTimeout(() => {
      const el = document.getElementById(key);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement | null)?.focus?.();
    }, 30);
  }

  async function submit() {
    setServerError("");
    const all = validateApplication(input);
    if (Object.keys(all).length) {
      setErrors(all);
      const s = firstStepWithError(all);
      if (s !== null) setStep(s);
      return focusFirst(all);
    }
    if (demo) return setServerError("Demo mode: everything checks out, but submitting needs Supabase. Add your keys to .env.local to go live.");
    if (!supabase || !payment?.qr_path) return setServerError("Payments are not configured yet. Please try again later.");
    setBusy(true);
    try {
      const upload = async (bucket: string, f: File | null) => {
        if (!f) return null;
        const path = `${user.id}/${crypto.randomUUID()}.${EXT[f.type] ?? "bin"}`;
        const { error } = await supabase!.storage.from(bucket).upload(path, f, { contentType: f.type, upsert: false });
        if (error) throw error;
        return path;
      };
      setProgress("Uploading documents…");
      const [identity_path, identity_back_path, address_path, student_path] = await Promise.all([
        upload("kyc-documents", files.identity),
        upload("kyc-documents", files.identity_back),
        upload("kyc-documents", files.address),
        upload("kyc-documents", v.category === "Student" ? files.student : null),
      ]);
      setProgress("Uploading payment screenshot…");
      const proof_path = await upload("payment-proofs", files.proof);
      setProgress("Submitting application…");
      const { data, error } = await supabase.rpc("submit_loan_application", {
        p_full_name: v.full_name.trim(),
        p_phone: v.phone.trim(),
        p_category: v.category,
        p_requested_amount: Number(v.requested_amount),
        p_transaction_id: v.transaction_id.trim(),
        p_proof_path: proof_path,
        p_expected_qr: payment.qr_path,
        p_refund_upi_id: v.refund_upi_id.trim(),
        p_kyc: {
          dob: v.dob,
          address: v.address.trim(),
          city: v.city.trim(),
          state: v.state.trim(),
          pincode: v.pincode.trim(),
          identity_type: input.identity_type,
          identity_last4: v.identity_last4.trim(),
          institution: v.institution.trim(),
          identity_path,
          identity_back_path,
          address_path,
          student_path,
          consent: true,
        },
      });
      if (error) throw error;
      onSubmitted((data as { ref_code: string }).ref_code);
    } catch (err) {
      setServerError(errorText(err));
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  const f = (k: string) => ({ id: k, "aria-invalid": Boolean(errors[k]), "aria-describedby": errors[k] ? k + "-error" : undefined });
  const days = site?.refund_days ?? 7;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
      <div className="card overflow-hidden">
        {/* Stepper */}
        <ol className="grid grid-cols-4 border-b hairline bg-white/[0.02]">
          {STEPS.map(({ title, icon: Icon }, i) => {
            const state = i < step ? "done" : i === step ? "active" : "todo";
            return (
              <li key={title} className="relative">
                <button
                  type="button"
                  disabled={i > step || busy}
                  onClick={() => setStep(i)}
                  className={`flex w-full flex-col items-center gap-1.5 px-2 py-4 text-[0.7rem] font-bold sm:flex-row sm:justify-center sm:gap-2 sm:text-xs ${
                    state === "active" ? "text-ink" : state === "done" ? "text-ok" : "text-faint"
                  }`}
                >
                  <span
                    className={`grid size-7 place-items-center rounded-full ${
                      state === "active" ? "bg-gradient-to-b from-[#f3dca6] to-[#c9a35a] text-[#1a1406] shadow-[0_0_18px_-2px_rgb(227_194_125/0.7)]" : state === "done" ? "bg-ok-soft text-ok" : "bg-white/[0.05] text-faint"
                    }`}
                  >
                    {state === "done" ? <Check size={14} strokeWidth={3} /> : <Icon size={14} />}
                  </span>
                  {title}
                </button>
                {state === "active" && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent" />}
              </li>
            );
          })}
        </ol>

        <div className="p-5 sm:p-7">
          {step === 0 && (
            <section className="space-y-5 animate-fade">
              <Header title="Tell us about yourself" sub="Enter details exactly as they appear on your ID." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" k="full_name" err={errors.full_name}>
                  <input {...f("full_name")} autoComplete="name" maxLength={100} value={v.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="As on your ID" />
                </Field>
                <Field label="Mobile number" k="phone" err={errors.phone} hint={accountPhone ? "Your account’s mobile number." : undefined}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-12 place-items-center text-sm font-semibold text-muted">+91</span>
                    <input
                      {...f("phone")}
                      className="!pl-12"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      readOnly={Boolean(accountPhone)}
                      value={v.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                      placeholder="98765 43210"
                    />
                  </div>
                </Field>
                <Field label="Date of birth" k="dob" err={errors.dob}>
                  <input {...f("dob")} type="date" value={v.dob} onChange={(e) => set("dob", e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="What do you do?" k="category" err={errors.category}>
                  <select
                    {...f("category")}
                    value={v.category}
                    onChange={(e) => {
                      set("category", e.target.value);
                      if (e.target.value === "Driver") set("identity_type", "Driving licence");
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div>
                <Field label="Loan amount you need" k="requested_amount" err={errors.requested_amount}>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-base font-semibold text-muted">₹</span>
                    <input
                      {...f("requested_amount")}
                      className="!pl-10 !text-lg !font-bold"
                      inputMode="numeric"
                      value={v.requested_amount}
                      onChange={(e) => set("requested_amount", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    />
                  </div>
                </Field>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => set("requested_amount", String(a))}
                      className={`chip border ${Number(v.requested_amount) === a ? "border-gold/60 bg-gold-soft text-gold-ink" : "border-white/10 bg-white/[0.03] text-ink-2 hover:border-white/25"}`}
                    >
                      {rupees(a)}
                    </button>
                  ))}
                </div>
                <p className="hint">Between ₹1,000 and ₹5,00,000. The lender sets the final amount.</p>
              </div>

              <div className="grid gap-4 border-t hairline pt-5 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <Field label="Current address" k="address" err={errors.address}>
                    <textarea {...f("address")} rows={2} autoComplete="street-address" maxLength={500} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder="House / flat, street, locality" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="City" k="city" err={errors.city}>
                    <input {...f("city")} autoComplete="address-level2" maxLength={100} value={v.city} onChange={(e) => set("city", e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="State" k="state" err={errors.state}>
                    <input {...f("state")} autoComplete="address-level1" maxLength={100} value={v.state} onChange={(e) => set("state", e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="PIN code" k="pincode" err={errors.pincode}>
                    <input {...f("pincode")} inputMode="numeric" autoComplete="postal-code" maxLength={6} value={v.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-5 animate-fade">
              <Header
                title="Upload your documents"
                sub={
                  v.category === "Student"
                    ? "Students: ID, address proof and your student ID card."
                    : v.category === "Driver"
                      ? "Drivers: your driving licence is your ID document."
                      : "A government ID and a proof of your current address."
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="ID document" k="identity_type" err={errors.identity_type}>
                  <select {...f("identity_type")} value={input.identity_type} disabled={v.category === "Driver"} onChange={(e) => set("identity_type", e.target.value)}>
                    {IDENTITY_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Last 4 characters of ID number" k="identity_last4" err={errors.identity_last4} hint="Never type your full ID number.">
                  <input
                    {...f("identity_last4")}
                    maxLength={4}
                    className="font-mono tracking-[0.3em] uppercase"
                    value={v.identity_last4}
                    onChange={(e) => set("identity_last4", e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                    placeholder="XXXX"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FileDrop
                  id="identity_file"
                  label={`${input.identity_type} — front`}
                  hint="Photo page or front side · up to 5 MB"
                  required
                  file={files.identity}
                  onChange={(x) => setFile("identity", x, "identity_file")}
                  error={errors.identity_file}
                />
                <FileDrop id="identity_back" label={`${input.identity_type} — back`} hint="Only if it has details on the back" file={files.identity_back} onChange={(x) => setFile("identity_back", x, "identity_back")} />
                <FileDrop
                  id="address_file"
                  label="Address proof"
                  hint="Utility bill, bank statement or rent agreement"
                  required
                  file={files.address}
                  onChange={(x) => setFile("address", x, "address_file")}
                  error={errors.address_file}
                />
                {v.category === "Student" && (
                  <FileDrop
                    id="student_file"
                    label="Student ID card"
                    hint="Valid for the current academic year"
                    required
                    file={files.student}
                    onChange={(x) => setFile("student", x, "student_file")}
                    error={errors.student_file}
                  />
                )}
              </div>
              {v.category === "Student" && (
                <Field label="School / college / university" k="institution" err={errors.institution}>
                  <input {...f("institution")} maxLength={150} value={v.institution} onChange={(e) => set("institution", e.target.value)} placeholder="e.g. St. Xavier's College, Mumbai" />
                </Field>
              )}
              <Check2 id="kyc_consent" checked={v.kyc_consent} onChange={(c) => set("kyc_consent", c)} error={errors.kyc_consent}>
                These documents are mine and the details are accurate. I consent to them being reviewed for this application and shared with the lender.
              </Check2>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-5 animate-fade">
              <Header title={`Pay the ₹${FEE} application fee`} sub="Use any UPI app. Check that the payee name matches before you pay." />
              <div className="card-glow grid gap-6 rounded-2xl border hairline bg-gradient-to-br from-white/[0.05] to-transparent p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                <div className="mx-auto w-full max-w-[180px] rounded-2xl bg-white p-3 shadow-[0_20px_40px_-15px_rgb(0_0_0/0.8)]">
                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrUrl} alt={`UPI QR code for ${payment?.payee_name}`} className="aspect-square w-full rounded-lg object-contain" />
                  ) : (
                    <div className="grid aspect-square place-items-center text-center text-xs text-muted">QR not published yet</div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pay to</p>
                  <p className="mt-1 text-lg font-bold">{payment?.payee_name || "—"}</p>
                  {payment?.upi_id && (
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(payment.upi_id);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                      className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg border hairline bg-white/[0.04] px-3 py-1.5 font-mono text-sm"
                    >
                      {payment.upi_id} {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} className="text-muted" />}
                    </button>
                  )}
                  <p className="display mt-4 text-4xl text-champagne">₹{FEE}</p>
                  <p className="text-xs text-muted">Pay this exact amount once.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="UPI transaction ID (UTR)" k="transaction_id" err={errors.transaction_id} hint="12-digit number in your UPI app's payment details.">
                  <input
                    {...f("transaction_id")}
                    className="font-mono"
                    maxLength={40}
                    value={v.transaction_id}
                    onChange={(e) => set("transaction_id", e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                    placeholder="e.g. 428192018291"
                  />
                </Field>
                <Field label="UPI ID for refunds" k="refund_upi_id" err={errors.refund_upi_id} hint={`Where we send ₹${FEE} back if you're not approved.`}>
                  <input {...f("refund_upi_id")} autoCapitalize="none" maxLength={120} value={v.refund_upi_id} onChange={(e) => set("refund_upi_id", e.target.value.trim())} placeholder="yourname@okaxis" />
                </Field>
              </div>
              <FileDrop
                id="proof"
                label="Payment screenshot"
                hint="The confirmation screen showing amount, payee and UTR · PNG/JPG/WebP"
                types={IMAGE_TYPES}
                required
                file={files.proof}
                onChange={(x) => setFile("proof", x, "proof")}
                error={errors.proof}
              />
              <Check2 id="payment_consent" checked={v.payment_consent} onChange={(c) => set("payment_consent", c)} error={errors.payment_consent}>
                I understand the ₹{FEE} fee covers verification of my application. If I&rsquo;m not approved it will be refunded in full to the UPI ID above within {days} days. Approval
                sends my application to the lender, who decides the final loan terms.
              </Check2>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-5 animate-fade">
              <Header title="Check and submit" sub="You can't edit an application after submitting it." />
              <dl className="divide-y divide-line overflow-hidden rounded-2xl border hairline text-sm">
                <Summary k="Name" v={v.full_name} />
                <Summary k="Mobile" v={`+91 ${v.phone}`} />
                <Summary k="Date of birth" v={v.dob} />
                <Summary k="Category" v={v.category + (v.category === "Student" ? ` · ${v.institution}` : "")} />
                <Summary k="Amount requested" v={rupees(Number(v.requested_amount) || 0)} strong />
                <Summary k="Address" v={`${v.address}, ${v.city}, ${v.state} ${v.pincode}`} />
                <Summary k="ID" v={`${input.identity_type} ···· ${v.identity_last4.toUpperCase()}`} />
                <Summary
                  k="Documents"
                  v={[files.identity && "ID front", files.identity_back && "ID back", files.address && "Address proof", v.category === "Student" && files.student && "Student ID"]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <Summary k="UTR" v={v.transaction_id.toUpperCase()} mono />
                <Summary k="Refund UPI" v={v.refund_upi_id} mono />
              </dl>
              {serverError && <Notice tone="bad">{serverError}</Notice>}
            </section>
          )}

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between gap-3 border-t hairline pt-5">
            <button type="button" className="btn btn-ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
            {step < 3 ? (
              <button type="button" className="btn btn-dark btn-lg" onClick={next}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => void submit()}>
                {busy ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> {progress || "Submitting…"}
                  </>
                ) : (
                  <>
                    Submit application <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="card card-glow p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Your application</p>
          <p className="display mt-2 text-4xl text-champagne">{rupees(Number(v.requested_amount) || 0)}</p>
          <p className="text-sm text-muted">{v.category}</p>
          <ul className="mt-5 space-y-3 border-t hairline pt-5 text-sm">
            <li className="flex items-start gap-3">
              <BadgeIndianRupee size={17} className="mt-0.5 shrink-0 text-brand" />
              <span>
                <strong>₹{FEE} fee</strong>, refunded within {days} days if you&rsquo;re not approved
              </span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand" />
              <span>Documents stored privately; only reviewers can open them</span>
            </li>
            <li className="flex items-start gap-3">
              <CircleCheckBig size={17} className="mt-0.5 shrink-0 text-brand" />
              <span>Decision in 24–48 hours, visible on this page</span>
            </li>
          </ul>
        </div>
        {site?.lender_name && (
          <div className="well p-5 text-xs leading-relaxed text-muted">
            Lender: <strong className="text-ink-2">{site.lender_name}</strong> ({site.lender_type}, RBI Reg. No. <span className="font-mono">{site.lender_reg_no}</span>). Interest
            rate and repayment terms are set by the lender and shared in a Key Fact Statement before you sign.
          </div>
        )}
      </aside>
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="display text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">{sub}</p>
    </div>
  );
}

function Field({ label, k, err, hint, children }: { label: string; k: string; err?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={k}>
        {label}
      </label>
      {children}
      {err ? <FieldError id={k} message={err} /> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

function Check2({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (c: boolean) => void; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed text-ink-2 transition ${
          error ? "border-bad/40 bg-bad-soft/60" : checked ? "border-gold/35 bg-gold-soft/70" : "border-white/[0.08] bg-white/[0.02]"
        }`}
      >
        <input id={id} type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={Boolean(error)} />
        <span>{children}</span>
      </label>
      <FieldError id={id} message={error} />
    </div>
  );
}

function Summary({ k, v, strong = false, mono = false }: { k: string; v: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 bg-white/[0.015] px-4 py-3 sm:grid-cols-[180px_1fr]">
      <dt className="text-muted">{k}</dt>
      <dd className={`break-words ${strong ? "font-bold" : "font-medium"} ${mono ? "font-mono" : ""}`}>{v || "—"}</dd>
    </div>
  );
}
