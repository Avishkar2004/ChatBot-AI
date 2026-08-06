import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import redisClient from "../config/redis.js";
import { chatRateLimit, rateLimit } from "../middleware/redisAuth.js";
import { stubber } from "./helpers/stub.js";

const { stub, restoreAll } = stubber();
afterEach(() => restoreAll());

function mockRes() {
  const res = { statusCode: 200, headers: {} };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  res.setHeader = (key, value) => {
    res.headers[key] = value;
  };
  return res;
}

const run = async (middleware, req) => {
  const res = mockRes();
  let passed = false;
  await middleware(req, res, () => {
    passed = true;
  });
  return { res, passed };
};

/**
 * The old limiter re-SET its key on every request, pushing the expiry out each
 * time. A one-minute window therefore never closed while the user kept talking,
 * so ten messages spread over ten minutes still produced a 429.
 */
test("the window is anchored to its first request, not refreshed on each hit", async () => {
  const expiries = [];
  let count = 0;
  stub(redisClient, "incrementInWindow", async (key, windowSeconds) => {
    count += 1;
    if (count === 1) expiries.push(windowSeconds);
    // TTL winds down instead of resetting.
    return { count, ttl: Math.max(1, 60 - count * 6) };
  });

  const limiter = chatRateLimit(60 * 1000, 10);
  const req = { user: { id: "user-1" } };

  for (let i = 0; i < 9; i++) {
    const { passed } = await run(limiter, req);
    assert.equal(passed, true, `request ${i + 1} should be allowed`);
  }

  assert.deepEqual(expiries, [60], "TTL is written once, when the window opens");
});

test("requests beyond the budget are refused with a retry hint", async () => {
  stub(redisClient, "incrementInWindow", async () => ({ count: 11, ttl: 24 }));

  const { res, passed } = await run(chatRateLimit(60 * 1000, 10), {
    user: { id: "user-1" },
  });

  assert.equal(passed, false);
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.retryAfter, 24);
  assert.match(res.body.message, /24 seconds/);
  assert.equal(res.headers["Retry-After"], 24);
});

test("the exact limit still passes; only the one after it is refused", async () => {
  stub(redisClient, "incrementInWindow", async () => ({ count: 10, ttl: 30 }));

  const { passed } = await run(chatRateLimit(60 * 1000, 10), {
    user: { id: "user-1" },
  });

  assert.equal(passed, true);
});

test("a Redis outage fails open rather than blocking every message", async () => {
  stub(redisClient, "incrementInWindow", async () => null);

  const { passed } = await run(chatRateLimit(60 * 1000, 1), {
    user: { id: "user-1" },
  });

  assert.equal(passed, true);
});

test("the per-IP limiter keys on the caller's address", async () => {
  const keys = [];
  stub(redisClient, "incrementInWindow", async (key) => {
    keys.push(key);
    return { count: 1, ttl: 900 };
  });

  await run(rateLimit(15 * 60 * 1000, 20), { ip: "203.0.113.7" });

  assert.deepEqual(keys, ["rate_limit:203.0.113.7"]);
});

test("unauthenticated requests skip the per-user chat limiter", async () => {
  const called = stub(redisClient, "incrementInWindow", async () => ({
    count: 99,
    ttl: 60,
  }));

  const { passed } = await run(chatRateLimit(60 * 1000, 1), {});

  assert.equal(passed, true);
  assert.equal(called.calls.length, 0);
});
