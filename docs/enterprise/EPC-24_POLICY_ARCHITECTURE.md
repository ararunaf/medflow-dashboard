# EPC-24 — Policy Architecture

**Sprint:** EPC-24 Sprint 10 — Execution Policy Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application (demo/health-query)
        ↓
ExecutionPolicyRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (in-memory)
        ↑
Factory
        ↑
Provider (createExecutionPolicyRegistryPort)
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
| Sem interpretação / avaliação / Rule Engine | ✅ |
| Foundation EPC-00–23 intacta | ✅ |

---

## 3. Desacoplamento

- Policy Registry **não** conhece Engines  
- Engines **não** conhecem Policy Registry  
- Capability Registry / Dependency Registry permanecem independentes  
- Pipeline Resolver / Context / State Machine / Event Bus / Registry / Trace intactos  
- Integração apenas via Ports  

---

## 4. Store

- `DefaultExecutionPolicyRegistryStore` — Map in-process  
- Sem banco · Sem Redis · Sem cache distribuído · Sem HTTP  

---

## 5. Orchestrator (Sprint 10)

O Canonical Execution Orchestrator:

1. Injeta `ExecutionPolicyRegistryPort`  
2. Registra bootstrap estrutural (`structural-platform-policies`)  
3. Anexa `executionPolicyRegistryId` ao Context via `updateContext`  
4. **Não** interpreta políticas  
5. **Não** aplica regras  
6. **Não** executa Engines  

Flags:

- `dependsOnExecutionPolicyRegistry: true`  
- `usesExecutionPolicyRegistryStructurally: true`
