// ODIN Insights v3 shadow generator.
// Produces public/data/insights.v2.shadow.json only; never replaces production insights.json.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { chatJson, getProviderConfig } from "./ai-provider.mjs";
import { PROMPT_VERSION, SCHEMA_VERSION, INTELLIGENCE_CONTRACT_VERSION } from "./insights-schema.mjs";
import { compareDirection } from "./evidence-consistency.mjs";
import { buildSectionProfile } from "./section-profile-builder.mjs";

const OUT_DIR = path.resolve(process.cwd(), "public/data");
const OUT_FILE = path.join(OUT_DIR, "insights.v2.shadow.json");
const runId = (() => {
  const s = new Date().toISOString().slice(0,19).replace(/[-:T]/g,"");
  return `odin-${s.slice(0,8)}-${s.slice(8)}-${randomBytes(2).toString("hex")}`;
})();
const sha256 = (s) => "sha256:" + createHash("sha256").update(String(s)).digest("hex");
const provider = getProviderConfig();
const telemetry = [];

const SYSTEM = `Você é o analista editorial do ODIN — Omnibus Digital Intelligence News (produto: ODIN Intelligence Dashboard, inteligência financeira e geoeconômica).
Epistemic contract: SOURCE → DATA → EVENT → CLAIM → CONTEXT → INTERPRETATION → THESIS → STAKEHOLDER.
Produza inteligência verificável, não aconselhamento financeiro, jurídico ou político.

Regras:
- fatos devem ser sustentados por evidenceRefs; interpretações e hipóteses nunca podem ser apresentadas como fatos;
- não invente números, fontes, normas, instituições ou datas;
- use somente o contexto fornecido;
- capitalização de mercado não é capital investido nem volume de pagamentos;
- relações causais não medidas devem ser hypothesis/interpretation;
- datas-chave: use cada data SOMENTE para o evento a que o contexto a associa (ex.: início de vigência ≠ prazo de declaração);
- comparações com referência: use a direção (acima/abaixo) calculada e declarada no contexto; nunca infira a direção;
- efeitos econômicos são possibilidades, não fatos consumados;
- Direito Econômico é lente analítica, não parecer jurídico;
- se a relevância jurídica for alta, indique normas e instituições explicitamente presentes no contexto;
- stakeholder implications devem ser neutras e acionáveis como contexto, sem recomendar compra/venda ou escolha política; audience deve ser EXATAMENTE um destes valores ASCII: government, corporate, investors, startups; nunca traduza nem acrescente texto ao valor;
- What to Watch deve apontar sinais observáveis, fonte e motivo; o campo source deve ser EXATAMENTE um sourceId ou sourceUrl presente na lista de fontes permitidas fornecida no contexto;
- escreva em português e inglês;
- mantenha tom sóbrio, analítico, compatível com Chatham House;
- não use linguagem promocional ou de chatbot.

Retorne SOMENTE JSON válido. Não use markdown. Limite cada texto a 2 frases; produza no máximo 4 claims, 4 stakeholderImplications e 3 whatToWatch. Campos temporais: nextReviewAt deve ser ISO datetime completo; whatToWatch.expectedDate deve ser YYYY-MM-DD ou null. Não invente datas. Os valores de audience devem permanecer exatamente em inglês conforme o enum. Exatamente neste formato:
{
 "pt":"2-4 frases executivas",
 "en":"2-4 executive sentences",
 "thesis":{"pt":"...","en":"..."},
 "economicLaw":{"relevance":"high|medium|low|not_material","pt":"...","en":"...","norms":["..."],"institutions":["..."],"sourceRefs":["..."]},
 "stakeholderImplications":[
   {"audience":"government|corporate|investors|startups","textPt":"...","textEn":"..."}
 ],
 "whatToWatch":[
   {"signal":"...","source":"...","expectedDate":"YYYY-MM-DD or null","whyItMatters":"..."}
 ],
 "claims":[
   {"id":"...","kind":"fact|interpretation|hypothesis","textPt":"...","textEn":"...","evidenceRefs":["source-id"],"confidence":{"data":"high|medium|low","interpretation":"high|medium|low"}}
 ],
 "confidence":{"data":"high|medium|low","interpretation":"high|medium|low"},
 "limitations":"..."
}`;

const EVIDENCE_DIR = path.join(OUT_DIR, "evidence", runId);
const REPO_ROOT = process.cwd();
const rel = (abs) => path.relative(REPO_ROOT, abs).split(path.sep).join("/");

/**
 * Proveniência reproduzível: os bytes EXATOS usados na geração são gravados em
 * public/data/evidence/<runId>/ e o hash é calculado sobre esses bytes.
 * dataPath aponta para a cópia de evidência (imutável por runId), não para o
 * snapshot diário, que é sobrescrito.
 */
async function persistEvidence(fileName, bytes) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const abs = path.join(EVIDENCE_DIR, fileName);
  await writeFile(abs, bytes);
  return { dataPath: rel(abs), hash: sha256Bytes(bytes) };
}
const sha256Bytes = (buf) => "sha256:" + createHash("sha256").update(buf).digest("hex");

async function fileSource(sourceId, sourceUrl, asOf, relPath, metricId) {
  const bytes = await readFile(path.join(REPO_ROOT, relPath));
  const { dataPath, hash } = await persistEvidence(path.basename(relPath), bytes);
  return { provenance: { sourceId, sourceUrl, asOf, dataPath, metricId, hash }, data: JSON.parse(bytes.toString("utf8")) };
}

function fmt(v) {
  if (v >= 1e12) return `US$ ${(v/1e12).toFixed(2)} trilhões`;
  if (v >= 1e9) return `US$ ${(v/1e9).toFixed(1)} bilhões`;
  if (v >= 1e6) return `US$ ${(v/1e6).toFixed(1)} milhões`;
  return `US$ ${Math.round(v).toLocaleString("en-US")}`;
}
const dirWord = (d) => d === "above" ? "above" : d === "below" ? "below" : "equal to";

async function contexts() {
  // ── Fontes: cada leitura grava sua cópia de evidência e calcula o hash dos bytes.
  const carbonSrc = await fileSource("source-carbon-ec", null, null, "public/data/sources/cbam-carbon.json", "cbam-price-latest");
  const cbam = carbonSrc.data;
  carbonSrc.provenance.sourceUrl = cbam.sourceUrl;
  carbonSrc.provenance.asOf = cbam.validAsOf;
  const stableSrc = await fileSource("source-defillama-stablecoins", "https://defillama.com/stablecoins", null, "public/data/stablecoins.json", "stablecoin-total-mcap");
  const rwaSrc = await fileSource("source-defillama-rwa", "https://defillama.com/protocols", null, "public/data/rwa-protocols.json", "rwa-tvl-sample");
  const cryptoSrc = await fileSource("source-defillama-coins", "https://defillama.com/", null, "public/data/crypto-market.json", "asset-prices");
  for (const src of [stableSrc, rwaSrc, cryptoSrc]) src.provenance.asOf = src.data.updatedAt;
  const stable = stableSrc.data, rwa = rwaSrc.data;

  const climateEnd = new Date(Date.now()-5*864e5).toISOString().slice(0,10);
  const climateStart = new Date(Date.now()-370*864e5).toISOString().slice(0,10);
  const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=-15.8&longitude=-47.9&start_date=${climateStart}&end_date=${climateEnd}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  const weatherRes = await fetch(weatherUrl,{signal:AbortSignal.timeout(30000)});
  if (!weatherRes.ok) throw new Error(`Open-Meteo HTTP ${weatherRes.status}`);
  const weatherBytes = Buffer.from(await weatherRes.arrayBuffer());
  const weatherEvidence = await persistEvidence("open-meteo-brasilia.json", weatherBytes);
  const weather = JSON.parse(weatherBytes.toString("utf8"));
  const temps=weather.daily?.temperature_2m_mean??[];
  const precip=(weather.daily?.precipitation_sum??[]).reduce((a,b)=>a+b,0);
  const avg=temps.reduce((a,b)=>a+b,0)/(temps.length||1);
  const avgR=Number(avg.toFixed(1)), precipR=Math.round(precip);
  const TEMP_REF=21.4, PRECIP_REF=1550;
  const top=rwa.data.rwa.slice(0,3).map(x=>`${x.name}: ${fmt(x.tvlUsd)} TVL`).join("; ");

  // ── Carbono: valores vêm do arquivo de fonte versionado, não do código.
  const prices = [...cbam.prices].sort((a,b) => a.period.localeCompare(b.period));
  const latest = prices.at(-1), previous = prices.at(-2);
  const label = (period) => { const [y,q] = period.split("-"); return `${q} ${y}`; };
  const carbonDir = previous ? compareDirection(latest.eurPerTCO2e, previous.eurPerTCO2e) : null;
  const carbonContext = `Carbon pricing/CBAM (${cbam.legalBasis.join(", as amended by the ")}). ${label(latest.period)} price: ${latest.eurPerTCO2e} €/tCO2e${previous ? `; ${label(previous.period)}: ${previous.eurPerTCO2e} €/tCO2e; the ${label(latest.period)} price is ${dirWord(carbonDir)} the ${label(previous.period)} price` : ""}. Six sectors. De minimis: ${cbam.deMinimis.tonnesPerYear} t/year ${cbam.deMinimis.scope}. Definitive period in force since ${cbam.keyDates.definitiveStart}. First annual CBAM declaration (covering 2026 imports) due by ${cbam.keyDates.firstAnnualDeclaration}; this is a declaration deadline, not the start of the definitive regime. In the definitive regime the authorized EU importer is legally responsible for declaring embedded emissions; Brazilian exporters may face indirect requests for verifiable installation-level data. Effects on costs/competitiveness are possibilities. Do not use national per-capita emissions. Source: source-carbon-ec.`;

  const climateContext = `Climate vector for Brasília. Rolling 12-month window ${climateStart} to ${climateEnd}; mean temperature ${avgR}°C (${dirWord(compareDirection(avgR, TEMP_REF))} the ${TEMP_REF}°C reference); precipitation ${precipR} mm (${dirWord(compareDirection(precipR, PRECIP_REF))} the ${PRECIP_REF} mm reference). The reference benchmarks (${TEMP_REF}°C and ${PRECIP_REF} mm) are dashboard references, not an official climatology. A single city cannot establish impacts on producing regions, commodities or energy. Any transmission to commodities, hydrology, energy or FX must be a hypothesis and should be monitored against producing regions and relevant river basins. Source: source-open-meteo-brasilia.`;

  const blockchainContext = `Digital assets. Stablecoin market capitalization: ${fmt(stable.data.totalMcapUsd)}; Tether: ${fmt(stable.data.assets[0].mcapUsd)}. This is market capitalization, not international payment volume. RWA sample: ${top}; do not sum these protocols or call the sample the whole sector. Prices include BTC, ETH, SOL and BNB snapshots. Interpretation may discuss digital dollar rails and local-currency narratives, but cannot claim causation. Sources: source-defillama-stablecoins, source-defillama-rwa, source-defillama-coins.`;

  return [
    {
      id:"carbon", validAsOf:cbam.validAsOf, nextReviewAt:cbam.nextReviewAt,
      provenance:[carbonSrc.provenance],
      context:carbonContext,
      evidence:{
        material: carbonContext,
        keyDates:[
          { id:"cbam-definitive-start", date:cbam.keyDates.definitiveStart,
            subjectTerms:["regime definitivo","período definitivo","fase definitiva","definitive regime","definitive cbam regime","definitive cbam period","definitive period","definitive phase"],
            eventTerms:["começa","começou","inicia","iniciou","início","em vigor","vigente","vigora","desde","starts","started","begins","began","start of","applies","applied","in force","since"] },
          { id:"cbam-first-annual-declaration", date:cbam.keyDates.firstAnnualDeclaration,
            subjectTerms:["primeira declaração","declaração anual","first declaration","annual declaration","first annual"],
            eventTerms:["até","prazo","devida","vence","due","deadline","by "] },
        ],
        comparisons: previous ? [
          { id:"cbam-price-latest-vs-previous", observed:latest.eurPerTCO2e, reference:previous.eurPerTCO2e, unit:"€/tCO2e", direction:carbonDir },
        ] : [],
      },
    },
    {
      id:"blockchain", validAsOf:stable.updatedAt, nextReviewAt:new Date(Date.now()+7*864e5).toISOString(),
      provenance:[stableSrc.provenance, rwaSrc.provenance, cryptoSrc.provenance],
      context:blockchainContext,
      evidence:{ material:blockchainContext, keyDates:[], comparisons:[] },
    },
    {
      id:"climate", validAsOf:climateEnd, nextReviewAt:new Date(Date.now()+7*864e5).toISOString(),
      provenance:[{ sourceId:"source-open-meteo-brasilia", sourceUrl:weatherUrl, asOf:climateEnd, dataPath:weatherEvidence.dataPath, metricId:"brasilia-12m-temp-precip", hash:weatherEvidence.hash }],
      context:climateContext,
      evidence:{ material:climateContext, keyDates:[], comparisons:[
        { id:"climate-temp-vs-reference", observed:avgR, reference:TEMP_REF, unit:"°C", direction:compareDirection(avgR, TEMP_REF) },
        { id:"climate-precip-vs-reference", observed:precipR, reference:PRECIP_REF, unit:"mm", direction:compareDirection(precipR, PRECIP_REF) },
      ] },
    },
  ];
}

const results=[];
const reportSections=[];
for (const item of await contexts()) {
  const sectionEvents = [];
  try {
  const {parsed,usage,latencyMs}=await chatJson({
    system:SYSTEM,
    user:`Section: ${item.id}\nValid as of: ${item.validAsOf}\nNext review: ${item.nextReviewAt}\nProvenance permitida para esta seção (use estes sourceId/sourceUrl literalmente em evidenceRefs e whatToWatch.source):\n${item.provenance.map(p => `${p.sourceId} | ${p.sourceUrl}`).join("\n")}\nContext:\n${item.context}`,
    temperature:0.2,maxTokens:3500,reasoning:false,
    onEvent: (event) => sectionEvents.push({ ...event, sectionId: item.id })
  });
  telemetry.push(...sectionEvents.map(e => ({ ...e, runId, model: provider.model, schemaVersion: SCHEMA_VERSION, intelligenceContractVersion: INTELLIGENCE_CONTRACT_VERSION, promptVersion: PROMPT_VERSION })));
  console.log(`Telemetry ${item.id}: ${sectionEvents.length} provider events`);
  if (!parsed || typeof parsed.pt!=="string" || typeof parsed.en!=="string") throw new Error(`Invalid model output for ${item.id}`);
  const provById=new Map(item.provenance.map(p=>[p.sourceId,p]));
  for (const c of parsed.claims ?? []) for (const ref of c.evidenceRefs ?? [])
    if (!provById.has(ref)) throw new Error(`${item.id}: claim ${c.id} references unknown provenance ${ref}`);
  const entry = {
    schemaVersion:SCHEMA_VERSION,
    intelligenceContractVersion:INTELLIGENCE_CONTRACT_VERSION,
    sectionId:item.id,
    status:"shadow",
    pt:parsed.pt.trim(), en:parsed.en.trim(),
    thesis:parsed.thesis,
    economicLaw:parsed.economicLaw,
    stakeholderImplications:parsed.stakeholderImplications,
    whatToWatch:parsed.whatToWatch,
    claims:parsed.claims,
    provenance:item.provenance,
    confidence:parsed.confidence,
    limitations:parsed.limitations,
    provider:provider.name, model:provider.model,
    promptVersion:PROMPT_VERSION, generatedAt:new Date().toISOString(),
    validAsOf:item.validAsOf, nextReviewAt:item.nextReviewAt,
    runId, reviewStatus:"unreviewed",
    usage:{prompt:usage.prompt,completion:usage.completion,total:usage.total,latencyMs}
  };
  // Section Profile (ADR-0003): camadas determinísticas para seções registradas.
  results.push({ ...entry, ...buildSectionProfile(item.id, entry, item.evidence) });
  reportSections.push({ sectionId: item.id, status: "shadow", latencyMs, totalTokens: usage.total, evidence: { ...item.evidence, materialSha256: sha256(item.evidence.material) } });
  console.log(`OK shadow ${item.id} · ${latencyMs}ms · ${usage.total ?? "?"} tokens`);
  } catch (error) {
    reportSections.push({ sectionId: item.id, status: "failed_controlled", decision: "preserve", errorType: error?.name || "Error", errorMessage: String(error?.message || error).slice(0, 500), providerEvents: sectionEvents });
    await mkdir(OUT_DIR,{recursive:true});
    await writeFile(path.join(OUT_DIR, "generationReport.json"), JSON.stringify({ runId, provider: provider.name, model: provider.model, schemaVersion: SCHEMA_VERSION, intelligenceContractVersion: INTELLIGENCE_CONTRACT_VERSION, promptVersion: PROMPT_VERSION, decision: "failed_controlled", sections: reportSections, providerEvents: telemetry, generatedAt: new Date().toISOString() }, null, 2)+"\n");
    throw error;
  }
}
await mkdir(OUT_DIR,{recursive:true});
const payload={
  schemaVersion:SCHEMA_VERSION,
  intelligenceContractVersion:INTELLIGENCE_CONTRACT_VERSION,
  status:"shadow",
  runId,
  generatedAt:new Date().toISOString(),
  provider:provider.name, model:provider.model, promptVersion:PROMPT_VERSION,
  data:{sections:Object.fromEntries(results.map(x=>[x.sectionId,x]))}
};
const REPORT_FILE = path.join(OUT_DIR, "generationReport.json");
const report = {
  runId,
  provider: provider.name,
  model: provider.model,
  schemaVersion: SCHEMA_VERSION,
  intelligenceContractVersion: INTELLIGENCE_CONTRACT_VERSION,
  promptVersion: PROMPT_VERSION,
  decision: "shadow_generated",
  sections: reportSections,
  providerEvents: telemetry,
  generatedAt: new Date().toISOString()
};
await writeFile(OUT_FILE,JSON.stringify(payload,null,2)+"\n");
await writeFile(REPORT_FILE,JSON.stringify(report,null,2)+"\n");
console.log(`WROTE ${OUT_FILE}`);
