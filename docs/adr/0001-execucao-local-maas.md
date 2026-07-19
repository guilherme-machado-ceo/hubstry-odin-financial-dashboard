# ADR 0001: Execução local do gerador ODIN Insights via MaaS

- Status: aceito
- Data da decisão: 2026-07-19
- Data da documentação: 2026-07-19
- Natureza: Retrospectivo

## Contexto

O recurso ODIN Insights precisa de um LLM para gerar análises editoriais
das seções. Restrições:

- GitHub Actions **bloqueado sem previsão de desbloqueio** — impossível
  agendar ou executar a geração em CI;
- A chave do MaaS (Huawei Cloud/Digiti, trial de 10M tokens) não pode
  aparecer no código, no navegador ou em qualquer artefato público;
- O dashboard é estático (Vite/React na Vercel), sem backend.

## Decisão

Geração **local** via `scripts/generate-insights.mjs` (Node.js): a chave
existe apenas na variável de ambiente `MAAS_KEY` da máquina do operador;
a saída (`public/data/insights.json`) é commitada e publicada pelo fluxo
normal de push → deploy Vercel.

## Alternativas consideradas

- **GitHub Actions + Secrets** — bloqueado na conta; inviável;
- **Serverless function na Vercel** — criaria backend para manter,
  superfície de ataque para a chave e custo; adiada para uma eventual
  fase 2 (chat), nunca para geração batch;
- **Chamada direta do browser ao endpoint MaaS** — exporia a chave a
  qualquer visitante; rejeitada de imediato.

## Consequências

- Positivas: a chave nunca sai da máquina do operador; o JSON gerado é
  versionado no git; o dashboard continua 100% estático; custo de tokens
  controlado run a run.
- Negativas: regeneração é manual e depende da máquina do operador; sem
  agendamento automático enquanto o Actions estiver bloqueado.
