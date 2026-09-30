# ADR-0003: Section Profiles — contratos de domínio por seção via composição

**Status**: Proposto (revisão cruzada v0.2)  
**Data**: 2026-09-30  
**Estende**: ADR-0002 (ODIN Insights vNext / Intelligence Contract 1.0)  
**Autores**: Guilherme (CEO) · Kimi (engenharia) · revisão cross-AI

## Contexto

O Intelligence Contract 1.0 é transversal e genérico: conhece `claims`, `economicLaw`, `stakeholderImplications` e `whatToWatch`, mas não define a ontologia de cada domínio. Isso permite saltos epistemológicos que o validator transversal atual não necessariamente bloquearia — por exemplo, anomalia de temperatura em Brasília convertida em tese sobre commodities, ou crescimento de market cap convertido em afirmação de adoção real.

O primeiro artefato v2 já foi promovido à produção sob o contrato atual (`public/data/insights.v2.json`, status `generated`). A geração recorrente/histórica ainda não foi operacionalizada. O momento permanece adequado para introduzir Section Profiles, desde que a compatibilidade com o artefato v2 já publicado seja preservada e testada.

A revisão do artefato publicado revelou um defeito de integridade: o snapshot continha os bytes literais `0x5C 0x6E` (`\\n`) após o `}` final. Esse defeito foi corrigido em PR separado antes da materialização deste ADR. A correção confirma a necessidade de uma checagem determinística de parsing dos artefatos JSON versionados.

## Decisão

### 1. Perfis de seção por composição sobre o contrato-base

Perfis de seção serão compostos sobre o contrato-base, preferencialmente via JSON Schema (`allOf`) quando o contrato-base estiver materializado em JSON Schema.

Hoje parte do enforcement é procedural em `scripts/insights-schema.mjs`. Portanto, este ADR decide a arquitetura — composição, validator único e regras semânticas plugáveis — e não cristaliza prematuramente o mecanismo de implementação.

A materialização do contrato-base em JSON Schema será realizada na FASE B.

### 2. Camadas com obrigatoriedade dirigida pela afirmação

O perfil declara camadas requeridas e opcionais, métricas permitidas (`metricId`), requisitos de evidência e regras semânticas.

A regra fundamental é:

> **se determinada afirmação é feita, determinadas camadas/evidências tornam-se obrigatórias.**

Não se estabelece que toda seção deva atravessar universalmente uma sequência fixa de camadas.

### 3. Regras epistemológicas são validação bloqueante, nunca apenas prompt

Regras epistemológicas de domínio serão enforcement do validator, não apenas instruções de prompt.

- **Climate**: claim de impacto em commodities, energia ou FX exige evidência compatível com TRANSMISSÃO; OBSERVAÇÃO isolada não é suficiente.
- **Digital Assets**: claim de adoção exige evidência compatível com USE_CASE/FLOWS; MARKET, por si só, não prova adoção.

Violação produz `sectionProfileValid = false` e impede `publishAllowed` no gate único existente.

O objetivo é bloquear, pelo gate, saltos epistemológicos formalizados nas regras do perfil; não se afirma que o sistema possa antecipar toda forma futura de erro epistemológico não especificada.

### 4. Validator: módulo novo, ponto de entrada único

Será criado `scripts/insights-profile-validator.mjs`.

Ele executará regras do contrato-base e regras específicas do profile, produzindo `sectionProfileValid`.

`scripts/validate-insights-shadow.mjs` continuará como ponto de entrada operacional e invocará o profile-validator, sem absorver a lógica específica de cada domínio.

Não haverá validator independente por seção.

### 5. Fixtures determinísticos em quatro classes

Cada seção terá:

- `valid.json`;
- `invalid-structure.json`;
- `invalid-semantics.json`;
- `regression-published.json`.

O último será uma cópia corrigida do artefato v2 efetivamente publicado e deverá continuar validando.

Os fixtures serão executados em CI a cada PR, sem chamada LLM e sem custo de tokens.

### 6. Piloto único: Carbon

Carbon será o primeiro Section Profile, abrangendo contrato, regras semânticas, fixtures, CI determinístico e um shadow run com Nemotron.

Climate e Digital Assets só serão replicados após o piloto validado e após o teste contrato↔frontend.

### 7. Contrato → frontend antes da replicação

Após estabilizar o Carbon Profile, será criado um teste de contrato/renderização. O fixture `valid.json` deverá ser compatível com o renderer do InsightBox sem drift estrutural.

Esse gate incorpora a lição do desalinhamento `textPt/textEn` versus `pt/en`.

A derivação completa de tipos TypeScript a partir do schema fica para a fase final.

### 8. Versionamento

`intelligenceContractVersion` continua sendo a versão semver do contrato-base.

Profiles declaram `requiresContract: ">=1.0"` e possuem `profileVersion` próprio.

O gate de publicação existente recebe `sectionProfileValid`. Não haverá gate paralelo.

Nenhum workflow novo será criado automaticamente como consequência deste ADR.

## Estrutura alvo

```text
contracts/
  intelligence-base.schema.json
  sections/
    carbon/
      profile.schema.json
      rules.mjs
      fixtures/
        valid.json
        invalid-structure.json
        invalid-semantics.json
        regression-published.json

scripts/
  insights-schema.mjs
  insights-profile-validator.mjs
  validate-insights-shadow.mjs
```

Climate e Digital Assets serão adicionados somente após o piloto Carbon e o gate contrato↔frontend.

## Alternativas consideradas e rejeitadas

- **Prompts por seção sem contrato**: prompt é orientação; contrato e validator são enforcement.
- **Contratos independentes por seção**: criariam matriz de compatibilidade, validators paralelos e maior risco de drift.
- **Evidence Graph como infraestrutura**: `evidenceRefs[]` já representa as relações de evidência necessárias; não será introduzida infraestrutura adicional nesta fase.
- **Três seções simultaneamente**: o piloto único permite validar o padrão antes de multiplicar sua superfície de manutenção.
- **Camadas universalmente obrigatórias**: criariam obrigações artificiais; a obrigatoriedade deve ser dirigida pela afirmação.
- **Validator único inchado com lógica de domínio**: o ponto de entrada permanece único, mas a lógica específica fica em módulos de profile.

## Consequências

### Positivas

- saltos epistemológicos formalmente proibidos pelo profile são bloqueados no gate de publicação;
- regressões ficam cobertas por fixtures sem custo de tokens;
- compatibilidade com o v2 publicado torna-se teste automatizado;
- nova seção passa a ser extensão modular;
- Nemotron interpreta estrutura epistemicamente restrita em vez de inventá-la;
- reduz-se o drift entre contrato, geração e renderer;
- não há nova infraestrutura de dados na FASE 1.

### Custos e riscos

- novo módulo de validação;
- camada adicional de schema/profile;
- manutenção dos fixtures;
- profiles excessivamente rígidos podem bloquear claims legítimos.

Mitigações: revisão humana dos `invalid-semantics.json`, revisão dos requisitos de evidência e registro de qualquer override manual com justificativa no `generationReport`.

### Dívida detectada e resolvida durante a revisão

O artefato `insights.v2.json` publicado continha um `\\n` literal terminal e não era aceito por `JSON.parse()`. O defeito foi corrigido em PR separado antes deste ADR.

A partir da FASE D, CI deverá tratar o parsing de todos os `public/data/*.json` publicados como invariante de integridade de artefatos.

## Fases

Cada fase é um PR próprio e possui gate humano:

**0 — Inventário do contrato atual**: separar enforcement procedural de declarativo.

**A — Este ADR**: documentar e aprovar a arquitetura.

**B — Materializar contrato-base + Carbon Profile**: criar o base JSON Schema e o primeiro profile Carbon.

**C — Rules + fixtures**: implementar regras semânticas e as quatro classes de fixtures.

**D — CI determinístico**: executar fixtures em CI e validar o parsing de todos os `public/data/*.json`.

**E — 1 shadow run Nemotron/Carbon**: validar geração contra o Carbon Profile sem promoção automática.

**F — Contract-render test**: garantir compatibilidade entre fixture/contrato e InsightBox.

**G — Clone para Climate + Digital Assets**: somente após os gates anteriores.

**H — Tipos TypeScript derivados do schema**: reduzir ainda mais o drift entre contrato e frontend.

## Reversibilidade

Cada fase é reversível isoladamente.

Profiles são aditivos ao contrato-base. Remover um profile consiste em removê-lo do registry e retirar sua implementação e fixtures, sem invalidar o contrato-base 1.0.

O contrato-base permanece válido para seções que ainda não possuam profile, permitindo migração gradual.

## Restrições permanentes

- nada em `main` sem PR aprovado;
- Earth-2 permanece intocado;
- `NVIDIA_API_KEY` permanece exclusivamente em Secrets;
- pipeline legado `insights.json` permanece preservado;
- Analytics/Observability permanece fora do escopo;
- nenhuma chamada LLM antes da FASE E;
- nenhum workflow novo é criado automaticamente por este ADR;
- nenhuma promoção automática de shadow para produção.
