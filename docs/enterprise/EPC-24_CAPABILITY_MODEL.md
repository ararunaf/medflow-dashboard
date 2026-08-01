# EPC-24 — Execution Capability Model

**Sprint:** EPC-24 Sprint 08  
**Escopo:** Modelos canônicos estruturais do Execution Capability Registry  
**Regra:** Nenhum modelo contém regra de negócio.

---

## 1. Modelos canônicos (12)

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionCapability` | `execution-capability` | Capacidade registrada |
| `ExecutionCapabilityDefinition` | `execution-capability-definition` | Definição estrutural |
| `ExecutionCapabilityMetadata` | `execution-capability-metadata` | Metadados estruturais |
| `ExecutionCapabilityCategory` | `execution-capability-category` | Categoria estrutural |
| `ExecutionCapabilityReference` | `execution-capability-reference` | Referência opaca |
| `ExecutionCapabilityDescriptor` | `execution-capability-descriptor` | Descritor (não executável) |
| `ExecutionCapabilityRegistry` | `execution-capability-registry` | Agregado raiz do catálogo |
| `ExecutionCapabilityStatistics` | `execution-capability-statistics` | Estatísticas in-memory |
| `ExecutionCapabilityCapabilities` | `execution-capability-capabilities` | Capacidades embutidas |
| `ExecutionCapabilityHealth` | `execution-capability-health` | Saúde estrutural |
| `ExecutionCapabilityResult` | `execution-capability-result` | Resultado de operação |
| `ExecutionCapabilityFilter` | `execution-capability-filter` | Filtro estrutural |

Constante: `STRUCTURAL_CAPABILITY_REGISTRY_CAPABILITY`.

---

## 2. Flags estruturais obrigatórias

Todo Capability Registry declara explicitamente:

- `structuralCapabilityRegistryOnly: true`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `autoDiscoveryImplemented: false`
- `dynamicLoadingImplemented: false`
- `reflectionUsed: false`
- `pluginsUsed: false`
- `capabilitiesExecuted: false`
- `enginesInvoked: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`

Toda `ExecutionCapability` / `ExecutionCapabilityDescriptor` declara:

- `autoDiscovered: false`
- `dynamicallyLoaded: false`
- `executable: false` (descriptor)
- `capabilitiesExecuted: false`

---

## 3. Relação com Execution Context

O Context **não embute** o Capability Registry.  
Apenas referencia `executionCapabilityRegistryId` via:

- `references[]`
- `metadata.customAttributes`
- `history[]` (`execution-capability-registry-attached`)

O Capability Registry permanece dono dos dados de capacidades.

---

## 4. Localização

`src/lib/enterprise/execution-capability-registry/ports/models.ts`
