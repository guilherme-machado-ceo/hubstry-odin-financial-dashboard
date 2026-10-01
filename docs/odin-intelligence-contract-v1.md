# ODIN Intelligence Contract v1

- Status: aprovado para implementação
- Versão: 1.0
- Escopo: ODIN Insights / camada de inteligência editorial
- Data: 2026-09-30
- Sucessor: [v1.1](odin-intelligence-contract-v1.1.md) — congelado para o M3; o conteúdo v1.0 publicado continua válido

## 1. Finalidade

O ODIN não deve transformar um modelo de linguagem em autoridade factual. A camada de inteligência transforma informação pública rastreável em contexto, interpretação e hipóteses explicitamente qualificadas.

Cadeia epistemológica:

SOURCE → DATA → EVENT → CLAIM → CONTEXT → INTERPRETATION → THESIS → STAKEHOLDER

A cadeia é um contrato editorial e técnico: nenhum nível posterior pode ser tratado como evidência do nível anterior.

## 2. Princípios

1. Evidência precede afirmação.
2. Fato, interpretação e hipótese são semanticamente distintos.
3. A ausência de evidência é uma informação relevante e deve ser explicitada quando limitar a conclusão.
4. O modelo pode sintetizar, classificar, correlacionar e formular hipóteses; não pode inventar fatos, números, fontes ou causalidade.
5. Relações causais não demonstradas devem ser apresentadas como hipótese/interpretação.
6. Dados e interpretação possuem confiança independente.
7. A lente de Direito Econômico é analítica, não parecer jurídico.
8. Quando a lente jurídica tiver relevância medium/high, deve haver ancoragem normativa e fonte identificável.
9. Stakeholder analysis é contextual, não recomendação de investimento ou persuasão política.
10. Toda geração deve ser reproduzível por runId, promptVersion, model/provider e provenance.
11. Falhas de geração não devem apagar automaticamente conteúdo previamente publicado.
12. A automação não pode publicar um snapshot novo sem passar pelo generation gate.

## 3. Unidade semântica: claim

Cada afirmação analítica relevante deve poder ser classificada como:

- fact — diretamente sustentada pelos dados/evidência fornecidos;
- interpretation — leitura analítica derivada da evidência;
- hypothesis — relação explicativa ou causal ainda não demonstrada pelos dados disponíveis.

O tipo não precisa aparecer visualmente em cada frase. Ele pertence ao contrato de dados e pode ser exposto pela UI de forma discreta quando necessário.

Exemplo:

```json
{
  "id": "claim-carbon-cbam-01",
  "kind": "fact",
  "textPt": "...",
  "textEn": "...",
  "evidenceRefs": ["evidence-001"],
  "confidence": {
    "data": "high",
    "interpretation": "high"
  }
}
```

## 4. Proveniência mínima

Toda claim que dependa de evidência externa deve apontar para uma referência endereçável.

Contrato mínimo:

```json
{
  "sourceId": "source-001",
  "sourceUrl": "https://...",
  "asOf": "2026-09-30",
  "dataPath": "public/data/example.json",
  "metricId": "example-metric",
  "hash": "sha256:..."
}
```

`excerptHash` não é obrigatório no MVP e só será introduzido quando existir excerpt persistido como artefato de evidência.

## 5. Intelligence Contract vs. outros versionamentos

São contratos diferentes:

- `schemaVersion`: formato estrutural do artefato;
- `intelligenceContractVersion`: regras epistemológicas/editoriais;
- `promptVersion`: implementação textual do comportamento do modelo.

Mudança de prompt não implica automaticamente mudança do contrato de inteligência.

## 6. Estrutura editorial

Quando material para a seção, o ODIN Insight poderá conter:

1. Contexto Estratégico
2. Tese ODIN
3. Lente de Direito Econômico
4. Implicações para Stakeholders
5. What to Watch

A interface usa um acordeão-mãe "ODIN Insight", fechado por padrão. Sub-blocos podem estar ausentes quando a materialidade for baixa.

## 7. Materialidade

Cada seção deve ser avaliada:

- A — Insight obrigatório;
- B — Insight recomendado;
- C — Insight contextual, condicionado a evento/inflexão;
- D — não aplicável.

A classificação não obriga geração textual quando não houver materialidade.

## 8. Direito Econômico

Se `economicLaw.relevance = high`:

- `norms[]` é obrigatório;
- instituições relevantes devem ser identificadas;
- a fonte normativa deve ser identificável e, quando possível, oficial;
- ausência de ancoragem deve bloquear publicação.

Se a dimensão jurídica não for material, declarar relevância baixa em vez de produzir texto genérico.

## 9. Stakeholders

As lentes permitidas são:

- Government / Policy Makers;
- C-Level / Corporate Strategy;
- Investors;
- Startups / Innovation.

A análise deve descrever exposição, variáveis, riscos, mecanismos, cenários e sinais. Não deve emitir recomendação de compra/venda nem persuasão política.

## 10. What to Watch

Cada sinal deve, quando aplicável, conter:

- signal;
- source;
- expectedDate;
- whyItMatters;
- nextReviewAt;
- ownerLens;
- relatedSection.

## 11. Confidence

`confidence.data` mede a confiança na fidelidade dos dados utilizados.

`confidence.interpretation` mede a confiança na interpretação, não na existência dos dados.

Inferência econômica não medida diretamente nos dados não pode receber `interpretation = high`.

## 12. Estados de execução

Estados previstos:

- `shadow`
- `generated`
- `preserved_after_error`
- `preserved_after_timeout`
- `failed_controlled`

Um estado de falha controlada nunca deve ser apresentado como nova geração bem-sucedida.

## 13. Generation gate

A publicação de um novo snapshot só é permitida quando:

```text
publishAllowed =
  schemaValid
  && generatedCount > 0
  && provenanceCoverage >= threshold
  && confidencePresent
  && freshnessOk
  && bannedClaims == 0
  && economicLawHighHasNorms == true
```

Se `publishAllowed = false`:

- não publicar;
- não substituir o snapshot anterior;
- registrar `failed_controlled`;
- preservar o artefato anterior;
- registrar a causa no log técnico.

## 14. Compatibilidade e migração

Durante a migração:

- `insights.json` legado permanece como produção;
- `insights.v2.json` pode existir como artefato shadow/experimental;
- o frontend não promove v2 automaticamente;
- após dois runs NVIDIA verdes e QA aprovado, v2 pode substituir o contrato de produção;
- v1 não será mantido como segundo contrato permanente; permanecerá no histórico/snapshot de arquivo.

## 15. Provider/model governance

O ODIN deve usar uma abstração de provider:

```text
AI_PROVIDER=maas|nvidia
```

A migração inicial usa NVIDIA como candidato operacional:

```text
provider = nvidia
model = nvidia/nemotron-3-super-120b-a12b
endpoint = https://integrate.api.nvidia.com/v1
```

A escolha será validada por smoke test de contrato e shadow generation. Isso não constitui benchmark comparativo.

O segredo permanece exclusivamente no ambiente seguro do CI/operator; nunca no frontend, no JSON público ou no código-fonte.

## 16. Escopo desta versão

Incluído:

- contrato epistemológico;
- provenance mínima;
- claims;
- schema v2;
- provider adapter;
- NVIDIA smoke test;
- shadow generation;
- prompt/editorial v3;
- frontend accordion;
- i18n/a11y;
- generation gate;
- automação semanal;
- rollback.

Fora do escopo:

- alteração do pipeline Earth-2;
- substituição de modelos climáticos;
- chat público;
- Deep Research;
- recomendação financeira;
- aconselhamento jurídico;
- persuasão política.

