# EPC-24 — Execution Context Architecture

**Sprint:** EPC-24 Sprint 03 — Execution Context Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Hierarquia obrigatória

```
Application
  → ExecutionContextPort
    → Adapter (Default | Mock)
      → Store (in-memory)
        ← Factory
          ← Provider (createExecutionContextPort)
```

Inversão de dependência: Application depende **apenas** do Port.

---

## 2. Mapa de pastas

```
src/lib/enterprise/execution-context/
├── index.ts
├── ports/
│   ├── execution-context-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   └── index.ts
├── adapters/
│   ├── default-execution-context-adapter.ts
│   ├── mock-execution-context-adapter.ts
│   ├── context-helpers.ts
│   └── index.ts
├── store/
│   ├── execution-context-store.ts
│   ├── default-execution-context-store.ts
│   └── index.ts
├── factory/
│   ├── execution-context-factory.ts
│   └── index.ts
├── providers/
│   ├── create-execution-context-port.ts
│   └── index.ts
└── demo/
    ├── execution-context-health-query.ts
    └── index.ts
```

---

## 3. Integração Orchestrator ↔ Context ↔ Resolver

```
┌─────────────────────────────────────────────────────────────┐
│ Canonical Execution Orchestrator                            │
│                                                             │
│  1. createContext()          → ExecutionContextPort         │
│  2. resolvePipeline()        → PipelineResolverPort         │
│  3. updateContext(pipeline)  → ExecutionContextPort         │
│  4. structural walk          → (sem Engines)                │
│  5. finalizeContext()        → ExecutionContextPort         │
│  6. return enriched Context + CanonicalExecutionResult      │
└─────────────────────────────────────────────────────────────┘
```

### Invariantes

1. Orchestrator cria e utiliza **exclusivamente** o Execution Context.
2. Pipeline Resolver **não recebe** o conteúdo do Context.
3. Comunicação Resolver ↔ Orchestrator apenas via interfaces canônicas.
4. Nenhum Engine Foundation é invocado.
5. Enterprise Foundation (EPC-00–23) permanece intacta.
6. Pipeline Resolver permanece intacto (sem alteração nesta Sprint).

---

## 4. Aderência ECS-01

| Requisito | Status |
|-----------|--------|
| Application → Port → Adapter → Store → Factory → Provider | ✅ |
| Default + Mock adapters | ✅ |
| `health()` + `capabilities()` | ✅ |
| Unknown provider → throw | ✅ |
| Sem vendor types no Port | ✅ |
| Sem regras clínicas / TISS no adapter/store | ✅ |
| Sem acoplamento direto entre Engines | ✅ |

---

## 5. Módulos NÃO alterados

- Enterprise Foundation (congelada)
- Pipeline Resolver
- Document Intake / Processing / Providers
- OCR / AI / Healthcare / TISS*
- Contract Rule Binding / Rule Runtime
- Capture / Operational / Workflow / Rule Engine

**Alterados nesta Sprint (permitido):**

- `execution-context/**` (novo)
- `canonical-execution-orchestrator/**` (integração estrutural)
- testes / docs / script npm
