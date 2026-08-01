# EPC-24 — Constraint Model

**Sprint:** EPC-24 Sprint 11 — Execution Constraint Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionConstraint` | `execution-constraint` | Entrada canônica de restrição |
| `ExecutionConstraintDefinition` | `execution-constraint-definition` | Definição estrutural opaca |
| `ExecutionConstraintMetadata` | `execution-constraint-metadata` | Metadados estruturais |
| `ExecutionConstraintReference` | `execution-constraint-reference` | Referência opaca |
| `ExecutionConstraintCategory` | `execution-constraint-category` | Categoria estrutural |
| `ExecutionConstraintScope` | `execution-constraint-scope` | Escopo estrutural |
| `ExecutionConstraintRegistry` | `execution-constraint-registry` | Agregado raiz do catálogo |
| `ExecutionConstraintCapabilities` | `execution-constraint-capabilities` | Flags estruturais embutidas |
| `ExecutionConstraintStatistics` | `execution-constraint-statistics` | Estatísticas in-memory |
| `ExecutionConstraintHealth` | `execution-constraint-health` | Saúde estrutural |
| `ExecutionConstraintResult` | `execution-constraint-result` | Resultado estrutural |
| `ExecutionConstraintFilter` | `execution-constraint-filter` | Filtro de consulta |

**Total:** 12 modelos canônicos (incluindo o agregado `ExecutionConstraintRegistry`).

Nenhum modelo contém regra de negócio.

---

## 2. Flags estruturais obrigatórias

Em toda entrada / registry / port:

- `constraintValidationImplemented: false`
- `ruleEngineInvoked: false`
- `decisionEngineInvoked: false`
- `rulesEnforced: false`
- `rulesApplied: false`
- `constraintsValidated: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`
- `structuralConstraintRegistryOnly: true`
- `implementsConstraintValidation: false`
- `implementsExecutionBlocking: false`
- `implementsRuleExecution: false`
- `implementsDecisionEngine: false`
- `executionBlocked: false`

Na restrição / scope:

- `constraintValidated: false`
- `evaluable: false`
- `declared: true` (disponível estruturalmente, não avaliável)

---

## 3. Relação com Execution Context

O Context **não** embute o Constraint Registry.  
Apenas referencia via:

1. `references[]` — `{ name: "executionConstraintRegistryId", value: "<id>" }`  
2. `history[]` — evento `execution-constraint-registry-attached`  
3. `metadata.customAttributes.executionConstraintRegistryId`

O Context permanece exclusivamente objeto de transporte.
