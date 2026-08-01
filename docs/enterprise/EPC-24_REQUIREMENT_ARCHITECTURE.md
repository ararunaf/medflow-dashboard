# EPC-24 — Requirement Architecture

**Sprint:** EPC-24 Sprint 12 — Execution Requirement Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas

```
Application (demo/health-query)
        ↓
ExecutionRequirementRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (in-memory)
        ↑
Factory
        ↑
Provider (createExecutionRequirementRegistryPort)
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
| Sem validação / pré-condições / Rule Engine | ✅ |
| Foundation EPC-00–23 intacta | ✅ |

---

## 3. Desacoplamento

- Requirement Registry **não** conhece Engines  
- Engines **não** conhecem Requirement Registry  
- Capability Registry / Dependency Registry / Policy Registry permanecem independentes  
- Pipeline Resolver / Context / State Machine / Event Bus / Registry / Trace intactos  
- Integração apenas via Ports  

---

## 4. Store

- `DefaultExecutionRequirementRegistryStore` — Map in-process  
- Sem banco · Sem Redis · Sem cache distribuído · Sem HTTP  

---

## 5. Orchestrator (Sprint 12)

O Canonical Execution Orchestrator:

1. Injeta `ExecutionRequirementRegistryPort`  
2. Registra bootstrap estrutural (`structural-platform-requirements`)  
3. Anexa `executionRequirementRegistryId` ao Context via `updateContext`  
4. **Não** valida requisitos  
5. **Não** bloqueia execução  
6. **Não** executa Engines  

Flags:

- `dependsOnExecutionRequirementRegistry: true`  
- `usesExecutionRequirementRegistryStructurally: true`
