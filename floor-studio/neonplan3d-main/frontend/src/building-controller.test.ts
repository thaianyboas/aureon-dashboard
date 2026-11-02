import assert from "node:assert/strict";
import { test } from "node:test";
import { compareVersions, loadDeadline } from "./building-controller.ts";

test("versions compare numerically, so 1.10.1 is newer than 1.9.2", () => {
  assert.ok(compareVersions("1.10.1", "1.9.2") > 0);
  assert.ok(compareVersions("1.9.2", "1.10.0") < 0);
  assert.equal(compareVersions("1.10.0", "1.10.0"), 0);
  assert.ok(compareVersions("2.0.0", "1.99.99") > 0);
});


test("building reads time out rather than leaving an endless loading state", async () => {
  await assert.rejects(loadDeadline(new Promise(() => {}), 5), /AUREON_PLAN_TIMEOUT/);
});
test("late completion of an abandoned read cannot replace its timeout", async () => {
  let finish!: (value: string) => void;
  const late = new Promise<string>(resolve => {finish=resolve;});
  const result = loadDeadline(late,5);
  await assert.rejects(result,/AUREON_PLAN_TIMEOUT/);
  finish("old plan");
  await assert.rejects(result,/AUREON_PLAN_TIMEOUT/);
  assert.equal(await loadDeadline(Promise.resolve("fresh plan"),100),"fresh plan");
});
test("building read failures remain actionable without waiting for the deadline", async () => {
  await assert.rejects(loadDeadline(Promise.reject(new Error("Integration unavailable")),100),/Integration unavailable/);
});
