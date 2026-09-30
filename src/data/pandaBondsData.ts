// ============================================================
// PANDA BONDS — TRACKER BRASIL ↔ CHINA (CIBM)
// Conteúdo curado com dogma de proveniência: cada item tem fonte
// com URL verificável e data de verificação. Nenhuma afirmação
// factual sem fonte. Verificado em 2026-09-30.
// ============================================================

export type PandaStatus = "issued" | "planned" | "watch";

export interface PandaBondEvent {
  id: string;
  date: string; // ISO — data do evento ou da divulgação
  status: PandaStatus; // issued = executado | planned = anunciado, não executado | watch = radar, sem confirmação
  issuer: string;
  amountCnyBn: number | null; // null = valor público ainda não definido
  titlePt: string;
  titleEn: string;
  detailPt: string;
  detailEn: string;
  source: string;
  sourceUrl: string;
  verifiedAt: string;
}

export const PANDA_BOND_EVENTS: PandaBondEvent[] = [
  {
    id: "ndb-sep-2026",
    date: "2026-09-08",
    status: "issued",
    issuer: "NDB (Banco dos BRICS)",
    amountCnyBn: 7.0,
    titlePt: "NDB precifica 2º Panda Bond de 2026: ¥7 bi com estrutura claw-back",
    titleEn: "NDB prices its 2nd Panda Bond of 2026: ¥7 bn with clawback structure",
    detailPt: "Tranche de 3 anos de ¥5,5 bi e tranche de 5 anos de ¥1,5 bi; bookbuild coberto 1,43×/1,65×, com bancos centrais e fundo soberano entre os investidores. O acumulado do NDB no mercado panda chega a ¥94,5 bi — o maior entre bancos multilaterais.",
    detailEn: "3-year tranche of ¥5.5 bn and 5-year tranche of ¥1.5 bn; bookbuild covered 1.43×/1.65×, with central banks and a sovereign fund among investors. NDB's cumulative panda bond issuance reaches ¥94.5 bn — the largest among multilateral banks.",
    source: "New Development Bank (press release oficial)",
    sourceUrl: "https://www.ndb.int/news/ndb-prices-rmb-7-bln-panda-bond-with-3-year-and-5-year-clawback-structure/",
    verifiedAt: "2026-09-30",
  },
  {
    id: "brazil-regular-borrower",
    date: "2026-08-05",
    status: "planned",
    issuer: "Brasil — Tesouro Nacional",
    amountCnyBn: null,
    titlePt: "Tesouro quer estreia soberana ainda em 2026 — e voltar todo ano",
    titleEn: "Treasury targets sovereign debut still in 2026 — and yearly returns",
    detailPt: "Francisco Segundo (subsecretário da Dívida Pública): o pedido já foi liberado pelas autoridades chinesas; restam etapas procedurais, como contratar uma agência de rating chinesa. O objetivo é emitir em 2026, sem garantia. Valor em aberto: Durigan (Reuters, jun) falou em até ¥5 bi; o secretário Daniel Leal (Bloomberg, jul) em ~¥10 bi — divergência não explicada oficialmente.",
    detailEn: "Francisco Segundo (Deputy Secretary for Public Debt): the application has been cleared by Chinese authorities; procedural steps remain, including hiring a Chinese rating agency. Goal is a 2026 issuance, not guaranteed. Amount unsettled: Durigan (Reuters, Jun) said up to ¥5 bn; Treasury Secretary Daniel Leal (Bloomberg, Jul) said ~¥10 bn — discrepancy not officially explained.",
    source: "South China Morning Post (via The Star)",
    sourceUrl: "https://www.thestar.com.my/aseanplus/aseanplus-news/2026/08/08/brazil-to-become-regular-borrower-in-china-treasury-official-says",
    verifiedAt: "2026-09-30",
  },
  {
    id: "brazil-loi",
    date: "2026-06-25",
    status: "planned",
    issuer: "Brasil — Ministério da Fazenda",
    amountCnyBn: 5.0,
    titlePt: "Brasil entrega carta de intenções à NAFMII — 1º soberano da América Latina",
    titleEn: "Brazil delivers letter of intent to NAFMII — 1st Latin American sovereign",
    detailPt: "O ministro Dario Durigan entregou a carta em Pequim, em cerimônia com o governador do PBoC, Pan Gongsheng. Plano: até ¥5 bi (~US$735 mi) — a maior estreia soberana estrangeira no mercado panda, se confirmada (a Indonésia marcou ¥7 bi em 23/jul/2026). Durigan estimou janela de 2–3 meses. ATENÇÃO: a emissão ainda NÃO ocorreu.",
    detailEn: "Finance Minister Dario Durigan delivered the letter in Beijing, at a ceremony with PBoC governor Pan Gongsheng. Plan: up to ¥5 bn (~US$735 M) — the largest foreign sovereign debut in the panda market, if confirmed (Indonesia set a ¥7 bn mark on Jul 23, 2026). Durigan estimated a 2–3 month window. NOTE: the issuance has NOT happened yet.",
    source: "Reuters",
    sourceUrl: "https://www.reuters.com/world/americas/brazil-plans-up-5-billion-yuan-panda-bond-issuance-says-finance-minister-2026-06-25/",
    verifiedAt: "2026-09-30",
  },
  {
    id: "ndb-apr-2026",
    date: "2026-04-08",
    status: "issued",
    issuer: "NDB (Banco dos BRICS)",
    amountCnyBn: 7.0,
    titlePt: "NDB emite ¥7 bi dual-tranche — 1º emissor SSA com claw-back na China",
    titleEn: "NDB issues ¥7 bn dual-tranche — first SSA issuer with claw-back in China",
    detailPt: "¥6 bi a 3 anos (cupom 1,74%) + ¥1 bi a 5 anos (1,84%), com sobressubscrição de 1,69×/2,27×. Primeiro emissor SSA (soberanos, supranacionais e agências) a usar a estrutura claw-back no mercado interbancário chinês. Acumulado à época: ¥87,5 bi.",
    detailEn: "¥6 bn 3-year (1.74% coupon) + ¥1 bn 5-year (1.84%), oversubscribed 1.69×/2.27×. First SSA (sovereigns, supranationals and agencies) issuer to use a claw-back structure in China's interbank market. Cumulative at the time: ¥87.5 bn.",
    source: "New Development Bank (press release oficial)",
    sourceUrl: "https://www.ndb.int/news/new-development-bank-successfully-issued-dual-tranche-cny-7-billion-panda-bond-with-claw-back-structure/",
    verifiedAt: "2026-09-30",
  },
  {
    id: "suzano-cumulative",
    date: "2026-08-08",
    status: "issued",
    issuer: "Suzano",
    amountCnyBn: 2.6,
    titlePt: "Suzano acumula ¥2,6 bi em 3 emissões desde 2024 — >50 bps abaixo da curva em dólar",
    titleEn: "Suzano reaches ¥2.6 bn across 3 deals since 2024 — >50 bps below its dollar curve",
    detailPt: "Emilio Yeh (CFO da Suzano Ásia): a precificação saiu mais de 50 pontos-base abaixo da curva de dólar da empresa, mesmo após o swap. Nos roadshows, investidores chineses perguntavam constantemente pelo soberano — a estreia do Tesouro criaria a curva de referência que falta para as empresas brasileiras.",
    detailEn: "Emilio Yeh (Suzano Asia CFO): pricing came in more than 50 basis points below the company's dollar curve, even after the swap. During roadshows, Chinese investors constantly asked about the sovereign — a Treasury debut would create the missing reference curve for Brazilian corporates.",
    source: "South China Morning Post (via The Star)",
    sourceUrl: "https://www.thestar.com.my/aseanplus/aseanplus-news/2026/08/08/brazil-to-become-regular-borrower-in-china-treasury-official-says",
    verifiedAt: "2026-09-30",
  },
  {
    id: "corporates-watch",
    date: "2026-08-08",
    status: "watch",
    issuer: "Vale / WEG / Petrobras",
    amountCnyBn: null,
    titlePt: "Radar corporativo: Vale, WEG e Petrobras citadas como candidatas",
    titleEn: "Corporate watch: Vale, WEG and Petrobras named as candidates",
    detailPt: "Alexandre Lowenkron (Bocom BBM): historicamente, mais de 50–60% das emissões corporativas de uma janela se concentram logo após o soberano abrir o mercado. Investidores chineses filtram por escala, rating e vínculo operacional com a China. Vale está 2 notches acima do soberano; Suzano, 1 notch; Petrobras é limitada pelo teto soberano. Nenhuma operação confirmada.",
    detailEn: "Alexandre Lowenkron (Bocom BBM): historically, over 50–60% of corporate issuances in a given window concentrate right after the sovereign opens the market. Chinese investors screen for scale, rating and operational ties to China. Vale is rated 2 notches above the sovereign; Suzano, 1 notch; Petrobras is capped at the sovereign ceiling. No deal confirmed.",
    source: "South China Morning Post (via The Star)",
    sourceUrl: "https://www.thestar.com.my/aseanplus/aseanplus-news/2026/08/08/brazil-to-become-regular-borrower-in-china-treasury-official-says",
    verifiedAt: "2026-09-30",
  },
  {
    id: "suzano-debut",
    date: "2024-11-18",
    status: "issued",
    issuer: "Suzano",
    amountCnyBn: 1.2,
    titlePt: "Suzano: 1ª corporação não-financeira das Américas a emitir Panda Bond",
    titleEn: "Suzano: first non-financial corporation from the Americas to issue Panda Bonds",
    detailPt: "¥1,2 bi (~US$165 mi), 3 anos, cupom de 2,80%, qualificada como Green Panda Bond — recursos para plantios certificados de eucalipto no Brasil. Emissão dentro de um programa NAFMII de até ¥20 bi aprovado pelo conselho em ago/2024.",
    detailEn: "¥1.2 bn (~US$165 M), 3-year, 2.80% coupon, qualified as Green Panda Bonds — proceeds allocated to certified eucalyptus plantations in Brazil. Issued under a NAFMII program of up to ¥20 bn approved by the board in Aug 2024.",
    source: "Suzano (press release oficial)",
    sourceUrl: "https://www.suzano.com.br/en/news-post/suzano-becomes-the-first-non-financial-corporation-from-the-americas-to-issue-panda-bonds-in-china",
    verifiedAt: "2026-09-30",
  },
];

export interface PandaMarketStat {
  value: string;
  labelPt: string;
  labelEn: string;
  source: string;
  sourceUrl: string;
}

export const PANDA_MARKET_STATS: PandaMarketStat[] = [
  {
    value: "¥136,5 bi",
    labelPt: "Emitidos em jan–mai/2026 — 74% de todo 2025; ano caminha para recorde (PBoC)",
    labelEn: "Issued Jan–May 2026 — 74% of all of 2025; year on track for a record (PBoC)",
    source: "PBoC, via Global Times",
    sourceUrl: "https://www.globaltimes.cn/page/202606/1364484.shtml",
  },
  {
    value: "¥7 bi",
    labelPt: "Maior estreia soberana até agora: Indonésia (23/jul/2026) — marca a ser superada pelo Brasil",
    labelEn: "Largest sovereign debut so far: Indonesia (Jul 23, 2026) — the mark Brazil aims to beat",
    source: "South China Morning Post (via The Star)",
    sourceUrl: "https://www.thestar.com.my/aseanplus/aseanplus-news/2026/08/08/brazil-to-become-regular-borrower-in-china-treasury-official-says",
  },
  {
    value: "¥94,5 bi",
    labelPt: "Acumulado do NDB (banco dos BRICS) — maior emissor multilateral do mercado panda",
    labelEn: "NDB (BRICS bank) cumulative — largest multilateral issuer in the panda market",
    source: "New Development Bank",
    sourceUrl: "https://www.ndb.int/news/ndb-prices-rmb-7-bln-panda-bond-with-3-year-and-5-year-clawback-structure/",
  },
];
