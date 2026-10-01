# Changelog

Todas as mudanças notáveis deste projeto são documentadas neste arquivo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [PR 1 · filtro regional e apresentação de datas] — 2026-10-01

Origem: relato do Guilherme ("o filtro de regiões não muda nada") e revisão de
UX com a IA parceira. Reproduzido no navegador: o clique funcionava, mas o
efeito era invisível no topo, parcial na Volatilidade e contraditório nas
Camadas ODIN.

### Corrigido
- **Onde o filtro age**: com BRICS/LATAM selecionado, o topo mostra "Filtro
  aplicado: Spreads · Volatilidade · Dívida · Estabilidade ↓" (links para as
  seções). Os KPIs do topo são globais.
- **Volatilidade**: a tabela de detalhes passa a obedecer ao filtro (antes só
  o ranking).
- **Dívida**: pertencimento por país, como nas demais seções — o Brasil
  sumia do filtro BRICS porque a seção usava outro critério.
- **Camadas ODIN das 4 seções filtráveis** recalculam os indicadores com o
  subconjunto da região e exibem "região: X". Regra: nenhum número aparece
  como da região sem ter sido recalculado. Antes, com BRICS, o bloco dizia
  "maior spread · Argentina".
- **KPIs do topo**: cifrão duplicado ("$~$12B", "$$8.1B").

### Alterado
- **Datas, não julgamentos**: a interface deixa de exibir "desatualizado".
  Cada fonte mostra sua data de referência; o cabeçalho do bloco mostra o
  intervalo ("referência dos dados: 2024–2026"); só fontes ao vivo têm selo.
  O frescor continua calculado no modelo (`sourceFreshness`) para governança.
- `src/data/regions.ts`: fonte única de pertencimento regional.

### Testes
- `test-section-layers.mjs`: nenhum país fora da região nos indicadores
  recalculados (falha com o comportamento antigo — verificado); rótulo de
  região; visão global sem rótulo; nenhum "desatualizado" no HTML; "ao vivo"
  nas fontes ao vivo; as 4 seções usando `inRegion`; tabela da volatilidade
  filtrada; aviso no topo.

## [M2 · camadas estruturais] — 2026-10-01

Meta do M2: camadas ODIN nas 10 seções de dados sem ODIN Insight, **sem IA**.
M1 aceito em produção por Guilherme em 01/10/2026.

### Adicionado
- `src/data/sectionLayers.ts` — registro das camadas estruturais de Hero/PTAX,
  Brasil + Panda Bonds, Tamanho do mercado, Spreads, Volatilidade, TCX,
  Composição da dívida, Estabilidade, Ouro e Petróleo: fontes e data de
  referência, frescor (curado > 180 dias = desatualizado; APIs ao vivo
  marcadas), 2 a 3 indicadores **extraídos dos mesmos módulos de dados que a
  seção exibe** (nada digitado), eventos, 1 What to Watch ligado a uma fonte da
  seção e status da lente de Direito Econômico ("não aplicável nesta edição").
  Valores bilíngues (formatação pt-BR/en-US); estimativas marcadas.
- `src/components/SectionLayers.tsx` — bloco recolhível "Camadas ODIN ·
  estruturais · sem IA", fechado por padrão, com selo quando há dado
  desatualizado. Montado no `App.tsx` abaixo de cada seção; componentes das
  seções intocados. Earth-2 fora do escopo.
- `scripts/test-section-layers.mjs` — empacota registro e componente com
  esbuild e **renderiza** os 10 blocos em PT e EN (react-dom/server): fontes,
  datas, indicadores, What to Watch, lente jurídica, bloco fechado, nenhum
  `undefined`/`NaN`, App montando cada bloco. No CI de PR (com `npm ci`).

### Corrigido
- README: Panda Bonds tem data registrada por evento (verificação set/2026);
  a célula "sem data registrada" do #38 estava errada.

## [docs · README M1] — 2026-09-30

### Alterado
- README reescrito para o estado pós-M1: nome canônico, resumo em inglês,
  status e roadmap M1–M4, mapa das 16 seções (origem do dado, fonte, data de
  referência, camadas ODIN), as 5 camadas e suas regras, pipeline governado,
  proveniência e auditoria, fontes e providers (NVIDIA Nemotron ativo;
  Huawei Cloud MaaS como provider alternativo), operação e testes.
- Corrigido: a geração não roda mais localmente nem via MaaS por padrão; o
  diretório `logs/` citado antes não existe no repositório; PTAX, petróleo e
  clima consultam APIs ao vivo no navegador (não são snapshots).
- `docs/README.md`: nota apontando para a cadeia vigente (pipeline v2).

## [M1 fechado · revisão editorial do run adef] — 2026-09-30

Revisão humana do run `odin-20260930-174643-adef` (prompt 3.3.0), promovido
por guilherme-machado-ceo (shadow `36753798426`). Correção manual sobre o
artefato promovido, sem nova geração e sem fato novo; cada seção registra
`editorialCorrection`. Após a correção: gate completo PASS contra a
evidência do próprio run; proveniência intacta.

### Corrigido
- **carbon** — tese extrapolava "estabilidade de preço" a partir de dois
  pontos (agora marcada como interpretação, sem tendência); implicação
  `corporate` invertia a direção dos pedidos de dados (são importadores da UE
  que pedem a exportadores); `investors` repetia "preço estável"; grafia de
  "de minimis" e unidade em pt.
- **blockchain** — "permanece concentrado" pressupunha série temporal; a
  participação de 64% (cálculo do modelo) passa a ≈64,5%, explicitada como
  derivada.
- **climate** — "anomalia"/"déficit" pressupunham climatologia oficial; What
  to Watch ancorado em Brasília e na cadência diária da fonte; grafia.

### Matriz de aceite M1
Carbon, Blockchain e Climate × Contexto, Tese, Direito Econômico,
Stakeholders, What to Watch: **15/15**, com evidência, proveniência e
revisão humana.

### Pauta do M2 (autonomia editorial)
Tese sempre marcada como interpretação; proibir estabilidade/tendência a
partir de dois pontos; direção dos pedidos de dados do CBAM no contexto;
cálculos derivados explicitados; cadência da fonte também no whyItMatters.

## [insights-v3.3.0 · M1 Emergency MVP Gate] — 2026-09-30

Meta do M1: 3 seções (carbon, blockchain, climate) × 5 camadas (Contexto,
Tese, Direito Econômico, Stakeholders, What to Watch) × evidência × revisão
humana. Sem novos gates, profiles ou ADRs.

### Alterado
- **What to Watch = exatamente 1 item** por seção (temporário no M1).
- **Direito Econômico com fallback `not_material`**: declaração explícita de
  não materialidade e listas vazias; `low` sem obrigação de aparato normativo.
- **Mínimo de 2 stakeholders.** Completude das 5 camadas verificada no
  retry de contrato, no gate shadow e no promote (`checkLayerCompleteness`).
- **Retry de contrato de schema** (`ai-provider.mjs`): uma única nova
  tentativa devolvendo ao modelo os erros estruturais (ex.: itens vazios do
  run c876). Nada é apagado ou corrigido localmente; se persistir, o gate
  bloqueia. Eventos `schema_retry` registrados no `generationReport`.
- **Blockchain explicitamente snapshot** no contexto, com o What to Watch
  sugerido "próxima atualização do DefiLlama" (primeira comparação temporal).
- Correção de falso positivo do `snapshot_trend` (run c876): `limitations` e
  frases com negação explícita ("não é possível inferir tendência") não
  contam como linguagem de tendência.
- `InsightBox`: rótulo para `not_material` (antes aparecia cru) e tipo de
  `limitations` alinhado ao contrato (string).
- `PROMPT_VERSION` 3.2.0 → 3.3.0.

### Adicionado
- `scripts/test-contract-render.mjs` — alinhamento contrato ↔ InsightBox
  (5 camadas com cabeçalho e campos; todo enum com rótulo). Pegou as 3
  lacunas acima no código anterior.
- `scripts/test-m1-layers.mjs` — completude, caso c876, fallback
  not_material, negação em snapshot. Ambos no CI de PR.

## [gate-v1.4.1] — 2026-09-30

### Adicionado
- Observabilidade do gate: erros do validate-shadow e do promote viram
  anotações `::error::` do GitHub Actions (9 individuais + 1 agregada) e o
  resultado do gate vira `::notice::` — legíveis pela API de check-runs, sem
  baixar logs ou artefatos (`scripts/gh-annotations.mjs`).
- Shadow bloqueado publica o artefato `odin-insights-v2-shadow-blocked`
  para diagnóstico. **Não é promovível**: o promote só baixa
  `odin-insights-v2-shadow` e revalida tudo de qualquer forma.

## [insights-v3.2.0] — 2026-09-30

### Alterado
- Prompt do gerador shadow, alinhado ao contrato editorial do gate v1.4:
  - a mensagem por seção declara **forma temporal** (`snapshot`,
    `two_points`, `window_aggregate`), **referências jurídicas disponíveis**
    (ou "nenhuma") e, para cada fonte, **o que ela publica** (registry);
  - SYSTEM prompt: Direito Econômico só com referências listadas (sem
    citar de memória; pt e en com as mesmas referências); What to Watch só
    com sinais que a fonte publica, `expectedDate` nulo salvo data do
    contexto, sem limiares nem cadência inventados; snapshot não sustenta
    tendência; proibido reproduzir instruções no texto.
- Contexto de blockchain: a amostra RWA é descrita como dado ("amostra
  parcial, não total do setor") em vez de instrução ("do not sum"), que
  vazava para o texto publicado no run 8ab9.
- `PROMPT_VERSION` 3.1.0 → 3.2.0.

## [gate-v1.4] — 2026-09-30

Origem: revisão editorial humana do run `odin-20260930-155006-8ab9`, que
passou nos gates v1.3 mas continha afirmações não rastreáveis. Cada erro
encontrado virou fixture de regressão. Princípio: **rastreabilidade à
evidência, não presença de texto**.

### Adicionado
- `contracts/sources/registry.json` — capacidades declaradas por fonte:
  o que publica (`supports`), o que não publica (`outOfScope`) e a cadência
  de cada métrica.
- `scripts/editorial-contract.mjs`, aplicado dentro da consistência
  claim ↔ evidência (gate shadow e promote):
  - **What to Watch**: `expectedDate` e datas/números do texto presentes no
    material da seção; sinal sustentável pela fonte citada (registry);
    cadência compatível com a métrica (ex.: preço do CBAM é trimestral);
  - **Economic Law**: toda norma/instituição listada corresponde a uma
    referência jurídica registrada na evidência (`legalRefs`), em qualquer
    relevância; `high` exige norma + instituição + sourceRef; menções a
    normas numeradas ou siglas regulatórias sem registro bloqueiam;
    **equivalência referencial pt ↔ en** (mesmas referências, nomes podem
    diferir);
  - **forma temporal**: fonte `snapshot` não sustenta linguagem de tendência
    (What to Watch excluído);
  - **vazamento de prompt**: instruções reproduzidas no texto bloqueiam.
- `cbam-carbon.json`: `legalReferences` (Reg. (UE) 2023/956, simplificação
  de 2025, Comissão Europeia/DG TAXUD) e `temporalShape`.
- Fixtures: `8ab9-{carbon,blockchain,climate}.fail.json` (artefato real) e
  versões corrigidas `*.pass.json`; testes unitários de falso positivo e de
  equivalência pt/en.

### Alterado
- `corrected-climate.pass.json`: What to Watch reescrito — os sinais
  originais (regiões produtoras, bacias, INMET/CPTEC) não são publicados
  pela fonte citada.

### Atenção
- O `insights.v2.json` publicado (df75 corrigido) não passaria neste
  contrato no What to Watch de clima e blockchain; será substituído na
  próxima promoção. A fonte jurídica de blockchain continua fora de escopo:
  sem `legalRefs`, a seção deve declarar normas e instituições vazias.

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
