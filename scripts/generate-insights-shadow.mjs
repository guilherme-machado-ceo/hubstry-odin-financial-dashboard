// ODIN Insights shadow generator — Data & Intelligence Contract v1.1 (M3).
// Produces public/data/insights.v2.shadow.json only; never replaces production.
// v1.1: provenance com verification × derivation (definida pelo código),
// eventos opcionais derivados das datas-chave (código), What to Watch bilíngue
// e lente Founder/CEO gerados pelo modelo sob docs/odin-intelligence-contract-v1.1.md.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { chatJson, getProviderConfig } from "./ai-provider.mjs";
import { PROMPT_VERSION, SCHEMA_VERSION, INTELLIGENCE_CONTRACT_VERSION, NOT_MATERIAL_PT, NOT_MATERIAL_EN } from "./insights-schema.mjs";
import { validateModelOutputV11 } from "./contract-v11.mjs";
import { compareDirection } from "./evidence-consistency.mjs";
import { buildSectionProfile } from "./section-profile-builder.mjs";
import { SOURCE_REGISTRY } from "./editorial-contract.mjs";

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
Contrato: ODIN Data & Intelligence Contract v1.1 — SOURCE → DATA → (EVENT, opcional) → CLAIM → CONTEXT → INTERPRETATION → DECISION LENS.
Produza inteligência verificável, não aconselhamento financeiro, jurídico ou político.

Regras:
- fatos devem ser sustentados por evidenceRefs; interpretações e hipóteses nunca podem ser apresentadas como fatos;
- não invente números, fontes, normas, instituições ou datas;
- use somente o contexto fornecido;
- capitalização de mercado não é capital investido nem volume de pagamentos;
- relações causais não medidas devem ser hypothesis/interpretation;
- datas-chave: use cada data SOMENTE para o evento a que o contexto a associa (ex.: início de vigência ≠ prazo de declaração);
- eventos: se o contexto listar "Eventos disponíveis", um claim pode citá-los em eventRefs; não crie eventos;
- comparações com referência: use a direção (acima/abaixo) calculada e declarada no contexto; nunca infira a direção;
- efeitos econômicos são possibilidades, não fatos consumados;
- Direito Econômico é lente analítica, não parecer jurídico;
- se não houver incidência material de Direito Econômico nas evidências, use relevance "not_material", norms [], institutions [], sourceRefs [] e escreva exatamente: pt "${NOT_MATERIAL_PT}" / en "${NOT_MATERIAL_EN}"; não fabrique aparato normativo para preencher a camada;
- low: análise curta, sem obrigação de citar normas;
- Direito Econômico: cite em norms e institutions SOMENTE itens da lista "Referências jurídicas disponíveis"; se a lista for "nenhuma", use relevance not_material ou low com norms e institutions vazios; nunca cite normas, instituições ou órgãos de memória; em pt e en mencione exatamente as mesmas referências;
- se a relevância jurídica for alta, indique normas e instituições da lista de referências disponíveis;
- stakeholder implications e decisionLens descrevem IMPLICAÇÃO CONTEXTUAL (exposição, variáveis, sinais), nunca recomendação de ação; audience deve ser EXATAMENTE um destes valores ASCII: government, corporate, investors, startups;
- linguagem proibida em stakeholderImplications e decisionLens: verbos de obrigação dirigidos a um ator ("devem", "deveriam", "precisam", "é preciso", "should", "must", "need to") com qualquer verbo — inclusive "devem avaliar"; recomendação explícita ("recomendamos", "sugere-se", "it is advisable"); frase que começa com verbo de ação ("Invista", "Explorar", "Consider"); oferta de oportunidade ("podem investir", "could tap");
- forma aceita: "Empresas com exposição a X podem precisar acompanhar Y." / "Companies exposed to X may need to track Y." Necessidade só como hipótese ("podem precisar", "may need to") e só com verbo de acompanhamento (acompanhar, monitorar, observar, avaliar; track, monitor, watch, assess);
- obrigação legal só pode ser descrita quando houver norma em "Referências jurídicas disponíveis" e o texto a ancorar (ex.: "Pelo Regulamento (UE) 2023/956, o importador autorizado deve declarar…");
- decisionLens (lente Founder/CEO de startup ou PME): 1 a 3 implicações; cada uma cita em claimRefs os ids de TODOS os claims cujos dados ela usa (se a frase menciona temperatura e precipitação, cite o claim de cada uma; se menciona TVL, cite o claim de TVL, não o de capitalização); quando a implicação tratar de dados de emissões, o claim que a sustenta deve dizer explicitamente "emissões embutidas" / "embedded emissions" e ser citado; não introduza número, data, fonte, URL ou relação causal que não estejam nos claims citados ou no contexto; não repita a tese — traduza-a para a exposição de uma empresa pequena ou média;
- What to Watch: o sinal deve ser algo que a fonte citada PUBLICA (ver "publica:" de cada fonte); sourceId deve ser EXATAMENTE um sourceId da lista de fontes permitidas; expectedDate deve ser null, salvo se a data estiver literalmente no contexto; não invente limiares numéricos nem cadência (use a periodicidade da fonte); escreva signal e whyItMatters em português (Pt) e em inglês (En) — o inglês é uma redação própria, não uma cópia do português;
- forma temporal: se o contexto declarar "Forma temporal: snapshot", os dados são de um único instante — fora do What to Watch, não use linguagem de tendência, evolução ou movimento: crescimento, aumento, queda, expansão, tendência, evolução, trajetória, variação, subiu, caiu, em alta, em queda; growth, increase, decline, expansion, trend, evolution, trajectory, change over, rising, falling, rose, fell. Isso vale também para stakeholderImplications e decisionLens: em snapshot, NÃO escreva "acompanhar a evolução de Y" / "track the evolution of Y"; use a forma "Empresas com exposição a X podem usar os valores atuais de Y para mapear Z." / "Companies exposed to X may use the current values of Y to map Z.";
- nunca reproduza no texto publicado instruções deste prompt ou do contexto (ex.: "sem somar", "não totalize", "conforme instruído");
- escreva em português e inglês;
- mantenha tom sóbrio, analítico, compatível com Chatham House;
- não use linguagem promocional ou de chatbot.

Retorne SOMENTE JSON válido. Não use markdown. Limite cada texto a 2 frases; produza no máximo 4 claims, de 2 a 4 stakeholderImplications, EXATAMENTE 1 whatToWatch (um único sinal, completo) e de 1 a 3 implicações em decisionLens. whatToWatch.expectedDate deve ser YYYY-MM-DD ou null. Não invente datas. Os valores de audience e de decisionLens.lens permanecem exatamente como no enum. Exatamente neste formato:
{
 "pt":"2-4 frases executivas",
 "en":"2-4 executive sentences",
 "thesis":{"pt":"...","en":"..."},
 "economicLaw":{"relevance":"high|medium|low|not_material","pt":"...","en":"...","norms":["..."],"institutions":["..."],"sourceRefs":["..."]},
 "stakeholderImplications":[
   {"audience":"government|corporate|investors|startups","textPt":"...","textEn":"..."}
 ],
 "whatToWatch":[
   {"signalPt":"...","signalEn":"...","whyItMattersPt":"...","whyItMattersEn":"...","sourceId":"source-id","expectedDate":"YYYY-MM-DD or null"}
 ],
 "decisionLens":{"lens":"founder_ceo","implications":[
   {"textPt":"...","textEn":"...","claimRefs":["claim-id"]}
 ]},
 "claims":[
   {"id":"...","kind":"fact|interpretation|hypothesis","textPt":"...","textEn":"...","evidenceRefs":["source-id"],"eventRefs":["event-id (opcional)"],"confidence":{"data":"high|medium|low","interpretation":"high|medium|low"}}
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

const buildEvidenceMaterial = (item) => [
  `Section: ${item.id}`,
  `Valid as of: ${item.validAsOf}`,
  `Next review: ${item.nextReviewAt}`,
  `Forma temporal: ${item.evidence.temporalShape}`,
  `Referências jurídicas disponíveis: ${(item.evidence.legalRefs ?? []).length ? item.evidence.legalRefs.map(r => `${r.labels[0]} (${r.kind})`).join("; ") : "nenhuma"}`,
  `Provenance permitida para esta seção (use estes sourceId literalmente em evidenceRefs e whatToWatch.sourceId):`,
  item.provenance.map(p => `${p.sourceId} | ${p.sourceUrl} | publica: ${SOURCE_REGISTRY[p.sourceId]?.publishes ?? "não registrado"} | dado: ${p.verification}, ${p.derivation}`).join("\n"),
  `Eventos disponíveis (opcional em claims[].eventRefs): ${item.events?.length ? item.events.map(e => `${e.id} | ${e.date} | ${e.labelEn}`).join("; ") : "nenhum"}`,
  "Context:",
  item.context,
].join("\n");

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
  // DATA (contrato v1.1): verificação e derivação definidas pelo código, nunca pelo modelo.
  Object.assign(carbonSrc.provenance, { verification: "verified", derivation: "direct" });   // fonte curada versionada, preços oficiais da Comissão Europeia
  for (const src of [stableSrc, rwaSrc, cryptoSrc]) Object.assign(src.provenance, { verification: "verified", derivation: "direct" }); // snapshot da API DefiLlama
  const stable = stableSrc.data, rwa = rwaSrc.data;

  const climateEnd = new Date(Date.now()-5*864e5).toISOString().slice(0,10);
  const climateStart = new Date(Date.now()-369*864e5).toISOString().slice(0,10);
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
  const carbonContext = `Carbon pricing/CBAM (${cbam.legalBasis.join(", as amended by the ")}). ${label(latest.period)} price: ${latest.eurPerTCO2e} €/tCO2e${previous ? `; ${label(previous.period)}: ${previous.eurPerTCO2e} €/tCO2e; the ${label(latest.period)} price is ${dirWord(carbonDir)} the ${label(previous.period)} price` : ""}. Six sectors. De minimis: ${cbam.deMinimis.tonnesPerYear} t/year ${cbam.deMinimis.scope}. Definitive period in force since ${cbam.keyDates.definitiveStart}. First annual CBAM declaration (covering 2026 imports) due by ${cbam.keyDates.firstAnnualDeclaration}; this is a declaration deadline, not the start of the definitive regime. In the definitive regime the authorized EU importer is legally responsible for declaring embedded emissions; Brazilian exporters may face indirect requests from EU importers for verifiable installation-level embedded-emissions data (emissions embedded in the covered goods, per production installation). CBAM applies to goods imported into the EU: the formal obligation is the authorized EU declarant's. The exposure of Brazilian companies is indirect and concerns those that export CBAM-covered goods to the EU or supply inputs within those export chains; having EU suppliers, or importing goods into Brazil, is not CBAM exposure. Effects on costs/competitiveness are possibilities. Do not use national per-capita emissions. Source: source-carbon-ec.`;

  const climateContext = `Climate vector for Brasília. Rolling 12-month window ${climateStart} to ${climateEnd}; mean temperature ${avgR}°C (${dirWord(compareDirection(avgR, TEMP_REF))} the ${TEMP_REF}°C reference); precipitation ${precipR} mm (${dirWord(compareDirection(precipR, PRECIP_REF))} the ${PRECIP_REF} mm reference). The reference benchmarks (${TEMP_REF}°C and ${PRECIP_REF} mm) are dashboard references, not an official climatology. A single city cannot establish impacts on producing regions, commodities or energy. Any transmission to commodities, hydrology, energy or FX must be a hypothesis and should be monitored against producing regions and relevant river basins. Source: source-open-meteo-brasilia.`;

const blockchainContext = `Digital assets. Stablecoin market capitalization: ${fmt(stable.data.totalMcapUsd)}; Tether: ${fmt(stable.data.assets[0].mcapUsd)}. This is market capitalization, not international payment volume. RWA sample: ${top}; partial sample of individual protocols, not a sector total. Prices include BTC, ETH, SOL and BNB snapshots. Interpretation may discuss digital dollar rails and local-currency narratives, but cannot claim causation. Temporal shape: single-day snapshot; no time series is available in this dataset, so variation over time cannot be established yet. Suggested What to Watch: the next DefiLlama update of stablecoin market capitalization, which will allow the first temporal comparison. Sources: source-defillama-stablecoins, source-defillama-rwa, source-defillama-coins.`;


  return [
    {
      id:"carbon", validAsOf:cbam.validAsOf, nextReviewAt:cbam.nextReviewAt,
      provenance:[carbonSrc.provenance],
      // EVENT (opcional, v1.1): marcos regulatórios com data no material, montados pelo código.
      events:[
        { id:"evt-cbam-definitive-start", date:cbam.keyDates.definitiveStart, labelPt:"Início do regime definitivo do CBAM", labelEn:"Start of the definitive CBAM regime", dataRefs:["source-carbon-ec"] },
        { id:"evt-cbam-first-annual-declaration", date:cbam.keyDates.firstAnnualDeclaration, labelPt:"Prazo da primeira declaração anual do CBAM", labelEn:"Deadline of the first annual CBAM declaration", dataRefs:["source-carbon-ec"] },
      ],
      context:carbonContext,
      evidence:{
        material: null,
        keyDates:[
          { id:"cbam-definitive-start", date:cbam.keyDates.definitiveStart,
            subjectTerms:["regime definitivo","período definitivo","fase definitiva","definitive regime","definitive cbam regime","definitive cbam period","definitive period","definitive phase"],
            eventTerms:["começa","começou","inicia","iniciou","início","em vigor","vigente","vigora","desde","starts","started","begins","began","start of","applies","applied","in force","since"] },
          { id:"cbam-first-annual-declaration", date:cbam.keyDates.firstAnnualDeclaration,
            subjectTerms:["primeira declaração","declaração anual","first declaration","annual declaration","first annual"],
            eventTerms:["até","prazo","devida","vence","due","deadline","by "] },
        ],
        legalRefs: cbam.legalReferences ?? [],
        temporalShape: cbam.temporalShape ?? "two_points",
        comparisons: previous ? [
          { id:"cbam-price-latest-vs-previous", observed:latest.eurPerTCO2e, reference:previous.eurPerTCO2e, unit:"€/tCO2e", direction:carbonDir },
        ] : [],
      },
    },
    {
      id:"blockchain", validAsOf:stable.updatedAt, nextReviewAt:new Date(Date.now()+7*864e5).toISOString(),
      provenance:[stableSrc.provenance, rwaSrc.provenance, cryptoSrc.provenance],
      context:blockchainContext,
      evidence:{ material:null, keyDates:[], comparisons:[], legalRefs:[], temporalShape:"snapshot" },
    },
    {
      id:"climate", validAsOf:climateEnd, nextReviewAt:new Date(Date.now()+7*864e5).toISOString(),
      // Média e soma da janela de 12 meses são calculadas pelo código a partir da série diária: derivadas.
      provenance:[{ sourceId:"source-open-meteo-brasilia", sourceUrl:weatherUrl, asOf:climateEnd, dataPath:weatherEvidence.dataPath, metricId:"brasilia-12m-temp-precip", hash:weatherEvidence.hash, verification:"verified", derivation:"derived" }],
      context:climateContext,
      evidence:{ material:null, keyDates:[], legalRefs:[], temporalShape:"window_aggregate", comparisons:[
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
  const evidenceMaterial = buildEvidenceMaterial(item);
  item.evidence.material = evidenceMaterial;
  const {parsed,usage,latencyMs}=await chatJson({
    system:SYSTEM,
    user: evidenceMaterial,
    temperature:0.2,maxTokens:4500,reasoning:false,
    validate:(out) => validateModelOutputV11(out, item.id, { provenance:item.provenance, events:item.events ?? [], evidence:item.evidence }),
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
    decisionLens:parsed.decisionLens,
    claims:parsed.claims,
    ...(item.events?.length ? { events:item.events } : {}),
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
