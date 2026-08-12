# XML Real Production Certification

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A5-03 — XML Real Production Certification                     |
| Projeto     | MedicFlow-AI                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Discovery   | `docs/enterprise/XML_REAL_DISCOVERY.md`                       |
| Activation  | A5-02 via `RealTissXMLTISSRuntimeAdapter`                     |
| Registro    | `docs/enterprise/REAL_PROVIDER_REGISTRY.md`                   |
| Status      | Production Certified                                          |

---

## 1. Objetivo

Certificar o `RealTissXMLTISSRuntimeAdapter` para produção sem alterar qualquer
arquivo em `src/`, `Runtime`, `Port`, `Gateway`, `Pipeline`, `Foundations`,
`Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability` ou
`Composition Root`.

## 2. Escopo da Certificação

- `scripts/enterprise/tests/xml-production-certification.test.ts` (novo)
- `docs/enterprise/XML_PRODUCTION_CERTIFICATION.md` (este documento)
- `docs/enterprise/REAL_PROVIDER_REGISTRY.md` (status `Production Certified`)

Nenhum arquivo em `src/` foi modificado nesta sprint.

## 3. Cenários Certificados

| #   | Cenário                                  | Evidência no Teste                                                 |
| --- | ---------------------------------------- | ------------------------------------------------------------------ |
| 1   | XML válido de guia `consulta`            | `<?xml ...?>`, `<ans:consulta ...>`, namespace ANS                 |
| 2   | XML vazio / ausência de `autoFillResult` | Gera consulta com placeholders padrão                              |
| 3   | XML inválido: guia não suportada         | `internacao` gera XML bem-formado, mas sem estrutura real          |
| 4   | Múltiplas guias / campos adicionais      | Mantém documento único e bem-formado                               |
| 5   | Caracteres especiais                     | `&`, `<`, `>`, `"`, `'` escapados corretamente                     |
| 6   | UTF-8                                    | Preserva `João José Müller Ção` e prolog `encoding="UTF-8"`        |
| 7   | Namespace ANS                            | `http://www.ans.gov.br/padroes/tiss/schemas`                       |
| 8   | Schema version                           | `3.05.00` em `tissVersion`, `namespaces[0]` e `schemas[0]`         |
| 9   | Serialização                             | Documento com prolog, tag raiz e fechamento coerente               |
| 10  | Documento grande                         | Beneficiário com 10.000 caracteres mantido no corpo                |
| 11  | Retry                                    | 3 tentativas para 2 `failAttempts` + `retryCount`                  |
| 12  | Dead Letter                              | `infrastructure.deadLetterRuntime` e `retryInfrastructure`         |
| 13  | Observability                            | `health`, `providerInfo`, `capabilities` com `provider: real-tiss` |
| 14  | Throughput                               | 53.129,88 operações/segundo                                        |
| 15  | Latência média                           | 0,0188 ms por operação                                             |

## 4. Prova de XML_GENERATED sem Batch

O teste `15. End-to-end: VALIDATED → ENRICHED → XML_GENERATED sem Batch`
executa `processTissEnrichedXmlGenerated` via `getEnterpriseRuntime()` e depois
`processTissXmlJob` diretamente para verificar os atributos da mensagem
`XML_GENERATED`.

Flags do próximo job:

- `xmlExecuted = true`
- `xmlGenerated = true`
- `batchExecuted = false`
- `protocolExecuted = false`
- `persistenceExecuted = false`
- `auditExecuted = false`
- `completedExecuted` não foi ativado (próximo estágio ainda não alcançado)

## 5. Métricas de Performance

Obtidas com 1.000 chamadas sequenciais de `prepareXMLDocument` no mesmo processo:

```
[xml-certification] throughput=53129.88 ops/s, averageLatency=0.0188 ms, totalMs=18.82
```

- **Throughput**: 53.129,88 ops/s
- **Latência média**: 0,0188 ms
- **Latência total**: 18,82 ms
- **Amostras**: 1.000

## 6. Execução e Verificação

### Comandos executados

- `npm run build` — sucesso
- `npx tsc --noEmit` — sucesso
- `npm run lint` — 0 erros (7 warnings preexistentes)
- `npm run smoke-check` — sucesso
- `npx tsx --test --test-reporter=tap scripts/enterprise/tests/xml-production-certification.test.ts` — 14/14 pass

### Testes existentes

- `xml-tiss-runtime-engine.test.ts` — 16/16 pass
- `tiss-runtime-03a-xml-real-activation.test.ts` — 6/6 pass

## 7. Greps (sobre `src/`)

| #   | Padrão                                          | Resultado                     |
| --- | ----------------------------------------------- | ----------------------------- |
| 1   | `new RealTissXMLTISSRuntimeAdapter`             | 1 ocorrência (factory)        |
| 2   | `XMLTISSRuntimePort`                            | 86 ocorrências                |
| 3   | `getEnterpriseRuntime`                          | 174 ocorrências               |
| 4   | `BatchRuntimePort` em `xml-tiss-runtime`        | 0 ocorrências                 |
| 5   | `BatchRuntimePort` em `process-tiss-xml-job.ts` | 0 ocorrências                 |
| 6   | `processTissEnrichedXmlGenerated`               | 2 ocorrências (não alteradas) |
| 7   | `processTissXmlJob`                             | 6 ocorrências (não alteradas) |
| 8   | `XMLRuntime`                                    | 496 ocorrências               |
| 9   | `XMLSerializer`                                 | 0 ocorrências                 |
| 10  | `XMLSchema`                                     | 0 ocorrências                 |

## 8. Garantias Preservadas

- Nenhum arquivo em `src/` foi modificado nesta sprint.
- `XMLTISSRuntimePort` permanece o único contrato.
- `getEnterpriseRuntime()` permanece o único entrypoint.
- O XML Real acessa `DefaultXMLTISSRuntimeAdapter` para store/retry/observability e gera o XML sem acessar implementações concretas de `xml-runtime`, `xml-generation-runtime`, `xml-serializer-runtime`, `xml-schema-runtime` ou `xsd-runtime`.
- `processTissEnrichedXmlGenerated` e `processTissXmlJob` não foram alterados.

## 9. Conclusão

O XML Real foi certificado para produção reutilizando integralmente a
arquitetura Enterprise. O Baseline v1.0 permanece preservado.
