import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Structured logger with per-request context.
 *
 * Every log line is a single JSON object (or a colourised one-liner in dev) so
 * it can be shipped to any log backend without a parser. Request-scoped fields
 * such as requestId/userId are injected automatically from AsyncLocalStorage —
 * call sites never have to thread them through.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const resolveMinLevel = () => {
  const explicit = process.env.LOG_LEVEL?.toLowerCase();
  if (explicit && LEVELS[explicit] !== undefined) return LEVELS[explicit];
  // Tests should not spew log noise unless they opt in.
  if (process.env.NODE_ENV === "test") return LEVELS.silent;
  return LEVELS.info;
};

let minLevel = resolveMinLevel();

const isPretty = () => {
  if (process.env.LOG_FORMAT) return process.env.LOG_FORMAT === "pretty";
  return process.env.NODE_ENV !== "production";
};

/** Override the level at runtime (used by tests and admin tooling). */
export const setLogLevel = (level) => {
  const next = LEVELS[String(level).toLowerCase()];
  if (next !== undefined) minLevel = next;
  return minLevel;
};

export const getLogLevel = () =>
  Object.keys(LEVELS).find((k) => LEVELS[k] === minLevel) || "info";

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const REDACT_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "passwordhash",
  "passwordconfirm",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "api_key",
  "groq_api_key",
  "jwt",
  "secret",
  "set-cookie",
]);

const MAX_DEPTH = 4;
const MAX_STRING = 500;

const truncate = (str) =>
  str.length > MAX_STRING
    ? `${str.slice(0, MAX_STRING)}… (+${str.length - MAX_STRING} chars)`
    : str;

const serializeError = (err) => ({
  name: err.name,
  message: err.message,
  ...(err.code ? { code: err.code } : {}),
  ...(err.status || err.statusCode
    ? { status: err.status || err.statusCode }
    : {}),
  stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
});

/** Deep-copy `value`, masking secret-looking keys and capping string size. */
export const redact = (value, depth = 0) => {
  if (value === null || value === undefined) return value;
  if (value instanceof Error) return serializeError(value);
  if (typeof value === "string") return truncate(value);
  if (typeof value !== "object") return value;
  if (depth >= MAX_DEPTH) return "[truncated]";

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth + 1));
  }

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = redact(val, depth + 1);
  }
  return out;
};

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

const storage = new AsyncLocalStorage();

/** Run `fn` with request-scoped fields attached to every log line inside it. */
export const runWithContext = (context, fn) => storage.run({ ...context }, fn);

export const getContext = () => storage.getStore() || {};

/** Merge extra fields into the active request context (e.g. userId after auth). */
export const addContext = (fields) => {
  const store = storage.getStore();
  if (store) Object.assign(store, fields);
};

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

const COLORS = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";

const formatPretty = (record) => {
  const { level, time, msg, requestId, ...rest } = record;
  const color = COLORS[level] || "";
  const head = `${color}${level.toUpperCase().padEnd(5)}${RESET} ${time.slice(11, 23)}`;
  const id = requestId
    ? ` \x1b[90m[${String(requestId).slice(0, 8)}]${RESET}`
    : "";
  const extras = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
  return `${head}${id} ${msg}${extras}`;
};

// Test hooks can swap this to capture output without touching stdout.
let sink = (level, line) => {
  const stream =
    level === "error" || level === "warn" ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
};

export const setLogSink = (fn) => {
  const previous = sink;
  sink = fn;
  return () => {
    sink = previous;
  };
};

const write = (level, msg, fields) => {
  if (LEVELS[level] < minLevel) return;

  const { requestId, userId, route } = getContext();
  const record = {
    level,
    time: new Date().toISOString(),
    msg: typeof msg === "string" ? msg : String(msg),
    ...(requestId ? { requestId } : {}),
    ...(userId ? { userId } : {}),
    ...(route ? { route } : {}),
    ...(fields ? redact(fields) : {}),
  };

  sink(level, isPretty() ? formatPretty(record) : JSON.stringify(record));
};

export const logger = {
  debug: (msg, fields) => write("debug", msg, fields),
  info: (msg, fields) => write("info", msg, fields),
  warn: (msg, fields) => write("warn", msg, fields),
  error: (msg, fields) => write("error", msg, fields),
  /** Bind fixed fields onto a sub-logger (e.g. logger.child({ service: "groq" })). */
  child: (bound = {}) => ({
    debug: (msg, fields) => write("debug", msg, { ...bound, ...fields }),
    info: (msg, fields) => write("info", msg, { ...bound, ...fields }),
    warn: (msg, fields) => write("warn", msg, { ...bound, ...fields }),
    error: (msg, fields) => write("error", msg, { ...bound, ...fields }),
  }),
};

export default logger;
