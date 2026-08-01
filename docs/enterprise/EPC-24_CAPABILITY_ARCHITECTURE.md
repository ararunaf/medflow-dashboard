# EPC-24 — Execution Capability Registry Architecture

**Sprint:** EPC-24 Sprint 08  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Camadas

```
Application (demo health query)
        ↓ depende exclusivamente do Port
ExecutionCapabilityRegistryPort
        ↓
Adapter (Default | Mock)
        ↓
Store (DefaultExecutionCapabilityRegistryStore — Map in-memory)
        ↑
Factory (ExecutionCapabilityRegistryFactory)
        ↑
Provider (createExecutionCapabilityRegistryPort)
```

---

## 2. Componentes

| Componente | Responsabilidade |
|------------|------------------|
| Port | Contrato estrutural único |
| Default Adapter | Implementação in-process |
| Mock Adapter | Testes / homologação offline |
| Store | Catálogo in-memory (sem persistência) |
| Factory | Seleção do adapter por provider |
| Provider | Inversão de dependência |
| Demo Application | PoC Application → Port |

---

## 3. Integração com Orchestrator

O Canonical Execution Orchestrator:

1. Injeta `ExecutionCapabilityRegistryPort` via Factory / Runtime  
2. Após Trace, chama `registerCapabilityRegistryForContext`  
3. Anexa `executionCapabilityRegistryId` ao Context via `ExecutionContextPort.updateContext`  
4. Declara `dependsOnExecutionCapabilityRegistry: true`  
5. Declara `usesExecutionCapabilityRegistryStructurally: true`  

Nenhum outro módulo EPC-24 é alterado.  
Nenhuma Engine é acoplada diretamente.

---

## 4. Fronteiras congeladas

| Camada | Status |
|--------|--------|
| Enterprise Foundation (EPC-00–23) | Intacta |
| Pipeline Resolver / Context / SM / Event Bus / Registry / Trace | Intactos |
| Orchestrator | Atualizado (integração estrutural) |
| Capability Registry | Novo módulo |

---

## 5. Garantias arquiteturais

- Sem descoberta automática  
- Sem reflexão  
- Sem plugins  
- Sem carregamento dinâmico  
- Sem execução de capacidades  
- Sem acesso externo  
- Sem persistência / banco  
- Context permanece transporte  
- Desacoplamento total das Engines  
