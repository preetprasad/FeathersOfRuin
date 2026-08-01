import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_SESSION_SECONDS, createAdminSession, verifyAdminCode, verifyAdminSession } from "../lib/admin-auth";

const accessCode = "4Freshers-example-code-for-tests";
const sessionSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const now = Date.UTC(2026, 7, 1, 7, 0, 0);

test("accepts only the configured 4Freshers access code", async () => {
  assert.equal(await verifyAdminCode(accessCode, accessCode), true);
  assert.equal(await verifyAdminCode(`${accessCode}-wrong`, accessCode), false);
  assert.equal(await verifyAdminCode("short", "short"), false);
});

test("creates a signed admin session with a bounded lifetime", async () => {
  const token = await createAdminSession(sessionSecret, now);
  assert.equal(await verifyAdminSession(token, sessionSecret, now + 1_000), true);
  assert.equal(await verifyAdminSession(token, sessionSecret, now + ADMIN_SESSION_SECONDS * 1_000), false);
});

test("rejects tampered, malformed, and incorrectly signed admin sessions", async () => {
  const token = await createAdminSession(sessionSecret, now);
  const tampered = `${token.slice(0, -1)}${token.endsWith("0") ? "1" : "0"}`;
  assert.equal(await verifyAdminSession(tampered, sessionSecret, now), false);
  assert.equal(await verifyAdminSession(token, `${sessionSecret}wrong`, now), false);
  assert.equal(await verifyAdminSession("v1.invalid.signature", sessionSecret, now), false);
});
