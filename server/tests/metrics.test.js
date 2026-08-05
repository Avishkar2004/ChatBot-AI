import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import metrics, { estimateCostUsd } from "../services/metrics.js";

beforeEach(() => metrics.reset());

test("estimateCostUsd prices a known model per million tokens", () => {
  // llama-3.1-8b-instant: $0.05 prompt / $0.08 completion per 1M tokens.
  assert.equal(estimateCostUsd("llama-3.1-8b-instant", 1_000_000, 0), 0.05);
  assert.equal(estimateCostUsd("llama-3.1-8b-instant", 0, 1_000_000), 0.08);
  assert.ok(
    Math.abs(
      estimateCostUsd("llama-3.1-8b-instant", 500_000, 250_000) - 0.045,
    ) < 1e-9,
  );
});

test("estimateCostUsd returns zero for unknown models instead of guessing", () => {
  assert.equal(estimateCostUsd("some-future-model", 1_000_000, 1_000_000), 0);
});

test("recordHttp accumulates counts, status classes and percentiles", () => {
  for (let i = 1; i <= 100; i += 1) {
    metrics.recordHttp({
      method: "GET",
      route: "/api/projects",
      status: i === 100 ? 500 : 200,
      durationMs: i,
    });
  }

  const snap = metrics.snapshot();
  assert.equal(snap.http.total, 100);
  assert.equal(snap.http.byStatusClass["2xx"], 99);
  assert.equal(snap.http.byStatusClass["5xx"], 1);
  assert.equal(snap.http.latencyMs.p50, 50);
  assert.equal(snap.http.latencyMs.p95, 95);
  assert.equal(snap.http.latencyMs.max, 100);

  const route = snap.http.routes.find((r) => r.route === "GET /api/projects");
  assert.equal(route.count, 100);
  assert.equal(route.errors, 1);
});

test("recordLlm tracks tokens, cost and per-model breakdown", () => {
  metrics.recordLlm({
    model: "llama-3.1-8b-instant",
    promptTokens: 1_000_000,
    completionTokens: 1_000_000,
    durationMs: 800,
  });
  metrics.recordLlm({
    model: "llama-3.1-8b-instant",
    promptTokens: 1_000_000,
    completionTokens: 0,
    durationMs: 400,
    streamed: true,
  });

  const { llm } = metrics.snapshot();
  assert.equal(llm.requests, 2);
  assert.equal(llm.streamed, 1);
  assert.equal(llm.promptTokens, 2_000_000);
  assert.equal(llm.completionTokens, 1_000_000);
  assert.equal(llm.totalTokens, 3_000_000);
  // 0.05 + 0.08 + 0.05
  assert.equal(llm.estimatedCostUsd, 0.18);

  const model = llm.byModel.find((m) => m.model === "llama-3.1-8b-instant");
  assert.equal(model.requests, 2);
  assert.equal(model.avgMs, 600);
});

test("recordLlm counts failures without inflating token spend", () => {
  metrics.recordLlm({ model: "llama-3.1-8b-instant", failed: true });

  const { llm } = metrics.snapshot();
  assert.equal(llm.requests, 1);
  assert.equal(llm.failures, 1);
  assert.equal(llm.totalTokens, 0);
  assert.equal(llm.estimatedCostUsd, 0);
});

test("unpriced models are flagged so cost gaps are visible", () => {
  metrics.recordLlm({
    model: "mystery-model",
    promptTokens: 10,
    completionTokens: 5,
  });

  const { llm } = metrics.snapshot();
  assert.deepEqual(llm.unpricedModels, ["mystery-model"]);
  assert.equal(llm.estimatedCostUsd, 0);
});

test("toPrometheus exposes counters in text exposition format", () => {
  metrics.recordHttp({
    method: "GET",
    route: "/health",
    status: 200,
    durationMs: 5,
  });
  metrics.recordLlm({
    model: "llama-3.1-8b-instant",
    promptTokens: 1_000_000,
    completionTokens: 0,
  });

  const text = metrics.toPrometheus();
  assert.match(text, /# TYPE chatbot_http_requests_total counter/);
  assert.match(text, /chatbot_http_requests_total 1/);
  assert.match(
    text,
    /chatbot_llm_tokens_total\{kind="prompt",model="llama-3\.1-8b-instant"\} 1000000/,
  );
  assert.match(text, /chatbot_llm_cost_usd_total 0\.05/);
});

test("reset clears every accumulator", () => {
  metrics.recordHttp({ status: 200, durationMs: 1 });
  metrics.recordError({ type: "TypeError" });
  metrics.reset();

  const snap = metrics.snapshot();
  assert.equal(snap.http.total, 0);
  assert.equal(snap.errors.total, 0);
  assert.equal(snap.llm.requests, 0);
});
