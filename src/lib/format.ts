export const rupees = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export const dateOnly = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });

export function timeAgo(value: string, now = Date.now()) {
  const mins = Math.round((now - new Date(value).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

export function addDays(value: string, days: number) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function errorText(error: unknown) {
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = String((error as { message: unknown }).message);
    if (/duplicate key.*transaction_id/i.test(msg)) return "This UTR has already been used for another application.";
    if (/one_pending_application_per_user/i.test(msg)) return "You already have an application under review.";
    return msg;
  }
  return "Something went wrong. Please try again.";
}

export const appRef = (a: { ref_code: string | null; id: string }) =>
  a.ref_code ?? "MP-" + a.id.replace(/-/g, "").slice(0, 8).toUpperCase();
