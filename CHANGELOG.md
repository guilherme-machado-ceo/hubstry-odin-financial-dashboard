# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [gate-v1.3] — 2026-09-30

### Adicionado
- **Revisão humana auditável**: `scripts/review-summary.mjs` publica no
  resumo do job shadow (`$GITHUB_STEP_SUMMARY`) o que será aprovado —
  decisão e flags do gate, bloqueios, claims (tipo, texto, evidência,
  confiança), What to Watch, implicações e evidências com hash — e o
  `shadow_run_id` a informar na promoção. Roda também quando o gate bloqueia.
- O promote exige `ODIN_REVIEWER` (no workflow: `github.actor`) e grava por
  seção `reviewedBy`, `reviewedAt` e `reviewSource`
  (`shadowRunId`, `generationRunId`); o resumo do artefato promovido fica no
  job de promoção.
- `scripts/test-review-summary.mjs` no CI de PR.

## [gate-v1.2] — 2026-09-30

### Adicionado
- **Proveniência reproduzível**: o gerador shadow grava os bytes exatos de
  cada fonte usada em `public/data/evidence/<runId>/` e calcula o SHA-256
  sobre esses bytes; `provenance.dataPath` aponta para a cópia de evidência
  (imutável por run), não para o snapshot diário sobrescrito.
- `public/data/sources/cbam-carbon.json` — fonte curada do CBAM (preços
  trimestrais, datas-chave, de minimis, `validAsOf`, `nextReviewAt`),
  versionada; os valores saem do código do gerador.
- `scripts/verify-provenance.mjs` — recalcula os hashes; `--require` no
  gate shadow e no promote; verificação do `insights.v2.json` publicado no
  CI de PR.
- Workflow shadow publica as evidências no artefato; o promote as copia
  para o repositório, verifica os hashes e as commita junto com o insight.

### Alterado
- Clima: a resposta do Open-Meteo é persistida como evidência antes do
  cálculo (antes: buscada ao vivo e descartada, hash irreprodutível).
- Blockchain: hash sobre os bytes do arquivo (antes: `JSON.stringify` do
  objeto reparseado); `asOf` do snapshot de preços vem do arquivo (antes:
  data fixa no código).

### Manutenção
- Atualização do preço do CBAM: editar `public/data/sources/cbam-carbon.json`
  (novo trimestre em `prices`, `validAsOf`, `nextReviewAt`).

## [gate-v1.1] — 2026-09-30

### Adicionado
- **Freshness no gate v2** (`checkFreshness`, validate-shadow e promote):
  `validAsOf` dentro do `maxAge` da seção (carbon 100 d, blockchain 7 d,
  climate 45 d), sem data futura, e `nextReviewAt` não vencido.
- **Carbon Section Profile em produção**: o gerador shadow emite
  `sectionProfile`, `profileVersion` e `layers` para seções com profile
  registrado, via `scripts/section-profile-builder.mjs` — camadas
  determinísticas (fontes, datas-chave, indicadores, claims), não pedidas
  ao LLM.
- Testes: gate estrito, builder e freshness em `test-insights-profiles.mjs`.

### Alterado
- `validateSectionProfile(entry, id, { strict: true })` no gate: seção com
  profile registrado **sem** profile agora bloqueia (antes passava como
  "legado"). O modo padrão, compatível com o contrato legado, fica para o
  `insights.v2.json` publicado até a próxima promoção.

### Atenção operacional
- Com os valores atuais do contexto de carbono (`validAsOf` 2026-07-06,
  `nextReviewAt` 2026-10-05), a seção carbon passa a ser bloqueada no gate
  a partir de 2026-10-05, até o dado de preço do CBAM ser atualizado.

## [insights-v3.1.0] — 2026-09-30

### Adicionado
- `scripts/evidence-consistency.mjs` — consistência claim ↔ evidência
  determinística, aplicada no gate shadow e, de novo, no promote:
  1. números e datas de claims `fact` devem existir no material de fonte,
     com normalização pt/en (`1.321`/`1321`, `22,4`/`22.4`, datas por
     extenso → ISO);
  2. datas-chave com papel semântico (`keyDates`): a data associada a um
     evento deve ser a registrada para ele (início do regime definitivo do
     CBAM ≠ prazo da primeira declaração anual);
  3. comparações recalculadas em código (`comparisons`): acima/abaixo da
     referência não é inferido pelo modelo.
- O gerador shadow grava o material de fonte (e seu SHA-256), as datas-chave
  e as comparações por seção no `generationReport.json`.
- Fixtures de regressão com os erros reais do run
  `odin-20260930-134927-df75` (devem ser bloqueadas) e com as versões
  corrigidas (devem passar); rodam no CI de PR.

### Alterado
- Contexto de carbono: vigência do regime definitivo (2026-01-01) explícita
  e distinta do prazo da primeira declaração anual (2027-09-30).
- Contexto de clima: direção das comparações calculada e declarada.
- SYSTEM prompt: regras de datas-chave e de comparações.
- `PROMPT_VERSION` 3.0.1 → 3.1.0.

### Limitações conhecidas
- Inteiros de 0 a 10 e números colados a letras (CO2, Q2) não são checados.
- Comparações são avaliadas por frase; uma frase com as duas direções passa.

## [insights-v3.0.1] — 2026-09-30

### Alterado
- Nome canônico: **ODIN = Omnibus Digital Intelligence News** (decisão de
  marca de Guilherme Gonçalves Machado). "Financial & Geoeconomic
  Intelligence" permanece apenas como descritor do produto dashboard
  ("ODIN Intelligence Dashboard"). Substitui "Open Financial & Geoeconomic
  Intelligence Platform" no SYSTEM prompt do gerador shadow e no README.
- `PROMPT_VERSION` 3.0.0 → 3.0.1 (mudança de prompt, convenção do ADR 0003).

## [insights-v3.0.0-hotfix.1] — 2026-09-30

Correção editorial manual do artefato publicado (run
`odin-20260930-134927-df75`). **Sem nova geração**: o texto foi corrigido
diretamente no `insights.v2.json`; cada seção corrigida registra
`editorialCorrection` (data, método, motivo e campos alterados).

### Corrigido
- **carbon** — o regime definitivo do CBAM (Carbon Border Adjustment
  Mechanism) vigora desde 2026-01-01; 2027-09-30 é o prazo da primeira
  declaração anual. O artefato afirmava, como `fact` de confiança alta, que
  o regime "começa em 2027-09-30". Corrigidos: texto pt/en, `claim-2`,
  item do What to Watch e implicação `corporate`.
- **climate** — comparação invertida: 1321 mm está **abaixo** da
  referência de 1550 mm (a temperatura, 22,4 °C, está acima de 21,4 °C).
  Corrigidos: texto pt/en e `clim-bsb-003`.

### Origem
MVP Readiness Gate — auditoria de 2026-09-30. Ambos os erros passaram pelo
gate atual porque `evidenceRef` existente não verifica se a evidência
sustenta o claim; a checagem determinística claim ↔ evidência entra em PR
posterior.

## [auditoria-v1.2] — 2026-07-20

### Adicionado
- `npm run insights:validate` — primeiro teste automatizado do projeto:
  valida schema e proveniência do `insights.json` (campos obrigatórios,
  formatos ISO, `runId`, `generationStatus`) e regressão editorial
  bloqueante (siglas CBAM/BRICS+/RWA expandidas na 1ª ocorrência);
  heurística anti-total derivado (RN-006) como aviso. Referências:
  RNF-010 e "testes de regressão" do dogma editorial (SPEC/SDD no Notion).
- SPEC-001 (ODIN Insights) redigida no template SDD — documento de
  gestão mantido no Notion, conforme a tabela de fontes de verdade.

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
