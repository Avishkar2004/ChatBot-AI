import test from "node:test";
import assert from "node:assert/strict";
import { normalizeModel, isDecommissionedError } from "../routes/chatRoutes.js";

const FALLBACK = "llama-3.1-8b-instant";

test("normalizeModel falls back when no model is configured", () => {
  assert.equal(normalizeModel(undefined), FALLBACK);
  assert.equal(normalizeModel(""), FALLBACK);
  assert.equal(normalizeModel(null), FALLBACK);
});

test("normalizeModel maps non-Groq and deprecated names onto a live model", () => {
  assert.equal(normalizeModel("gpt-4o"), FALLBACK);
  assert.equal(normalizeModel("GPT-3.5-turbo"), FALLBACK);
  assert.equal(normalizeModel("llama3-8b-8192"), FALLBACK);
  assert.equal(normalizeModel("llama3-70b-8192"), FALLBACK);
  assert.equal(normalizeModel("mistral-7b"), "mixtral-8x7b-32768");
});

test("normalizeModel passes through models it does not recognise", () => {
  assert.equal(
    normalizeModel("llama-3.3-70b-versatile"),
    "llama-3.3-70b-versatile",
  );
});

test("isDecommissionedError detects the Groq retirement signal", () => {
  assert.equal(
    isDecommissionedError(new Error("model_decommissioned: llama3-8b-8192")),
    true,
  );
  assert.equal(
    isDecommissionedError({ response: { data: "model has been decommissioned" } }),
    true,
  );
  assert.equal(isDecommissionedError(new Error("rate limit exceeded")), false);
  assert.equal(isDecommissionedError(undefined), false);
  // Structured (non-string) payloads must not throw.
  assert.equal(isDecommissionedError({ response: { data: { code: 500 } } }), false);
});
