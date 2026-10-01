# ODIN Data & Intelligence Contract v1.1

- Status: **congelado** para o M3 (aprovado por Guilherme e pela IA parceira em 01/10/2026)
- Versão: 1.1 (`intelligenceContractVersion: "1.1"`)
- Substitui: [v1.0](odin-intelligence-contract-v1.md) para novas gerações; o conteúdo M1 já publicado (v1.0) continua válido
- Regras executáveis: [`scripts/contract-v11.mjs`](../scripts/contract-v11.mjs) · testes: [`scripts/test-contract-v11.mjs`](../scripts/test-contract-v11.mjs) · fixtures: [`contracts/contract-v1.1/`](../contracts/contract-v1.1/)

Este documento fixa o contrato **antes** de o M3 gerar conteúdo, para que a lente Founder/CEO seja produzida dentro dele e não o redesenhe. Em caso de divergência entre texto e código, prevalece o código testado, e o texto é corrigido no mesmo PR.

## 1. Cadeia epistemológica

```
SOURCE
  ↓
DATA            verification × derivation
  ↓
(EVENT)         opcional
  ↓
CLAIM           evidenceRefs → DATA · eventRefs → EVENT (se houver)
  ↓
CONTEXT
  ↓
INTERPRETATION
  ↓
DECISION LENS   Founder / CEO
```

Nenhum nível posterior serve de evidência para o anterior. A DECISION LENS **não é camada factual**: consome DATA, CLAIM, CONTEXT e INTERPRETATION e produz implicação contextual.

## 2. DATA — procedência em dois eixos

Toda entrada de `provenance[]` declara, além de `sourceId`, `sourceUrl`, `asOf`, `dataPath`, `metricId` e `hash` (v1.0):

| Campo | Valores | Pergunta |
|---|---|---|
| `verification` | `verified` · `unverified` | O valor confere com a fonte citada? |
| `derivation` | `direct` · `transformed` · `derived` · `estimated` | O que foi feito com o valor da fonte? |

- `direct`: como publicado (ex.: PTAX, Brent diário).
- `transformed`: troca de unidade, moeda ou escala.
- `derived`: calculado a partir de dados de fonte (ex.: diferencial de juros, volatilidade anualizada, média anual).
- `estimated`: sem observação direta.

Os dois eixos são independentes: "spread soberano → verified + derived" e "PTAX → verified + direct" são distinguíveis. Os mesmos eixos já são obrigatórios em todo indicador das camadas "Fontes e sinais" (`src/data/sectionLayers.ts`, PR 2c), e o modelo os recebe estruturados, sem inferi-los do texto.

## 3. EVENT (opcional)

Relações válidas: `CLAIM → DATA` ou `CLAIM → EVENT → DATA`. Fontes de snapshot (ex.: clima, stablecoins) não precisam de evento, e o contrato **não** induz eventos artificiais.

Quando existir, `events[]` traz `{ id, date, labelPt, labelEn, dataRefs[] }`:

- `date` em `YYYY-MM-DD` e presente no material de evidência da seção;
- `dataRefs` não vazio e contido na provenance;
- `claims[].eventRefs`, quando usado, aponta para eventos existentes.

## 4. CLAIM, CONTEXT, INTERPRETATION

Sem mudança em relação à v1.0: `fact | interpretation | hypothesis`, `evidenceRefs` obrigatórios para fato, confiança de dado e de interpretação separadas, consistência claim ↔ evidência determinística (números, datas, datas-chave, comparações).

## 5. What to Watch bilíngue (gerado pela IA)

Cada item:

```json
{
  "signalPt": "…",
  "signalEn": "…",
  "whyItMattersPt": "…",
  "whyItMattersEn": "…",
  "sourceId": "source-…",
  "expectedDate": "YYYY-MM-DD | null"
}
```

- Os dois idiomas nascem na geração; o frontend **não traduz** (a regra do Briefing proíbe texto novo no frontend).
- `sourceId` pertence à provenance; `expectedDate` é explícito (`null` quando não houver).
- `signalEn` idêntico a `signalPt` é bloqueado.
- As regras editoriais da v1.0 (data e número presentes no material, escopo e cadência da fonte) valem para os dois idiomas.

## 6. DECISION LENS — Founder/CEO

```json
"decisionLens": {
  "lens": "founder_ceo",
  "implications": [
    { "textPt": "…", "textEn": "…", "claimRefs": ["claim-1"] }
  ]
}
```

- Uma única lente nesta versão (`founder_ceo`), com 1 a 3 implicações.
- Cada implicação cita ao menos um claim existente (`claimRefs`).
- **Sem fato novo**: todo número e toda data da implicação existem no material de evidência ou nos claims citados.
- **Sem fonte nova**: nenhuma URL; nenhuma fonte registrada fora da provenance da seção.
- **Sem causalidade nova**: conectivo causal ("porque", "devido a", "leva a", "because", "due to", "drives"…) só é aceito se um claim citado já contém relação causal.
- **Implicação contextual, nunca recomendação** (seção 7).

Exemplo aceito: "Empresas expostas ao câmbio podem precisar acompanhar a volatilidade."
Exemplo bloqueado: "Empresas expostas ao câmbio devem reduzir sua exposição."

## 7. Linguagem de recomendação (bloqueio determinístico)

Aplica-se à DECISION LENS e às Implicações para Stakeholders. O bloqueio é por **padrão**, não por palavra solta:

| Regra | Padrão | Bloqueia | Não bloqueia |
|---|---|---|---|
| R1 | deôntico + verbo de ação | "devem reduzir", "should hedge", "podem precisar reduzir" | "podem precisar acompanhar", "devem avaliar"; obrigação jurídica descrita ("importadores autorizados devem apresentar a declaração") |
| R2 | ato de fala de recomendação | "recomendamos", "sugere-se", "it is advisable" | — |
| R3 | frase iniciada por imperativo/infinitivo de ação | "Invista…", "Explorar oportunidades…", "Consider shifting…" | "Monitorar…", "Avaliar a exposição…" |
| R4 | modal de possibilidade + verbo de oportunidade/transação | "podem investir", "could tap" | "pode entrar em vigor", "may enter into force" |

Verbos de acompanhamento/análise (acompanhar, monitorar, observar, avaliar, verificar, mapear; track, monitor, watch, follow, assess, review) caracterizam implicação contextual. As fixtures de aprovação e bloqueio (PT e EN) ficam em `contracts/contract-v1.1/recommendation-fixtures.json`; frase nova que gere falso positivo ou falso negativo entra como fixture antes do ajuste da regra.

## 8. Correção editorial pós-revisão

`editorialCorrection.changes[] = { field, kind: "wording" | "structural", reason }`.

- `wording`: redação, grafia, concordância — permitido e registrado.
- `structural`: qualquer mudança em campo contratual (`claims`, `provenance`, `events`, `evidenceRefs`, `eventRefs`, `claimRefs`, `whatToWatch.sourceId`, `whatToWatch.expectedDate`, `economicLaw.relevance/norms/institutions/sourceRefs`, `confidence`, `validAsOf`, `decisionLens.lens`, `decisionLens.implications.claimRefs`).
- Mudança em campo contratual classificada como `wording` é bloqueada.

## 9. Critérios de aceite do M3

1. **Sem correção editorial estrutural**: as três seções promovidas na mesma rodada com `structuralCorrectionCount = 0`.
2. **Teste dos 3 minutos — CI**: cada item do Briefing responde às 4 perguntas — o que mudou (fato com evidência), por que importa (lente), o que acompanhar (What to Watch PT/EN) e de onde veio (fonte com link).
3. **Teste dos 3 minutos — humano**: Guilherme + 2 a 3 pessoas do ICP (founders/CEOs de startups e PMEs), cronometradas; passa se ≥ 2 de 3 respondem corretamente ≥ 3 das 4 perguntas.

## 10. Gate

O shadow gate e a promoção aceitam `intelligenceContractVersion` 1.0 e 1.1. Para entradas 1.1, `contractV11Valid` (todas as regras deste documento) entra no `publishAllowed`, no `generationReport.validation` e no resumo de revisão.

## 11. Fora do escopo desta versão

Outras lentes (PME, governo, investidor), recomendação financeira, aconselhamento jurídico, persuasão política, e o diferencial de juros do Brasil (aguarda análise de equivalência Tesouro Nacional/ANBIMA).
