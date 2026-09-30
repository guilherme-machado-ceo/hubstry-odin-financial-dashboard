import { validateCarbonProfile } from "../contracts/sections/carbon/rules.mjs";

const validators = new Map([["carbon", validateCarbonProfile]]);

export function validateSectionProfile(entry, sectionId = entry?.sectionId) {
  if (!entry?.sectionProfile) return [];
  const validator = validators.get(entry.sectionProfile);
  if (!validator) return [`section profile não suportado: ${entry.sectionProfile}`];
  if (entry.sectionId !== sectionId) return [`section profile sectionId inconsistente: ${entry.sectionId}`];
  return validator(entry, `sections.${sectionId}`);
}