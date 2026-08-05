import logger from "../lib/logger.js";

/**
 * In-process metrics registry.
 *
 * Deliberately dependency-free: counters and a bounded latency reservoir kept
 * in memory, exposed as JSON or Prometheus text via /api/metrics. Good enough
 * to answer "is it slow, is it erroring, what are we spending" for a single
 * instance; swap the snapshot into a real TSDB when you scale horizontally.
 */

// USD per 1M tokens. Approximate published Groq list prices — override with
// MODEL_PRICING_JSON when they change or when you negotiate different rates.
const DEFAULT_PRICING = {
  "llama-3.1-8b-instant": { prompt: 0.05, completion: 0.08 },
  "llama-3.3-70b-versatile": { prompt: 0.59, completion: 0.79 },
  "llama-3.1-70b-versatile": { prompt: 0.59, completion: 0.79 },
  "mixtral-8x7b-32768": { prompt: 0.24, completion: 0.24 },
  "gemma2-9b-it": { prompt: 0.2, completion: 0.2 },
};

const loadPricing = () => {
  if (!process.env.MODEL_PRICING_JSON) return { ...DEFAULT_PRICING };
  try {
    return {
      ...DEFAULT_PRICING,
      ...JSON.parse(process.env.MODEL_PRICING_JSON),
    };
  } catch (error) {
    logger.warn("Invalid MODEL_PRICING_JSON, using defaults", { err: error });
    return { ...DEFAULT_PRICING };
  }
};

const PRICING = loadPricing();
const LATENCY_SAMPLES = 1000;

/** Cost in USD for a completion. Unknown models price at 0 and are flagged. */
export const estimateCostUsd = (
  model,
  promptTokens = 0,
  completionTokens = 0,
) => {
  const price = PRICING[model];
  if (!price) return 0;
  return (
    (promptTokens / 1_000_000) * price.prompt +
    (completionTokens / 1_000_000) * price.completion
  );
};

const percentile = (sorted, p) => {
  if (!sorted.length) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, idx)];
};

const bump = (map, key, fields) => {
  const entry = map.get(key) || {};
  for (const [k, v] of Object.entries(fields)) {
    entry[k] = (entry[k] || 0) + v;
  }
  map.set(key, entry);
  return entry;
};

class Metrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.startedAt = Date.now();
    this.http = {
      total: 0,
      byStatusClass: {},
      byRoute: new Map(),
      latencies: [],
    };
    this.errors = { total: 0, byType: {} };
    this.llm = {
      requests: 0,
      streamed: 0,
      failures: 0,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
      unpricedModels: new Set(),
      byModel: new Map(),
      latencies: [],
    };
  }

  recordHttp({
    method = "GET",
    route = "unknown",
    status = 200,
    durationMs = 0,
  }) {
    this.http.total += 1;

    const statusClass = `${Math.floor(status / 100)}xx`;
    this.http.byStatusClass[statusClass] =
      (this.http.byStatusClass[statusClass] || 0) + 1;

    bump(this.http.byRoute, `${method} ${route}`, {
      count: 1,
      totalMs: durationMs,
      errors: status >= 500 ? 1 : 0,
    });

    this.http.latencies.push(durationMs);
    if (this.http.latencies.length > LATENCY_SAMPLES)
      this.http.latencies.shift();
  }

  recordError({ type = "Error", route = "unknown" } = {}) {
    this.errors.total += 1;
    const key = `${type}`;
    this.errors.byType[key] = (this.errors.byType[key] || 0) + 1;
    bump(this.http.byRoute, `ERR ${route}`, { count: 1 });
  }

  /** Record one model call: tokens, estimated cost, latency. */
  recordLlm({
    model = "unknown",
    promptTokens = 0,
    completionTokens = 0,
    durationMs = 0,
    streamed = false,
    failed = false,
  } = {}) {
    this.llm.requests += 1;
    if (streamed) this.llm.streamed += 1;
    if (failed) {
      this.llm.failures += 1;
      bump(this.llm.byModel, model, { failures: 1 });
      return 0;
    }

    const cost = estimateCostUsd(model, promptTokens, completionTokens);
    if (!PRICING[model] && (promptTokens || completionTokens)) {
      this.llm.unpricedModels.add(model);
    }

    this.llm.promptTokens += promptTokens;
    this.llm.completionTokens += completionTokens;
    this.llm.costUsd += cost;

    bump(this.llm.byModel, model, {
      requests: 1,
      promptTokens,
      completionTokens,
      costUsd: cost,
      totalMs: durationMs,
    });

    this.llm.latencies.push(durationMs);
    if (this.llm.latencies.length > LATENCY_SAMPLES) this.llm.latencies.shift();

    return cost;
  }

  snapshot() {
    const httpSorted = [...this.http.latencies].sort((a, b) => a - b);
    const llmSorted = [...this.llm.latencies].sort((a, b) => a - b);

    const routes = [...this.http.byRoute.entries()]
      .map(([route, v]) => ({
        route,
        count: v.count || 0,
        errors: v.errors || 0,
        avgMs: v.count ? Math.round((v.totalMs || 0) / v.count) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    const models = [...this.llm.byModel.entries()].map(([model, v]) => ({
      model,
      requests: v.requests || 0,
      failures: v.failures || 0,
      promptTokens: v.promptTokens || 0,
      completionTokens: v.completionTokens || 0,
      costUsd: Number((v.costUsd || 0).toFixed(6)),
      avgMs: v.requests ? Math.round((v.totalMs || 0) / v.requests) : 0,
    }));

    return {
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      process: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        nodeVersion: process.version,
      },
      http: {
        total: this.http.total,
        byStatusClass: { ...this.http.byStatusClass },
        latencyMs: {
          p50: percentile(httpSorted, 50),
          p95: percentile(httpSorted, 95),
          p99: percentile(httpSorted, 99),
          max: httpSorted.at(-1) || 0,
        },
        routes,
      },
      errors: { total: this.errors.total, byType: { ...this.errors.byType } },
      llm: {
        requests: this.llm.requests,
        streamed: this.llm.streamed,
        failures: this.llm.failures,
        promptTokens: this.llm.promptTokens,
        completionTokens: this.llm.completionTokens,
        totalTokens: this.llm.promptTokens + this.llm.completionTokens,
        estimatedCostUsd: Number(this.llm.costUsd.toFixed(6)),
        unpricedModels: [...this.llm.unpricedModels],
        latencyMs: {
          p50: percentile(llmSorted, 50),
          p95: percentile(llmSorted, 95),
          max: llmSorted.at(-1) || 0,
        },
        byModel: models,
      },
    };
  }

  /** Prometheus text exposition of the same numbers. */
  toPrometheus() {
    const s = this.snapshot();
    const lines = [];
    const push = (name, help, type, samples) => {
      lines.push(
        `# HELP ${name} ${help}`,
        `# TYPE ${name} ${type}`,
        ...samples,
      );
    };
    const esc = (v) => String(v).replace(/["\\]/g, "\\$&");

    push("chatbot_uptime_seconds", "Process uptime", "gauge", [
      `chatbot_uptime_seconds ${s.uptimeSeconds}`,
    ]);
    push("chatbot_http_requests_total", "HTTP requests", "counter", [
      `chatbot_http_requests_total ${s.http.total}`,
      ...Object.entries(s.http.byStatusClass).map(
        ([cls, n]) => `chatbot_http_requests_total{status_class="${cls}"} ${n}`,
      ),
    ]);
    push("chatbot_http_latency_ms", "HTTP latency percentiles", "gauge", [
      `chatbot_http_latency_ms{quantile="0.5"} ${s.http.latencyMs.p50}`,
      `chatbot_http_latency_ms{quantile="0.95"} ${s.http.latencyMs.p95}`,
      `chatbot_http_latency_ms{quantile="0.99"} ${s.http.latencyMs.p99}`,
    ]);
    push("chatbot_errors_total", "Unhandled errors", "counter", [
      `chatbot_errors_total ${s.errors.total}`,
    ]);
    push("chatbot_llm_requests_total", "Model calls", "counter", [
      `chatbot_llm_requests_total ${s.llm.requests}`,
      ...s.llm.byModel.map(
        (m) =>
          `chatbot_llm_requests_total{model="${esc(m.model)}"} ${m.requests}`,
      ),
    ]);
    push("chatbot_llm_tokens_total", "Tokens consumed", "counter", [
      `chatbot_llm_tokens_total{kind="prompt"} ${s.llm.promptTokens}`,
      `chatbot_llm_tokens_total{kind="completion"} ${s.llm.completionTokens}`,
      ...s.llm.byModel.flatMap((m) => [
        `chatbot_llm_tokens_total{kind="prompt",model="${esc(m.model)}"} ${m.promptTokens}`,
        `chatbot_llm_tokens_total{kind="completion",model="${esc(m.model)}"} ${m.completionTokens}`,
      ]),
    ]);
    push("chatbot_llm_cost_usd_total", "Estimated spend", "counter", [
      `chatbot_llm_cost_usd_total ${s.llm.estimatedCostUsd}`,
      ...s.llm.byModel.map(
        (m) =>
          `chatbot_llm_cost_usd_total{model="${esc(m.model)}"} ${m.costUsd}`,
      ),
    ]);

    return `${lines.join("\n")}\n`;
  }
}

const metrics = new Metrics();
export default metrics;