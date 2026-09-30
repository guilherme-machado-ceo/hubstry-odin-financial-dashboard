# ADR 0002: ODIN Insights vNext — Intelligence Contract, Provider Abstraction e NVIDIA

- Status: aprovado para implementação
- Data da decisão: 2026-09-30
- Natureza: evolução arquitetural
- Supersedes: ADR 0001 para a execução operacional do ODIN Insights

## Contexto

O ODIN Insights foi originalmente implementado para geração local via MaaS porque o GitHub Actions estava bloqueado. O estado atual do repositório já possui geração, logs, freshness, confidence e preservação de snapshots anteriores, mas o contrato editorial ainda é limitado a texto curto por seção.

A evolução aprovada transforma o Insight em uma camada de inteligência transversal, preservando o dashboard e introduzindo contexto estratégico, tese, lente de Direito Econômico, stakeholders e sinais a observar.

O provider também será migrado de forma reversível para NVIDIA, sem alterar o Earth-2.

## Decisão

Adotar:

1. ODIN Intelligence Contract v1;
2. schema v2 versionado;
3. claims semânticas fact/interpretation/hypothesis;
4. provenance mínima endereçável;
5. provider adapter com `AI_PROVIDER=maas|nvidia`;
6. NVIDIA Nemotron 3 Super 120B-A12B como candidato operacional para smoke/shadow;
7. shadow generation antes da promoção;
8. generation gate bloqueante;
9. frontend com um acordeão-mãe ODIN Insight, fechado por padrão;
10. automação via GitHub Actions somente após o gate estar validado;
11. rollback por provider/schema e preservação temporária do MaaS;
12. Earth-2 fora do escopo.

## Migração

A migração ocorrerá em camadas reversíveis:

### Fase 0 — Baseline e contrato
- confirmar estado real do repositório;
- registrar baseline;
- consolidar Intelligence Contract v1;
- decidir artefato de migração.

### Fase 1 — Schema
- implementar schema v2;
- claims;
- provenance mínima;
- compatibilidade de migração.

### Fase 2 — Provider abstraction
- desacoplar o gerador do endpoint MaaS;
- manter fallback MaaS;
- adicionar configuração NVIDIA.

### Fase 3 — NVIDIA smoke test
Verificar somente contrato operacional:
- autenticação;
- endpoint;
- model id;
- formato da resposta;
- parâmetros de geração;
- reasoning flags;
- max tokens;
- latência observada;
- usage/custo reportável.

Smoke test não é benchmark comparativo.

### Fase 4 — Shadow generation
Nemotron gera e valida, mas não substitui o snapshot de produção.

### Fase 5 — Prompt/editorial
Implementar prompt v3 alinhado ao Intelligence Contract.

### Fase 6 — Frontend
Adicionar a camada de inteligência sem redesenhar o dashboard. O acordeão-mãe deve respeitar i18n, acessibilidade e comportamento de exportação.

### Fase 7 — Actions + gate
Somente após validação do pipeline:
- workflow_dispatch;
- execução semanal;
- generation gate;
- publicação controlada.

### Fase 8 — Promotion
Após pelo menos dois runs NVIDIA verdes:
- promover schema v2;
- retirar fallback visual v1;
- arquivar v1;
- manter rollback documentado.

## Reversibilidade

O MaaS não será removido antes de dois runs NVIDIA publicados e validados.

A troca de provider deve ser controlável por configuração. O Earth-2 permanece independente.

## Segurança

`NVIDIA_API_KEY` e qualquer credencial MaaS ficam fora do código e dos artefatos públicos.

O fato de Earth-2 já usar `NVIDIA_API_KEY` não é considerado prova de autorização para o endpoint de LLM; a autorização será verificada pelo smoke test.

## Consequências

### Positivas
- inteligência editorial mais rica;
- rastreabilidade por claim;
- separação fato/interpretação/hipótese;
- migração reversível;
- automação governada;
- menor dependência de um único provider;
- preservação do design atual.

### Negativas
- maior complexidade de schema;
- maior esforço de validação;
- custo adicional de proveniência e QA;
- necessidade de governar drift editorial;
- coexistência temporária de v1/v2 durante a migração.

## Critério de sucesso

A sprint somente é considerada concluída quando:

- schema v2 valida;
- provenance é verificável;
- claims são classificadas;
- smoke test NVIDIA passa;
- shadow generation passa;
- generation gate bloqueia artefatos inválidos;
- frontend mantém o design atual;
- i18n/a11y funcionam;
- Earth-2 permanece sem alterações;
- pelo menos dois runs NVIDIA passam em produção antes da retirada do fallback MaaS.

