import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

// ODIN — section profile validator dirigido por registry (ADR-0003).
// Adicionar uma seção = adicionar contracts/sections/<id>/ + entrada no registry.json.
// Cada rules.mjs exporta validateProfile(entry, basePath) — ou validate<PascalCase(id)>Profile (legado do piloto).

const root = process.cwd();
const registryPath = path.join(root, "contracts/sections/registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));

const toPascal = (id) => id.split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");

const validators = new Map();
for (const profileId of registry.profiles ?? []) {
  const moduleUrl = pathToFileURL(path.join(root, "contracts/sections", profileId, "rules.mjs")).href;
  const mod = await import(moduleUrl);
  const fn = mod.validateProfile ?? mod[`validate${toPascal(profileId)}Profile`];
  if (typeof fn === "function") validators.set(profileId, fn);
}

/** IDs de seção com profile registrado (registry.json). */
export const REGISTERED_PROFILES = new Set(registry.profiles ?? []);

/**
 * Máquina de estados (ADR-0003):
 * - sem sectionProfile → contrato legado (compatível), EXCETO em modo estrito;
 * - modo estrito (gate de geração/promoção, MVP Readiness Gate): seção com
 *   profile registrado DEVE declará-lo — ausência bloqueia, não é "válida";
 * - profile desconhecido → BLOCK.
 */
export function validateSectionProfile(entry, sectionId = entry?.sectionId, { strict = false } = {}) {
  if (!entry?.sectionProfile) {
    if (strict && REGISTERED_PROFILES.has(sectionId)) return [`sections.${sectionId}: profile registrado "${sectionId}" ausente (gate estrito)`];
    return [];
  }
  const validator = validators.get(entry.sectionProfile);
  if (!validator) return [`section profile não suportado: ${entry.sectionProfile}`];
  if (entry.sectionId !== sectionId) return [`section profile sectionId inconsistente: ${entry.sectionId}`];
  return validator(entry, `sections.${sectionId}`);
}
