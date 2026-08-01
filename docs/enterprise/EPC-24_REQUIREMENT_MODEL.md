# EPC-24 — Requirement Model

**Sprint:** EPC-24 Sprint 12 — Execution Requirement Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionRequirement` | `execution-requirement` | Entrada canônica de requisito |
| `ExecutionRequirementDefinition` | `execution-requirement-definition` | Definição estrutural opaca |
| `ExecutionRequirementMetadata` | `execution-requirement-metadata` | Metadados estruturais |
| `ExecutionRequirementReference` | `execution-requirement-reference` | Referência opaca |
| `ExecutionRequirementCategory` | `execution-requirement-category` | Categoria estrutural |
| `ExecutionRequirementScope` | `execution-requirement-scope` | Escopo estrutural |
| `ExecutionRequirementRegistry` | `execution-requirement-registry` | Agregado raiz do catálogo |
| `ExecutionRequirementCapabilities` | `execution-requirement-capabilities` | Flags estruturais embutidas |
| `ExecutionRequirementStatistics` | `execution-requirement-statistics` | Estatísticas in-memory |
| `ExecutionRequirementHealth` | `execution-requirement-health` | Saúde estrutural |
| `ExecutionRequirementResult` | `execution-requirement-result` | Resultado estrutural |
| `ExecutionRequirementFilter` | `execution-requirement-filter` | Filtro de consulta |

**Total:** 12 modelos canônicos (incluindo o agregado `ExecutionRequirementRegistry`).

Nenhum modelo contém regra de negócio.

---

## 2. Flags estruturais obrigatórias

Em toda entrada / registry / port:

- `requirementValidationImplemented: false`
- `ruleEngineInvoked: false`
- `decisionEngineInvoked: false`
- `rulesEnforced: false`
- `rulesApplied: false`
- `requirementsValidated: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`
- `structuralRequirementRegistryOnly: true`
- `implementsRequirementValidation: false`
- `implementsRequirementValidation: false`
- `implementsRuleExecution: false`
- `implementsDecisionEngine: false`
- `preconditionsChecked: false`

Na requisito / scope:

- `requirementValidated: false`
- `evaluable: false`
- `declared: true` (disponível estruturalmente, não avaliável)

---

## 3. Relação com Execution Context

O Context **não** embute o Requirement Registry.  
Apenas referencia via:

1. `references[]` — `{ name: "executionRequirementRegistryId", value: "<id>" }`  
2. `history[]` — evento `execution-requirement-registry-attached`  
3. `metadata.customAttributes.executionRequirementRegistryId`

O Context permanece exclusivamente objeto de transporte.
