import crypto from "node:crypto";
import logger, { runWithContext, addContext } from "../lib/logger.js";
import metrics from "../services/metrics.js";

/**
 * Request-scoped observability: correlation IDs, access logs, error capture.
 *
 * Mount `requestContext` before anything else so every downstream log line and
 * error carries the same requestId, and `errorHandler` last so unhandled
 * failures are counted and reported instead of vanishing into console.log.
 */

// Accept an inbound correlation ID only if it looks like one — never echo
// arbitrary client input into logs or response headers.
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

const incomingRequestId = (req) => {
  const header = req.headers["x-request-id"] || req.headers["x-correlation-id"];
  const value = Array.isArray(header) ? header[0] : header;
  return value && SAFE_ID.test(value) ? value : crypto.randomUUID();
};

/** Low-cardinality route label ("/api/projects/:projectId/chat"), safe for metrics. */
export const routeLabel = (req) => {
  const mounted = req.baseUrl || "";
  const path = req.route?.path;
  if (path) return `${mounted}${path === "/" ? "" : path}` || "/";
  // No route matched (404) — bucket them all together rather than by URL.
  return mounted ? `${mounted}/*` : "unmatched";
};

/** Assigns a request ID and runs the rest of the request inside its log context. */
export const requestContext = (req, res, next) => {
  const requestId = incomingRequestId(req);
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  runWithContext({ requestId }, () => {
    req.startTime = process.hrtime.bigint();
    next();
  });
};

const QUIET_PATHS = new Set(["/health", "/favicon.ico"]);

/** Structured access log + HTTP metrics, emitted once per completed response. */
export const httpLogger = (req, res, next) => {
  res.on("finish", () => {
    const durationMs = req.startTime
      ? Number(process.hrtime.bigint() - req.startTime) / 1e6
      : 0;
    const rounded = Math.round(durationMs * 100) / 100;
    const route = routeLabel(req);

    metrics.recordHttp({
      method: req.method,
      route,
      status: res.statusCode,
      durationMs: rounded,
    });

    if (req.user?.id) addContext({ userId: req.user.id });

    const fields = {
      method: req.method,
      path: req.originalUrl?.split("?")[0],
      route,
      status: res.statusCode,
      durationMs: rounded,
      ip: req.ip,
      bytes: Number(res.getHeader("content-length")) || undefined,
      cache: res.getHeader("x-cache") || undefined,
    };

    const level =
      res.statusCode >= 500
        ? "error"
        : res.statusCode >= 400
          ? "warn"
          : QUIET_PATHS.has(req.path)
            ? "debug"
            : "info";

    logger[level]("http_request", fields);
  });

  next();
};

// ---------------------------------------------------------------------------
// Error capture
// ---------------------------------------------------------------------------

const webhookUrl = () => process.env.ERROR_WEBHOOK_URL;

/**
 * Report an exception: structured log + metric, plus an optional webhook POST
 * (Slack/Sentry-compatible relay). Never throws and never blocks the response.
 */
export const captureException = (error, context = {}) => {
  metrics.recordError({
    type: error?.name || "Error",
    route: context.route || "unknown",
  });

  logger.error(context.message || "unhandled_error", { err: error, ...context });

  const url = webhookUrl();
  if (!url) return;

  const body = JSON.stringify({
    text: `[${process.env.NODE_ENV || "development"}] ${error?.name}: ${error?.message}`,
    requestId: context.requestId,
    route: context.route,
    userId: context.userId,
  });

  // Fire-and-forget with a hard timeout so a slow sink can't wedge the process.
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: AbortSignal.timeout(3000),
  }).catch((err) => logger.warn("error_webhook_failed", { err }));
};

/** Terminal Express error handler. Mount after all routes. */
export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const context = {
    message: "request_failed",
    route: routeLabel(req),
    method: req.method,
    path: req.originalUrl?.split("?")[0],
    requestId: req.id,
    userId: req.user?.id,
  };

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    logger.warn("invalid_json_body", { ...context, err: error });
    return res.status(400).json({
      message: "Invalid JSON format",
      error: "Please check your request body format",
      requestId: req.id,
    });
  }

  if (error?.message === "Not allowed by CORS") {
    logger.warn("cors_blocked", { ...context, origin: req.headers.origin });
    return res
      .status(403)
      .json({ message: "Origin not allowed", requestId: req.id });
  }

  captureException(error, context);

  return res.status(error.status || 500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : error.message,
    requestId: req.id,
  });
};

/** Log-and-count for crashes outside the request cycle. */
export const installProcessHandlers = () => {
  process.on("unhandledRejection", (reason) => {
    captureException(
      reason instanceof Error ? reason : new Error(String(reason)),
      { message: "unhandled_rejection", route: "process" },
    );
  });

  process.on("uncaughtException", (error) => {
    captureException(error, { message: "uncaught_exception", route: "process" });
    // Leave the process alive-but-degraded rather than dropping in-flight
    // streams; a supervisor should restart on repeated failures.
  });
};
