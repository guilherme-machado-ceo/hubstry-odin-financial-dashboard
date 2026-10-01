# ODIN — Omnibus Digital Intelligence News

<p align="center">
  <a href="https://hubstry.dev">
    <img src="public/brand/hubstry-logo-chip.png" alt="Hubstry Deep Tech" width="320" />
  </a>
</p>

**ODIN Intelligence Dashboard** — inteligência financeira e geoeconômica. Da informação pública ao contexto de decisão.

**Produção:** https://hubstry-odin-financial-dashboard.vercel.app

> **English summary.** ODIN (Omnibus Digital Intelligence News) is Hubstry Deep Tech's intelligence line. This repository hosts the ODIN Intelligence Dashboard: 16 sections on local-currency bonds, gold, oil, carbon pricing (CBAM), digital assets and climate, built from curated public sources and daily API snapshots. In three sections (Carbon, Blockchain, Climate), a governed AI pipeline adds five intelligence layers — Strategic Context, ODIN Thesis, Economic Law lens, Stakeholder Implications and What to Watch — generated in shadow mode, checked by deterministic gates (contract, freshness, claim-to-evidence consistency, hash-verified provenance) and published only after human review. Milestone M1 (3 sections × 5 layers, evidence-backed, human-reviewed) is complete. Not financial, investment or legal advice.

---

## Visão geral

O ODIN acompanha a transição do sistema financeiro global de um modelo centrado no dólar para um arranjo multipolar — moedas locais, ouro e infraestrutura própria (CIPS — Cross-Border Interbank Payment System, sistema chinês de pagamentos interbancários; NDB — New Development Bank, banco do BRICS; Bond Connect) — e os vetores que o atravessam: precificação de carbono, ativos digitais e clima.

O dashboard combina dois tipos de conteúdo:

- **Dados e indicadores** — 16 seções com séries curadas de fontes primárias, snapshots diários e consultas ao vivo a APIs abertas;
- **Camadas de inteligência ODIN** — em três seções, leitura editorial gerada por IA sob contrato, com evidência rastreável e revisão humana antes da publicação.

O projeto é *docs-as-code*: decisões (ADRs — Architecture Decision Records), mudanças (CHANGELOG), contratos, fixtures de regressão e evidências de cada geração ficam versionados junto ao código.

## Status

| Marco | Escopo | Situação |
|---|---|---|
| **M1 — Emergency MVP Gate** | Carbono, Blockchain e Clima × 5 camadas, com evidência, proveniência e revisão humana | **Concluído** (15/15; run `odin-20260930-174643-adef`; em produção desde 01/10/2026) |
| **M2 — Camadas estruturais** | Fontes, data de referência e frescor, indicadores, eventos, What to Watch e status da lente jurídica nas 10 demais seções de dados, sem IA | **Concluído** |
| M3 — Autonomia editorial | O modelo produz as 5 camadas de forma consistente, sem correção manual; section profiles de Blockchain e Clima | Planejado |
| M4 — Escala | Mais seções com IA, providers, automação e monitoramento | Planejado |

## As 16 seções

| Seção | Origem do dado | Fonte principal | Referência | Camadas ODIN |
|---|---|---|---|---|
| Banner de contexto | curado estático | Hubstry (editorial) | — | — |
| Notícias | snapshot diário | Google News RSS | diária | — |
| Hero · PTAX | API ao vivo no navegador | BCB — Banco Central do Brasil (SGS 10813) | ao vivo | estruturais |
| Brasil em foco · Panda Bonds | curado estático | BCB; Ministério da Fazenda; Reuters | Panda set/2026 · BCB jun/2025 | estruturais |
| Tamanho do mercado LC | curado estático | BIS — Bank for International Settlements | dez/2024 | estruturais |
| Spreads | curado estático | Bloomberg | jan/2025 | estruturais |
| Volatilidade cambial | curado estático | Bloomberg | jan/2025 | estruturais |
| Hedge TCX | curado estático | TCX — The Currency Exchange Fund | jan/2025 | estruturais |
| Composição da dívida | curado estático | IMF WEO — World Economic Outlook | out/2024 | estruturais |
| Estabilidade | curado estático | IMF WEO | out/2024 | estruturais |
| Reservas de ouro | curado estático | IMF WEO | out/2024 | estruturais |
| Vetor petróleo | curado + API ao vivo no navegador | Bloomberg; Yahoo Finance | jan/2025 · ao vivo | estruturais |
| Vetor climático | API ao vivo no navegador | Open-Meteo | ao vivo | **M1** |
| Previsão Earth-2 | snapshot 2×/dia | NVIDIA Earth-2 (FourCastNet) | 2×/dia | fora do escopo |
| Precificação de carbono | fonte curada versionada + snapshot | Comissão Europeia (CBAM); OWID; Banco Mundial | jul/2026 | **M1** |
| Blockchain e RWA | snapshot diário + API ao vivo | DefiLlama; mempool.space | diária | **M1** |

A coluna "Referência" reproduz a data registrada em `sourceRefs` (`src/data/lcBondsData.ts`) e, para Panda Bonds, a data de verificação dos eventos (`src/data/pandaBondsData.ts`). **Camadas ODIN:** "M1" = 5 camadas de inteligência (IA sob contrato + revisão humana); "estruturais" = bloco recolhível sem IA com fontes, data e frescor, indicadores extraídos dos dados da seção, eventos, What to Watch e status da lente jurídica (`src/data/sectionLayers.ts`). Dado curado com mais de 180 dias aparece como **desatualizado**; a atualização desses dados é trabalho de conteúdo separado.

## As cinco camadas de inteligência

| Camada | O que entrega | Regra |
|---|---|---|
| **Contexto Estratégico** | O que os dados dizem e por que importam | Só números e datas presentes na evidência |
| **Tese ODIN** | Interpretação derivada dos dados | Marcada como interpretação; sem tendência a partir de *snapshot* ou de dois pontos |
| **Direito Econômico** | Relevância jurídico-institucional (`high`, `medium`, `low`, `not_material`) | Normas e instituições só se registradas na evidência da seção; `not_material` declara a ausência de incidência |
| **Stakeholders** | Implicações para governo, empresas, investidores e startups (mínimo 2) | Sem recomendação de compra, venda ou escolha política |
| **What to Watch** | Um sinal monitorável (M1) | A fonte citada precisa publicar o sinal; data apenas se estiver na evidência |

Cada afirmação é classificada como **fato**, **interpretação** ou **hipótese**, com referência à evidência que a sustenta (contrato em `docs/odin-intelligence-contract-v1.md`).

## Pipeline de inteligência governada

```text
fontes versionadas + snapshots
        ↓
gerador shadow (GitHub Actions, disparo manual)
        ↓  cópia exata das fontes em public/data/evidence/<runId>/
LLM → JSON sob contrato  ──(schema inválido)──→ 1 retry de contrato
        ↓
gate determinístico
  · contrato e completude das 5 camadas
  · section profile (Carbono)
  · freshness (idade máxima por seção; revisão vencida bloqueia)
  · consistência claim ↔ evidência (números, datas, datas-chave, comparações)
  · contrato editorial (What to Watch, Direito Econômico, snapshot, vazamento de prompt)
  · proveniência reproduzível (SHA-256 dos arquivos de evidência)
        ↓
resumo de revisão no Actions (claims, evidências, bloqueios)
        ↓
revisão humana → promoção manual (workflow com aprovação explícita)
        ↓
public/data/insights.v2.json + evidências do run → main → deploy
```

O que **não** é automático: a geração (disparo manual), a revisão e a promoção. O LLM não escreve a estrutura epistemológica: camadas de *profile*, datas-chave e comparações são calculadas em código.

## Proveniência e auditoria

- **Evidência por run** — `public/data/evidence/<runId>/` guarda os bytes exatos usados na geração; `provenance[].hash` é o SHA-256 desses arquivos. Verificação: `node scripts/verify-provenance.mjs public/data/insights.v2.json --require`.
- **Revisão com autoria** — cada seção promovida registra `reviewedBy` (conta do GitHub que aprovou), `reviewedAt` e `reviewSource` (run shadow e run de geração). O status fica no artefato; a interface ainda não o exibe.
- **Correções editoriais** — ajustes manuais pós-promoção ficam registrados em `editorialCorrection` (data, motivo, campos), sem regenerar nem alterar a evidência.
- **Telemetria** — `generationReport.json` de cada run (artefato do Actions): provider, modelo, tokens, latência, retries e resultado do gate; erros do gate também aparecem como anotações do Actions.
- **Regressão** — erros reais de runs anteriores viram fixtures em `contracts/consistency/fixtures/` e precisam continuar bloqueados.
- **Registro de decisões** — `docs/adr/`, `docs/odin-intelligence-contract-v1.md`, `CHANGELOG.md`; issues rotuladas por origem da revisão (ex.: `external-ai-review`).

## Fontes e providers

| Fonte | Uso | Acesso |
|---|---|---|
| Comissão Europeia — CBAM (DG TAXUD) | Preço trimestral, marcos regulatórios, referências jurídicas | curadoria manual em `public/data/sources/cbam-carbon.json` |
| DefiLlama | Stablecoins, RWA/TVL, preços de criptoativos | snapshot diário (`main.yml`), sem chave |
| mempool.space | Taxas on-chain do Bitcoin | ao vivo, sem chave |
| Open-Meteo | Temperatura e precipitação (Brasília) | ao vivo e na geração, sem chave |
| BCB SGS 10813 | PTAX BRL/USD | ao vivo, sem chave |
| Yahoo Finance | Brent/WTI | ao vivo, sem chave |
| Our World in Data / Global Carbon Project | CO₂ por consumo | snapshot diário, sem chave |
| Google News RSS | Notícias | snapshot diário, sem chave |
| BIS, IMF WEO, CEPAL, NDB, CIPS, TCX, Bloomberg | Séries de títulos, dívida, ouro, câmbio | curadoria manual em `src/data/*.ts` |
| NVIDIA Earth-2 (FourCastNet NIM) | Previsão meteorológica | snapshot 2×/dia, chave em *secrets* |
| **NVIDIA — Nemotron** | Geração das camadas ODIN (provider ativo) | API, chave em *secrets* do Actions |
| **Huawei Cloud MaaS** (Model as a Service, via Digiti) | Provider alternativo configurado (`AI_PROVIDER=maas`) | API, chave em variável de ambiente |

Nenhuma chave de API é exposta no navegador.

## Operação

**Gerar e publicar camadas ODIN**
1. Actions → **ODIN Insights Shadow** → *Run workflow*.
2. Ler o resumo do job (claims, evidências, decisão do gate). Em bloqueio, o motivo aparece nas anotações e no artefato `odin-insights-v2-shadow-blocked`.
3. Se aprovado: Actions → **ODIN Insights Controlled Promotion** → `shadow_run_id` do passo 1, `approve = true`. A conta que dispara fica registrada como revisora.

**Atualizar o preço do CBAM** — editar `public/data/sources/cbam-carbon.json` (novo trimestre em `prices`, `validAsOf`, `nextReviewAt`). O gate bloqueia a seção de carbono quando `nextReviewAt` vence ou o dado passa de 100 dias.

**Deploy** — integração GitHub → Vercel: cada push na `main` publica; cada PR gera *preview*. O plano atual tem limite diário de deploys; agrupar mudanças evita esgotá-lo.

## Desenvolvimento

```bash
npm install
npm run dev          # ambiente local (Vite)
npm run build        # build de produção (tsc + vite)

# testes determinísticos (rodam no CI de PR, sem chamada a LLM)
node scripts/test-insights-profiles.mjs     # section profiles, freshness, gate estrito
node scripts/test-evidence-consistency.mjs  # claim ↔ evidência e contrato editorial
node scripts/test-m1-layers.mjs             # 5 camadas, retry de contrato, snapshot
node scripts/test-contract-render.mjs       # contrato ↔ InsightBox
node scripts/test-review-summary.mjs        # resumo de revisão
node scripts/test-section-layers.mjs        # camadas estruturais M2 (render PT/EN; requer npm install)
```

**Stack:** React 19 · TypeScript (strict) · Vite · Tailwind CSS · Recharts · html2canvas + jsPDF · i18n próprio (PT/EN).

## O que o ODIN não é

Não é terminal financeiro, plataforma de *trading*, recomendação de investimento, previsão de mercado, parecer jurídico nem chatbot. A lente de Direito Econômico é analítica; as implicações para stakeholders são contexto, não recomendação.

## Licença

AGPL-3.0 © 2026 Hubstry Deep Tech · Overall 720°

> Verificar valores contra as fontes primárias antes de publicar ou decidir. Conteúdo para fins de análise econômica e geopolítica; não constitui recomendação financeira, de investimento ou jurídica.
