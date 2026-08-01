# EPC-24 — Execution Registry Model

**Sprint:** EPC-24 Sprint 06 — Execution Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Princípio

Todos os modelos são **exclusivamente estruturais**.  
Nenhum modelo contém regra de negócio, interpretação clínica, OCR, IA ou persistência.

---

## 2. Modelos canônicos (12)

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionRegistryEntry` | `execution-registry-entry` | Entrada canônica do catálogo |
| `ExecutionRegistryRecord` | `execution-registry-record` | Projeção/record envolvendo a Entry |
| `ExecutionRegistryMetadata` | `execution-registry-metadata` | Tags, timestamps, atributos opacos |
| `ExecutionRegistryReference` | `execution-registry-reference` | Referência opaca nome/valor |
| `ExecutionRegistryIndex` | `execution-registry-index` | Índice estrutural in-memory |
| `ExecutionRegistrySnapshot` | `execution-registry-snapshot` | Snapshot no momento do registro |
| `ExecutionRegistryCapabilities` | `execution-registry-capabilities` | Capacidades embutidas (sem Engines) |
| `ExecutionRegistryQuery` | `execution-registry-query` | Query estrutural de busca |
| `ExecutionRegistryFilter` | `execution-registry-filter` | Filtro estrutural de listagem |
| `ExecutionRegistryResult` | `execution-registry-result` | Resultado estrutural de operação |
| `ExecutionRegistryStatistics` | `execution-registry-statistics` | Contagens estruturais do catálogo |
| `ExecutionRegistryHealth` | `execution-registry-health` | Saúde estrutural do Registry |

---

## 3. Entry — campos principais

```
ExecutionRegistryEntry
  id / executionRegistryId
  executionId
  correlationId?
  contextId?
  stateMachineId?
  eventBusId?
  pipelineId?
  references[]
  metadata
  snapshot?
  capability
  registeredAt / updatedAt
  enginesInvoked: false
  persistenceImplemented: false
  databaseUsed: false
```

---

## 4. Constantes

- `STRUCTURAL_REGISTRY_CAPABILITY` — capacidades canônicas embutidas em toda Entry  
- Explicitamente: `structuralRegistryOnly: true`, `persistenceImplemented: false`, `databaseUsed: false`, `decoupledFromEngines: true`

---

## 5. Relação com Execution Context

O Context **não embute** o Registry.  
Apenas referencia via:

- `references[]` com `name: "executionRegistryId"`  
- `metadata.customAttributes.executionRegistryId`  
- history event `execution-registry-attached`

---

## 6. Localização

`src/lib/enterprise/execution-registry/ports/models.ts`
