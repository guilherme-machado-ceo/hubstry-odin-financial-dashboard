# ODIN Financial Dashboard v2.4

**Dashboard de Inteligencia Financeira BRICS+** — LC Bonds, Ouro, Petroleo, Clima e Noticias em tempo real.

## Deploy ao vivo
- **Kimi Page**: https://zql5spkdoior4.kimi.page
- **GitHub**: https://github.com/guilherme-machado-ceo/hubstry-odin-financial-dashboard

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS (Cyber Noir theme)
- Recharts (visualizacao de dados)
- html2canvas + jsPDF (export PNG/PDF)
- i18n custom (PT/EN toggle, ZH-ready)

## APIs sem chave utilizadas
| API | Proposito |
|-----|-----------|
| BCB SGS (serie 10813) | Ptax BRL/USD ao vivo |
| Yahoo Finance | Cotacoes de petroleo Brent/WTI (BZ=F, CL=F) |
| Open-Meteo | Dados climaticos e anomalias de temperatura |
| Google News RSS + allorigins.win | Noticias financeiras via proxy CORS |

## 14 Secoes do Dashboard
1. **ContextBanner** — Manchete geopolitica do Panda Bond BR em CNY
2. **NewsTicker** — Noticias financeiras RSS em tempo real (sem API key)
3. **HeroSection** — KPIs com BRL/USD Ptax LIVE, filtro de regiao (BRICS/LATAM)
4. **BrazilSpotlight** — Panda Bond, NDB progress bar, fluxograma CIPS
5. **MarketSizeChart** — BRICS + LATAM LC Bonds 2015-2025
6. **SpreadsTable** — Diferenciais de taxa vs volatilidade FX (9 paises)
7. **VolatilityChart** — Ranking G20 de volatilidade cambial
8. **TCXChart** — Hedging de moeda local (71 moedas)
9. **DebtComposition** — Divida ML vs ME com Debt-to-GDP
10. **StabilityScatter** — Estabilidade economica vs participacao ML
11. **GoldReservesChart** — Reservas de ouro BRICS+ (2015-2025) + % nas reservas
12. **OilVectorChart** — Brent, WTI, producao BRICS+, petroyuan (dados ao vivo)
13. **ClimateVectorChart** — Anomalias climaticas BRICS+ (Open-Meteo, sem chave)
14. **Footer** — Fontes primarias, disclaimer Hubstry/Overall 720°

## Deploy na Vercel (zero CI/CD)

Como seu GitHub Actions esta bloqueado, a Vercel e a alternativa mais simples:

### Opcao A: Deploy via CLI (recomendado)
```bash
# 1. Instale a Vercel CLI
npm i -g vercel

# 2. Login (abre navegador para auth)
vercel login

# 3. Deploy (na raiz do projeto)
cd /caminho/para/hubstry-odin-financial-dashboard
vercel --prod

# Pronto! URL gerada automaticamente
```

### Opcao B: Deploy via Git (integracao nativa)
1. Acesse https://vercel.com/new
2. Importe o repositorio `guilherme-machado-ceo/hubstry-odin-financial-dashboard`
3. Framework Preset: **Vite**
4. Deploy!

A Vercel faz deploy automatico a cada `git push` para `main` — sem precisar de GitHub Actions.

### Opcao C: Deploy manual (drag & drop)
1. Rode `npm run build` localmente
2. Acesse https://vercel.com/new
3. Selecione a pasta `dist/`
4. Deploy!

## Recursos
- Export PNG/PDF/JSON por grafico
- Toggle PT/EN com arquitetura ZH-ready
- Embed widget por secao
- Scroll-reveal animations
- Source links com overlay de metodologia
- Dogma editorial: siglas expandidas na 1a ocorrencia

## License
AGPL-3.0 © 2026 Hubstry Deep Tech · Overall 720°
