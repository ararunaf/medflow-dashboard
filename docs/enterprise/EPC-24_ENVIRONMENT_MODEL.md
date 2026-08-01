# EPC-24 — Environment Model

**Sprint:** EPC-24 Sprint 14 — Execution Environment Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionEnvironment` | `execution-environment` | Entrada canônica de ambiente |
| `ExecutionEnvironmentDefinition` | `execution-environment-definition` | Definição estrutural opaca |
| `ExecutionEnvironmentMetadata` | `execution-environment-metadata` | Metadados estruturais |
| `ExecutionEnvironmentReference` | `execution-environment-reference` | Referência opaca |
| `ExecutionEnvironmentCategory` | `execution-environment-category` | Categoria estrutural |
| `ExecutionEnvironmentScope` | `execution-environment-scope` | Escopo estrutural |
| `ExecutionEnvironmentRegistry` | `execution-environment-registry` | Agregado raiz do catálogo |
| `ExecutionEnvironmentCapabilities` | `execution-environment-capabilities` | Flags estruturais embutidas |
| `ExecutionEnvironmentStatistics` | `execution-environment-statistics` | Estatísticas in-memory |
| `ExecutionEnvironmentHealth` | `execution-environment-health` | Saúde estrutural |
| `ExecutionEnvironmentResult` | `execution-environment-result` | Resultado estrutural |
| `ExecutionEnvironmentFilter` | `execution-environment-filter` | Filtro de consulta |

**Total:** 12 modelos canônicos (incluindo o agregado `ExecutionEnvironmentRegistry`).

Nenhum modelo contém regra de negócio.

---

## 2. Flags estruturais obrigatórias

Em toda entrada / registry / port:

- `environmentSelectionImplemented: false`
- `environmentProvisioningImplemented: false`
- `environmentActivationImplemented: false`
- `environmentsSelected: false`
- `environmentsProvisioned: false`
- `environmentsActivated: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`
- `structuralEnvironmentRegistryOnly: true`
- `implementsEnvironmentSelection: false`
- `implementsEnvironmentProvisioning: false`
- `implementsEnvironmentActivation: false`
- `workersInvoked: false`

No ambiente / scope:

- `environmentSelected: false`
- `evaluable: false`
- `declared: true` (disponível estruturalmente, não selecionável / ativável)

---

## 3. Cadeia de referências no agregado

`ExecutionEnvironmentRegistry` pode referenciar estruturalmente:

- `executionId` · `contextId` · `stateMachineId` · `eventBusId`  
- `executionRegistryId` · `executionTraceId`  
- `executionCapabilityRegistryId` · `executionDependencyRegistryId`  
- `executionPolicyRegistryId` · `executionConstraintRegistryId`  
- `executionRequirementRegistryId` · `executionResourceRegistryId`  
- `pipelineId`

Nenhuma dessas referências implica invocação, seleção ou ativação.
