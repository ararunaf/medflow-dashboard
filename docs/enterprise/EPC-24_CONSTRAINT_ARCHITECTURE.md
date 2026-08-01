# EPC-24 — Constraint Architecture

**Sprint:** EPC-24 Sprint 11 — Execution Constraint Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application (demo/health-query)
        ↓
ExecutionConstraintRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (in-memory)
        ↑
Factory
        ↑
Provider (createExecutionConstraintRegistryPort)
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
| Sem validação / bloqueio / Rule Engine | ✅ |
| Foundation EPC-00–23 intacta | ✅ |

---

## 3. Desacoplamento

- Constraint Registry **não** conhece Engines  
- Engines **não** conhecem Constraint Registry  
- Capability Registry / Dependency Registry / Policy Registry permanecem independentes  
- Pipeline Resolver / Context / State Machine / Event Bus / Registry / Trace intactos  
- Integração apenas via Ports  

---

## 4. Store

- `DefaultExecutionConstraintRegistryStore` — Map in-process  
- Sem banco · Sem Redis · Sem cache distribuído · Sem HTTP  

---

## 5. Orchestrator (Sprint 11)

O Canonical Execution Orchestrator:

1. Injeta `ExecutionConstraintRegistryPort`  
2. Registra bootstrap estrutural (`structural-platform-constraints`)  
3. Anexa `executionConstraintRegistryId` ao Context via `updateContext`  
4. **Não** valida restrições  
5. **Não** bloqueia execução  
6. **Não** executa Engines  

Flags:

- `dependsOnExecutionConstraintRegistry: true`  
- `usesExecutionConstraintRegistryStructurally: true`
