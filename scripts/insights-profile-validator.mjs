import { validateCarbonProfile } from "../contracts/sections/carbon/rules.mjs";

const validators = new Map([["carbon", validateCarbonProfile]]);

export function validateSectionProfile(entry, sectionId = entry?.sectionId) {
  const validator = validators.get(entry?.sectionProfile ?? sectionId);
  if (!validator) return [`section profile não suportado: ${entry?.sectionProfile ?? sectionId}`];
  return validator(entry, `sections.${sectionId}`);
}