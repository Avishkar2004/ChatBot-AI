import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { requireAuth, requireActiveSession } from "../middleware/auth.js";
import tokenRegistry from "../services/tokenRegistry.js";
import redisClient from "../config/redis.js";
import { stubber } from "./helpers/stub.js";

const { stub, restoreAll } = stubber();
afterEach(() => restoreAll());

const JWT_SECRET = process.env.JWT_SECRET;

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

const authorize = async (token) => {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();

  let syncPassed = false;
  requireAuth(req, res, () => {
    syncPassed = true;
  });
  if (!syncPassed) return { req, res, passed: false };

  let passed = false;
  await requireActiveSession(req, res, () => {
    passed = true;
  });
  return { req, res, passed };
};

const issue = (claims = {}) =>
  jwt.sign({ sub: "user-1", email: "a@b.c", username: "a", ...claims }, JWT_SECRET, {
    expiresIn: "1h",
  });

/**
 * "Sign out" used to only clear localStorage, so a copied token stayed usable
 * for its full seven-day life.
 */
test("a signed-out token stops working", async () => {
  stub(tokenRegistry, "isRevoked", async () => true);
  stub(tokenRegistry, "cutoffFor", async () => null);

  const { res, passed } = await authorize(issue());

  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /log in again/i);
});

test("a live token passes both checks", async () => {
  stub(tokenRegistry, "isRevoked", async () => false);
  stub(tokenRegistry, "cutoffFor", async () => null);

  const { req, passed } = await authorize(issue());

  assert.equal(passed, true);
  assert.equal(req.user.id, "user-1");
  assert.ok(req.token, "the raw token is kept so logout can revoke it");
});

test("changing a password invalidates tokens issued before it", async () => {
  const issuedAt = Math.floor(Date.now() / 1000) - 600;
  stub(tokenRegistry, "isRevoked", async () => false);
  stub(tokenRegistry, "cutoffFor", async () => issuedAt + 60);

  const { res, passed } = await authorize(issue({ iat: issuedAt }));

  assert.equal(passed, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /password changed/i);
});

test("the token minted by the password change itself survives the cutoff", async () => {
  const cutoff = Math.floor(Date.now() / 1000);
  stub(tokenRegistry, "isRevoked", async () => false);
  stub(tokenRegistry, "cutoffFor", async () => cutoff);

  const { passed } = await authorize(issue({ iat: cutoff }));

  assert.equal(passed, true);
});

test("a Redis outage degrades revocation instead of locking everyone out", async () => {
  stub(tokenRegistry, "isRevoked", async () => {
    throw new Error("redis down");
  });

  const { passed } = await authorize(issue());

  assert.equal(passed, true);
});

// ---------------------------------------------------------------------------
// tokenRegistry
// ---------------------------------------------------------------------------

test("revoke stores a hash of the token, never the token itself", async () => {
  const writes = [];
  stub(redisClient, "set", async (key, value, ttl) => {
    writes.push({ key, value, ttl });
    return true;
  });

  const token = "header.payload.signature";
  await tokenRegistry.revoke(token, Math.floor(Date.now() / 1000) + 120);

  assert.equal(writes.length, 1);
  assert.ok(!writes[0].key.includes(token), "the raw token is not a cache key");
  assert.match(writes[0].key, /^revoked_token:[a-f0-9]{64}$/);
  assert.ok(writes[0].ttl > 0 && writes[0].ttl <= 121);
});

test("revoking an already-expired token writes nothing", async () => {
  const writes = stub(redisClient, "set", async () => true);

  await tokenRegistry.revoke("abc", Math.floor(Date.now() / 1000) - 10);

  assert.equal(writes.calls.length, 0);
});
