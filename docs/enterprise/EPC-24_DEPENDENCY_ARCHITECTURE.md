# EPC-24 — Dependency Architecture

**Sprint:** EPC-24 Sprint 09 — Execution Dependency Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application (demo/health-query)
        ↓
ExecutionDependencyRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (in-memory)
        ↑
Factory
        ↑
Provider (createExecutionDependencyRegistryPort)
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
| Sem resolução / ordenação / DAG | ✅ |
| Foundation EPC-00–23 intacta | ✅ |

---

## 3. Desacoplamento

- Dependency Registry **não** conhece Engines  
- Engines **não** conhecem Dependency Registry  
- Capability Registry permanece independente  
- Pipeline Resolver / Context / State Machine / Event Bus / Registry / Trace intactos  
- Integração apenas via Ports  

---

## 4. Store

- `DefaultExecutionDependencyRegistryStore` — Map in-process  
- Sem banco · Sem Redis · Sem cache distribuído · Sem HTTP  

---

## 5. Orchestrator

Novo fluxo estrutural após Capability Registry:

1. `registerDependencyRegistryForContext()`  
2. `attachDependencyRegistryToExecutionContext()`  

Flags:

- `dependsOnExecutionDependencyRegistry: true`
- `usesExecutionDependencyRegistryStructurally: true`
