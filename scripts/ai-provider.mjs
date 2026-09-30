// ODIN Insights — provider adapter
// Mantém o gerador independente do fornecedor. O provider ativo é decidido
// por AI_PROVIDER; nenhum segredo é persistido neste módulo.

const PROVIDERS = {
  maas: {
    endpoint: process.env.MAAS_ENDPOINT || "https://ldgllm.digiti.net.br/v1/chat/completions",
    model: process.env.MAAS_MODEL || "deepseek-v4-flash",
    keyEnv: "MAAS_KEY",
  },
  nvidia: {
    endpoint: process.env.NVIDIA_ENDPOINT || "https://integrate.api.nvidia.com/v1/chat/completions",
    model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-super-120b-a12b",
    keyEnv: "NVIDIA_API_KEY",
  },
};

const TRANSIENT_HTTP = new Set([429, 500, 502, 503, 504]);
const MAX_TRANSPORT_ATTEMPTS = Number(process.env.AI_MAX_TRANSPORT_ATTEMPTS || 5);
const MAX_CONSECUTIVE_503 = Number(process.env.AI_MAX_CONSECUTIVE_503 || 3);
const RETRY_BASE_MS = Number(process.env.AI_RETRY_BASE_MS || 1000);
const RETRY_CAP_MS = Number(process.env.AI_RETRY_CAP_MS || 30000);

export function getProviderConfig() {
  const name = process.env.AI_PROVIDER || "maas";
  const config = PROVIDERS[name];
  if (!config) throw new Error(`AI_PROVIDER inválido: ${name}. Use maas ou nvidia.`);
  const key = process.env[config.keyEnv];
  return { name, ...config, key };
}

function extractJson(text) {
  const raw = String(text ?? "").trim();
  try { return JSON.parse(raw); } catch {}
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("resposta sem JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeUsage(usage) {
  return {
    prompt: usage?.prompt_tokens ?? null,
    completion: usage?.completion_tokens ?? null,
    total: usage?.total_tokens ?? null,
  };
}

function retryDelayMs(attempt, retryAfter) {
  if (Number.isFinite(retryAfter)) return Math.min(Math.max(retryAfter, 0), RETRY_CAP_MS);
  const exponential = Math.min(RETRY_CAP_MS, RETRY_BASE_MS * (2 ** (attempt - 1)));
  return Math.floor(Math.random() * (exponential + 1));
}

function parseRetryAfterMs(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

function isTransientNetworkError(error) {
  return error?.name === "TimeoutError"
    || error?.name === "AbortError"
    || error?.name === "TypeError";
}

function classifyHttp(status) {
  if (TRANSIENT_HTTP.has(status)) return "transient";
  return "permanent";
}

async function requestCompletion({ config, body, timeoutMs, phase, onEvent }) {
  let consecutive503 = 0;

  for (let attempt = 1; attempt <= MAX_TRANSPORT_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    let res;
    let raw = "";

    try {
      res = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      raw = await res.text();
    } catch (error) {
      if (!isTransientNetworkError(error) || attempt >= MAX_TRANSPORT_ATTEMPTS) {
        throw new Error(`${config.name} ${phase} network failure after attempt ${attempt}: ${error.message}`);
      }
      const delayMs = retryDelayMs(attempt);
      const event = { provider: config.name, phase, attempt, errorType: error.name || "network", latencyMs: Date.now() - startedAt, decision: "retry", delayMs };
      onEvent?.(event);
      console.warn(JSON.stringify(event));
      await new Promise(resolve => setTimeout(resolve, delayMs));
      continue;
    }

    if (res.ok) {
      const result = { json: JSON.parse(raw), attempt, latencyMs: Date.now() - startedAt };
      onEvent?.({ provider: config.name, phase, attempt, latencyMs: result.latencyMs, decision: "success" });
      return result;
    }

    const kind = classifyHttp(res.status);
    if (kind === "permanent" || attempt >= MAX_TRANSPORT_ATTEMPTS) {
      throw new Error(`${config.name} HTTP ${res.status}: ${raw.slice(0, 500)}`);
    }

    if (res.status === 503) consecutive503 += 1;
    else consecutive503 = 0;

    if (consecutive503 >= MAX_CONSECUTIVE_503) {
      throw new Error(`${config.name} HTTP 503 persistente: ${consecutive503} falhas consecutivas; abortando como failed_controlled`);
    }

    const retryAfter = parseRetryAfterMs(res.headers.get("retry-after"));
    const delayMs = retryDelayMs(attempt, retryAfter);
    const event = { provider: config.name, phase, attempt, httpStatus: res.status, latencyMs: Date.now() - startedAt, retryAfterMs: retryAfter, decision: "retry", delayMs };
    onEvent?.(event);
    console.warn(JSON.stringify(event));
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error(`${config.name} ${phase} excedeu o limite de tentativas de transporte`);
}

export async function chatJson({ system, user, temperature = 0.3, maxTokens = 700, reasoning = false, onEvent }) {
  const config = getProviderConfig();
  if (!config.key) throw new Error(`${config.keyEnv} não definida para provider ${config.name}`);

  const body = {
    model: config.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  // OpenAI-compatible structured-output hint. Providers that do not support
  // it can still return JSON text; parsing below remains the final guard.
  body.response_format = { type: "json_object" };

  if (config.name === "nvidia") {
    body.chat_template_kwargs = { enable_thinking: reasoning };
  }

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 45000);
  const first = await requestCompletion({ config, body, timeoutMs, phase: "generation", onEvent });
  let parsed;
  let usage = normalizeUsage(first.json.usage);

  try {
    const content = first.json.choices?.[0]?.message?.content ?? "";
    parsed = extractJson(content);
  } catch (firstError) {
    // Exactly one controlled contract retry. It does not attempt to repair or
    // rewrite content locally; the model is asked to emit the same answer as
    // valid JSON only. Schema/semantic validation remains downstream.
    const retryBody = {
      ...body,
      temperature: 0,
      messages: [
        ...body.messages,
        {
          role: "user",
          content: "Return the same answer again as syntactically valid JSON only. No markdown, no prose outside the JSON object.",
        },
      ],
    };
    const retry = await requestCompletion({
      config,
      body: retryBody,
      timeoutMs,
      phase: "contract_retry",
      onEvent,
    });
    const retryContent = retry.json.choices?.[0]?.message?.content ?? "";
    try {
      parsed = extractJson(retryContent);
      usage = normalizeUsage(retry.json.usage);
    } catch {
      throw new Error(`resposta JSON inválida após retry corretivo: ${firstError.message}`);
    }
  }

  return {
    parsed,
    usage,
    latencyMs: first.latencyMs,
    provider: config.name,
    model: config.model,
  };
}
