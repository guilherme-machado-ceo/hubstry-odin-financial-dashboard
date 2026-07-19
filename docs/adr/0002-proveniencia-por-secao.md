# ADR 0002: Proveniência por seção no insights.json

- Status: aceito
- Data da decisão: 2026-07-19
- Data da documentação: 2026-07-19
- Natureza: Retrospectivo

## Contexto

Com a estratégia de merge (ADR 0004), uma run podia preservar conteúdo
gerado por uma versão antiga do prompt — mas o campo global
`promptVersion` do arquivo indicava a versão do gerador atual, fazendo
todo o conteúdo *parecer* mais novo do que era. Apontado em revisão
externa (IA) como quebra da rastreabilidade prometida pelo ODIN.

## Decisão

Cada seção passa a carregar sua própria proveniência:

- `promptVersion` — versão do prompt que gerou aquele conteúdo;
- `generatedAt` — instante da geração da seção (não da execução global);
- `generationStatus` — `generated` | `preserved_after_timeout` |
  `preserved_after_error`;
- `runId` — identificador da execução que gerou o conteúdo, presente
  também no run log (seção preservada mantém o runId original).

O `promptVersion`/`updatedAt` globais passam a significar,
respectivamente, a versão do gerador e o instante da última execução.
O InsightBox exibe o `generatedAt` da seção e uma nota visual quando o
texto foi preservado de geração anterior.

## Alternativas consideradas

- **Versionar o arquivo inteiro por run** — perde a granularidade; o
  problema era justamente por seção;
- **Proveniência só no JSON, sem UI** — rastreabilidade invisível ao
  leitor não é rastreabilidade; rejeitada.

## Consequências

- Positivas: fallback honesto (timeout não mascara origem do texto);
  compatível com formatos anteriores (campos opcionais); UI transparente;
  correlação exata log↔artefato via runId.
- Negativas: schema ligeiramente maior; exige disciplina de manter os
  campos em futuras fontes de geração.
