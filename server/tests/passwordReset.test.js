import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import User from "../models/User.js";
import tokenRegistry from "../services/tokenRegistry.js";
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import { stubber } from "./helpers/stub.js";

const { stub, restoreAll } = stubber();
afterEach(() => {
  restoreAll();
  delete process.env.RESEND_API_KEY;
});

function mockRes() {
  const res = { statusCode: 200 };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
}

const fakeUser = (overrides = {}) => ({
  _id: { toString: () => "user-1" },
  email: "someone@example.com",
  username: "someone",
  passwordHash: "$2a$10$notarealhash",
  save: async function () {
    this.saved = true;
  },
  ...overrides,
});

// ---------------------------------------------------------------------------
// forgotPassword
// ---------------------------------------------------------------------------

test("a reset stores only the hash of the emailed token", async () => {
  const user = fakeUser();
  stub(User, "findOne", async () => user);

  const res = mockRes();
  await forgotPassword({ body: { email: user.email }, id: "r1" }, res);

  assert.equal(user.saved, true);
  assert.match(user.resetTokenHash, /^[a-f0-9]{64}$/);
  assert.ok(user.resetTokenExpiresAt > new Date());

  // The link handed back must hash to exactly what was stored, or the reset
  // step can never match it.
  const emailed = res.body.resetUrl.split("token=")[1];
  assert.equal(
    crypto.createHash("sha256").update(emailed).digest("hex"),
    user.resetTokenHash,
  );
});

test("without a mail provider the link comes back for the UI to offer", async () => {
  stub(User, "findOne", async () => fakeUser());

  const res = mockRes();
  await forgotPassword({ body: { email: "someone@example.com" }, id: "r1" }, res);

  assert.match(res.body.resetUrl, /\/reset-password\?token=[\w-]{20,}$/);
});

test("a configured mail provider never returns the link in the response", async () => {
  process.env.RESEND_API_KEY = "re_fake";
  stub(User, "findOne", async () => fakeUser());
  // Provider path: pretend delivery succeeded.
  stub(globalThis, "fetch", async () => ({ ok: true, text: async () => "" }));

  const res = mockRes();
  await forgotPassword({ body: { email: "someone@example.com" }, id: "r1" }, res);

  assert.equal(res.body.resetUrl, undefined);
});

test("an unknown address gets the same answer as a known one", async () => {
  stub(User, "findOne", async () => null);

  const res = mockRes();
  await forgotPassword({ body: { email: "nobody@example.com" }, id: "r1" }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.resetUrl, undefined);
  assert.match(res.body.message, /if an account exists/i);
});

// ---------------------------------------------------------------------------
// resetPassword
// ---------------------------------------------------------------------------

test("a valid token sets the password, clears the token and drops other sessions", async () => {
  const user = fakeUser();
  stub(User, "findOne", async () => user);
  const revoked = stub(tokenRegistry, "revokeAllForUser", async () => true);

  const res = mockRes();
  await resetPassword(
    { body: { token: "a".repeat(43), password: "BrandNewPass456" }, id: "r1" },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token, "the user is signed straight back in");
  assert.equal(user.resetTokenHash, null, "the token is single-use");
  assert.equal(user.resetTokenExpiresAt, null);
  assert.ok(user.passwordChangedAt instanceof Date);
  assert.deepEqual(revoked.calls[0], ["user-1"]);
});

test("an unmatched or expired token is refused without saying which", async () => {
  stub(User, "findOne", async () => null);

  const res = mockRes();
  await resetPassword(
    { body: { token: "b".repeat(43), password: "BrandNewPass456" }, id: "r1" },
    res,
  );

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /invalid or has expired/i);
});

test("the lookup requires an unexpired token, not just a matching hash", async () => {
  let query;
  stub(User, "findOne", async (q) => {
    query = q;
    return null;
  });

  const res = mockRes();
  await resetPassword({ body: { token: "c".repeat(43), password: "x".repeat(9) }, id: "r1" }, res);

  assert.ok(query.resetTokenExpiresAt.$gt instanceof Date);
  assert.match(query.resetTokenHash, /^[a-f0-9]{64}$/);
});
