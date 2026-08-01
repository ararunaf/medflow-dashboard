# EPC-24 — Execution State Model

**Sprint:** EPC-24 Sprint 04 — Execution State Machine Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)

---

## 1. Modelos canônicos (estruturais)

| # | Modelo | Papel |
|---|--------|-------|
| 1 | `ExecutionState` | Estado corrente da máquina |
| 2 | `ExecutionStateTransition` | Aresta percorrida (from → to) |
| 3 | `ExecutionLifecycle` | Agregado canônico da máquina |
| 4 | `ExecutionStatus` | Enumeração dos estados possíveis |
| 5 | `ExecutionStateHistory` | Histórico de transições |
| 6 | `ExecutionStateMetadata` | Metadados estruturais |
| 7 | `ExecutionStateCapabilities` | Capacidades embutidas (sem Engines) |
| 8 | `ExecutionStateDefinition` | Definição estrutural de um estado |
| 9 | `ExecutionTransitionRule` | Aresta permitida do grafo estrutural |
| 10 | `ExecutionTransitionResult` | Resultado estrutural de `transition()` |

**Total: 10 modelos canônicos.**

Nenhum modelo contém regras de negócio TISS / clínicas / contratuais.

---

## 2. Estados estruturais

| Status | Terminal | Ordem |
|--------|----------|-------|
| `Created` | Não | 0 |
| `Pending` | Não | 1 |
| `Resolving` | Não | 2 |
| `Ready` | Não | 3 |
| `Running` | Não | 4 |
| `Waiting` | Não | 5 |
| `Paused` | Não | 6 |
| `Completed` | Sim | 7 |
| `Cancelled` | Sim | 8 |
| `Failed` | Sim | 9 |

Nenhuma ação ocorre durante as transições — apenas mudança estrutural de status + registro em history.

---

## 3. Grafo estrutural (resumo)

```
Created → Pending → Resolving → Ready → Running → Completed
   │         │          │         │        │
   └─────────┴──────────┴─────────┴────────┴─→ Cancelled | Failed

Running ↔ Waiting
Running ↔ Paused
Ready → Paused → Running | Ready
```

`ExecutionTransitionRule` declara arestas válidas do grafo.  
Isso **não** é regra de negócio — é definição estrutural do ciclo de vida.

---

## 4. Separação Context × State Machine

| Concern | Onde vive |
|---------|-----------|
| Transporte / refs / pipeline attachment | Execution Context |
| Ciclo de vida / status / history de estados | Execution State Machine |

O Context recebe apenas referências opacas (`stateMachineId`, `executionState`).  
Toda informação de ciclo de vida é obtida exclusivamente via `ExecutionStateMachinePort`.
