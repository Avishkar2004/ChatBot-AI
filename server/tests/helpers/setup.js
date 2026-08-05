/**
 * Loaded via `node --import` before any test file, so environment flags are in
 * place before modules that read them at import time (logger levels, app.js's
 * "don't connect to Mongo/Redis under test" guard).
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ADMIN_EMAILS = "admin@example.com";
// Never let a test fire the real error webhook.
delete process.env.ERROR_WEBHOOK_URL;
