// ODIN — anotações do GitHub Actions para o gate.
// Erros do gate viram `::error::` e o resumo vira `::notice::`, legíveis pela
// API de check-runs (annotations) sem baixar logs ou artefatos. Fora do
// Actions, não imprime nada.
// Limite do GitHub: 10 anotações de erro por step — as 9 primeiras saem
// individualmente e a última agrega todas.
const escape = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const inActions = () => process.env.GITHUB_ACTIONS === "true";

export function annotateErrors(title, errors) {
  if (!inActions() || !errors.length) return;
  for (const e of errors.slice(0, 9)) console.log(`::error title=${escape(title)}::${escape(e)}`);
  console.log(`::error title=${escape(`${title} — todos (${errors.length})`)}::${escape(errors.join(" | "))}`);
}

export function annotateNotice(title, message) {
  if (!inActions()) return;
  console.log(`::notice title=${escape(title)}::${escape(message)}`);
}
