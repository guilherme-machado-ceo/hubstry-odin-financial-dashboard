# ODIN — Documentação e Auditoria

Estrutura **docs-as-code**: toda decisão, mudança e verificação relevante é
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
| `data-audit.md` | Auditoria das fontes públicas: status, evidência e data de cada dado curado |
| `../CHANGELOG.md` | Linha do tempo das mudanças (formato Keep a Changelog) |

## Cadeia de auditoria ponta a ponta

1. **Dado** — cada dado curado tem registro em `src/data/dataAudit.ts`
   (status, URL oficial, data da evidência); `scripts/test-data-audit.mjs`
   falha no CI se o código divergir das evidências;
2. **Coleta** — os snapshots e dados abertos são gerados por workflows
   versionados, com gate de validação antes de gravar;
3. **Publicação** — cada push na `main` dispara deploy vinculado ao SHA do
   commit;
4. **Revisão** — achados de revisão viram issues (label por natureza do
   revisor) fechadas pelos commits de correção, com entrada no CHANGELOG.

## Convenções

- **CHANGELOG responde "O QUE mudou"** (com referência ao ADR); **ADR
  responde "POR QUÊ"** — sem duplicar justificativas;
- Labels de revisão por origem: `external-ai-review` (IA externa),
  `human-review`, `security-review`, `data-quality`, `methodology`;
- Documentos em PT-BR; código e mensagens de commit sem acentos;
- ADR aceito nunca é editado substancialmente — ver política no
  `adr/0000-template.md`.

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
