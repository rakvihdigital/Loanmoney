export function validateKycDetails(data: { dob: string; category: string; identity_type: string; institution: string }, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dob)) throw new Error("Enter a valid date of birth.");
  const birth = new Date(data.dob + "T00:00:00Z");
  if (!Number.isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== data.dob) throw new Error("Enter a valid date of birth.");
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
  const earliest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));
  if (age < 18 || birth < earliest) throw new Error("Applicants must be between 18 and 120 years old.");
  if (data.category === "Driver" && data.identity_type !== "Driving licence") throw new Error("Drivers must provide a driving licence.");
  if (data.category === "Student" && data.institution.trim().length < 2) throw new Error("Enter your institution name.");
}

export function validateKycUpload(file: { type: string; size: number }) {
  if (!["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error("KYC documents must be PNG, JPG, WebP or PDF, up to 5 MB each.");
  }
}
