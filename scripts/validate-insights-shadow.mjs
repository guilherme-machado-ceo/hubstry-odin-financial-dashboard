import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateInsightEntry, checkFreshness, checkLayerCompleteness, SCHEMA_VERSION, SUPPORTED_CONTRACT_VERSIONS } from "./insights-schema.mjs";
import { checkContractV11, formatContractError } from "./contract-v11.mjs";
import { validateSectionProfile } from "./insights-profile-validator.mjs";
import { checkEvidenceConsistency, formatConsistencyError } from "./evidence-consistency.mjs";
import { verifyProvenance } from "./verify-provenance.mjs";
import { annotateErrors, annotateNotice } from "./gh-annotations.mjs";

const FILE = path.resolve(process.cwd(),"public/data/insights.v2.shadow.json");
const json = JSON.parse(await readFile(FILE,"utf8"));
const errors=[];
if (json.schemaVersion!==SCHEMA_VERSION) errors.push("global.schemaVersion inválido");
if (!SUPPORTED_CONTRACT_VERSIONS.has(json.intelligenceContractVersion)) errors.push(`global.intelligenceContractVersion não suportada: ${json.intelligenceContractVersion}`);
if (json.status!=="shadow") errors.push("global.status deve ser shadow");
if (typeof json.runId!=="string") errors.push("global.runId ausente");
const sections=json.data?.sections;
if (!sections || typeof sections!=="object" || Object.keys(sections).length===0) errors.push("data.sections vazio");
const profileErrors=[];
const freshnessErrors=[];
const layerErrors=[];
for (const [id,entry] of Object.entries(sections??{})) {
  errors.push(...validateInsightEntry(entry,id));
  profileErrors.push(...validateSectionProfile(entry,id,{ strict:true }));
  freshnessErrors.push(...checkFreshness(entry,id));
  layerErrors.push(...checkLayerCompleteness(entry,id));
}
errors.push(...profileErrors);
errors.push(...freshnessErrors);
errors.push(...layerErrors);
const layersComplete = layerErrors.length === 0;
const freshnessValid = freshnessErrors.length === 0;
const sectionProfileValid = profileErrors.length === 0;
const generated=Object.values(sections??{}).filter(e=>e.status==="shadow").length;
const facts=Object.values(sections??{}).flatMap(e=>e.claims??[]).filter(c=>c.kind==="fact");
const covered=facts.length===0?1:facts.filter(c=>(c.evidenceRefs??[]).length>0).length/facts.length;
const lawOk=Object.values(sections??{}).every(e=>e.economicLaw?.relevance!=="high" ||
  ["norms","institutions","sourceRefs"].every(k=>Array.isArray(e.economicLaw[k])&&e.economicLaw[k].length>0));
// Consistência claim ↔ evidência (determinística): material vem do generationReport.
const reportPath = path.resolve(process.cwd(),"public/data/generationReport.json");
let reportForEvidence = null;
try { reportForEvidence = JSON.parse(await readFile(reportPath,"utf8")); } catch {}
const evidenceBySection = new Map((reportForEvidence?.sections ?? []).map(s => [s.sectionId, s.evidence]));
const consistencyErrors = [];
for (const [id,entry] of Object.entries(sections??{})) consistencyErrors.push(...checkEvidenceConsistency(entry, evidenceBySection.get(id)).map(e => ({ sectionId:id, ...e })));
const evidenceConsistent = consistencyErrors.length === 0;
// Data & Intelligence Contract v1.1: procedência em dois eixos, EVENT opcional,
// What to Watch bilíngue, lente Founder/CEO e linguagem não recomendativa.
const contractV11Errors = [];
for (const [id,entry] of Object.entries(sections??{})) if (entry.intelligenceContractVersion === "1.1") contractV11Errors.push(...checkContractV11(entry, evidenceBySection.get(id)).map(e => `sections.${id} ${formatContractError(e)}`));
const contractV11Valid = contractV11Errors.length === 0;
errors.push(...contractV11Errors);
errors.push(...consistencyErrors.map(e => `sections.${e.sectionId} ${formatConsistencyError(e)}`));
const provenanceCheck = await verifyProvenance(json, { require: true });
errors.push(...provenanceCheck.errors);
const provenanceReproducible = provenanceCheck.errors.length === 0;
const gate=errors.length===0 && generated>0 && covered>=0.5 && lawOk && sectionProfileValid && evidenceConsistent && freshnessValid && provenanceReproducible && layersComplete && contractV11Valid;
console.log(`Shadow gate: ${gate?"PASS":"BLOCK"} | sections=${generated} factEvidenceCoverage=${covered.toFixed(2)} sectionProfileValid=${sectionProfileValid} evidenceConsistent=${evidenceConsistent} freshnessValid=${freshnessValid} provenanceReproducible=${provenanceReproducible} layersComplete=${layersComplete} contractV11Valid=${contractV11Valid}`);
if(!gate) errors.push("shadow generation gate bloqueou o artefato");
const reportFile = path.resolve(process.cwd(),"public/data/generationReport.json");
try {
  const report = JSON.parse(await readFile(reportFile,"utf8"));
  report.validation = { decision: gate ? "publish_candidate" : "blocked", validator: "semantic", errors, factEvidenceCoverage: covered, generatedSections: generated, economicLawHighHasNorms: lawOk, sectionProfileValid, evidenceConsistent, consistencyErrors, freshnessValid, provenanceReproducible, layersComplete, contractV11Valid, contractV11Errors, validatedAt: new Date().toISOString() };
  await writeFile(reportFile, JSON.stringify(report,null,2)+"\n");
} catch (reportError) {
  errors.push(`generationReport.json não pôde ser atualizado: ${reportError.message}`);
}
annotateNotice("ODIN shadow gate", `run ${json.runId} · ${gate?"PASS":"BLOCK"} · sections=${generated} · profile=${sectionProfileValid} · consistency=${evidenceConsistent} · freshness=${freshnessValid} · provenance=${provenanceReproducible} · layers=${layersComplete} · contractV11=${contractV11Valid}`);
if(errors.length){annotateErrors("ODIN gate BLOCK",errors);for(const e of errors) console.error("ERRO:",e);process.exit(1);}
console.log("insights.v2.shadow.json APROVADO estruturalmente.");