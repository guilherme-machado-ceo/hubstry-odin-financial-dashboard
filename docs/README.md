# ODIN — Documentação e Auditoria

Estrutura **docs-as-code**: toda decisão, mudança e execução relevante é
registrada em arquivos versionados junto ao código.

> Auditabilidade aqui significa **registros versionados, identificáveis
> e protegidos contra alteração não controlada** — não "imutabilidade".
> Commits e tags podem ser reescritos por quem tem permissão; a proteção
> vem das configurações do repositório (ver "Endurecimento" abaixo), não
> de uma propriedade mágica do git.

## Estrutura

| Caminho | Conteúdo |
|---------|----------|
| `adr/` | Architecture Decision Records — uma decisão por arquivo, com contexto, alternativas rejeitadas e consequências |
| `adr/0000-template.md` | Template para novas decisões (inclui política de edição) |
| `../CHANGELOG.md` | Linha do tempo das mudanças (formato Keep a Changelog) |
| `../logs/insights-runs-AAAA-MM.jsonl` | Run logs mensais do gerador ODIN Insights (uma linha JSON por execução) |

## Cadeia de auditoria ponta a ponta

1. **Geração** — cada seção de `public/data/insights.json` carrega
   `promptVersion`, `generatedAt`, `generationStatus` e `runId`;
2. **Execução** — cada run anexa uma linha ao log do mês com o MESMO
   `runId` (liga log↔artefato sem depender de correlação por horário),
   latência, status, `errorType`, tokens e hashes SHA-256 de
   entrada/saída (prova qual snapshot alimentou o modelo);
3. **Publicação** — cada push dispara deploy na Vercel vinculado ao SHA
   do commit;
4. **Revisão** — achados de revisão viram issues (label por natureza do
   revisor) fechadas pelos commits de correção, e regras no prompt com
   entrada no CHANGELOG.

## Convenções

- **CHANGELOG responde "O QUE mudou"** (com referência ao ADR); **ADR
  responde "POR QUÊ"** — sem duplicar justificativas;
- Labels de revisão por origem: `external-ai-review` (IA externa),
  `human-review`, `security-review`, `data-quality`, `methodology`;
- Documentos em PT-BR; código e mensagens de commit sem acentos;
- ADR aceito nunca é editado substancialmente — ver política no
  `adr/0000-template.md`;
- `insights.json` e os run logs são artefatos de auditoria — sempre
  commitados; edição manual só como contingência documentada no
  CHANGELOG.

## Política de conteúdo dos logs

Os run logs contêm **apenas metadados operacionais**: runId, modelo,
versões, status, latência, tokens, timestamps, hashes, tipo de erro.
Nunca registrar: chaves, headers, prompts ou respostas completos, dados
pessoais, payloads confidenciais, URLs assinadas ou mensagens de erro
que revelem credenciais.

Convenção semântica: `tokens: null` = consumo **indeterminado**
(falha/timeout); zero só quando a API confirma zero. O log é o **registro
técnico de consumo reportado pela API**, reconciliável com o painel do
provedor — a referência de cobrança é o painel comercial (retries,
cache e arredondamentos podem divergir).

Rotação: um arquivo por mês (`insights-runs-AAAA-MM.jsonl`). Se o volume
crescer, migrar para armazenamento dedicado — política a registrar em
ADR futuro.

Consulta do consumo acumulado: `npm run insights:usage`.

## Endurecimento do repositório (configuração manual nas Settings)

- Branch protection na `main`: exigir PR para mudanças relevantes e
  **bloquear force push**;
- Tags anotadas (`git tag -a`); preferencialmente commits/tags assinados;
- Secret scanning, Dependabot e CodeQL (gratuitos para repos públicos);
- GitHub Releases por milestone.

## Como registrar uma nova decisão

1. Copie `adr/0000-template.md` para `adr/NNNN-titulo-curto.md`
   (próximo número sequencial);
2. Preencha datas de decisão e documentação, natureza, contexto,
   decisão, alternativas e consequências;
3. Referencie o ADR no CHANGELOG e na mensagem de commit.
