import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  requestContext,
  httpLogger,
  routeLabel,
  errorHandler,
} from "../middleware/observability.js";
import { redact, getContext, setLogLevel, setLogSink } from "../lib/logger.js";
import metrics from "../services/metrics.js";
import { mockRes } from "./helpers/http.js";

beforeEach(() => metrics.reset());

// Every middleware under test calls next() synchronously, so no awaiting needed.
const invoke = (middleware, req, res, next = () => {}) =>
  middleware(req, res, next);

// Capture log output as parsed JSON records for the duration of `fn`.
const captureLogs = (fn) => {
  const records = [];
  const levels = [];
  const restoreSink = setLogSink((level, line) => {
    levels.push(level);
    records.push(JSON.parse(line));
  });
  const previousFormat = process.env.LOG_FORMAT;
  process.env.LOG_FORMAT = "json";
  setLogLevel("debug");

  try {
    fn();
  } finally {
    restoreSink();
    setLogLevel("silent");
    if (previousFormat === undefined) delete process.env.LOG_FORMAT;
    else process.env.LOG_FORMAT = previousFormat;
  }

  return { records, levels };
};

// ---------------------------------------------------------------------------
// Request IDs
// ---------------------------------------------------------------------------

test("requestContext mints a request id, echoes it, and exposes it to logs", () => {
  const req = { headers: {}, method: "GET", url: "/health" };
  const res = mockRes();
  let contextId;

  invoke(requestContext, req, res, () => {
    contextId = getContext().requestId;
  });

  assert.match(req.id, /^[0-9a-f-]{36}$/);
  assert.equal(res.headers["X-Request-Id"], req.id);
  assert.equal(contextId, req.id);
});

test("requestContext reuses a well-formed inbound correlation id", () => {
  const req = { headers: { "x-request-id": "edge-abc123" }, method: "GET" };
  const res = mockRes();

  invoke(requestContext, req, res);

  assert.equal(req.id, "edge-abc123");
  assert.equal(res.headers["X-Request-Id"], "edge-abc123");
});

test("requestContext rejects an untrusted inbound id instead of echoing it", () => {
  const injected = "bad id\r\nSet-Cookie: pwned=1";
  const req = { headers: { "x-request-id": injected }, method: "GET" };
  const res = mockRes();

  invoke(requestContext, req, res);

  assert.notEqual(req.id, injected);
  assert.match(req.id, /^[0-9a-f-]{36}$/);
});

// ---------------------------------------------------------------------------
// Access logging + metrics
// ---------------------------------------------------------------------------

test("routeLabel keeps cardinality low by using the matched route pattern", () => {
  assert.equal(
    routeLabel({
      baseUrl: "/api/projects",
      route: { path: "/:projectId/chat" },
    }),
    "/api/projects/:projectId/chat",
  );
  assert.equal(
    routeLabel({ baseUrl: "", route: { path: "/health" } }),
    "/health",
  );
  assert.equal(routeLabel({ baseUrl: "", originalUrl: "/nope" }), "unmatched");
});

test("httpLogger emits one correlated line and one metric per response", () => {
  const req = {
    headers: {},
    method: "POST",
    originalUrl: "/api/projects/abc/chat?x=1",
    baseUrl: "/api/projects",
    route: { path: "/:projectId/chat" },
    ip: "127.0.0.1",
    user: { id: "user-1" },
  };
  const res = mockRes();
  res.statusCode = 200;

  const { records } = captureLogs(() => {
    invoke(requestContext, req, res, () => {
      invoke(httpLogger, req, res);
      res.emit("finish");
    });
  });

  assert.equal(records.length, 1);
  const [record] = records;
  assert.equal(record.msg, "http_request");
  assert.equal(record.status, 200);
  assert.equal(record.route, "/api/projects/:projectId/chat");
  assert.equal(record.path, "/api/projects/abc/chat");
  assert.equal(
    record.requestId,
    req.id,
    "log line is correlated to the request",
  );
  assert.equal(record.userId, "user-1");
  assert.equal(typeof record.durationMs, "number");

  const snap = metrics.snapshot();
  assert.equal(snap.http.total, 1);
  assert.equal(snap.http.routes[0].route, "POST /api/projects/:projectId/chat");
});

test("httpLogger logs 5xx at error level and 4xx at warn", () => {
  const build = (status) => {
    const req = { headers: {}, method: "GET", originalUrl: "/boom" };
    const res = mockRes();
    res.statusCode = status;
    return { req, res };
  };

  const { levels } = captureLogs(() => {
    const server = build(503);
    invoke(httpLogger, server.req, server.res);
    server.res.emit("finish");

    const client = build(404);
    invoke(httpLogger, client.req, client.res);
    client.res.emit("finish");
  });

  assert.deepEqual(levels, ["error", "warn"]);
});

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

test("redact masks credentials at any depth", () => {
  const out = redact({
    email: "a@b.com",
    password: "hunter2",
    headers: { Authorization: "Bearer abc", accept: "json" },
    nested: { config: { apiKey: "sk-live-123" } },
  });

  assert.equal(out.email, "a@b.com");
  assert.equal(out.password, "[redacted]");
  assert.equal(out.headers.Authorization, "[redacted]");
  assert.equal(out.headers.accept, "json");
  assert.equal(out.nested.config.apiKey, "[redacted]");
});

test("redact truncates oversized strings and serializes errors", () => {
  const long = redact({ content: "x".repeat(2000) });
  assert.ok(long.content.length < 600);
  assert.match(long.content, /\(\+1500 chars\)$/);

  const err = redact({ err: new TypeError("bad input") });
  assert.equal(err.err.name, "TypeError");
  assert.equal(err.err.message, "bad input");
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

test("errorHandler returns 400 with the request id for malformed JSON", () => {
  const err = new SyntaxError("Unexpected token }");
  err.status = 400;
  err.body = "{oops}";

  const res = mockRes();
  errorHandler(
    err,
    { headers: {}, id: "req-1", method: "POST" },
    res,
    () => {},
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid JSON format");
  assert.equal(res.body.requestId, "req-1");
  assert.equal(
    metrics.snapshot().errors.total,
    0,
    "a malformed client body is not a server error",
  );
});

test("errorHandler reports unexpected failures and counts them", () => {
  const res = mockRes();
  errorHandler(
    new TypeError("kaboom"),
    {
      headers: {},
      id: "req-2",
      method: "GET",
      baseUrl: "/api/projects",
      route: { path: "/" },
    },
    res,
    () => {},
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.requestId, "req-2");
  const snap = metrics.snapshot();
  assert.equal(snap.errors.total, 1);
  assert.equal(snap.errors.byType.TypeError, 1);
});

test("errorHandler hides internals in production", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const res = mockRes();
    errorHandler(
      new Error("secret db dsn"),
      { headers: {}, id: "req-3" },
      res,
      () => {},
    );
    assert.equal(res.body.error, "Something went wrong");
    assert.ok(!JSON.stringify(res.body).includes("secret db dsn"));
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test("errorHandler delegates when the response already started streaming", () => {
  const res = mockRes();
  res.headersSent = true;
  let forwarded = null;

  errorHandler(new Error("late"), { headers: {}, id: "req-4" }, res, (e) => {
    forwarded = e;
  });

  assert.equal(forwarded.message, "late");
  assert.equal(res.body, undefined);
});
