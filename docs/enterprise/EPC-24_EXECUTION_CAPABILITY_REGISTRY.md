# EPC-24 — Execution Capability Registry Foundation

**Sprint:** EPC-24 Sprint 08 — Execution Capability Registry Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar o Registro Canônico de Capacidades de Execução — módulo responsável **exclusivamente** por representar estruturalmente as capacidades disponíveis para execução.

Esta Sprint **não** executa qualquer Engine.  
**Não** implementa descoberta automática.  
**Não** utiliza reflexão.  
**Não** utiliza plugins.  
**Não** utiliza carregamento dinâmico.

Toda implementação é exclusivamente estrutural.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution Capability Registry
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 08):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Criar Execution Event Bus  
5. Registrar Execution no Registry  
6. Criar Execution Trace  
7. Registrar Capability Registry  
8. Anexar `executionCapabilityRegistryId` ao Context  
9. Devolver Context enriquecido  

Nenhuma Engine é invocada. Nenhuma capacidade é executada. Nenhuma descoberta automática ocorre.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionCapabilityRegistryPort
  → Adapter (Default | Mock)
    → Store (in-memory)
      ← Factory
        ← Provider (createExecutionCapabilityRegistryPort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `registerCapability()` | Registra capacidade estrutural in-memory |
| `getCapability()` | Obtém capacidade por id / key |
| `listCapabilities()` | Lista capacidades estruturais |
| `findCapabilities()` | Busca capacidades por filtro estrutural |
| `statistics()` | Estatísticas estruturais do catálogo |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação executa capacidades, acessa Engines ou realiza descoberta automática.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo EPC-24 atualizado além do novo Capability Registry  
- Integração exclusiva via `ExecutionCapabilityRegistryPort`  
- Execution Context permanece objeto de transporte (apenas referência `executionCapabilityRegistryId`)  
- Pipeline Resolver, Context, State Machine, Event Bus, Registry e Trace permanecem intactos e independentes  
- Enterprise Foundation (EPC-00–23) permanece congelada  

---

## 6. Proibições (cumpridas)

- Sem OCR / Parser XML / Rule Engine / Workflow / AI / TISS / FHIR / DICOM  
- Sem banco / Supabase / Redis / cache distribuído / persistência  
- Sem plugins / reflexão / carregamento dinâmico / descoberta automática  
- Sem Workers / HTTP / filas / Pub/Sub  
- Sem execução de capacidades / Engines  

---

## 7. Localização

`src/lib/enterprise/execution-capability-registry/`
