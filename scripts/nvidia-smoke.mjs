// ODIN NVIDIA smoke test — contrato de API, não benchmark.
// Executar somente em CI com NVIDIA_API_KEY configurada.
// Não grava insights.json nem envia dados do dashboard.
const endpoint = process.env.NVIDIA_ENDPOINT || "https://integrate.api.nvidia.com/v1/chat/completions";
const model = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-super-120b-a12b";
const key = process.env.NVIDIA_API_KEY;
if (!key) throw new Error("NVIDIA_API_KEY não definida");

const body = {
  model,
  messages: [
    { role: "system", content: "Return only valid JSON with keys ok and model." },
    { role: "user", content: "Confirm the API contract with a minimal smoke response." },
  ],
  temperature: 0.3,
  max_tokens: 128,
  chat_template_kwargs: { enable_thinking: false },
};

const MAX_ATTEMPTS = Number(process.env.NVIDIA_SMOKE_MAX_ATTEMPTS || 3);
const TRANSIENT = new Set([429,500,502,503,504]);
const baseDelay = Number(process.env.NVIDIA_SMOKE_RETRY_BASE_MS || 1000);
const capDelay = Number(process.env.NVIDIA_SMOKE_RETRY_CAP_MS || 10000);
const startedAt = Date.now();
let json;
let raw = "";
let lastStatus = null;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.NVIDIA_TIMEOUT_MS || 30000)),
  });
  raw = await res.text();
  lastStatus = res.status;
  if (res.ok) { json = JSON.parse(raw); break; }
  if (!TRANSIENT.has(res.status) || attempt >= MAX_ATTEMPTS) throw new Error(`NVIDIA HTTP ${res.status} after ${attempt} attempt(s): ${raw.slice(0, 500)}`);
  const retryAfterHeader = res.headers.get("retry-after");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
  const exp = Math.min(capDelay, baseDelay * (2 ** (attempt - 1)));
  const delay = Number.isFinite(retryAfter) ? Math.min(retryAfter, capDelay) : Math.floor(Math.random() * (exp + 1));
  console.warn(JSON.stringify({ attempt, httpStatus: res.status, decision: "retry", delayMs: delay }));
  await new Promise(r => setTimeout(r, delay));
}
if (!json) throw new Error(`NVIDIA smoke did not receive a successful response; last HTTP status ${lastStatus}`);
const responseJson = json;
const content = responseJson.choices?.[0]?.message?.content ?? "";
if (!content) throw new Error("NVIDIA respondeu sem choices[0].message.content");

console.log(JSON.stringify({
  status: "PASS",
  endpoint,
  model,
  latencyMs: Date.now() - startedAt,
  usage: json.usage ?? null,
  responsePreview: content.slice(0, 300),
}, null, 2));
