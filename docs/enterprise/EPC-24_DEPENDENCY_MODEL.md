# EPC-24 — Dependency Model

**Sprint:** EPC-24 Sprint 09 — Execution Dependency Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionDependency` | `execution-dependency` | Entrada canônica de dependência |
| `ExecutionDependencyDefinition` | `execution-dependency-definition` | Definição estrutural opaca |
| `ExecutionDependencyMetadata` | `execution-dependency-metadata` | Metadados estruturais |
| `ExecutionDependencyReference` | `execution-dependency-reference` | Referência opaca |
| `ExecutionDependencyGraph` | `execution-dependency-graph` | Grafo estrutural (não resolvido) |
| `ExecutionDependencyNode` | `execution-dependency-node` | Nó estrutural |
| `ExecutionDependencyEdge` | `execution-dependency-edge` | Aresta estrutural |
| `ExecutionDependencyRegistry` | `execution-dependency-registry` | Agregado raiz do catálogo |
| `ExecutionDependencyCapabilities` | `execution-dependency-capabilities` | Flags estruturais embutidas |
| `ExecutionDependencyStatistics` | `execution-dependency-statistics` | Estatísticas in-memory |
| `ExecutionDependencyHealth` | `execution-dependency-health` | Saúde estrutural |
| `ExecutionDependencyResult` | `execution-dependency-result` | Resultado estrutural |
| `ExecutionDependencyFilter` | `execution-dependency-filter` | Filtro de consulta |

**Total:** 13 modelos canônicos (incluindo o agregado `ExecutionDependencyRegistry`).

Nenhum modelo contém regra de negócio.

---

## 2. Flags estruturais obrigatórias

Em toda entrada / registry / port:

- `dependencyResolutionImplemented: false`
- `topologicalSortImplemented: false`
- `dagSolverImplemented: false`
- `automaticOrderingImplemented: false`
- `enginesInvoked: false`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`
- `structuralDependencyRegistryOnly: true`

No grafo / dependência:

- `dependencyResolved: false`
- `ordered: false`
- `dagComputed: false`
- `topologicalSortApplied: false`

---

## 3. Relação com Execution Context

O Context **não** embute o Dependency Registry.  
Apenas referencia via:

1. `references[]` — `name: "executionDependencyRegistryId"`
2. `metadata.customAttributes.executionDependencyRegistryId`
3. `history[]` — evento `execution-dependency-registry-attached`

Consulta de dependências ocorre exclusivamente via `ExecutionDependencyRegistryPort`.

---

## 4. Constante canônica

`STRUCTURAL_DEPENDENCY_REGISTRY_CAPABILITY` — capacidades embutidas em toda entrada do registry.
