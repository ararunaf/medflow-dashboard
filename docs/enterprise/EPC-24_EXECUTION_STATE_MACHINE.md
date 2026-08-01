# EPC-24 — Execution State Machine Foundation

**Sprint:** EPC-24 Sprint 04 — Execution State Machine Foundation  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0` (`e6e0eda61e47102a8b8853a62640e0788946ec27`)  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Objetivo

Criar a Máquina Canônica de Estados da Execução — módulo responsável **exclusivamente** pelo ciclo de vida estrutural de uma execução.

Esta Sprint **não** executa qualquer etapa do pipeline.  
Apenas define e controla transições estruturais de estado.

---

## 2. Fluxo oficial

```
Execution Context
  ↓
Execution State Machine
  ↓
Execution Context atualizado (referência estrutural)
```

Fluxo do Orchestrator (Sprint 04):

1. Criar Execution Context  
2. Resolver Pipeline  
3. Criar Execution State Machine  
4. Anexar estado inicial ao Context (referência)  
5. Aplicar transições estruturais de ciclo de vida  
6. Devolver Context enriquecido  

Nenhum Engine é invocado. Nenhum processamento real ocorre.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionStateMachinePort
    → Adapter (Default | Mock)
      → Store (in-memory)
        ← Factory
          ← Provider (createExecutionStateMachinePort)
```

---

## 4. Port — operações estruturais

| Operação | Descrição |
|----------|-----------|
| `createStateMachine()` | Cria máquina no estado inicial (`Created`) |
| `transition()` | Transição estrutural (sem ações de negócio) |
| `getCurrentState()` | Estado corrente |
| `getHistory()` | Histórico de transições |
| `health()` | Prontidão |
| `capabilities()` | Capacidades estáticas |

Nenhuma operação executa OCR, IA, Mapping, regras, parsers ou Engines.

---

## 5. Integração

- **Canonical Execution Orchestrator** — único módulo atualizado  
- Integração exclusiva via `ExecutionStateMachinePort`  
- Execution Context permanece objeto de transporte  
- Pipeline Resolver permanece intacto e independente  
- Enterprise Foundation (EPC-00–23) permanece congelada  

---

## 6. Proibições (cumpridas)

Não implementado: OCR, IA, Rule Engine, Workflow, Parser XML, Validações, Contratos, Operadoras, Banco, Supabase, Workers, HTTP, Filas, Execução paralela, Persistência externa.

---

## 7. Localização

```
src/lib/enterprise/execution-state-machine/
scripts/enterprise/tests/execution-state-machine-engine.test.ts
docs/enterprise/EPC-24_EXECUTION_STATE_MACHINE.md
docs/enterprise/EPC-24_STATE_MODEL.md
docs/enterprise/EPC-24_STATE_ARCHITECTURE.md
docs/enterprise/EPC-24_STATE_CERTIFICATION.md
```
