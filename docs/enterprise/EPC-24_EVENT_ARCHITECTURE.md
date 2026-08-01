# EPC-24 — Execution Event Architecture

**Sprint:** EPC-24 Sprint 05 — Execution Event Bus Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Hierarquia obrigatória

```
Application
  → ExecutionEventBusPort
    → Adapter (Default | Mock)
      → Store (in-memory)
        ← Factory
          ← Provider (createExecutionEventBusPort)
```

Inversão de dependência: Application depende **apenas** do Port.

---

## 2. Mapa de pastas

```
src/lib/enterprise/execution-event-bus/
├── index.ts
├── ports/
│   ├── execution-event-bus-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   └── index.ts
├── adapters/
│   ├── default-execution-event-bus-adapter.ts
│   ├── mock-execution-event-bus-adapter.ts
│   ├── event-bus-helpers.ts
│   └── index.ts
├── store/
│   ├── execution-event-bus-store.ts
│   ├── default-execution-event-bus-store.ts
│   └── index.ts
├── factory/
│   ├── execution-event-bus-factory.ts
│   └── index.ts
├── providers/
│   ├── create-execution-event-bus-port.ts
│   └── index.ts
└── demo/
    ├── execution-event-bus-health-query.ts
    └── index.ts
```

---

## 3. Integração Orchestrator ↔ Context ↔ Resolver ↔ State Machine ↔ Event Bus

```
┌─────────────────────────────────────────────────────────────┐
│ Canonical Execution Orchestrator                            │
│                                                             │
│  1. createContext()            → ExecutionContextPort       │
│  2. resolvePipeline()          → PipelineResolverPort       │
│  3. createStateMachine()       → ExecutionStateMachinePort  │
│  4. attach SM ref to Context   → ExecutionContextPort       │
│  5. createEventBus()           → ExecutionEventBusPort      │
│  6. attach Event Bus ref       → ExecutionContextPort       │
│  7. structural transitions     → ExecutionStateMachinePort  │
│  8. attach pipeline            → ExecutionContextPort       │
│  9. structural walk            → (sem Engines)              │
│ 10. finalize Context           → ExecutionContextPort       │
│ 11. return enriched Context + CanonicalExecutionResult      │
└─────────────────────────────────────────────────────────────┘
```

### Invariantes

1. Orchestrator utiliza o Event Bus **exclusivamente** via `ExecutionEventBusPort`.  
2. Execution Context permanece objeto de **transporte** (ref `eventBusId` apenas).  
3. Nenhum evento é publicado pelo Orchestrator nesta sprint.  
4. Pipeline Resolver e State Machine **não conhecem** o Event Bus.  
5. Nenhum Engine Foundation é invocado.  
6. Enterprise Foundation (EPC-00–23) permanece congelada.  

---

## 4. Desacoplamento

| Componente | Conhece Event Bus? |
|------------|-------------------|
| Canonical Execution Orchestrator | Sim (via Port) |
| Execution Context | Não (apenas ref opaca) |
| Execution State Machine | Não |
| Pipeline Resolver | Não |
| OCR / AI / Rule / Mapping Engines | Não |

---

## 5. Store

- Exclusivamente in-memory (`DefaultExecutionEventBusStore`)  
- Sem persistência externa  
- Sem filas / streams / realtime  

---

## 6. Aderência ECS-01

Camadas obrigatórias presentes e isoladas:

- Port → Adapter → Store → Factory → Provider  
- PoC Application (`demo/`) depende apenas do Port  
- Capabilities declaram explicitamente o que **não** é implementado  
