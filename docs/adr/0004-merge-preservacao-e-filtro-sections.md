# ADR 0004: Merge com preservação e filtro SECTIONS

- Status: aceito
- Data da decisão: 2026-07-19
- Data da documentação: 2026-07-19
- Natureza: Retrospectivo

## Contexto

Dois incidentes operacionais:

1. Um timeout na seção de clima fez a run seguinte **sobrescrever o
   arquivo inteiro**, apagando um texto já aprovado (perda real do
   insight de clima v1);
2. Reruns completos substituíam textos aprovados por novas amostras
   estocásticas — regenerar uma seção problemática colocava em risco as
   demais.

## Decisão

- **Merge com preservação**: a run lê o `insights.json` existente; seções
  que falharem são preservadas da rodada anterior e marcadas
  (`preserved_after_timeout` / `preserved_after_error`), nunca apagadas;
- **Filtro `SECTIONS`**: variável de ambiente limita a regeneração às
  seções listadas; as demais são preservadas byte a byte, sem chamada à
  API.

## Alternativas consideradas

- **Rerun até todas terem sucesso** — gasta tokens e continua
  re-amostrando textos bons; rejeitada;
- **Edição manual do JSON** — quebra a proveniência "gerado por prompt
  versão X"; reservada a contingência documentada (timeout repetido),
  com registro no CHANGELOG.

## Consequências

- Positivas: nenhuma perda de conteúdo aprovado; regeneração cirúrgica
  (na rodada v2.3, o clima aprovado em v2.2 foi preservado intacto);
  economia de tokens em reruns parciais.
- Negativas: operador precisa lembrar de limpar o filtro
  (`Remove-Item Env:SECTIONS`) antes de runs completas.
