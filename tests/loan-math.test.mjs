import { test } from "node:test";
import assert from "node:assert/strict";
import { emi, schedule, addMonths, totals, nextInstalment } from "../src/lib/loan-math.ts";

test("EMI matches the database formula (₹50,000 at 12% for 12 months = ₹4,442)", () => {
  assert.equal(emi(50000, 12, 12), 4442);
  assert.equal(emi(120000, 0, 12), 10000);
  assert.equal(emi(0, 12, 12), 0);
});

test("schedule pays the loan down to exactly zero", () => {
  const rows = schedule(50000, 12, 12, "2026-12-05");
  assert.equal(rows.length, 12);
  assert.equal(rows.at(-1).balance, 0);
  assert.equal(rows.reduce((s, r) => s + r.principal, 0), 50000);
  assert.equal(rows[0].interest, 500);
  assert.equal(rows[0].date, "2026-12-05");
  assert.equal(rows[1].date, "2027-01-05");
});

test("month arithmetic clamps to the end of shorter months", () => {
  assert.equal(addMonths(2027, 1, 31, 1), "2027-02-28");
  assert.equal(addMonths(2028, 1, 31, 1), "2028-02-29");
  assert.equal(addMonths(2026, 11, 30, 3), "2027-02-28");
});

test("totals and next instalment", () => {
  const rows = schedule(50000, 12, 12, "2026-12-05");
  const t = totals(rows);
  assert.equal(t.paid - t.interest, 50000);
  assert.equal(nextInstalment(rows, "2027-01-06").date, "2027-02-05");
  assert.equal(nextInstalment(rows, "2030-01-01"), null);
});

import { withStatus, progress } from "../src/lib/loan-math.ts";

test("instalment status: paid, overdue, the next one due, then upcoming", () => {
  const rows = schedule(50000, 12, 12, "2026-10-05");
  const s = withStatus(rows, [{ instalment_no: 1, paid_on: "2026-10-04", amount: 4442, reference: "NACH1" }], "2026-11-10");
  assert.deepEqual(s.slice(0, 4).map((r) => r.status), ["paid", "overdue", "due", "upcoming"]);
  const pg = progress(s, 50000);
  assert.equal(pg.paidCount, 1);
  assert.equal(pg.overdueCount, 1);
  assert.equal(pg.outstanding, 50000 - rows[0].principal);
});
