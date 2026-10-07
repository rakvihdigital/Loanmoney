"use client";

import { useState } from "react";
import { FileCheck2, ExternalLink, ShieldCheck, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Kyc = {
  dob: string; address: string; city: string; state: string; pincode: string;
  identity_type: string; identity_last4: string; institution: string | null;
  identity_path: string; identity_back_path: string | null; address_path: string;
  student_path: string | null; consent_at: string;
};

type Link = { label: string; url: string };

const DEMO_KYC_MAP: Record<string, { details: Kyc; links: Link[] }> = {
  "APP-829102-IN": {
    details: {
      dob: "2002-05-14",
      address: "Flat 402, Sunshine Apartments, MG Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      identity_type: "Voter ID",
      identity_last4: "8492",
      institution: "St. Xavier's College, Mumbai",
      identity_path: "demo/identity.png",
      identity_back_path: null,
      address_path: "demo/address.png",
      student_path: "demo/student.png",
      consent_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    links: [
      { label: "Identity Document — Voter ID Front", url: "#" },
      { label: "Address Proof — Electricity Bill", url: "#" },
      { label: "Student ID Card — St. Xavier's College", url: "#" },
    ],
  },
  "APP-739105-IN": {
    details: {
      dob: "1995-11-20",
      address: "House No 12, Sector 15",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      identity_type: "Driving licence",
      identity_last4: "3920",
      institution: null,
      identity_path: "demo/dl.png",
      identity_back_path: null,
      address_path: "demo/address.png",
      student_path: null,
      consent_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    },
    links: [
      { label: "Driving Licence — Front / Identity", url: "#" },
      { label: "Current Address Proof", url: "#" },
    ],
  },
  "APP-619204-IN": {
    details: {
      dob: "1990-08-05",
      address: "78 Commercial Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      identity_type: "Passport",
      identity_last4: "9102",
      institution: null,
      identity_path: "demo/passport.png",
      identity_back_path: null,
      address_path: "demo/address.png",
      student_path: null,
      consent_at: new Date(Date.now() - 3600000 * 52).toISOString(),
    },
    links: [
      { label: "Passport — Photo Page", url: "#" },
      { label: "Current Address Proof", url: "#" },
    ],
  },
};

export function KycReview({
  id,
  busy,
  run,
  onOpened,
}: {
  id: string;
  busy: boolean;
  run: (action: () => Promise<string>) => Promise<void>;
  onOpened: () => void;
}) {
  const [details, setDetails] = useState<Kyc | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [missing, setMissing] = useState(false);

  async function open() {
    await run(async () => {
      // Check for demo applications
      if (DEMO_KYC_MAP[id]) {
        const demo = DEMO_KYC_MAP[id];
        setDetails(demo.details);
        setLinks(demo.links);
        setMissing(false);
        onOpened();
        return "KYC details loaded. Documents verified for demo application.";
      }

      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.from("application_kyc").select("*").eq("application_id", id).maybeSingle();
      if (error) throw error;
      if (!data) {
        setMissing(true);
        return "This application has no KYC submission attached.";
      }
      const documentList = [
        { label: "Identity document — front", path: data.identity_path },
        { label: "Identity document — back", path: data.identity_back_path },
        { label: "Address proof", path: data.address_path },
        { label: "Student ID card", path: data.student_path },
      ];
      const signed: Link[] = [];
      for (const doc of documentList) {
        if (!doc.path) continue;
        const { data: link, error: linkError } = await supabase.storage.from("kyc-documents").createSignedUrl(doc.path, 300);
        if (linkError) throw linkError;
        signed.push({ label: doc.label, url: link.signedUrl });
      }
      setDetails(data);
      setLinks(signed);
      setMissing(false);
      onOpened();
      return "KYC details loaded. Private document links expire in five minutes; click refresh if needed.";
    });
  }

  return (
    <section className="admin-kyc-section border-t border-slate-100 pt-4 mt-4">
      <button
        className="kyc-open-button text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl transition shadow-xs"
        disabled={busy}
        onClick={() => void open()}
      >
        {details ? <RefreshCw size={14} /> : <FileCheck2 size={15} />}
        {details ? "Refresh Private KYC Documents" : "Review KYC & Documents"}
      </button>

      {missing && (
        <p className="notice mt-3 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-medium">
          No KYC documents were submitted with this application.
        </p>
      )}

      {details && (
        <div className="kyc-review-details mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in">
          <dl className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400 font-semibold text-[11px]">Date of Birth</dt>
              <dd className="font-medium text-slate-800 mt-0.5">{details.dob}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-semibold text-[11px]">Identity Document</dt>
              <dd className="font-medium text-slate-800 mt-0.5">
                {details.identity_type} · •••• {details.identity_last4}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-400 font-semibold text-[11px]">Residential Address</dt>
              <dd className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                {details.address}, {details.city}, {details.state} — {details.pincode}
              </dd>
            </div>
            {details.institution && (
              <div className="col-span-2">
                <dt className="text-slate-400 font-semibold text-[11px]">Institution</dt>
                <dd className="font-medium text-slate-800 mt-0.5">{details.institution}</dd>
              </div>
            )}
          </dl>

          <div className="kyc-document-links grid gap-2.5 mt-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target={link.url === "#" ? undefined : "_blank"}
                rel={link.url === "#" ? undefined : "noopener noreferrer"}
                onClick={(e) => {
                  if (link.url === "#") {
                    e.preventDefault();
                    alert(`Sample document view for "${link.label}"`);
                  }
                }}
                className="flex items-center justify-between bg-white border border-slate-200 hover:border-blue-500 p-3 rounded-xl text-xs font-semibold text-blue-700 hover:shadow-sm transition"
              >
                <span className="flex items-center gap-2">
                  <FileText size={15} className="text-blue-600" />
                  {link.label}
                </span>
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            ))}
          </div>

          <p className="field-help mt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Private document links. Consent recorded {new Date(details.consent_at).toLocaleString("en-IN")}.</span>
          </p>
        </div>
      )}
    </section>
  );
}
