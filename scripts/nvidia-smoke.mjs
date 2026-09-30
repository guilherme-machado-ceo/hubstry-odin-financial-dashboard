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

const startedAt = Date.now();
const res = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(Number(process.env.NVIDIA_TIMEOUT_MS || 30000)),
});
const raw = await res.text();
if (!res.ok) throw new Error(`NVIDIA HTTP ${res.status}: ${raw.slice(0, 500)}`);
const json = JSON.parse(raw);
const content = json.choices?.[0]?.message?.content ?? "";
if (!content) throw new Error("NVIDIA respondeu sem choices[0].message.content");

console.log(JSON.stringify({
  status: "PASS",
  endpoint,
  model,
  latencyMs: Date.now() - startedAt,
  usage: json.usage ?? null,
  responsePreview: content.slice(0, 300),
}, null, 2));
