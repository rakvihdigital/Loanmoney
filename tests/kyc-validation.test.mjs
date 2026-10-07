import { test } from "node:test";
import assert from "node:assert/strict";
import { validateKycDetails, validateKycUpload } from "../src/lib/kyc-validation.ts";
const today = new Date("2026-10-07T00:00:00Z");
const details = { dob: "2000-01-01", category: "Unemployed", identity_type: "Voter ID", institution: "" };
test("accepts adult applicants and the exact eighteenth birthday", () => {
  assert.doesNotThrow(() => validateKycDetails(details, today));
  assert.doesNotThrow(() => validateKycDetails({ ...details, dob: "2008-10-07" }, today));
});
test("rejects underage, future and impossible dates", () => {
  for (const dob of ["2008-10-08", "2027-01-01", "2000-02-30", "not-a-date"]) {
    assert.throws(() => validateKycDetails({ ...details, dob }, today));
  }
});
test("enforces the same oldest birth date as the database", () => {
  assert.doesNotThrow(() => validateKycDetails({ ...details, dob: "1906-10-07" }, today));
  assert.throws(() => validateKycDetails({ ...details, dob: "1906-10-06" }, today));
});
test("drivers must provide a driving licence", () => {
  assert.throws(() => validateKycDetails({ ...details, category: "Driver" }, today));
  assert.doesNotThrow(() => validateKycDetails({ ...details, category: "Driver", identity_type: "Driving licence" }, today));
});
test("students must supply an institution", () => {
  assert.throws(() => validateKycDetails({ ...details, category: "Student", institution: " " }, today));
  assert.doesNotThrow(() => validateKycDetails({ ...details, category: "Student", institution: "Example College" }, today));
});
test("allows PDF and images within the limit; rejects empty, oversize and other formats", () => {
  for (const type of ["application/pdf", "image/png", "image/jpeg", "image/webp"]) assert.doesNotThrow(() => validateKycUpload({type,size:5242880}));
  for (const file of [{type:"application/pdf",size:5242881},{type:"image/png",size:0},{type:"image/svg+xml",size:100}]) assert.throws(() => validateKycUpload(file));
});
