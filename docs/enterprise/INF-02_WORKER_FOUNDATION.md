# INF-02 — Worker Foundation

**Sprint:** INF-02 — Worker Foundation (Fase B — Enterprise Infrastructure)  
**Data:** 01/08/2026  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`  
**Padrão:** ECS-01 Ports & Adapters  
**Referência INF-01:** `080b853183212f0ec5ce898f90527f31259ee8f4`  
**Resultado esperado:** infraestrutura estrutural de Workers; comportamento do produto inalterado

---

## 1. Objetivo

Criar a infraestrutura canônica de Workers da plataforma Enterprise.

O objetivo **NÃO** é executar processamento.

O objetivo é estabelecer a arquitetura oficial para execução futura de tarefas assíncronas.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- alterar qualquer módulo EPC-00 até EPC-24 (exceto Canonical Execution Orchestrator);
- alterar Rule Engine, Workflow, OCR, IA, Capture, Processing, TISS;
- alterar qualquer tela do produto;
- alterar banco de dados / criar migrations;
- criar APIs REST;
- implementar processamento concorrente;
- executar Workers / Threads / Worker Threads / Background Services;
- integrar BullMQ, Hangfire, Azure Workers, AWS Lambda, Cloudflare Workers, Kubernetes Jobs;
- executar OCR / IA em background;
- consumir / processar mensagens.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionWorkerPort
    → Adapter (DefaultExecutionWorkerAdapter | MockExecutionWorkerAdapter)
      → InMemoryExecutionWorkerStore
        ← ExecutionWorkerFactory
          ← ExecutionWorkerProvider
```

Integração com filas: exclusivamente via `ExecutionQueuePort` (INF-01).

---

## 4. Módulo

`src/lib/enterprise/worker-foundation/`

| Camada | Artefato |
|--------|----------|
| Port | `ExecutionWorkerPort` |
| Adapters | `DefaultExecutionWorkerAdapter`, `MockExecutionWorkerAdapter` |
| Store | `InMemoryExecutionWorkerStore` |
| Factory | `ExecutionWorkerFactory` |
| Provider | `ExecutionWorkerProvider` / `createExecutionWorkerPort` |
| Consumer refs | OCR Pipeline + IA (estrutural) |

---

## 5. Operações do Port

- `registerWorker()` — estrutural (não executa)
- `unregisterWorker()` — estrutural
- `startWorker()` — estrutural (não inicia threads)
- `stopWorker()` — estrutural
- `pauseWorker()` — estrutural
- `resumeWorker()` — estrutural
- `getWorker()` — cria/obtém Worker estrutural
- `statistics()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` — declaração estática de capacidades

Nenhuma operação executa lógica real de Workers.

---

## 6. Integração com Orchestrator

Fluxo estrutural:

```
Execution Context
  → … registries …
  → Message Queue
  → Worker Foundation
  → Context enriquecido (executionWorkerId)
```

Anexa exclusivamente `executionWorkerId`. Nenhum Worker é iniciado.

---

## 7. Consumidores estruturais futuros

- `OCR_PIPELINE_WORKER_FOUNDATION_CONSUMER_REFERENCE`
- `AI_WORKER_FOUNDATION_CONSUMER_REFERENCE`

Nenhuma integração real. Nenhum processamento.

---

## 8. Testes

```bash
npm run enterprise:worker-foundation:test
```

---

## 9. Documentação correlata

- `INF-02_WORKER_MODEL.md`
- `INF-02_WORKER_ARCHITECTURE.md`
- `INF-02_WORKER_CERTIFICATION.md`
