// ODIN — mock hermético do pipeline (uso só em teste; carregado com --import).
// Substitui, sem rede e sem custo:
//   · Date.now / new Date() → relógio fixo (ODIN_FAKE_NOW);
//   · fetch para o Open-Meteo → série diária sintética (22,4 °C; 1321 mm);
//   · fetch para o endpoint do modelo → resposta montada a partir do material
//     da seção, no formato do contrato v1.1.
// Cenários (ODIN_MOCK_SCENARIO):
//   ok     — saída conforme na 1ª resposta;
//   retry  — 1ª resposta com recomendação na lente ("devem reduzir"); a
//            resposta ao retry de contrato vem conforme;
//   block  — sempre viola (recomendação + número novo na lente): o gate bloqueia,
//            mas o artefato shadow é escrito (amostra para calibração).

const FAKE_NOW = Date.parse(process.env.ODIN_FAKE_NOW ?? "2026-10-01T15:00:00Z");
const RealDate = Date;
class FakeDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [FAKE_NOW])); }
  static now() { return FAKE_NOW; }
}
globalThis.Date = FakeDate;

const SCENARIO = process.env.ODIN_MOCK_SCENARIO ?? "ok";
const realFetch = globalThis.fetch;

function openMeteo(url) {
  const u = new URL(url);
  const start = new RealDate(`${u.searchParams.get("start_date")}T00:00:00Z`);
  const end = new RealDate(`${u.searchParams.get("end_date")}T00:00:00Z`);
  const time = [], temp = [], precip = [];
  for (let d = start; d <= end; d = new RealDate(d.getTime() + 864e5)) {
    time.push(d.toISOString().slice(0, 10)); temp.push(22.4); precip.push(0);
  }
  precip[0] = 1321;
  return { latitude: -15.8, longitude: -47.9, daily: { time, temperature_2m_mean: temp, precipitation_sum: precip } };
}

const ptNum = (s) => s.replace(".", ",");
const NOT_MAT = {
  relevance: "not_material",
  pt: "Não foi identificada incidência material de Direito Econômico no conjunto de evidências analisado.",
  en: "No material Economic Law incidence was identified in the analyzed evidence set.",
  norms: [], institutions: [], sourceRefs: [],
};
const conf = (d, i) => ({ data: d, interpretation: i });

function carbon() {
  return {
    pt: "O preço do CBAM no Q2 2026 foi de 75,28 €/tCO2e, abaixo do preço do Q1 2026 (75,36 €/tCO2e). O regime definitivo está em vigor desde 2026-01-01, com a primeira declaração anual devida até 2027-09-30.",
    en: "The CBAM price in Q2 2026 was 75.28 €/tCO2e, below the Q1 2026 price (75.36 €/tCO2e). The definitive regime has been in force since 2026-01-01, with the first annual declaration due by 2027-09-30.",
    thesis: { pt: "Interpretação: a diferença entre os dois trimestres disponíveis é pequena; dois pontos não sustentam leitura de tendência.", en: "Interpretation: the difference between the two available quarters is small; two data points do not support a trend reading." },
    economicLaw: { relevance: "high", pt: "Incidência material: o Regulamento (UE) 2023/956 define obrigações de declaração para importadores autorizados na UE.", en: "Material incidence: Regulation (EU) 2023/956 sets declaration obligations for authorized EU importers.", norms: ["Regulation (EU) 2023/956"], institutions: ["European Commission"], sourceRefs: ["source-carbon-ec"] },
    stakeholderImplications: [
      { audience: "government", textPt: "Monitorar a conformidade das primeiras declarações permite medir o alcance do regime definitivo.", textEn: "Monitoring compliance with the first declarations allows the reach of the definitive regime to be measured." },
      { audience: "corporate", textPt: "Exportadores brasileiros de setores abrangidos podem receber pedidos de dados verificáveis de emissões por instalação.", textEn: "Brazilian exporters in covered sectors may receive requests for verifiable installation-level emissions data." },
    ],
    whatToWatch: [{ signalPt: "Preço do CBAM publicado pela Comissão Europeia", signalEn: "CBAM price published by the European Commission", whyItMattersPt: "Atualiza o preço de referência para importadores e permite a próxima comparação trimestral.", whyItMattersEn: "Updates the reference price for importers and enables the next quarterly comparison.", sourceId: "source-carbon-ec", expectedDate: null }],
    decisionLens: { lens: "founder_ceo", implications: [
      { textPt: "Empresas brasileiras que exportam bens de setores abrangidos podem precisar acompanhar o preço do CBAM, que foi de 75,28 €/tCO2e no Q2 2026.", textEn: "Brazilian companies exporting goods in covered sectors may need to track the CBAM price, which was 75.28 €/tCO2e in Q2 2026.", claimRefs: ["claim-1"] },
      { textPt: "Para founders com clientes importadores na UE, a primeira declaração anual, devida até 2027-09-30, é um marco de calendário a acompanhar.", textEn: "For founders with EU importer customers, the first annual declaration, due by 2027-09-30, is a calendar milestone to keep track of.", claimRefs: ["claim-3"] },
    ] },
    claims: [
      { id: "claim-1", kind: "fact", textPt: "O preço do CBAM no Q2 2026 foi de 75,28 €/tCO2e.", textEn: "The CBAM price in Q2 2026 was 75.28 €/tCO2e.", evidenceRefs: ["source-carbon-ec"], confidence: conf("high", "high") },
      { id: "claim-2", kind: "fact", textPt: "O regime definitivo do CBAM está em vigor desde 2026-01-01.", textEn: "The definitive CBAM regime has been in force since 2026-01-01.", evidenceRefs: ["source-carbon-ec"], eventRefs: ["evt-cbam-definitive-start"], confidence: conf("high", "high") },
      { id: "claim-3", kind: "fact", textPt: "A primeira declaração anual do CBAM é devida até 2027-09-30.", textEn: "The first annual CBAM declaration is due by 2027-09-30.", evidenceRefs: ["source-carbon-ec"], eventRefs: ["evt-cbam-first-annual-declaration"], confidence: conf("high", "high") },
    ],
    confidence: conf("high", "medium"),
    limitations: "Dois pontos trimestrais de preço; efeitos sobre custos e competitividade são possibilidades.",
  };
}

function blockchain(material) {
  const total = material.match(/Stablecoin market capitalization: US\$ ([\d.]+) bilhões/)?.[1];
  const tether = material.match(/Tether: US\$ ([\d.]+) bilhões/)?.[1];
  return {
    pt: `A capitalização de mercado de stablecoins foi de US$ ${ptNum(total)} bilhões, com Tether em US$ ${ptNum(tether)} bilhões. Os dados são de um único dia.`,
    en: `Stablecoin market capitalization was US$${total} billion, with Tether at US$${tether} billion. The data cover a single day.`,
    thesis: { pt: `Interpretação: no snapshot, um único emissor responde por US$ ${ptNum(tether)} bilhões de US$ ${ptNum(total)} bilhões da capitalização.`, en: `Interpretation: in the snapshot, a single issuer accounts for US$${tether} billion of US$${total} billion of capitalization.` },
    economicLaw: NOT_MAT,
    stakeholderImplications: [
      { audience: "government", textPt: "A concentração em um emissor é um dado relevante para análises de risco de contraparte em pagamentos digitais.", textEn: "Concentration in one issuer is relevant data for counterparty-risk analysis in digital payments." },
      { audience: "corporate", textPt: "Empresas que usam stablecoins em tesouraria podem precisar acompanhar a participação do maior emissor.", textEn: "Companies using stablecoins in treasury may need to track the largest issuer's share." },
    ],
    whatToWatch: [{ signalPt: "Atualização da capitalização de mercado de stablecoins no DefiLlama", signalEn: "Update of stablecoin market capitalization on DefiLlama", whyItMattersPt: "Permite a primeira comparação temporal dos dados de stablecoins.", whyItMattersEn: "Allows the first temporal comparison of the stablecoin data.", sourceId: "source-defillama-stablecoins", expectedDate: null }],
    decisionLens: { lens: "founder_ceo", implications: [
      { textPt: `Startups que recebem ou pagam em stablecoins podem precisar acompanhar a concentração em um emissor, que soma US$ ${ptNum(tether)} bilhões.`, textEn: `Startups that receive or pay in stablecoins may need to track concentration in one issuer, which totals US$${tether} billion.`, claimRefs: ["claim-2"] },
    ] },
    claims: [
      { id: "claim-1", kind: "fact", textPt: `A capitalização de mercado de stablecoins foi de US$ ${ptNum(total)} bilhões.`, textEn: `Stablecoin market capitalization was US$${total} billion.`, evidenceRefs: ["source-defillama-stablecoins"], confidence: conf("high", "high") },
      { id: "claim-2", kind: "fact", textPt: `A capitalização de mercado do Tether foi de US$ ${ptNum(tether)} bilhões.`, textEn: `Tether's market capitalization was US$${tether} billion.`, evidenceRefs: ["source-defillama-stablecoins"], confidence: conf("high", "high") },
    ],
    confidence: conf("high", "medium"),
    limitations: "Dados de um único dia; não há série temporal neste conjunto.",
  };
}

function climate(material) {
  const t = material.match(/mean temperature ([\d.]+)°C/)?.[1];
  const p = material.match(/precipitation (\d+) mm/)?.[1];
  return {
    pt: `A temperatura média em Brasília na janela de 12 meses foi de ${ptNum(t)}°C, acima da referência de 21,4°C. A precipitação foi de ${p} mm, abaixo da referência de 1550 mm.`,
    en: `Mean temperature in Brasília over the 12-month window was ${t}°C, above the 21.4°C reference. Precipitation was ${p} mm, below the 1550 mm reference.`,
    thesis: { pt: "Interpretação: Brasília ficou mais quente e mais seca que as referências internas do painel, que não são climatologia oficial.", en: "Interpretation: Brasília was warmer and drier than the dashboard's internal references, which are not an official climatology." },
    economicLaw: NOT_MAT,
    stakeholderImplications: [
      { audience: "government", textPt: "Dados de uma única cidade não estabelecem impacto em regiões produtoras ou bacias hidrográficas.", textEn: "Data from a single city do not establish impact on producing regions or river basins." },
      { audience: "corporate", textPt: "Empresas com operações no Distrito Federal podem precisar acompanhar a precipitação acumulada.", textEn: "Companies operating in the Federal District may need to track accumulated precipitation." },
    ],
    whatToWatch: [{ signalPt: "Temperatura média e precipitação acumulada em Brasília na próxima atualização diária do Open-Meteo", signalEn: "Mean temperature and accumulated precipitation in Brasília in the next daily Open-Meteo update", whyItMattersPt: "Permite acompanhar se o desvio em relação às referências persiste na janela móvel.", whyItMattersEn: "Shows whether the deviation from the references persists in the rolling window.", sourceId: "source-open-meteo-brasilia", expectedDate: null }],
    decisionLens: { lens: "founder_ceo", implications: [
      { textPt: `Para founders com operação física em Brasília, a precipitação de ${p} mm na janela é uma variável operacional a acompanhar.`, textEn: `For founders with physical operations in Brasília, precipitation of ${p} mm in the window is an operational variable to track.`, claimRefs: ["cl-002"] },
    ] },
    claims: [
      { id: "cl-001", kind: "fact", textPt: `A temperatura média em Brasília na janela foi de ${ptNum(t)}°C.`, textEn: `Mean temperature in Brasília over the window was ${t}°C.`, evidenceRefs: ["source-open-meteo-brasilia"], confidence: conf("high", "high") },
      { id: "cl-002", kind: "fact", textPt: `A precipitação acumulada em Brasília na janela foi de ${p} mm.`, textEn: `Accumulated precipitation in Brasília over the window was ${p} mm.`, evidenceRefs: ["source-open-meteo-brasilia"], confidence: conf("high", "high") },
    ],
    confidence: conf("high", "medium"),
    limitations: "Uma única cidade; as referências não são climatologia oficial.",
  };
}

function violate(out) {
  const bad = structuredClone(out);
  bad.decisionLens.implications[0].textPt = "Empresas expostas devem reduzir a exposição imediatamente, com meta de 37,5%.";
  return bad;
}

function modelResponse(body) {
  const msgs = body.messages ?? [];
  const user = msgs.find((m) => m.role === "user")?.content ?? "";
  const isRetry = msgs.some((m) => m.role === "user" && /violates the output contract/.test(m.content));
  const section = user.match(/^Section: (\w+)/m)?.[1];
  const builders = { carbon, blockchain, climate };
  let out = builders[section]?.(user);
  if (!out) throw new Error(`mock: seção desconhecida ${section}`);
  if (SCENARIO === "block" || (SCENARIO === "retry" && !isRetry)) out = violate(out);
  return { choices: [{ message: { content: JSON.stringify(out) } }], usage: { prompt_tokens: 1000, completion_tokens: 800, total_tokens: 1800 } };
}

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("open-meteo.com")) return new Response(JSON.stringify(openMeteo(url)), { status: 200, headers: { "content-type": "application/json" } });
  if (url.includes("/chat/completions")) return new Response(JSON.stringify(modelResponse(JSON.parse(init.body))), { status: 200, headers: { "content-type": "application/json" } });
  if (realFetch) throw new Error(`mock: rede bloqueada no teste (${url})`);
  throw new Error("fetch indisponível");
};
