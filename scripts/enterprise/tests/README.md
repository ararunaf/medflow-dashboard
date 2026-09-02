# Testes de `src/lib/enterprise/*` — status (F1-S1)

`npm test` é o gate oficial do repositório. Ele roda typecheck + a suíte real
de produto (`capture:test:all`) + os testes novos de F1-S2 (hierarquia
multi-entidade, importador TUSS/CID-10). Os ~180 scripts individuais nesta
pasta (`enterprise:*:test`) **não fazem parte do gate oficial**.

## Por quê

A maioria desses arquivos certifica a *ausência* de lógica real (ports que se
autodeclaram "structural foundation only") ou verifica, por regex, se o
código-fonte contém um texto específico (`/getWorkerRuntimePort/` etc.).
Depois da remoção dos módulos fake em F1-S1 (`security-runtime`,
`worker-runtime`, `scheduler-runtime`, `observability-runtime`,
`xml-schema/serializer/validation-runtime`, `ai-auditor`, `ai-orchestrator`,
`tiss-vocabulary`, `tiss-mapping`, `tiss-intelligence-engine`, entre outros),
muitos desses testes falham **corretamente** — eles certificavam exatamente o
scaffolding que foi removido.

Isso não é regressão: é o teste fazendo seu trabalho depois que o código que
ele vigiava deixou de existir.

## Se você for tocar em algo aqui

- Testes de módulo que ainda existe e é real (queue-runtime, tiss-runtime,
  tiss-catalog, canonical-execution-orchestrator, pipeline-resolver, ai-provider,
  ocr-provider) continuam válidos e podem ser rodados individualmente
  (`npx tsx --test scripts/enterprise/tests/<arquivo>.test.ts`).
- Testes de módulo deletado quebram na importação (`ERR_MODULE_NOT_FOUND`) —
  apague o teste junto com o módulo, não tente consertar.
- Testes de módulo real mas com asserção desatualizada (ex.: contava 11 Ports,
  agora são 8) — vale corrigir a asserção quando você mexer naquele módulo,
  não é urgente isoladamente.
- Não adicione novo teste aqui esperando que ele entre no gate oficial
  automaticamente — só entra se for adicionado a `"test"` em `package.json`.
