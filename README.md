# ODIN — Financial Intelligence Dashboard

Dashboard de inteligência financeira **BRICS+**: mercado de títulos em moeda local (LC Bonds), ouro, petróleo, precificação de carbono (CBAM), ativos digitais e vetor climático — com análises editoriais assistidas por IA e trilha de auditoria versionada no próprio repositório.

**Produção:** https://hubstry-odin-financial-dashboard.vercel.app

## Visão geral

O ODIN acompanha a transição do sistema financeiro global de um modelo centrado no dólar para um sistema multipolar — moedas locais, ouro e infraestrutura própria (CIPS, NDB, Bond Connect) — reunindo dados estáticos curados e snapshots diários de APIs abertas em 16 seções analíticas, com leitura editorial gerada por IA em três delas.

O projeto é **docs-as-code**: decisões de arquitetura (ADRs), mudanças (CHANGELOG), execuções do gerador de IA (run logs) e revisões externas (issues rotuladas) ficam versionados junto ao código, formando uma cadeia de auditoria ponta a ponta — decisão → mudança → execução → deploy → revisão.

## Funcionalidades

- **16 seções analíticas** — LC Bonds BRICS + LATAM, spreads e volatilidade cambial G20, hedge TCX, composição de dívida ML/ME, reservas de ouro, vetor petróleo, precificação de carbono e CBAM, blockchain e RWAs, vetor climático e notícias financeiras em tempo real;
- **ODIN Insights** — análise editorial por seção gerada via MaaS (Huawei Cloud), com proveniência por seção (`promptVersion`, `generatedAt`, `generationStatus`, `runId`), confiança estruturada (dados vs. interpretação) e selo de transparência "IA assistida · não revisado por analista";
- **i18n PT/EN** com arquitetura ZH-ready e dogma editorial de siglas expandidas na primeira ocorrência;
- **Exportação** PNG/PDF/JSON por gráfico, widget de incorporação (embed) por seção e overlays de fonte primária com metodologia.

## Fontes de dados

| Fonte | Uso | Chave |
|-------|-----|-------|
| BCB SGS (série 10813) | Ptax BRL/USD | não |
| Yahoo Finance | Brent/WTI | não |
| Open-Meteo | Anomalias climáticas | não |
| DefiLlama | Cripto, stablecoins, RWA/TVL | não |
| Our World in Data / Global Carbon Project | CO₂ por consumo | não |
| Google News RSS | Notícias financeiras | não |
| MaaS (Huawei Cloud/Digiti, LiteLLM) | Geração dos ODIN Insights | sim (apenas local, nunca no browser) |

Snapshots diários em `public/data/*.json`; a coleta e a geração de insights rodam localmente (`scripts/`).

## Documentação e auditoria

- `docs/README.md` — cadeia de auditoria e convenções;
- `docs/adr/` — Architecture Decision Records (0001–0004 + template);
- `CHANGELOG.md` — histórico de mudanças (Keep a Changelog);
- `logs/insights-runs-AAAA-MM.jsonl` — registro técnico de execuções do gerador (tokens, latência, hashes SHA-256, runId), com rotação mensal;
- Issues rotuladas por origem da revisão (`external-ai-review`, `human-review`, …) e Releases por milestone.

## Desenvolvimento

```bash
npm install
npm run dev        # ambiente local (Vite)
npm run build      # build de produção (tsc + vite)

# ODIN Insights (geração local, chave apenas em variável de ambiente)
MAAS_KEY="sua_chave" node scripts/generate-insights.mjs
npm run insights:usage   # consumo acumulado de tokens (run logs)
```

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS · Recharts · html2canvas + jsPDF · i18n próprio (PT/EN, ZH-ready)

## Deploy

Integração nativa GitHub → Vercel: todo push na branch `main` dispara build e deploy automático — sem dependência de GitHub Actions.

## Licença

AGPL-3.0 © 2026 Hubstry Deep Tech · Overall 720°

> Valores aproximados. Verificar contra fontes primárias antes de publicar ou tomar decisão de investimento. Este dashboard é para fins educativos e de análise geopolítica; não constitui recomendação financeira.
