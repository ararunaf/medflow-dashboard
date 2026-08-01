# EPC-24 — Resource Model

**Sprint:** EPC-24 Sprint 13 — Execution Resource Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionResource` | `execution-resource` | Entrada canônica de recurso |
| `ExecutionResourceDefinition` | `execution-resource-definition` | Definição estrutural opaca |
| `ExecutionResourceMetadata` | `execution-resource-metadata` | Metadados estruturais |
| `ExecutionResourceReference` | `execution-resource-reference` | Referência opaca |
| `ExecutionResourceCategory` | `execution-resource-category` | Categoria estrutural |
| `ExecutionResourceScope` | `execution-resource-scope` | Escopo estrutural |
| `ExecutionResourceRegistry` | `execution-resource-registry` | Agregado raiz do catálogo |
| `ExecutionResourceCapabilities` | `execution-resource-capabilities` | Flags estruturais embutidas |
| `ExecutionResourceStatistics` | `execution-resource-statistics` | Estatísticas in-memory |
| `ExecutionResourceHealth` | `execution-resource-health` | Saúde estrutural |
| `ExecutionResourceResult` | `execution-resource-result` | Resultado estrutural |
| `ExecutionResourceFilter` | `execution-resource-filter` | Filtro de consulta |

**Total:** 12 modelos canônicos (incluindo o agregado `ExecutionResourceRegistry`).

Nenhum modelo contém regra de negócio.

---

## 2. Flags estruturais obrigatórias

Em toda entrada / registry / port:

- `resourceAllocationImplemented: false`
- `resourceReservationImplemented: false`
- `loadBalancingImplemented: false`
- `resourcesReserved: false`
- `schedulingImplemented: false`
- `resourcesAllocated: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`
- `structuralResourceRegistryOnly: true`
- `implementsResourceAllocation: false`
- `implementsResourceReservation: false`
- `implementsLoadBalancing: false`
- `implementsScheduling: false`
- `workersInvoked: false`

No recurso / scope:

- `resourceAllocated: false`
- `evaluable: false`
- `declared: true` (disponível estruturalmente, não alocável)

---

## 3. Relação com Execution Context

O Context **não** embute o Resource Registry.  
Apenas referencia via:

1. `references[]` — `{ name: "executionResourceRegistryId", value: "<id>" }`  
2. `history[]` — evento `execution-resource-registry-attached`  
3. `metadata.customAttributes.executionResourceRegistryId`

O Context permanece exclusivamente objeto de transporte.
