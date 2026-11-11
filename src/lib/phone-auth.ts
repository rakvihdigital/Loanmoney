/**
 * Mobile-number login without an SMS provider.
 *
 * Supabase's built-in phone login needs a paid SMS provider. Instead, each
 * account is created with a hidden internal email derived from the mobile
 * number (it never receives mail: `.invalid` is a reserved, non-routable TLD).
 * Users only ever see and type their mobile number.
 *
 * Requires: Supabase → Authentication → Sign In / Providers → Email → "Confirm email" OFF.
 */
// Override with NEXT_PUBLIC_PHONE_EMAIL_DOMAIN if your Supabase project rejects ".invalid"
// (use a subdomain you own, e.g. phone.yourdomain.com). Set it once, before real users sign up.
export const PHONE_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_PHONE_EMAIL_DOMAIN || "phone.moneypay.invalid";

/** Keeps the last 10 digits, so "+91 98765 43210" and "09876543210" both work. */
export function normalizePhone(input: string) {
  return input.replace(/\D/g, "").slice(-10);
}

export function isValidPhone(input: string) {
  return /^[6-9]\d{9}$/.test(normalizePhone(input));
}

export function phoneToAuthEmail(input: string) {
  return `m${normalizePhone(input)}@${PHONE_EMAIL_DOMAIN}`;
}

export function isPhoneAuthEmail(email: string | undefined | null) {
  return Boolean(email && email.endsWith(`@${PHONE_EMAIL_DOMAIN}`));
}

/** "9876543210" → "+91 98765 43210" */
export function formatPhone(input: string | null | undefined) {
  const d = normalizePhone(input ?? "");
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : input ?? "";
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What to show for a signed-in account: their mobile number, or their email for email-based accounts. */
export function accountLabel(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined) {
  if (!user) return "";
  if (isPhoneAuthEmail(user.email)) {
    const meta = typeof user.user_metadata?.phone === "string" ? (user.user_metadata.phone as string) : "";
    return formatPhone(meta || (user.email ?? "").replace(/^m/, "").split("@")[0]);
  }
  return user.email ?? "";
}

/** Admin login accepts either a mobile number or an email address. */
export function loginIdentifierToEmail(input: string): string | null {
  const v = input.trim();
  if (EMAIL_RE.test(v)) return v;
  if (isValidPhone(v)) return phoneToAuthEmail(v);
  return null;
}
