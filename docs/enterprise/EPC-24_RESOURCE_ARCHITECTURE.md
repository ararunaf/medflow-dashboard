# EPC-24 — Resource Architecture

**Sprint:** EPC-24 Sprint 13 — Execution Resource Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application (demo/health-query)
        ↓
ExecutionResourceRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (in-memory)
        ↑
Factory
        ↑
Provider (createExecutionResourceRegistryPort)
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
| Sem alocação / reserva / balanceamento / scheduling | ✅ |
| Enterprise Foundation congelada intacta | ✅ |

---

## 3. Desacoplamento

- Resource Registry **não** conhece Engines  
- Engines **não** conhecem Resource Registry  
- Capability / Dependency / Policy / Constraint / Requirement Registry permanecem independentes  
- Pipeline Resolver / Context / State Machine / Event Bus / Registry / Trace intactos  
- Integração apenas via Ports  

---

## 4. Store

- `DefaultExecutionResourceRegistryStore` — Map in-process  
- Sem banco · Sem Redis · Sem cache distribuído · Sem HTTP  

---

## 5. Orchestrator (Sprint 13)

O Canonical Execution Orchestrator:

1. Injeta `ExecutionResourceRegistryPort`  
2. Registra bootstrap estrutural (`structural-platform-resources`)  
3. Anexa `executionResourceRegistryId` ao Context via `updateContext`  
4. **Não** aloca recursos  
5. **Não** reserva recursos  
6. **Não** balanceia carga  
7. **Não** executa Engines  

Flags:

- `dependsOnExecutionResourceRegistry: true`  
- `usesExecutionResourceRegistryStructurally: true`
