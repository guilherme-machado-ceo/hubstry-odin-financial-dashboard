# Auditoria das fontes públicas (PR 2a)

Verificação em 2026-10-01. Fonte única: `src/data/dataAudit.ts` (este arquivo é um resumo). Regra: nenhum valor é marcado como verificado sem URL oficial e data. Só dados abertos; nenhuma fonte paga.

## Corrigido (4)

| Dado | Onde | Antes | Evidência | Nota |
|---|---|---|---|---|
| Volume protegido pelo TCX em 2025 | `lcBondsData.ts › tcxHedgingData[2025].annualHedged` | 3.2 | [TCX — 2025 Annual Results press release](https://www.tcxfund.com/wp-content/uploads/2026/05/PR-TCX-announces-strong-2025-annual-results.pdf) (2026-05-28) | Corrigido de US$ 3,2 bi para US$ 2,84 bi. |
| Hedge acumulado do TCX desde 2007 | `lcBondsData.ts › kpis.tcxHedgedCumulative` | $8.1B | [TCX — 2025 Annual Results press release](https://www.tcxfund.com/wp-content/uploads/2026/05/PR-TCX-announces-strong-2025-annual-results.pdf) (2026-05-28) | O KPI "hedge acumulado" mostrava US$ 8,1 bi (valor de carteira, não acumulado). Corrigido para ~US$ 20 bi. |
| Dívida Bruta do Governo Geral do Brasil (% do PIB) | `lcBondsData.ts › kpis.dividaBrutaBR; countryDebtData[Brazil].debtToGDP` | 80.4 (04/2026) | [Banco Central do Brasil — SGS 13762](https://api.bcb.gov.br/dados/serie/bcdata.sgs.13762/dados/ultimos/6?formato=json) (2026-10-01) | Atualizado para jul/2026 (82,6%). O rótulo dizia "Governo Federal"; a série é do Governo Geral. O valor de abr/2026 na própria série é 80,10 (revisado). |
| Reservas de ouro (2015–2025) e ouro como % das reservas (2025) | `goldOilData.ts › goldReserves, goldShare` | 2025: China 2353, Russia 2333, India 901, Brazil 270, Turkey 765, Poland 516 | [World Gold Council — Quarterly time series on world official gold reserves (IMF IFS data), updated Sep 2026](https://www.gold.org/goldhub/data/gold-reserves-by-country) (2026-09-30) | Série inteira (fim de cada ano, 2015–2025) refeita com uma única fonte. A maior divergência era o Brasil (270 t no repositório vs. 172,4 t). A Turquia segue o ajuste técnico documentado pelo WGC (https://www.gold.org/download/file/16208/Central-bank-stats-methodology-technical-adjustments.pdf), por isso difere de números divulgados localmente. A Rússia saiu da tabela de % das reservas porque o WGC não publica o total russo. |

## Verificado (7)

| Dado | Onde | Evidência | Nota |
|---|---|---|---|
| Volume processado pelo CIPS em 2024 | `lcBondsData.ts › kpis.cipsThroughput` | [Shanghai Municipal People's Government](https://english.shanghai.gov.cn/en-FinancialReformandInnovation/20250108/0d5502fd008549f1bb306f5ccf1ffe7a.html) (2025-01-08) | Dado de 2024. O total de 2025 ainda não foi localizado em fonte oficial. |
| Linha de swap PBOC↔BCB | `lcBondsData.ts › inflectionPoints` | [The State Council of the PRC (gov.cn)](https://english.www.gov.cn/news/202505/14/content_WS6823d9a4c6d0868f4e8f283b.html) (2025-05-14) | Valores e prazo conferem. |
| Meta de financiamento em moeda local do NDB | `lcBondsData.ts › kpis.ndbLCTarget` | [New Development Bank — General Strategy 2022–2026](https://www.ndb.int/wp-content/uploads/2022/07/NDB_StrategyDocument_Eversion-1.pdf) (2022-07-01) | A meta de 30% confere. A participação atual (25%) não foi localizada em documento oficial do NDB. |
| Volume anual protegido pelo TCX (2022 e 2023) | `lcBondsData.ts › tcxHedgingData[2022, 2023].annualHedged` | [TCX — 2022 Annual Results press release](https://www.tcxfund.com/wp-content/uploads/2023/05/PR-2022-Annual-Results_May-2023.pdf) (2023-05-01)<br>[TCX — 2023 Annual Results press release](https://www.tcxfund.com/wp-content/uploads/2024/05/TCX-2023-Annual-Results_Press-Release_May-2024.pdf) (2024-05-01) | Conferem. Os demais anos (2015–2021 e 2024) não foram verificados. |
| Moedas cobertas pelo TCX desde 2007 | `lcBondsData.ts › kpis.tcxCurrencies` | [TCX — 2025 Annual Results press release](https://www.tcxfund.com/wp-content/uploads/2026/05/PR-TCX-announces-strong-2025-annual-results.pdf) (2026-05-28) | 71 é o total acumulado desde 2007, não o número de moedas de 2025 (54). |
| Preços CBAM e marcos do regime definitivo | `public/data/sources/cbam-carbon.json` | [European Commission — Taxation and Customs Union](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en) (2026-07-06) | Governado pelo pipeline de evidências (proveniência SHA-256). Revisão prevista em 2026-10-05. |
| Eventos de Panda Bonds | `pandaBondsData.ts › PANDA_BOND_EVENTS` | [pandaBondsData.ts (per-event sources)](https://github.com/guilherme-machado-ceo/hubstry-odin-financial-dashboard/blob/main/src/data/pandaBondsData.ts) (2026-09-30) | Cada evento já tem URL e data de verificação próprias. |

## Não verificado (6)

| Dado | Onde | Evidência | Nota |
|---|---|---|---|
| Mercado de títulos em moeda local BRICS + LATAM (total e crescimento) | `lcBondsData.ts › kpis.lcBondMarketTotal, lcBondGrowthPct, bricsLatamTotal` | — | Atribuído ao BIS, mas o agregado BRICS+LATAM não é publicado pronto e o cálculo não está documentado. A queda BRICS 2024→2025 (23,2 → 21,4 tri) não tem explicação. Reconstruir a partir das estatísticas de títulos de dívida do BIS (data.bis.org) com método explícito. |
| Comércio BRICS em moeda local (45%) e série bilateral | `lcBondsData.ts › kpis.bricsTradeLCShare, bricsLatamBilateral` | — | Nenhuma fonte registrada no repositório; não há estatística oficial consolidada para o bloco. |
| Participação atual (25%) e desembolsos em moeda local do NDB (~US$ 12 bi) | `lcBondsData.ts › kpis.ndbLCShare, ndbLCDisbursed` | — | Os 25% aparecem apenas em imprensa secundária; os ~US$ 12 bi não têm fonte. Conferir no relatório anual do NDB. |
| TCX: carteira em aberto, moedas por ano e anos não verificados | `lcBondsData.ts › tcxHedgingData (portfolioOutstanding, currencies)` | — | O TCX não divulga carteira em aberto nos comunicados anuais; a série de moedas mistura contagem anual e acumulada. |
| Composição da dívida por moeda e dívida/PIB (exceto Brasil) | `lcBondsData.ts › countryDebtData` | — | Sem fonte por ponto; referências heterogêneas (Índia com dado de 2018). Refazer com FMI (WEO/GFS) e BIS. |
| Produção BRICS+ e volume em petroyuan | `goldOilData.ts › oilData (bricsProduction, petroyuanVolume)` | — | Sem fonte aberta identificada para petroyuan; será removido no PR 2c se não houver série aberta. |

## A substituir (PR 2c) (4)

| Dado | Onde | Evidência | Nota |
|---|---|---|---|
| Spreads soberanos | `lcBondsData.ts › spreadsData` | — | Fonte declarada: Bloomberg Terminal (pago), sem metodologia registrada (referência, prazo e data não documentados). Será refeito como "Spread soberano (pb)" = juro local 10 anos − Treasury 10 anos (OCDE/FRED). |
| Volatilidade cambial | `lcBondsData.ts › volatilityData, volatilityDetails` | — | Sem metodologia registrada. Será calculada a partir de câmbio diário público (BCB, FRED H.10). |
| Score de estabilidade | `lcBondsData.ts › stabilityScores` | — | Número curado sem fórmula. Sai da interface principal no PR 2c até existir um índice ODIN reproduzível. |
| Médias anuais de Brent e WTI | `goldOilData.ts › oilData (brent, wti)` | — | Atribuídas à Bloomberg. Serão substituídas pela série aberta da EIA. |

