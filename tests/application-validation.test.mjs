import { test } from "node:test";
import assert from "node:assert/strict";
import { validateApplication, firstStepWithError } from "../src/lib/application-validation.ts";

const today = new Date("2026-11-06T00:00:00Z");
const valid = {
  full_name: "Asha Rao", phone: "9876543210", dob: "1998-04-12", category: "Employed", requested_amount: "25000",
  address: "12 MG Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038",
  identity_type: "Voter ID", identity_last4: "AB12", institution: "", kyc_consent: true,
  transaction_id: "428192018291", refund_upi_id: "asha.rao@okaxis", payment_consent: true,
  files: { identity: true, address: true, student: false, proof: true },
};

test("a complete application has no errors", () => {
  assert.deepEqual(validateApplication(valid, today), {});
});
test("refund UPI ID is required and must look like a VPA", () => {
  for (const refund_upi_id of ["", "asha", "asha@", "@okaxis", "asha@1bank"]) {
    assert.ok(validateApplication({ ...valid, refund_upi_id }, today).refund_upi_id, refund_upi_id);
  }
});
test("students need institution and student ID; drivers need a licence", () => {
  const s = validateApplication({ ...valid, category: "Student" }, today);
  assert.ok(s.institution && s.student_file);
  assert.ok(validateApplication({ ...valid, category: "Driver" }, today).identity_type);
});
test("amount bounds and phone format", () => {
  assert.ok(validateApplication({ ...valid, requested_amount: "999" }, today).requested_amount);
  assert.ok(validateApplication({ ...valid, requested_amount: "500001" }, today).requested_amount);
  assert.ok(validateApplication({ ...valid, phone: "5876543210" }, today).phone);
});
test("errors map to the wizard step that owns the field", () => {
  assert.equal(firstStepWithError(validateApplication({ ...valid, pincode: "0123" }, today)), 0);
  assert.equal(firstStepWithError(validateApplication({ ...valid, files: { ...valid.files, address: false } }, today)), 1);
  assert.equal(firstStepWithError(validateApplication({ ...valid, payment_consent: false }, today)), 2);
});
