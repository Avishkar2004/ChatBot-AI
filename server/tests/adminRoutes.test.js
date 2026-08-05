import test, { before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import app from "../app.js";
import redisCache from "../services/redisCache.js";
import { listen, signToken } from "./helpers/http.js";
import { stubber } from "./helpers/stub.js";

// ADMIN_EMAILS is set to admin@example.com by tests/helpers/setup.js.
const adminToken = () => signToken({ email: "admin@example.com" });
const userToken = () => signToken({ email: "user@example.com" });

const { stub, restoreAll } = stubber();
afterEach(() => restoreAll());

let server;
before(async () => {
  server = await listen(app);
});
after(async () => {
  await server.close();
});

const get = (path, token) =>
  server.request(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const del = (path, token) =>
  server.request(path, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

// ---------------------------------------------------------------------------
// Regression: /api/cache/stats used to be served by a global middleware that
// ran before any authentication, exposing Redis internals to anyone.
// ---------------------------------------------------------------------------

test("cache stats reject anonymous callers", async () => {
  const res = await get("/api/cache/stats");
  const body = await res.json();

  assert.equal(res.status, 401);
  assert.equal(body.message, "Authorization token missing");
  assert.equal(body.cache, undefined, "no Redis internals leak in the 401 body");
});

test("cache stats reject authenticated non-admins", async () => {
  const res = await get("/api/cache/stats", userToken());

  assert.equal(res.status, 403);
  assert.equal((await res.json()).cache, undefined);
});

test("cache stats are served to admins", async () => {
  stub(redisCache, "getCacheStats", async () => ({
    connected: true,
    memory: "used_memory:1024",
  }));

  const res = await get("/api/cache/stats", adminToken());
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.cache.connected, true);
  assert.ok(body.config, "cache TTL configuration is still reported");
});

test("destructive cache endpoints require an admin", async () => {
  assert.equal((await del("/api/cache/all")).status, 401);
  assert.equal((await del("/api/cache/all", userToken())).status, 403);
  assert.equal((await del("/api/cache/pattern/api", userToken())).status, 403);
});

test("per-user cache clearing stays available to any authenticated user", async () => {
  stub(redisCache, "invalidateUserCache", async () => true);

  const res = await del("/api/cache/user", userToken());

  assert.equal(res.status, 200);
});

// ---------------------------------------------------------------------------
// Metrics endpoint
// ---------------------------------------------------------------------------

test("metrics require an admin token", async () => {
  assert.equal((await get("/api/metrics")).status, 401);
  assert.equal((await get("/api/metrics", userToken())).status, 403);
});

test("metrics expose HTTP, error and token/cost counters", async () => {
  const res = await get("/api/metrics", adminToken());
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(typeof body.uptimeSeconds, "number");
  assert.ok(body.http.latencyMs);
  assert.ok(Array.isArray(body.http.routes));
  assert.equal(typeof body.llm.estimatedCostUsd, "number");
  assert.equal(typeof body.errors.total, "number");

  // Earlier requests in this file were counted.
  assert.ok(body.http.total > 0);
  assert.ok(
    body.http.routes.every((r) => !r.route.includes("Bearer")),
    "route labels stay low-cardinality",
  );
});

test("metrics render Prometheus text on request", async () => {
  const res = await server.request("/api/metrics?format=prometheus", {
    headers: { Authorization: `Bearer ${adminToken()}` },
  });
  const text = await res.text();

  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/plain/);
  assert.match(text, /chatbot_http_requests_total/);
});

// ---------------------------------------------------------------------------
// Correlation
// ---------------------------------------------------------------------------

test("every response carries a request id header", async () => {
  const res = await get("/api/cache/stats");
  assert.match(res.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
});

test("a client-supplied request id is echoed back for tracing", async () => {
  const res = await server.request("/api/cache/stats", {
    headers: { "x-request-id": "trace-123" },
  });
  assert.equal(res.headers.get("x-request-id"), "trace-123");
});
