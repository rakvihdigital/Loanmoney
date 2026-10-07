"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { FileCheck2, GraduationCap, CarFront, ShieldCheck, Upload, AlertCircle, CheckCircle2, X, FileText } from "lucide-react";

export const DOCUMENT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";
export const CATEGORIES = ["Student", "Driver", "Employed", "Self-employed", "Unemployed"];

export interface CustomFileInputProps {
  id: string;
  name: string;
  label: string;
  description: string;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  externalError?: string;
}

export function CustomFileInput({
  id,
  name,
  label,
  description,
  accept = DOCUMENT_ACCEPT,
  required = false,
  disabled = false,
  icon = <Upload size={22} />,
  externalError,
}: CustomFileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeError = externalError || error;

  const handleContainerClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (e.target === inputRef.current) return;
    inputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5 MB. Please select a smaller file.");
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-1">
      <div
        onClick={handleContainerClick}
        className={`document-upload cursor-pointer transition relative select-none ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:border-blue-500 hover:bg-blue-50/40"
        } ${selectedFile ? "border-emerald-300 bg-emerald-50/40" : ""} ${
          activeError ? "!border-rose-400 !bg-rose-50/40 ring-2 ring-rose-200" : ""
        }`}
      >
        {selectedFile ? (
          <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <div className="text-blue-600 shrink-0 mt-0.5">{icon}</div>
        )}

        <div className="flex-1 min-w-0 pointer-events-none">
          <span className="text-xs font-bold text-slate-900 block">
            {label} {required && <span className="text-rose-500">*</span>}
          </span>

          {selectedFile ? (
            <div className="mt-1.5 flex items-center justify-between bg-white border border-emerald-200 px-3 py-2 rounded-xl text-xs shadow-xs pointer-events-auto">
              <div className="flex items-center gap-2 truncate">
                <FileText size={15} className="text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{selectedFile.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">({formatSize(selectedFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                title="Remove file"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{description}</p>
          )}

          <input
            ref={inputRef}
            id={id}
            name={name}
            type="file"
            accept={accept}
            required={false}
            disabled={disabled}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {activeError && (
        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle size={14} className="shrink-0" /> {activeError}
        </p>
      )}
    </div>
  );
}

export function ApplicationFields({ preview = false, errors = {} }: { preview?: boolean; errors?: Record<string, string> }) {
  const [category, setCategory] = useState("Student");
  const [identityType, setIdentityType] = useState("Voter ID");

  const renderError = (fieldId: string) => {
    if (!errors[fieldId]) return null;
    return (
      <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1.5 animate-fadeIn">
        <AlertCircle size={13} className="shrink-0" /> {errors[fieldId]}
      </p>
    );
  };

  const errorClass = (fieldId: string) => (errors[fieldId] ? "!border-rose-400 ring-2 ring-rose-200" : "");

  return (
    <div className="kyc-fields space-y-6">
      {/* Step 1: Personal Details Square Card */}
      <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/50 shadow-xs space-y-5">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
          <span className="aspect-square size-10 rounded-xl bg-blue-600 text-white font-black font-mono text-sm flex items-center justify-center shrink-0 shadow-xs">
            01
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Personal Details & Applicant Category</h3>
            <p className="text-xs text-slate-500">Enter your details exactly as shown on your official identity document.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name">Full Legal Name *</label>
            <input
              id="full_name"
              name="full_name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              placeholder="Name as on ID document"
              className={errorClass("full_name")}
            />
            {renderError("full_name")}
          </div>
          <div>
            <label htmlFor="phone">Mobile Number *</label>
            <input
              id="phone"
              name="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              pattern="[6-9][0-9]{9}"
              placeholder="10-digit Indian mobile number"
              className={errorClass("phone")}
            />
            {renderError("phone")}
          </div>
          <div>
            <label htmlFor="dob">Date of Birth *</label>
            <input id="dob" name="dob" type="date" className={errorClass("dob")} />
            {renderError("dob")}
          </div>
          <div>
            <label htmlFor="category">Applicant Category *</label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value === "Driver") setIdentityType("Driving licence");
              }}
              className={errorClass("category")}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {renderError("category")}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="sm:col-span-2">
            <label htmlFor="address">Current Residential Address *</label>
            <textarea
              id="address"
              name="address"
              rows={2}
              autoComplete="street-address"
              minLength={10}
              maxLength={500}
              placeholder="House / flat number, street and locality"
              className={errorClass("address")}
            />
            {renderError("address")}
          </div>
          <div>
            <label htmlFor="city">City / Town *</label>
            <input id="city" name="city" autoComplete="address-level2" minLength={2} maxLength={100} placeholder="e.g. Mumbai" className={errorClass("city")} />
            {renderError("city")}
          </div>
          <div>
            <label htmlFor="state">State / Union Territory *</label>
            <input id="state" name="state" autoComplete="address-level1" minLength={2} maxLength={100} placeholder="e.g. Maharashtra" className={errorClass("state")} />
            {renderError("state")}
          </div>
          <div>
            <label htmlFor="pincode">PIN Code *</label>
            <input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[1-9][0-9]{5}"
              maxLength={6}
              placeholder="6-digit PIN code"
              className={errorClass("pincode")}
            />
            {renderError("pincode")}
          </div>
          <div>
            <label htmlFor="requested_amount">Requested Loan Amount (₹) *</label>
            <input
              id="requested_amount"
              name="requested_amount"
              type="number"
              min={1000}
              max={500000}
              step={1}
              placeholder="e.g. 25000"
              className={errorClass("requested_amount")}
            />
            {renderError("requested_amount")}
          </div>
        </div>
      </div>

      {/* Step 2: KYC & Supporting Documents Square Card */}
      <div className="border-2 border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/50 shadow-xs space-y-5">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
          <span className="aspect-square size-10 rounded-xl bg-blue-600 text-white font-black font-mono text-sm flex items-center justify-center shrink-0 shadow-xs">
            02
          </span>
          <div>
            <h3 className="text-lg font-bold text-slate-900">KYC & Supporting Documents</h3>
            <p className="text-xs text-slate-500">Readable copies, up to 5 MB each (PNG, JPG, WebP or PDF).</p>
          </div>
        </div>

        <div className="category-requirement border-2 border-blue-200 rounded-xl p-4 bg-blue-50/70 flex items-start gap-3">
          {category === "Student" ? (
            <GraduationCap size={24} />
          ) : category === "Driver" ? (
            <CarFront size={24} />
          ) : (
            <FileCheck2 size={24} />
          )}
          <div>
            <strong>
              {category === "Student"
                ? "Student Application Checklist"
                : category === "Driver"
                ? "Driver Application Checklist"
                : category === "Unemployed"
                ? "Unemployed Applicant KYC Checklist"
                : category + " Application Checklist"}
            </strong>
            <p>
              {category === "Student"
                ? "Upload your valid Student ID card in addition to identity and address proofs."
                : category === "Driver"
                ? "Your Driving Licence is required as your primary identity document."
                : "Upload your valid government identity and residential address proof documents."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="identity_type">Identity Document Type *</label>
            <select
              id="identity_type"
              name="identity_type"
              value={category === "Driver" ? "Driving licence" : identityType}
              onChange={(e) => setIdentityType(e.target.value)}
              className={errorClass("identity_type")}
            >
              {(category === "Driver" ? ["Driving licence"] : ["Voter ID", "Passport", "Driving licence"]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            {renderError("identity_type")}
          </div>
          <div>
            <label htmlFor="identity_last4">Last 4 Characters of Document Number *</label>
            <input
              id="identity_last4"
              name="identity_last4"
              pattern="[A-Za-z0-9]{4}"
              maxLength={4}
              placeholder="Only last 4 digits/chars"
              className={errorClass("identity_last4")}
            />
            <p className="field-help text-[11px] text-slate-500 mt-1">Do not enter full document number.</p>
            {renderError("identity_last4")}
          </div>
        </div>

        <CustomFileInput
          id="identity_file"
          name="identity_file"
          label={category === "Driver" ? "Driving Licence — Front / Photo Page" : "Identity Document — Front / Photo Page"}
          description="Click here to choose file. Make sure your name, photo, and date of birth are clearly readable."
          required
          disabled={false}
          externalError={errors["identity_file"]}
        />

        <CustomFileInput
          id="identity_back"
          name="identity_back"
          label="Identity Document — Back / Second Page (Optional)"
          description="Click here to choose file. Upload reverse side if it contains relevant address or details."
          disabled={false}
          externalError={errors["identity_back"]}
        />

        <CustomFileInput
          id="address_file"
          name="address_file"
          label="Current Address Proof Document"
          description="Click here to choose file. Official document showing your name and current residential address."
          required
          disabled={false}
          externalError={errors["address_file"]}
        />

        {category === "Student" && (
          <div className="student-documents space-y-4 p-4 rounded-xl bg-blue-50/70 border-2 border-blue-200">
            <div>
              <label htmlFor="institution">School / College / Institution Name *</label>
              <input
                id="institution"
                name="institution"
                minLength={2}
                maxLength={150}
                placeholder="e.g. St. Xavier's College, Mumbai"
                className={errorClass("institution")}
              />
              {renderError("institution")}
            </div>
            <CustomFileInput
              id="student_file"
              name="student_file"
              label="Student Identity Card"
              description="Click here to choose file. A clear copy of your valid student identity card."
              required
              disabled={false}
              icon={<GraduationCap size={22} />}
              externalError={errors["student_file"]}
            />
          </div>
        )}

        <div className="kyc-privacy flex items-start gap-2.5 text-xs text-slate-600 bg-white p-4 rounded-xl border-2 border-slate-200">
          <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Documents are stored encrypted in private storage buckets and reviewed manually by authorized administrators. Document links generated for admin review automatically expire after 5 minutes.
          </p>
        </div>

        <div>
          <label className={`flex items-start gap-3 font-normal text-xs text-slate-700 leading-relaxed p-3 rounded-xl border-2 transition ${errors["kyc_consent"] ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200"}`}>
            <input id="kyc_consent" className="mt-0.5 !w-4 shrink-0" type="checkbox" name="kyc_consent" />
            <span>I confirm these documents belong to me, all details provided are accurate, and I consent to their review for this application.</span>
          </label>
          {renderError("kyc_consent")}
        </div>
      </div>
    </div>
  );
}
