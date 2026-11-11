"use client";

import { useSettings } from "@/lib/settings-context";

export function RefundDays() {
  const { site } = useSettings();
  return <>{site?.refund_days ?? 7}</>;
}

export function LenderName({ fallback = "our lending partner" }: { fallback?: string }) {
  const { site, disclosed } = useSettings();
  return <>{disclosed && site ? site.lender_name : fallback}</>;
}

export function GrievanceContact() {
  const { site } = useSettings();
  if (!site?.grievance_officer) return <>the grievance officer listed in the footer (to be published)</>;
  return (
    <>
      <strong>{site.grievance_officer}</strong>,{" "}
      <a className="text-brand hover:underline" href={`mailto:${site.grievance_email}`}>
        {site.grievance_email}
      </a>
      {site.grievance_phone && <>, {site.grievance_phone}</>}
    </>
  );
}
