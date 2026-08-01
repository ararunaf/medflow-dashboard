# EPC-24 — Policy Model

**Sprint:** EPC-24 Sprint 10 — Execution Policy Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionPolicy` | `execution-policy` | Entrada canônica de política |
| `ExecutionPolicyDefinition` | `execution-policy-definition` | Definição estrutural opaca |
| `ExecutionPolicyMetadata` | `execution-policy-metadata` | Metadados estruturais |
| `ExecutionPolicyReference` | `execution-policy-reference` | Referência opaca |
| `ExecutionPolicyCategory` | `execution-policy-category` | Categoria estrutural |
| `ExecutionPolicyScope` | `execution-policy-scope` | Escopo estrutural |
| `ExecutionPolicyRegistry` | `execution-policy-registry` | Agregado raiz do catálogo |
| `ExecutionPolicyCapabilities` | `execution-policy-capabilities` | Flags estruturais embutidas |
| `ExecutionPolicyStatistics` | `execution-policy-statistics` | Estatísticas in-memory |
| `ExecutionPolicyHealth` | `execution-policy-health` | Saúde estrutural |
| `ExecutionPolicyResult` | `execution-policy-result` | Resultado estrutural |
| `ExecutionPolicyFilter` | `execution-policy-filter` | Filtro de consulta |

**Total:** 12 modelos canônicos (incluindo o agregado `ExecutionPolicyRegistry`).

Nenhum modelo contém regra de negócio.

---

## 2. Flags estruturais obrigatórias

Em toda entrada / registry / port:

- `policyInterpretationImplemented: false`
- `ruleEngineInvoked: false`
- `decisionEngineInvoked: false`
- `rulesEnforced: false`
- `rulesApplied: false`
- `policiesEvaluated: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`
- `structuralPolicyRegistryOnly: true`
- `implementsPolicyEvaluation: false`
- `implementsRuleExecution: false`
- `implementsDecisionEngine: false`

Na política / scope:

- `policyInterpreted: false`
- `evaluable: false`
- `declared: true` (disponível estruturalmente, não avaliável)

---

## 3. Relação com Execution Context

O Context **não** embute o Policy Registry.  
Apenas referencia via:

1. `references[]` — `{ name: "executionPolicyRegistryId", value: "<id>" }`  
2. `history[]` — evento `execution-policy-registry-attached`  
3. `metadata.customAttributes.executionPolicyRegistryId`

O Context permanece exclusivamente objeto de transporte.
