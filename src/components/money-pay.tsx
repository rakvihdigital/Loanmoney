"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Wallet,
  X,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle2,
  FileText,
  UserCheck,
  Lock,
  ExternalLink,
  User as UserIcon,
  KeyRound
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ApplicationFields, CustomFileInput } from "./application-fields";
import { KycReview } from "./kyc-review";
import { validateKycDetails, validateKycUpload } from "@/lib/kyc-validation";

type Settings = { qr_path: string | null; payee_name: string; upi_id: string; fee: number };
type Application = {
  id: string; full_name: string; phone: string; category: string; requested_amount: number;
  transaction_id: string; proof_path: string; fee: number; payee_name: string; upi_id: string;
  status: "pending" | "accepted" | "rejected"; payment_verified: boolean; kyc_verified: boolean; admin_note: string;
  reviewed_at: string | null; created_at: string;
};

const DEMO_APPLICATIONS: Application[] = [
  {
    id: "APP-829102-IN",
    full_name: "Rahul Sharma",
    phone: "9876543210",
    category: "Student",
    requested_amount: 25000,
    transaction_id: "UTR9821471029",
    proof_path: "demo/sample_receipt.png",
    fee: 299,
    payee_name: "Rakvih Money Pay",
    upi_id: "rakvih@upi",
    status: "pending",
    payment_verified: false,
    kyc_verified: false,
    admin_note: "",
    reviewed_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "APP-739105-IN",
    full_name: "Priya Verma",
    phone: "9812345678",
    category: "Driver",
    requested_amount: 50000,
    transaction_id: "UTR4710298312",
    proof_path: "demo/sample_receipt.png",
    fee: 299,
    payee_name: "Rakvih Money Pay",
    upi_id: "rakvih@upi",
    status: "accepted",
    payment_verified: true,
    kyc_verified: true,
    admin_note: "Driving licence and ₹299 UPI payment verified. Accepted for loan processing.",
    reviewed_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: "APP-619204-IN",
    full_name: "Amit Patel",
    phone: "9712398765",
    category: "Employed",
    requested_amount: 100000,
    transaction_id: "UTR1092837465",
    proof_path: "demo/sample_receipt.png",
    fee: 299,
    payee_name: "Rakvih Money Pay",
    upi_id: "rakvih@upi",
    status: "rejected",
    payment_verified: false,
    kyc_verified: false,
    admin_note: "Payment receipt screenshot did not match the submitted UTR number. Please resubmit with genuine receipt.",
    reviewed_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
  }
];

const rupees = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const date = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const field = (data: FormData, name: string) => String(data.get(name) ?? "").trim();

function errorText(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) return String(error.message);
  return "Something went wrong. Please try again.";
}

function validateImage(file: File, max: number) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Choose a PNG, JPG or WebP image.");
  if (file.size > max) throw new Error("This image is too large.");
}

function imagePath(file: File, prefix: string) {
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" }[file.type] ?? "png";
  return prefix + "/" + crypto.randomUUID() + "." + ext;
}

function Badge({ status }: { status: Application["status"] }) {
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle2 size={13} /> Accepted
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
        <X size={13} /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
      <Clock3 size={13} /> Under Review
    </span>
  );
}

export default function MoneyPay({ admin = false }: { admin?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings | null>({
    qr_path: null,
    payee_name: "Rakvih Money Pay",
    upi_id: "rakvih@upi",
    fee: 299,
  });
  const [applications, setApplications] = useState<Application[]>(admin ? DEMO_APPLICATIONS : []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [signUp, setSignUp] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successModalData, setSuccessModalData] = useState<{ id: string; name: string; amount: number } | null>(null);

  // Quick Inline Auth state for unauthenticated applicants
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) {
      if (admin) setApplications(DEMO_APPLICATIONS);
      else setApplications([]);
      setLoaded(true);
      return;
    }
    const { data: { user: current }, error: authError } = await supabase.auth.getUser();
    if (authError && authError.name !== "AuthSessionMissingError") throw authError;
    setUser(current);

    const { data: payment } = await supabase.from("payment_settings").select("qr_path,payee_name,upi_id,fee").eq("id", 1).maybeSingle();
    if (payment) setSettings(payment);

    setIsAdmin(true);

    if (current) {
      let query = supabase.from("applications").select("*").order("created_at", { ascending: false });
      if (!admin) query = query.eq("user_id", current.id);
      const { data } = await query;
      if (data && data.length > 0) {
        setApplications(data);
      } else if (admin) {
        setApplications(DEMO_APPLICATIONS);
      } else {
        setApplications([]);
      }
    } else if (admin) {
      setApplications(DEMO_APPLICATIONS);
    } else {
      setApplications([]);
    }
    setLoaded(true);
  }, [admin]);

  useEffect(() => {
    let alive = true;
    const reload = () => { void refresh().catch(e => { if (alive) { setMessage(errorText(e)); setLoaded(true); } }); };
    reload();
    const subscription = supabase?.auth.onAuthStateChange(() => { window.setTimeout(() => { if (alive) reload(); }, 0); });
    window.addEventListener("focus", reload);
    return () => { alive = false; subscription?.data.subscription.unsubscribe(); window.removeEventListener("focus", reload); };
  }, [refresh]);

  async function run(action: () => Promise<string>) {
    setBusy(true); setMessage("");
    try { const result = await action(); setMessage(result); }
    catch (error) { setMessage(errorText(error)); }
    finally { setBusy(false); }
  }

  async function handleQuickAuth() {
    if (!supabase) throw new Error("Configure Supabase credentials first.");
    if (!authEmail || !authPassword) throw new Error("Please enter your account email and password.");
    const credentials = { email: authEmail, password: authPassword };
    if (signUp) {
      const { data: result, error } = await supabase.auth.signUp(credentials);
      if (error) throw error;
      if (result.user) setUser(result.user);
      return result.session ? "Account created and signed in." : "Account created. Please check your email to confirm, then submit.";
    } else {
      const { data: result, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      if (result.user) setUser(result.user);
      return "Signed in successfully.";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const errors: Record<string, string> = {};

    // 1. Account validation for unauthenticated applicants
    if (!user && supabase) {
      const authEmailInput = field(data, "account_email");
      const authPassInput = field(data, "account_password");
      if (!authEmailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmailInput)) {
        errors["account_email"] = "Enter a valid account email address.";
      }
      if (!authPassInput || authPassInput.length < 8) {
        errors["account_password"] = "Password must be at least 8 characters long.";
      }
    }

    // 2. Personal & Applicant Details validation
    const fullName = field(data, "full_name");
    if (!fullName || fullName.length < 2) {
      errors["full_name"] = "Full Legal Name is required (minimum 2 characters).";
    }

    const phone = field(data, "phone");
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      errors["phone"] = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
    }

    const dob = field(data, "dob");
    const category = field(data, "category");
    if (!dob) {
      errors["dob"] = "Date of birth is required.";
    } else {
      try {
        validateKycDetails({
          dob,
          category,
          identity_type: field(data, "identity_type"),
          institution: field(data, "institution"),
        });
      } catch (e: unknown) {
        const msg = errorText(e);
        if (msg.includes("18") || msg.includes("120")) {
          errors["dob"] = msg;
        } else if (msg.includes("institution")) {
          errors["institution"] = msg;
        } else if (msg.includes("licence")) {
          errors["identity_type"] = msg;
        } else {
          errors["dob"] = msg;
        }
      }
    }

    const address = field(data, "address");
    if (!address || address.length < 10) {
      errors["address"] = "Enter your complete residential address (minimum 10 characters).";
    }

    const city = field(data, "city");
    if (!city || city.length < 2) {
      errors["city"] = "City / Town is required.";
    }

    const stateName = field(data, "state");
    if (!stateName || stateName.length < 2) {
      errors["state"] = "State / Union Territory is required.";
    }

    const pincode = field(data, "pincode");
    if (!pincode || !/^[1-9]\d{5}$/.test(pincode)) {
      errors["pincode"] = "Enter a valid 6-digit Indian PIN code.";
    }

    const amount = Number(data.get("requested_amount"));
    if (!amount || amount < 1000 || amount > 500000) {
      errors["requested_amount"] = "Requested loan amount must be between ₹1,000 and ₹5,00,000.";
    }

    if (category === "Driver" && field(data, "identity_type") !== "Driving licence") {
      errors["identity_type"] = "Drivers must select Driving licence as identity document.";
    }

    const last4 = field(data, "identity_last4");
    if (!last4 || !/^[A-Za-z0-9]{4}$/.test(last4)) {
      errors["identity_last4"] = "Enter exactly the last 4 characters/digits of your ID document.";
    }

    // 3. Document Files validation
    const idFile = data.get("identity_file");
    if (!(idFile instanceof File) || !idFile.size) {
      errors["identity_file"] = "Identity Document (Front / Photo page) is required.";
    }

    const addrFile = data.get("address_file");
    if (!(addrFile instanceof File) || !addrFile.size) {
      errors["address_file"] = "Current Address Proof Document is required.";
    }

    if (category === "Student") {
      const inst = field(data, "institution");
      if (!inst || inst.length < 2) {
        errors["institution"] = "School / College / Institution name is required for Students.";
      }
      const studentFile = data.get("student_file");
      if (!(studentFile instanceof File) || !studentFile.size) {
        errors["student_file"] = "Student Identity Card document is required.";
      }
    }

    if (data.get("kyc_consent") !== "on") {
      errors["kyc_consent"] = "You must confirm document accuracy and consent to KYC review.";
    }

    // 4. Payment details validation
    const transactionId = field(data, "transaction_id");
    if (!transactionId || !/^[A-Za-z0-9]{6,40}$/.test(transactionId)) {
      errors["transaction_id"] = "Enter a valid UPI Transaction Reference / UTR Number (6-40 alphanumeric characters).";
    }

    const proof = data.get("proof");
    if (!(proof instanceof File) || !proof.size) {
      errors["proof"] = "Payment Screenshot Receipt file is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessage(`Validation failed: ${Object.keys(errors).length} required field(s) missing or invalid. Please see highlighted fields below.`);
      const firstId = Object.keys(errors)[0];
      setTimeout(() => {
        const el = document.getElementById(firstId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        } else {
          document.getElementById("form-error-summary")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
      return;
    }

    setFieldErrors({});

    await run(async () => {
      // If user is not authenticated yet, perform quick inline auth first
      let activeUser = user;
      if (!activeUser && supabase) {
        const authEmailInput = field(data, "account_email");
        const authPassInput = field(data, "account_password");
        if (!authEmailInput || !authPassInput) {
          throw new Error("Please enter your email address and password in the Account section to submit.");
        }
        const credentials = { email: authEmailInput, password: authPassInput };
        let authResult = await supabase.auth.signInWithPassword(credentials);
        if (authResult.error && authResult.error.message.includes("Invalid login")) {
          // Attempt automatic signup
          const signUpResult = await supabase.auth.signUp(credentials);
          if (signUpResult.error) throw signUpResult.error;
          activeUser = signUpResult.data.user;
        } else if (authResult.error) {
          throw authResult.error;
        } else {
          activeUser = authResult.data.user;
        }
        if (activeUser) setUser(activeUser);
      }

      const kyc = {
        dob: field(data, "dob"), address: field(data, "address"), city: field(data, "city"),
        state: field(data, "state"), pincode: field(data, "pincode"), identity_type: field(data, "identity_type"),
        identity_last4: field(data, "identity_last4"), institution: field(data, "institution"), category
      };

      const needed = ["identity_file", "address_file", ...(category === "Student" ? ["student_file"] : [])];
      for (const name of [...needed, "identity_back"]) {
        const file = data.get(name);
        if (file instanceof File && file.size) {
          validateKycUpload(file);
        }
      }
      if (proof instanceof File && proof.size) {
        validateImage(proof, 5 * 1024 * 1024);
      }

      if (supabase && activeUser) {
        const uploadDocument = async (name: string) => {
          const file = data.get(name);
          if (!(file instanceof File) || !file.size) return null;
          const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
          const path = activeUser.id + "/" + crypto.randomUUID() + "." + ext;
          const { error } = await supabase!.storage.from("kyc-documents").upload(path, file);
          if (error) throw error;
          return path;
        };

        const identity_path = await uploadDocument("identity_file");
        const identity_back_path = await uploadDocument("identity_back");
        const address_path = await uploadDocument("address_file");
        const student_path = category === "Student" ? await uploadDocument("student_file") : null;
        const proofPath = proof instanceof File ? imagePath(proof, activeUser.id) : "demo/sample_receipt.png";
        if (proof instanceof File) {
          const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(proofPath, proof);
          if (uploadError) throw uploadError;
        }

        const { error } = await supabase.rpc("submit_application_kyc", {
          p_full_name: field(data, "full_name"), p_phone: field(data, "phone"),
          p_category: category, p_requested_amount: Number(data.get("requested_amount")),
          p_transaction_id: field(data, "transaction_id"), p_proof_path: proofPath, p_expected_qr: settings?.qr_path ?? "demo/qr.png",
          p_kyc: { ...kyc, identity_path, identity_back_path, address_path, student_path, consent: true }
        });
        if (error) {
          if (error.code === "23505") throw new Error("You already have a pending application or this transaction reference has already been submitted.");
          throw error;
        }
        const applicantName = field(data, "full_name") || "Applicant";
        const requestedAmt = Number(data.get("requested_amount")) || 25000;
        setSuccessModalData({
          id: `APP-${Math.floor(100000 + Math.random() * 900000)}-IN`,
          name: applicantName,
          amount: requestedAmt,
        });
      } else {
        const newAppId = `APP-${Math.floor(100000 + Math.random() * 900000)}-IN`;
        const applicantName = field(data, "full_name") || "Applicant";
        const requestedAmt = Number(data.get("requested_amount")) || 25000;
        const newApp: Application = {
          id: newAppId,
          full_name: applicantName,
          phone: field(data, "phone") || "9876543210",
          category: category || "General",
          requested_amount: requestedAmt,
          transaction_id: field(data, "transaction_id") || `UTR${Date.now().toString().slice(-10)}`,
          proof_path: "demo/sample_receipt.png",
          fee: settings?.fee ?? 299,
          payee_name: settings?.payee_name ?? "Rakvih Money Pay",
          upi_id: settings?.upi_id ?? "rakvih@upi",
          status: "pending",
          payment_verified: false,
          kyc_verified: false,
          admin_note: "",
          reviewed_at: null,
          created_at: new Date().toISOString(),
        };
        setApplications(prev => [newApp, ...prev]);
        setSuccessModalData({
          id: newAppId,
          name: applicantName,
          amount: requestedAmt,
        });
      }

      form.reset();
      await refresh();
      return "Application submitted successfully! Expected review takes 24–48 hours.";
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await run(async () => {
      const payee = field(data, "payee_name");
      const upi = field(data, "upi_id");
      let path = settings?.qr_path ?? null;
      const qr = data.get("qr");
      if (qr instanceof File && qr.size) {
        validateImage(qr, 2 * 1024 * 1024);
        path = imagePath(qr, "admin");
        if (supabase) {
          await supabase.storage.from("payment-qr").upload(path, qr);
        }
      }
      setSettings({
        qr_path: path || "demo/qr.png",
        payee_name: payee || "Rakvih Money Pay",
        upi_id: upi || "rakvih@upi",
        fee: 299,
      });

      if (supabase) {
        await supabase.from("payment_settings").update({
          qr_path: path || "demo/qr.png", payee_name: payee, upi_id: upi, updated_at: new Date().toISOString()
        }).eq("id", 1);
      }
      return "Payment details updated successfully! The QR code is now published for all applicants.";
    });
  }

  const handleDecisionUpdate = async (id: string, status: "accepted" | "rejected", paymentVerified: boolean, kycVerified: boolean, note: string) => {
    await run(async () => {
      if (supabase && !id.startsWith("APP-")) {
        const { error } = await supabase.rpc("review_application_kyc", {
          p_id: id, p_status: status, p_payment_verified: paymentVerified, p_kyc_verified: kycVerified, p_note: note
        });
        if (error) console.error(error);
      }

      setApplications(prev => prev.map(a => {
        if (a.id === id) {
          return {
            ...a,
            status,
            payment_verified: paymentVerified,
            kyc_verified: kycVerified,
            admin_note: note,
            reviewed_at: new Date().toISOString()
          };
        }
        return a;
      }));

      return `Application ${status} successfully. Decision note updated.`;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const qrUrl = settings?.qr_path && supabase ? supabase.storage.from("payment-qr").getPublicUrl(settings.qr_path).data.publicUrl : null;
  const paymentReady = Boolean(qrUrl || settings?.payee_name);
  const formDisabled = busy;
  const submitDisabled = busy;

  return (
    <main className="application-section max-w-[1360px] mx-auto px-6 py-10">
      {admin ? (
        <div className="mb-8">
          <span className="eyebrow mb-2"><span /> ADMIN CONTROL CENTER</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Universal management panel for configuring payment details and evaluating all applicant records.</p>
        </div>
      ) : (
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="eyebrow justify-center mb-3"><span /> APPLICANT PORTAL</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Application & Payment Portal</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Fill in your personal details, upload supporting KYC documents, scan the published UPI QR to pay ₹299, and track your review status.
          </p>
        </div>
      )}

      {message && (
        <div role="status" aria-live="polite" className="notice mb-8 flex items-start justify-between gap-4 border border-blue-200 bg-blue-50/80 text-blue-900 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-blue-600 shrink-0" />
            <span className="text-sm font-semibold">{message}</span>
          </div>
          <button aria-label="Dismiss message" onClick={() => setMessage("")} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
      )}

      {/* SUCCESS MODAL POPUP */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl text-center space-y-5 transform transition-all animate-scaleUp">
            <div className="mx-auto size-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 size={44} className="animate-bounce-short" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-full border border-emerald-200 mb-2">
                SUBMISSION SUCCESSFUL
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Application Submitted!</h2>
              <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                Application submitted successfully! Expected review takes <strong className="text-slate-900 font-bold">24–48 hours</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Application Reference ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-600 text-sm">{successModalData.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successModalData.id)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                    title="Copy Ref ID"
                  >
                    {copiedUpi ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span className="text-slate-500">Applicant Name:</span>
                <span className="font-bold text-slate-800">{successModalData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Requested Amount:</span>
                <span className="font-extrabold text-slate-900">{rupees(successModalData.amount)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  setTimeout(() => {
                    document.getElementById("submitted-applications-section")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="btn btn-primary w-full justify-center py-3 text-xs font-bold shadow-md shadow-blue-500/20"
              >
                View Applications Book
              </button>
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="btn border border-slate-200 text-slate-700 hover:bg-slate-100 w-full sm:w-auto justify-center py-3 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {!loaded ? (
        <div className="glass-card text-center py-16" role="status">
          <RefreshCw className="animate-spin mx-auto text-blue-600 mb-3" size={32} />
          <p className="text-sm font-semibold text-slate-600">Loading portal…</p>
        </div>
      ) : admin ? (
        <>
          {/* Admin Stats Grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {["pending", "accepted", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`glass-card p-5 text-left transition duration-200 ${filter === s ? "ring-2 ring-blue-600 bg-blue-50/40" : "hover:border-slate-300"}`}
              >
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{s === "all" ? "Total Applications" : s}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{applications.filter((a) => s === "all" || a.status === s).length}</p>
              </button>
            ))}
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[360px_1fr]">
            {/* Payment Settings Card */}
            <section className="glass-card p-6 border border-slate-200/80 rounded-2xl bg-white/90 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Payment QR Settings</h2>
              <p className="mt-1 text-xs text-slate-500">Live details published to applicant payment page.</p>
              {qrUrl ? (
                <div className="mx-auto my-5 size-48 rounded-2xl border border-slate-200 object-contain p-2 bg-slate-50 shadow-inner flex items-center justify-center">
                  <img src={qrUrl} alt="Current payment QR code" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
              ) : (
                <div className="mx-auto my-5 size-48 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <CreditCard size={36} className="mb-2 text-slate-400" />
                  <span className="text-xs font-semibold">Upload Payment QR Image</span>
                </div>
              )}
              <form onSubmit={saveSettings} className="mt-5 space-y-4" key={settings?.qr_path ?? "initial"}>
                <div>
                  <label htmlFor="payee_name" className="block text-xs font-semibold text-slate-700 mb-1">Payee / business name</label>
                  <input id="payee_name" name="payee_name" defaultValue={settings?.payee_name} maxLength={100} required />
                </div>
                <div>
                  <label htmlFor="upi_id" className="block text-xs font-semibold text-slate-700 mb-1">UPI ID</label>
                  <input id="upi_id" name="upi_id" defaultValue={settings?.upi_id} pattern="[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+" maxLength={100} required />
                </div>
                <div>
                  <label htmlFor="qr" className="block text-xs font-semibold text-slate-700 mb-1">Upload QR image (max 2 MB)</label>
                  <input id="qr" name="qr" type="file" accept="image/png,image/jpeg,image/webp" />
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-semibold flex items-center justify-between">
                  <span>Application Processing Fee:</span>
                  <strong className="text-base font-extrabold text-blue-700">₹299</strong>
                </div>
                <button className="btn w-full justify-center" disabled={busy}>
                  {busy ? "Publishing…" : "Publish Payment Details"}
                </button>
              </form>
            </section>

            {/* Applications List Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 capitalize">{filter} Applications</h2>
                <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline" disabled={busy} onClick={() => void run(async () => "Applications refreshed.")}>
                  <RefreshCw size={13} /> Refresh List
                </button>
              </div>
              {applications.filter((a) => filter === "all" || a.status === filter).map((a) => (
                <ReviewCard key={a.id} application={a} busy={busy} run={run} onDecide={handleDecisionUpdate} />
              ))}
              {!applications.some((a) => filter === "all" || a.status === filter) && (
                <div className="glass-card p-12 text-center text-slate-500 text-sm">No applications found in this category.</div>
              )}
            </section>
          </div>
        </>
      ) : (
        /* Applicant Portal Main View */
        <div className="space-y-10">
          <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_.85fr]">
            {/* Main Application Form Card */}
            <section className="glass-card p-6 sm:p-8 border border-slate-200/80 rounded-3xl bg-white/95 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div>
                  <span className="eyebrow mb-1"><span /> STEP-BY-STEP</span>
                  <h2 className="text-2xl font-extrabold text-slate-900">Application Details</h2>
                </div>
                {user ? (
                  <span className="text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-bold text-emerald-700 flex items-center gap-1.5">
                    <UserIcon size={13} /> {user.email}
                  </span>
                ) : (
                  <span className="text-xs bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full font-semibold text-blue-700">
                    Applicant Form
                  </span>
                )}
              </div>

              {/* Inline Account Header for Unauthenticated Applicants */}
              {!user && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <KeyRound size={15} className="text-blue-600" /> Account Details for Submission
                    </span>
                    <button
                      type="button"
                      onClick={() => setSignUp(!signUp)}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      {signUp ? "Switch to Sign In" : "New? Create Account"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label htmlFor="account_email" className="block text-[11px] font-semibold text-slate-600 mb-1">Account Email *</label>
                      <input
                        id="account_email"
                        name="account_email"
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={fieldErrors["account_email"] ? "!border-rose-400 ring-2 ring-rose-200" : ""}
                      />
                      {fieldErrors["account_email"] && (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle size={12} className="shrink-0" /> {fieldErrors["account_email"]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="account_password" className="block text-[11px] font-semibold text-slate-600 mb-1">Account Password *</label>
                      <input
                        id="account_password"
                        name="account_password"
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={8}
                        className={fieldErrors["account_password"] ? "!border-rose-400 ring-2 ring-rose-200" : ""}
                      />
                      {fieldErrors["account_password"] && (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle size={12} className="shrink-0" /> {fieldErrors["account_password"]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={submit} noValidate className="space-y-6">
                <fieldset disabled={formDisabled} className="space-y-6">
                  <ApplicationFields errors={fieldErrors} />

                  <div className="application-step pt-6 border-t border-slate-200">
                    <span>03</span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Payment & Receipt Upload</h3>
                      <p className="text-xs text-slate-500">Scan the published UPI QR, pay ₹299, and provide your payment screenshot.</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="transaction_id" className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI Transaction Reference / UTR Number *
                    </label>
                    <input
                      id="transaction_id"
                      name="transaction_id"
                      pattern="[A-Za-z0-9]{6,40}"
                      minLength={6}
                      maxLength={40}
                      placeholder="e.g. 428192018291"
                      className={fieldErrors["transaction_id"] ? "!border-rose-400 ring-2 ring-rose-200" : ""}
                    />
                    {fieldErrors["transaction_id"] && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1.5 animate-fadeIn">
                        <AlertCircle size={13} className="shrink-0" /> {fieldErrors["transaction_id"]}
                      </p>
                    )}
                  </div>

                  <CustomFileInput
                    id="proof"
                    name="proof"
                    label="Payment Screenshot Receipt"
                    description="Click here to choose file. Upload your transfer confirmation or UPI receipt screenshot (max 5 MB)."
                    accept="image/png,image/jpeg,image/webp"
                    required
                    disabled={formDisabled}
                    icon={<CreditCard size={22} />}
                    externalError={fieldErrors["proof"]}
                  />

                  <div>
                    <label className={`flex items-start gap-3 font-normal text-xs text-slate-600 leading-relaxed p-4 rounded-xl border ${fieldErrors["payment_consent"] ? "bg-rose-50 border-rose-300" : "bg-slate-50 border-slate-200"}`}>
                      <input id="payment_consent" name="payment_consent" className="mt-0.5 !w-4 shrink-0" type="checkbox" />
                      <span>
                        I confirm that the ₹299 fee is strictly for application processing. The expected review window is 24–48 hours; application acceptance does not guarantee loan disbursement.
                      </span>
                    </label>
                    {fieldErrors["payment_consent"] && (
                      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1.5 animate-fadeIn">
                        <AlertCircle size={13} className="shrink-0" /> {fieldErrors["payment_consent"]}
                      </p>
                    )}
                  </div>

                  {Object.keys(fieldErrors).length > 0 && (
                    <div id="form-error-summary" className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-medium space-y-2 mb-4 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                        <AlertCircle size={18} className="shrink-0 text-rose-600" />
                        <span>Submission Blocked: Please fix {Object.keys(fieldErrors).length} error{Object.keys(fieldErrors).length > 1 ? "s" : ""} below:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-rose-800 font-semibold pl-1">
                        {Object.entries(fieldErrors).map(([key, errMessage]) => (
                          <li key={key}>
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(key);
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                  el.focus();
                                }
                              }}
                              className="hover:underline text-left text-rose-700 font-bold"
                            >
                              {errMessage}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="btn w-full justify-center text-sm py-3.5 shadow-lg shadow-blue-500/25" disabled={submitDisabled}>
                    {busy ? "Submitting Application…" : "Submit Application for Review"}
                    <ArrowRight size={17} />
                  </button>
                </fieldset>
              </form>
            </section>

            {/* Right Side: QR Code Payment Box */}
            <section className="glass-card p-6 border border-slate-200/80 rounded-3xl bg-white/95 text-center shadow-sm relative overflow-hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                <ShieldCheck size={14} /> PUBLISHED UPI PAYMENT QR
              </span>
              <h2 className="mt-3 text-xl font-extrabold text-slate-900">Scan & Pay ₹299</h2>
              <p className="mt-1 text-xs text-slate-500">Pay using Google Pay, PhonePe, Paytm, or any UPI app.</p>

              {paymentReady && qrUrl ? (
                <>
                  <div className="mx-auto mt-4 max-w-56 rounded-2xl border-2 border-slate-200 bg-white p-3 shadow-md relative group">
                    <img src={qrUrl} alt="Admin UPI payment QR code" className="aspect-square w-full object-contain rounded-xl" />
                  </div>
                  <p className="mt-4 font-extrabold text-slate-900 text-sm">{settings?.payee_name}</p>
                  <div className="mt-1 inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-mono font-bold text-slate-800">{settings?.upi_id}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings?.upi_id ?? "")}
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 font-semibold"
                    >
                      {copiedUpi ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copiedUpi ? "Copied" : "Copy"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="my-6 rounded-2xl bg-slate-50 p-8 text-xs text-slate-500 border border-slate-200">
                  <strong className="block font-bold text-slate-800 text-sm mb-1">{settings?.payee_name}</strong>
                  <span className="font-mono text-xs bg-white px-3 py-1 rounded-md border border-slate-200 inline-block mb-3">{settings?.upi_id}</span>
                  <p className="text-[11px] text-slate-500">Pay ₹299 to the UPI ID above using any UPI app.</p>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-100 border border-amber-200 px-5 py-3.5">
                <span className="text-xs font-bold text-slate-800">Application Fee</span>
                <strong className="text-2xl font-black text-slate-900">₹299</strong>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                Check payee name before making payment. Attach your transaction reference and payment receipt screenshot in the form.
              </p>
            </section>
          </div>

          {/* Bottom Section: Submitted Applications Book (Single Row / Grid Layout) */}
          <section id="submitted-applications-section" className="glass-card p-6 sm:p-8 border border-slate-200/80 rounded-3xl bg-white/95 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <span className="eyebrow mb-1"><span /> APPLICATIONS BOOK</span>
                <h2 className="text-2xl font-extrabold text-slate-900">Your Submitted Applications</h2>
              </div>
              <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline" disabled={busy} onClick={() => void run(async () => "Status refreshed.")}>
                <RefreshCw size={13} /> Refresh List
              </button>
            </div>

            {applications.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {applications.map((a) => (
                  <article key={a.id} className="p-5 border border-slate-200/80 rounded-2xl bg-gradient-to-b from-white to-slate-50/50 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-slate-400 block">{a.id}</span>
                        <strong className="text-slate-900 font-black text-xl">{rupees(a.requested_amount)}</strong>
                      </div>
                      <Badge status={a.status} />
                    </div>
                    <div className="mt-3 text-xs space-y-1.5 text-slate-600">
                      <p className="flex justify-between">
                        <span className="text-slate-400">Applicant Name:</span>
                        <span className="font-semibold text-slate-800">{a.full_name}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Submitted:</span>
                        <span className="font-medium text-slate-700">{date(a.created_at)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-slate-400">Category:</span>
                        <span className="font-medium text-slate-700">{a.category}</span>
                      </p>
                    </div>
                    <div className="mt-3 p-3 rounded-xl bg-slate-100/90 text-xs text-slate-700 font-medium">
                      {a.status === "pending"
                        ? "⏱️ Expected review: 24–48 hours after submission."
                        : a.status === "accepted"
                        ? "✅ Application accepted for processing."
                        : "❌ Application not approved."}
                    </div>
                    {a.admin_note && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong>Admin Note:</strong> {a.admin_note}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                No applications submitted yet. Fill out the form above to submit your first application.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function ReviewCard({
  application: a,
  busy,
  run,
  onDecide,
}: {
  application: Application;
  busy: boolean;
  run: (action: () => Promise<string>) => Promise<void>;
  onDecide?: (id: string, status: "accepted" | "rejected", paymentVerified: boolean, kycVerified: boolean, note: string) => Promise<void>;
}) {
  const [verified, setVerified] = useState(a.payment_verified);
  const [note, setNote] = useState(a.admin_note || "");
  const [kycVerified, setKycVerified] = useState(a.kyc_verified ?? false);
  const [kycOpened, setKycOpened] = useState(false);
  const [proofUrl, setProofUrl] = useState("");

  async function decide(status: "accepted" | "rejected") {
    if (onDecide) {
      await onDecide(a.id, status, verified, kycVerified, note);
    } else {
      await run(async () => {
        if (!supabase) throw new Error("Supabase is not configured.");
        const { error } = await supabase.rpc("review_application_kyc", { p_id: a.id, p_status: status, p_payment_verified: verified, p_kyc_verified: kycVerified, p_note: note });
        if (error) throw error;
        return "Application " + status + ".";
      });
    }
  }

  return (
    <article className="glass-card p-6 border border-slate-200/80 rounded-2xl bg-white/95 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{a.full_name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{a.category} · Phone: {a.phone}</p>
        </div>
        <Badge status={a.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs border border-slate-100">
        <div>
          <p className="text-[11px] text-slate-500">Requested Loan</p>
          <strong className="text-slate-900 font-extrabold text-sm">{rupees(a.requested_amount)}</strong>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Paid Fee</p>
          <strong className="text-slate-900 font-bold text-sm">{rupees(a.fee)}</strong>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] text-slate-500">UPI Transaction Ref (UTR)</p>
          <p className="break-all font-mono text-slate-900 font-bold">{a.transaction_id}</p>
          <p className="mt-1 text-[11px] text-slate-500">Payee: {a.payee_name} ({a.upi_id})</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">Submitted: {date(a.created_at)}</p>
      <p className="mt-0.5 break-all text-[11px] font-mono text-slate-400">ID: {a.id}</p>

      <button
        disabled={busy}
        className="mt-4 text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
        onClick={() =>
          void run(async () => {
            if (a.id.startsWith("APP-")) {
              alert("Sample Payment Screenshot viewable for demo application.");
              return "Payment proof screenshot verified for demo application.";
            }
            const { data, error } = await supabase!.storage.from("payment-proofs").createSignedUrl(a.proof_path, 300);
            if (error) throw error;
            setProofUrl(data.signedUrl);
            return "Payment proof opened below. Link expires in five minutes.";
          })
        }
      >
        <ExternalLink size={14} /> View Private Payment Screenshot
      </button>
      {proofUrl && (
        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block mt-3">
          <img className="max-h-80 w-full rounded-xl border border-slate-200 object-contain bg-slate-900" src={proofUrl} alt={"Payment proof for " + a.full_name} />
        </a>
      )}

      <KycReview id={a.id} busy={busy} run={run} onOpened={() => setKycOpened(true)} />

      {a.status === "pending" ? (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <label className="flex items-start gap-3 font-normal text-xs text-slate-700">
            <input className="mt-0.5 !w-4" type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} disabled={busy} />
            <span>I verified the ₹299 payment receipt in the receiving bank account.</span>
          </label>
          <label className="flex items-start gap-3 font-normal text-xs text-slate-700">
            <input className="mt-0.5 !w-4" type="checkbox" checked={kycVerified} onChange={(e) => setKycVerified(e.target.checked)} disabled={busy || !kycOpened} />
            <span>I reviewed all identity, address, and category KYC documents.</span>
          </label>
          <div>
            <label htmlFor={"note-" + a.id} className="block text-xs font-semibold text-slate-700 mb-1">
              Decision Note (Required for rejection)
            </label>
            <textarea
              id={"note-" + a.id}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={2}
              disabled={busy}
              placeholder="Provide clear reason or decision note for applicant"
            />
          </div>
          <div className="flex gap-3">
            <button className="btn flex-1 !bg-emerald-600 hover:!bg-emerald-700 text-xs justify-center" disabled={busy || !verified || !kycVerified || !kycOpened} onClick={() => void decide("accepted")}>
              <Check size={16} /> Accept Application
            </button>
            <button className="btn flex-1 !bg-rose-600 hover:!bg-rose-700 text-xs justify-center" disabled={busy || note.trim().length < 3} onClick={() => void decide("rejected")}>
              <X size={16} /> Reject Application
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="font-semibold text-slate-800">Admin Decision Note:</p>
          <p className="mt-1">{a.admin_note || "No note provided."}</p>
          {a.reviewed_at && <span className="mt-1.5 block text-[10px] text-slate-400">Reviewed {date(a.reviewed_at)}</span>}
        </div>
      )}
    </article>
  );
}
