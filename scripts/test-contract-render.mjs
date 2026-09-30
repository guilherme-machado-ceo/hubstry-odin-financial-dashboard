// ODIN — teste estático contrato ↔ render (M1 · Emergency MVP Gate).
// O repositório não tem runner de teste de componente; este teste verifica o
// alinhamento entre o contrato das 5 camadas e o InsightBox: cada camada tem
// cabeçalho pt/en e caminho de renderização para seus campos, e todo valor de
// enum do contrato tem rótulo na UI (senão apareceria cru, ex.: "not_material").
import { readFile } from "node:fs/promises";

const src = await readFile("src/components/InsightBox.tsx", "utf8");
const failures = [];
const need = (cond, msg) => { if (!cond) failures.push(msg); };
const has = (s) => src.includes(s);

// Camadas: cabeçalho pt/en + caminho de dados.
const layers = [
  { name: "Contexto", headings: ["Contexto Estratégico", "Strategic Context"], paths: ["entry.pt", "entry.en"] },
  { name: "Tese", headings: ["Tese ODIN", "ODIN Thesis"], paths: ["entry.thesis.pt", "entry.thesis.en"] },
  { name: "Direito Econômico", headings: ["Lente de Direito Econômico", "Economic Law Lens"], paths: ["law.relevance", "law.pt", "law.en", "law.norms", "law.institutions"] },
  { name: "Stakeholders", headings: ["Implicações para Stakeholders", "Stakeholder Implications"], paths: ["item.audience", "item.textPt", "item.textEn"] },
  { name: "What to Watch", headings: ["What to Watch"], paths: ["item.signal", "item.source", "item.whyItMatters", "item.expectedDate"] },
];
for (const l of layers) {
  for (const h of l.headings) need(has(h), `camada ${l.name}: cabeçalho "${h}" ausente no InsightBox`);
  for (const p of l.paths) need(has(p), `camada ${l.name}: campo ${p} sem caminho de renderização`);
}

// Enums do contrato → rótulos na UI.
const enums = {
  "economicLaw.relevance": ["high", "medium", "low", "not_material"],
  "stakeholderImplications.audience": ["government", "corporate", "investors", "startups"],
  "claims.kind": ["fact", "interpretation", "hypothesis"],
};
for (const [field, values] of Object.entries(enums)) {
  for (const v of values) need(new RegExp(`\\b${v}\\s*:\\s*\\{\\s*pt:`).test(src), `${field}="${v}" sem rótulo pt/en na UI`);
}

// Tipo da relevância aceita not_material; limitations é string no contrato.
need(/relevance\?:[^;]*"not_material"/.test(src), "tipo EconomicLaw.relevance não aceita not_material");
need(/limitations\?:\s*string;/.test(src), "tipo limitations diverge do contrato (string)");

if (failures.length) { for (const f of failures) console.error("FALHA:", f); process.exit(1); }
console.log("ODIN contract ↔ render: PASS (5 camadas, enums rotulados)");
