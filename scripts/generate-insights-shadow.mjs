// ODIN Insights v3 shadow generator.
// Produces public/data/insights.v2.shadow.json only; never replaces production insights.json.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { chatJson, getProviderConfig } from "./ai-provider.mjs";
import { PROMPT_VERSION, SCHEMA_VERSION, INTELLIGENCE_CONTRACT_VERSION } from "./insights-schema.mjs";
import { compareDirection } from "./evidence-consistency.mjs";

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

function source(sourceId, sourceUrl, asOf, dataPath, metricId, material) {
  return { sourceId, sourceUrl, asOf, dataPath, metricId, hash: sha256(material) };
}
function fmt(v) {
  if (v >= 1e12) return `US$ ${(v/1e12).toFixed(2)} trilhões`;
  if (v >= 1e9) return `US$ ${(v/1e9).toFixed(1)} bilhões`;
  if (v >= 1e6) return `US$ ${(v/1e6).toFixed(1)} milhões`;
  return `US$ ${Math.round(v).toLocaleString("en-US")}`;
}
async function json(name) { return JSON.parse(await readFile(path.join(OUT_DIR,name),"utf8")); }

async function contexts() {
  const stable = await json("stablecoins.json");
  const crypto = await json("crypto-market.json");
  const rwa = await json("rwa-protocols.json");
  const now = new Date().toISOString().slice(0,10);
  const climateEnd = new Date(Date.now()-5*864e5).toISOString().slice(0,10);
  const climateStart = new Date(Date.now()-370*864e5).toISOString().slice(0,10);
  const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=-15.8&longitude=-47.9&start_date=${climateStart}&end_date=${climateEnd}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  const weather = await (await fetch(weatherUrl,{signal:AbortSignal.timeout(30000)})).json();
  const temps=weather.daily?.temperature_2m_mean??[];
  const precip=(weather.daily?.precipitation_sum??[]).reduce((a,b)=>a+b,0);
  const avg=temps.reduce((a,b)=>a+b,0)/(temps.length||1);
  const avgR=Number(avg.toFixed(1)), precipR=Math.round(precip);
  const TEMP_REF=21.4, PRECIP_REF=1550;
  const top=rwa.data.rwa.slice(0,3).map(x=>`${x.name}: ${fmt(x.tvlUsd)} TVL`).join("; ");
  return [
    (() => {
      const q2 = 75.28, q1 = 75.36;
      const context = `Carbon pricing/CBAM (Regulation (EU) 2023/956, as amended by the 2025 CBAM simplification). Q2 2026 price: ${q2} €/tCO2e; Q1 2026: ${q1} €/tCO2e; the Q2 price is ${compareDirection(q2, q1) === "below" ? "below" : "above"} the Q1 price. Six sectors. De minimis: 50 t/year annual aggregate per importer for covered goods. Definitive period in force since 2026-01-01. First annual CBAM declaration (covering 2026 imports) due by 2027-09-30; this is a declaration deadline, not the start of the definitive regime. In the definitive regime the authorized EU importer is legally responsible for declaring embedded emissions; Brazilian exporters may face indirect requests for verifiable installation-level data. Effects on costs/competitiveness are possibilities. Do not use national per-capita emissions. Source: source-carbon-ec.`;
      return {
        id:"carbon", validAsOf:"2026-07-06", nextReviewAt:"2026-10-05T00:00:00Z",
        provenance:[
          source("source-carbon-ec","https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en","2026-07-06","context:carbon","cbam-price-q2-2026",context),
        ],
        context,
        evidence:{
          material: context,
          keyDates:[
            { id:"cbam-definitive-start", date:"2026-01-01",
              subjectTerms:["regime definitivo","período definitivo","fase definitiva","definitive regime","definitive cbam regime","definitive cbam period","definitive period","definitive phase"],
              eventTerms:["começa","começou","inicia","iniciou","início","em vigor","vigente","vigora","desde","starts","started","begins","began","start of","applies","applied","in force","since"] },
            { id:"cbam-first-annual-declaration", date:"2027-09-30",
              subjectTerms:["primeira declaração","declaração anual","first declaration","annual declaration","first annual"],
              eventTerms:["até","prazo","devida","vence","due","deadline","by "] },
          ],
          comparisons:[
            { id:"cbam-price-q2-vs-q1", observed:q2, reference:q1, unit:"€/tCO2e", direction:compareDirection(q2, q1) },
          ],
        },
      };
    })(),
    {
      id:"blockchain", validAsOf:stable.updatedAt, nextReviewAt:new Date(Date.now()+7*864e5).toISOString(),
      provenance:[
        source("source-defillama-stablecoins","https://defillama.com/stablecoins",stable.updatedAt,"public/data/stablecoins.json","stablecoin-total-mcap",JSON.stringify(stable)),
        source("source-defillama-rwa","https://defillama.com/protocols",rwa.updatedAt,"public/data/rwa-protocols.json","rwa-tvl-sample",JSON.stringify(rwa)),
        source("source-defillama-coins","https://defillama.com/","2026-09-30","public/data/crypto-market.json","asset-prices",JSON.stringify(crypto))
      ],
      context:`Digital assets. Stablecoin market capitalization: ${fmt(stable.data.totalMcapUsd)}; Tether: ${fmt(stable.data.assets[0].mcapUsd)}. This is market capitalization, not international payment volume. RWA sample: ${top}; do not sum these protocols or call the sample the whole sector. Prices include BTC, ETH, SOL and BNB snapshots. Interpretation may discuss digital dollar rails and local-currency narratives, but cannot claim causation. Sources: source-defillama-stablecoins, source-defillama-rwa, source-defillama-coins.`,
      get evidence(){ return { material:this.context, keyDates:[], comparisons:[] }; }
    },
    {
      id:"climate", validAsOf:climateEnd, nextReviewAt:new Date(Date.now()+7*864e5).toISOString(),
      provenance:[
        source("source-open-meteo-brasilia",weatherUrl,climateEnd,"external:open-meteo-archive","brasilia-12m-temp-precip",JSON.stringify(weather.daily))
      ],
      context:`Climate vector for Brasília. Rolling 12-month window ${climateStart} to ${climateEnd}; mean temperature ${avgR}°C (${compareDirection(avgR, TEMP_REF) === "above" ? "above" : compareDirection(avgR, TEMP_REF) === "below" ? "below" : "equal to"} the ${TEMP_REF}°C reference); precipitation ${precipR} mm (${compareDirection(precipR, PRECIP_REF) === "above" ? "above" : compareDirection(precipR, PRECIP_REF) === "below" ? "below" : "equal to"} the ${PRECIP_REF} mm reference). The reference benchmarks (${TEMP_REF}°C and ${PRECIP_REF} mm) are dashboard references, not an official climatology. A single city cannot establish impacts on producing regions, commodities or energy. Any transmission to commodities, hydrology, energy or FX must be a hypothesis and should be monitored against producing regions and relevant river basins. Source: source-open-meteo-brasilia.`,
      get evidence(){ return { material:this.context, keyDates:[], comparisons:[
        { id:"climate-temp-vs-reference", observed:avgR, reference:TEMP_REF, unit:"°C", direction:compareDirection(avgR, TEMP_REF) },
        { id:"climate-precip-vs-reference", observed:precipR, reference:PRECIP_REF, unit:"mm", direction:compareDirection(precipR, PRECIP_REF) },
      ] }; }
    }
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
  results.push({
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
  });
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
