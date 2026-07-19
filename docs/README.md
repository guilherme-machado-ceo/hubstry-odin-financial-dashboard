# ODIN — Documentação e Auditoria

Estrutura **docs-as-code**: toda decisão, mudança e execução relevante é
registrada em arquivos versionados junto ao código. A trilha de auditoria
é o próprio `git log` — imutável, datada e com autoria.

## Estrutura

| Caminho | Conteúdo |
|---------|----------|
| `adr/` | Architecture Decision Records — uma decisão por arquivo, com contexto, alternativas rejeitadas e consequências |
| `adr/0000-template.md` | Template para novas decisões |
| `../CHANGELOG.md` | Linha do tempo das mudanças (formato Keep a Changelog) |
| `../logs/insights-runs.jsonl` | Registro de cada execução do gerador ODIN Insights (uma linha JSON por run: modelo, versão de prompt, status por seção, tokens consumidos) |

## Cadeia de auditoria ponta a ponta

1. **Geração** — cada seção de `public/data/insights.json` carrega
   `promptVersion`, `generatedAt` e `generationStatus`: dá para saber
   exatamente qual versão do prompt produziu cada texto e quando;
2. **Execução** — cada run é anexada a `logs/insights-runs.jsonl` com o
   consumo de tokens (campo `usage` da API MaaS), reconciliável com o
   painel da Huawei Cloud/Digiti;
3. **Publicação** — cada push dispara deploy na Vercel vinculado ao SHA
   do commit: o conteúdo no ar sempre aponta para um commit exato;
4. **Revisão** — achados de revisões externas viram regras no prompt e
   entradas no CHANGELOG, com o commit que as resolveu.

## Como registrar uma nova decisão

1. Copie `adr/0000-template.md` para `adr/NNNN-titulo-curto.md`
   (próximo número sequencial);
2. Preencha contexto, decisão, alternativas e consequências;
3. Referencie o ADR no CHANGELOG e na mensagem de commit.

## Convenções

- Documentos em PT-BR; código e mensagens de commit sem acentos;
- Decisões não são apagadas: se mudam, o ADR antigo recebe status
  `substituído por ADR-NNNN` e um novo ADR é criado;
- O `insights.json` e o `insights-runs.jsonl` são artefatos de auditoria
  — sempre commitados, nunca editados à mão sem registro no CHANGELOG.
