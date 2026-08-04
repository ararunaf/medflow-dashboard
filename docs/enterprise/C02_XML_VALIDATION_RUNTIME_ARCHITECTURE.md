# C-02 — XML Validation Runtime Architecture

## Visão

```
Produto
  → Enterprise Runtime
    → XMLValidationRuntimePort
      → DefaultXMLValidationRuntimeAdapter / EnterpriseXMLValidationRuntimeAdapter / MockXMLValidationRuntimeAdapter
        ← XMLValidationRuntimeFactory ← XMLValidationRuntimeRegistry
        → InMemoryXMLValidationRuntimeStore
          → XMLValidationResult (estrutural)
```

## ECS-01

```
src/lib/enterprise/xml-validation-runtime/
  ports/
  providers/
  factory/
  registry/
  adapters/
  store/
  demo/
  index.ts
```

## Camadas

| Camada | Responsabilidade |
|--------|------------------|
| Port | Contrato único `XMLValidationRuntimePort` |
| Provider | `createXMLValidationRuntimePort()` / `getXMLValidationRuntimePort()` |
| Factory | Materializa adapters por provider id |
| Registry | Catálogo `mock` / `test` / `default` / `enterprise` |
| Adapters | Implementações estruturais do Port |
| Store | Estado in-process (sem persistência) |
| Demo | `getXMLValidationRuntimeHealthSummary()` |

## Contratos canônicos

`XMLValidationContext` · `XMLValidationRequest` · `XMLValidationResult` · `XMLValidationIssue` · `XMLValidationStatistics` · `XMLValidationCapabilities` · `XMLValidationHealth` · `XMLValidationStatus`

Contratos estruturais futuros (somente tipos): structure · schema · namespace · version · integrity · consistency · compatibility · validation report — todos com `*Implemented: false`.

## Operações estruturais

- `validate` — resposta canônica estrutural; **não** valida XML / XSD
- `getResult` — obtém resultado estrutural; **não** executa validação
- `listResults` — lista resultados in-memory
- `stats` — estatísticas in-memory
- `health` / `capabilities` / `providerInfo`

## Integração Enterprise

- `getXMLValidationRuntimePort()`
- `xmlValidationRuntimeOk` em `EnterpriseRuntimeHealth`
- Peers via `enterpriseDeps` com shape-check apenas em `health()`

## Compatibilidade TISS

- `kind` discriminators permanecem `canonical-xml-validation-*`
- Aliases `CanonicalXMLValidation*` → nomes C-02
- Aliases `DefaultXMLValidationAdapter` / `EnterpriseXMLValidationAdapter` / `MockXMLValidationAdapter`
- API `validate(input)` continua retornando `{ ok, result }` com `result.resultId` e flags estruturais

## Limites explícitos

Esta arquitetura é **exclusivamente estrutural**:

- não existe validação XML
- não existe XSD
- não existe parser
- não existe correção automática
- não existe SOAP
- não existe comunicação de rede
- não existe banco / APIs
- não existe decisão inteligente / IA

---

## Regra Permanente do BLOCO C (determinismo)

Documento oficial:
[`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md).

Regra irmã (C-01A):
[`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md).
