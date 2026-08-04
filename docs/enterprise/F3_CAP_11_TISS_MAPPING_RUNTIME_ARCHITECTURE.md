# F3-CAP-11 — TISS Mapping Runtime Architecture

## Fluxo estrutural oficial

```
Produto
  → Enterprise Runtime
    → TISSMappingRuntimePort
      → DefaultTISSMappingRuntimeAdapter
        / EnterpriseTISSMappingRuntimeAdapter (alias)
        / MockTISSMappingRuntimeAdapter
      → InMemoryTISSMappingRuntimeStore
      → CanonicalMappingResult
```

## ECS-01

```
src/lib/enterprise/tiss-mapping-runtime/
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
| Port | Contrato único `TISSMappingRuntimePort` |
| Provider | `createTISSMappingRuntimePort()` / `getTISSMappingRuntimePort()` |
| Factory | Resolve provider → adapter |
| Registry | Catálogo `mock` / `test` / `default` / `enterprise` |
| Adapters | Implementações estruturais do Port |
| Store | Estado in-process (sem persistência) |
| Demo | `getTISSMappingRuntimeHealthSummary()` |

## Operações estruturais

- `prepareMapping` — cria `CanonicalMapping` estrutural (não mapeia)
- `getResult` — obtém resultado estrutural (não executa mapeamento)
- `stats` — estatísticas in-memory
- `health` / `capabilities` / `providerInfo`

## Composition Root

Enterprise Runtime resolve:

- `getTISSMappingRuntimePort()`
- `tissMappingRuntimeOk` no health agregado

Peers injetados via `enterpriseDeps` (shape-check apenas em `health()`).

## Fronteiras explícitas

Esta Foundation **não**:

- mapeia campos TISS
- implementa operadoras
- gera ou valida XML
- preenche guias
- chama IA
- persiste em banco
- expõe APIs de produto

Toda a Sprint F3-CAP-11 é exclusivamente estrutural.
