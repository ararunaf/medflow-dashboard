# EPC-24 — Execution State Architecture

**Sprint:** EPC-24 Sprint 04 — Execution State Machine Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Hierarquia obrigatória

```
Application
  → ExecutionStateMachinePort
    → Adapter (Default | Mock)
      → Store (in-memory)
        ← Factory
          ← Provider (createExecutionStateMachinePort)
```

Inversão de dependência: Application depende **apenas** do Port.

---

## 2. Mapa de pastas

```
src/lib/enterprise/execution-state-machine/
├── index.ts
├── ports/
│   ├── execution-state-machine-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   └── index.ts
├── adapters/
│   ├── default-execution-state-machine-adapter.ts
│   ├── mock-execution-state-machine-adapter.ts
│   ├── state-machine-helpers.ts
│   └── index.ts
├── store/
│   ├── execution-state-machine-store.ts
│   ├── default-execution-state-machine-store.ts
│   └── index.ts
├── factory/
│   ├── execution-state-machine-factory.ts
│   └── index.ts
├── providers/
│   ├── create-execution-state-machine-port.ts
│   └── index.ts
└── demo/
    ├── execution-state-machine-health-query.ts
    └── index.ts
```

---

## 3. Integração Orchestrator ↔ Context ↔ Resolver ↔ State Machine

```
┌─────────────────────────────────────────────────────────────┐
│ Canonical Execution Orchestrator                            │
│                                                             │
│  1. createContext()            → ExecutionContextPort       │
│  2. resolvePipeline()          → PipelineResolverPort       │
│  3. createStateMachine()       → ExecutionStateMachinePort  │
│  4. attach SM ref to Context   → ExecutionContextPort       │
│  5. structural transitions     → ExecutionStateMachinePort  │
│  6. attach pipeline            → ExecutionContextPort       │
│  7. structural walk            → (sem Engines)              │
│  8. finalize Context           → ExecutionContextPort       │
│  9. return enriched Context + CanonicalExecutionResult      │
└─────────────────────────────────────────────────────────────┘
```

### Invariantes

1. Orchestrator controla o ciclo de vida **exclusivamente** via Execution State Machine.  
2. Execution Context permanece objeto de **transporte**.  
3. Pipeline Resolver **não recebe** a State Machine nem o conteúdo do Context.  
4. Nenhum Engine Foundation é invocado.  
5. Enterprise Foundation (EPC-00–23) permanece intacta.  
6. Pipeline Resolver e Execution Context **não são alterados** nesta Sprint.  
7. State Machine permanece **desacoplada** dos Engines.  

---

## 4. Capabilities do Orchestrator (Sprint 04)

```
dependsOnPipelineResolver: true
resolvesPipelineDynamically: true
dependsOnExecutionContext: true
usesExecutionContextExclusively: true
dependsOnExecutionStateMachine: true
controlsLifecycleViaExecutionStateMachine: true
noDirectEngineCoupling: true
```

---

## 5. Aderência ECS-01

| Camada | Responsabilidade |
|--------|------------------|
| Application (demo) | Consome apenas o Port |
| Port | Contrato estrutural único |
| Adapter | Implementação in-memory |
| Store | Persistência estrutural in-process |
| Factory | Materializa adapter por provider id |
| Provider | `createExecutionStateMachinePort()` |
