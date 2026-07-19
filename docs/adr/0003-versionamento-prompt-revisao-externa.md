# ADR 0003: Versionamento de prompt e ciclo de revisão externa

- Status: aceito
- Data: 2026-07-19

## Contexto

Texto gerado por LLM é estocástico: erros editoriais e factuais só
aparecem na leitura. Sem processo, cada correção vira remendo manual
perdido na próxima regeneração. Era preciso um mecanismo em que cada
achado de revisão virasse melhoria permanente do gerador.

## Decisão

- `PROMPT_VERSION` no script, com bump a cada mudança de regra editorial,
  gravado por seção no JSON (ADR 0002);
- Todo achado de revisão (humana ou IA externa) é convertido em **regra
  literal** no system prompt — não em edição do texto gerado;
- Cada rodada de geração passa por checklist de aceite antes do push;
- O CHANGELOG registra versão, motivo e origem de cada regra.

## Alternativas consideradas

- **Pós-edição manual permanente** — não escala e é sobrescrita na run
  seguinte; reservada a contingências (ver ADR 0004);
- **Validação automática por regex/pós-checagem no script** — complementar
  promissor (ex.: rejeitar sigla não expandida), ainda não implementado;
  fica como evolução futura.

## Consequências

- Positivas: 4 rodadas de revisão externa incorporadas como 10+ regras
  permanentes (v2.0 → v2.3.1); correções sistêmicas, não pontuais;
  histórico de qual versão gerou cada texto.
- Negativas: prompt cresce a cada rodada (custo de tokens de sistema);
  regras dependem da aderência do modelo — não são garantia formal.
