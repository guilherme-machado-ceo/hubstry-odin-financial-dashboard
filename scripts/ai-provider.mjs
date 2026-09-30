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

export function getProviderConfig() {
  const name = process.env.AI_PROVIDER || "maas";
  const config = PROVIDERS[name];
  if (!config) throw new Error(`AI_PROVIDER inválido: ${name}. Use maas ou nvidia.`);
  const key = process.env[config.keyEnv];
  return { name, ...config, key };
}

function extractJson(text) {
  const match = String(text ?? "").match(/\{[\s\S]*\}/);
  if (!match) throw new Error("resposta sem JSON");
  return JSON.parse(match[0]);
}

function normalizeUsage(usage) {
  return {
    prompt: usage?.prompt_tokens ?? null,
    completion: usage?.completion_tokens ?? null,
    total: usage?.total_tokens ?? null,
  };
}

export async function chatJson({ system, user, temperature = 0.3, maxTokens = 700, reasoning = false }) {
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

  if (config.name === "nvidia") {
    body.chat_template_kwargs = { enable_thinking: reasoning };
  }

  const startedAt = Date.now();
  const res = await fetch(config.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS || 60000)),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`${config.name} HTTP ${res.status}: ${raw.slice(0, 500)}`);
  const json = JSON.parse(raw);
  const content = json.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(content);
  return {
    parsed,
    usage: normalizeUsage(json.usage),
    latencyMs: Date.now() - startedAt,
    provider: config.name,
    model: config.model,
  };
}
