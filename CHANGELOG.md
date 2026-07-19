# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [auditoria-v1.1] — 2026-07-19

Rodada de refinamento da estrutura de auditoria, incorporando 11 pontos
de revisão externa (IA):

### Adicionado
- `runId` por execução e por seção, vinculando run log ↔ insights.json
  sem depender de correlação por horário (commit d4d1b4d).
- Hashes SHA-256 de entrada/saída no run log (prova de qual snapshot
  alimentou o modelo).
- Registros de falha com `latencyMs`, `errorType` e `tokens: null`
  (null = consumo indeterminado; zero só com confirmação da API).
- Rotação mensal do run log (`logs/insights-runs-AAAA-MM.jsonl`).
- `npm run insights:usage` — soma auditável do consumo de tokens
  (commit 2d2b466).
- ADRs 0001–0004 marcados como Retrospectivos, com datas de decisão e
  documentação; template ganha política de edição.

### Corrigido
- Narrativa de "imutabilidade" substituída por "registros versionados,
  identificáveis e protegidos contra alteração não controlada" (git não
  é livro-razão imutável: force push e poderes de admin existem).
- Run log reclassificado como "registro técnico de consumo reportado
  pela API" — referência de cobrança é o painel comercial.
- Label de revisão renomeada para `external-ai-review` (o revisor é uma
  IA, não um auditor humano); issues #2–#5 atualizadas.
- Bump acidental de `react-dom` revertido (commit eccba6a).

## [insights-v2.3.1] — 2026-07-19

### Adicionado
- Prompt v2.3.1: capitalização definida como "estoque de valor de mercado
  (preço × oferta)" — proibido "capital alocado/investido"; proibido
  afirmar concentração sem métrica (participação percentual, HHI).
  Origem: revisão externa (microcorreções editoriais não bloqueantes).
- Estrutura de auditoria docs-as-code: `docs/adr/` (ADRs 0001–0004
  retroativos + template), este CHANGELOG e run log com consumo de
  tokens por execução.

## [insights-v2.3] — 2026-07-19

### Adicionado
- Regra anti-soma derivada: totais só com campo de total validado no
  contexto. Origem: revisão externa — o modelo somou os 3 maiores RWA
  (US$ 9,3 bi) e apresentou como total do setor (lista tem 8).
- Contexto blockchain: amostra RWA rotulada como parcial ("3 de N,
  não totalize").
- Filtro `SECTIONS` para regeneração direcionada (ADR 0004).

## [insights-v2.2] — 2026-07-19

### Adicionado
- Proveniência por seção: `promptVersion`, `generatedAt`,
  `generationStatus` (ADR 0002); InsightBox exibe "Gerado em" da seção e
  nota de texto preservado (i18n `insight.preserved`).
- Calibragem de confiança: inferência econômica não medida nos dados →
  `interpretation` nunca `high`. Origem: revisão externa.
- Hedge obrigatório em efeitos econômicos ("pode elevar/afetar").
- Framing legal do CBAM: obrigação de declarar é do importador
  autorizado na UE; exportador brasileiro pressionado indiretamente.

### Corrigido
- Removida chave espúria `precipAnomaly` do i18n EN (commit 93e74ea).

## [insights-v2.1] — 2026-07-19

### Corrigido
- Siglas com formato literal obrigatório na 1ª ocorrência (CBAM, BRICS+,
  RWA) — o modelo ignorava a regra genérica de nomenclatura.

## [insights-v2.0] — 2026-07-19

### Adicionado
- Schema v2 por seção: `dataAsOf`, `freshness` (fresh/stale por
  `maxAge`), `confidence` estruturada `{data, interpretation}`.
- Contexto carbono com `currentPeriod/currentPrice` — insight lidera com
  o dado vigente (antes citava Q1 em vez de Q2; revisão externa).
- Nota metodológica do score climático (`climate.scoreNote`) e rótulo de
  fuso horário nos timestamps (`formatUpdatedAt` com `timeZoneName`).

### Corrigido
- Removido argumento de emissões per capita do contexto CBAM (falácia
  ecológica: o mecanismo incide sobre emissões embutidas por
  produto/instalação — revisão externa).

## [insights-v1.x] — 2026-07-19

### Adicionado
- ODIN Insights: geração local via MaaS (ADR 0001) →
  `public/data/insights.json` → InsightBox nas seções carbon,
  blockchain e climate; selo "IA assistida · não revisado por analista".
- Merge com preservação de seções em caso de falha (ADR 0004) e timeout
  Open-Meteo ampliado para 30 s.

### Corrigido
- Limiar de minimis CBAM: anual e agregado por importador (o primeiro
  texto dizia "por produto" — erro factual).
- Timeout de uma seção não apaga mais as demais (perda do clima v1).
