# EPC-24 — Environment Architecture

**Sprint:** EPC-24 Sprint 14 — Execution Environment Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application (demo/health-query)
        ↓
ExecutionEnvironmentRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (in-memory)
        ↑
Factory
        ↑
Provider (createExecutionEnvironmentRegistryPort)
```

---

## 2. Integridade arquitetural

| Princípio | Status |
|-----------|--------|
| Application depende só do Port | ✅ |
| Adapter implementa o Port | ✅ |
| Store in-memory apenas | ✅ |
| Factory materializa adapters | ✅ |
| Provider inverte dependência | ✅ |
| Orchestrator usa Port exclusivamente | ✅ |
| Context = transporte | ✅ |
| Sem acoplamento direto a Engines | ✅ |
| Sem seleção / provisionamento / ativação | ✅ |
| Enterprise Foundation congelada intacta | ✅ |

---

## 3. Desacoplamento

- Environment Registry **não** conhece Engines  
- Engines **não** conhecem Environment Registry  
- Capability / Dependency / Policy / Constraint / Requirement / Resource Registry permanecem independentes  
- Pipeline Resolver / Context / State Machine / Event Bus / Registry / Trace intactos  
- Integração apenas via Ports  

---

## 4. Store

- `DefaultExecutionEnvironmentRegistryStore` — Map in-process  
- Sem banco · Sem Redis · Sem cache distribuído · Sem HTTP  

---

## 5. Orchestrator (ponto de integração)

Após Resource Registry:

1. `registerEnvironmentRegistryForContext(...)`  
2. `attachEnvironmentRegistryToExecutionContext(...)`  

O Context recebe apenas:

- referência `executionEnvironmentRegistryId`  
- histórico `execution-environment-registry-attached`  
- `metadata.customAttributes.executionEnvironmentRegistryId`  

Nenhuma Engine é executada. Nenhum ambiente é selecionado ou ativado.

---

## 6. Módulo

```
src/lib/enterprise/execution-environment-registry/
  ports/     — Port, models, types, identity
  store/     — contrato + Default in-memory
  adapters/  — Default + Mock + helpers
  factory/   — ExecutionEnvironmentRegistryFactory
  providers/ — createExecutionEnvironmentRegistryPort
  demo/      — health summary (Application PoC)
  index.ts
```
