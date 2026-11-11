import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, isValidPhone, phoneToAuthEmail, isPhoneAuthEmail, formatPhone } from "../src/lib/phone-auth.ts";

test("mobile numbers are normalised to 10 digits", () => {
  for (const v of ["9876543210", "+91 98765 43210", "09876543210", "+91-9876-543-210"]) assert.equal(normalizePhone(v), "9876543210");
});

test("only valid Indian mobile numbers pass", () => {
  assert.ok(isValidPhone("+91 98765 43210"));
  for (const v of ["5876543210", "98765", "", "abcdefghij"]) assert.ok(!isValidPhone(v), v);
});

test("the same number always maps to the same hidden login email", () => {
  assert.equal(phoneToAuthEmail("+91 98765 43210"), phoneToAuthEmail("9876543210"));
  assert.ok(isPhoneAuthEmail(phoneToAuthEmail("9876543210")));
  assert.ok(!isPhoneAuthEmail("someone@gmail.com"));
});

test("display format", () => {
  assert.equal(formatPhone("9876543210"), "+91 98765 43210");
});
