export const PROFILE_ID = "carbon";
export const PROFILE_VERSION = "1.0.0";

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export function validateCarbonProfile(entry, path = "entry") {
  const errors = [];
  if (!entry || typeof entry !== "object") return [`${path} deve ser objeto`];
  if (entry.sectionProfile !== PROFILE_ID) errors.push(`${path}.sectionProfile deve ser carbon`);
  if (entry.profileVersion !== PROFILE_VERSION) errors.push(`${path}.profileVersion deve ser ${PROFILE_VERSION}`);

  const layers = entry.layers;
  if (!layers || typeof layers !== "object") return [...errors, `${path}.layers ausente`];

  for (const name of ["sources","events","indicators","intelligence"]) {
    if (!Array.isArray(layers[name]) || layers[name].length === 0) {
      errors.push(`${path}.layers.${name} deve conter ao menos um elemento`);
    }
  }

  const sourceIds = new Set();
  for (const [i, source] of (layers.sources ?? []).entries()) {
    if (!nonEmptyString(source?.id)) errors.push(`${path}.layers.sources[${i}].id ausente`);
    else sourceIds.add(source.id);
    if (!/^https?:\/\//i.test(source?.sourceUrl ?? "")) errors.push(`${path}.layers.sources[${i}].sourceUrl inválida`);
  }

  for (const [i, event] of (layers.events ?? []).entries()) {
    if (!nonEmptyString(event?.id)) errors.push(`${path}.layers.events[${i}].id ausente`);
    if (!nonEmptyString(event?.type)) errors.push(`${path}.layers.events[${i}].type ausente`);
    if (!Array.isArray(event?.sourceRefs) || event.sourceRefs.length === 0) errors.push(`${path}.layers.events[${i}].sourceRefs ausente`);
    for (const ref of event?.sourceRefs ?? []) if (!sourceIds.has(ref)) errors.push(`${path}.layers.events[${i}].sourceRefs referencia source inexistente: ${ref}`);
  }

  for (const [i, indicator] of (layers.indicators ?? []).entries()) {
    if (!nonEmptyString(indicator?.id)) errors.push(`${path}.layers.indicators[${i}].id ausente`);
    if (!nonEmptyString(indicator?.metricId)) errors.push(`${path}.layers.indicators[${i}].metricId ausente`);
    if (!Array.isArray(indicator?.sourceRefs) || indicator.sourceRefs.length === 0) errors.push(`${path}.layers.indicators[${i}].sourceRefs ausente`);
    for (const ref of indicator?.sourceRefs ?? []) if (!sourceIds.has(ref)) errors.push(`${path}.layers.indicators[${i}].sourceRefs referencia source inexistente: ${ref}`);
  }

  for (const [i, item] of (layers.intelligence ?? []).entries()) {
    if (!nonEmptyString(item?.id)) errors.push(`${path}.layers.intelligence[${i}].id ausente`);
    if (!["fact","interpretation","hypothesis"].includes(item?.kind)) errors.push(`${path}.layers.intelligence[${i}].kind inválido`);
    if (!Array.isArray(item?.evidenceRefs) || item.evidenceRefs.length === 0) errors.push(`${path}.layers.intelligence[${i}].evidenceRefs ausente`);
    for (const ref of item?.evidenceRefs ?? []) if (!sourceIds.has(ref)) errors.push(`${path}.layers.intelligence[${i}].evidenceRefs referencia source inexistente: ${ref}`);
  }

  return errors;
}