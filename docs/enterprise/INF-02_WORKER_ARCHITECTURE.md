# INF-02 — Worker Architecture

**Sprint:** INF-02 — Worker Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Camadas ECS-01

```
Application
  → ExecutionWorkerPort
    → Adapter (DefaultExecutionWorkerAdapter | MockExecutionWorkerAdapter)
      → InMemoryExecutionWorkerStore
        ← ExecutionWorkerFactory
          ← ExecutionWorkerProvider
```

Port operations:

- `registerWorker` | `unregisterWorker`
- `startWorker` | `stopWorker` | `pauseWorker` | `resumeWorker`
- `getWorker` | `statistics` | `health` | `capabilities`

---

## 2. Integridade arquitetural

| Regra | Status |
|-------|--------|
| Application depende apenas do Port | ✅ |
| Adapters implementam exclusivamente o Port | ✅ |
| Store é in-memory estrutural | ✅ |
| Factory cria adapters (sem negócio) | ✅ |
| Provider resolve adapter (sem negócio) | ✅ |
| Sem BullMQ / Hangfire / Azure / Lambda / CF Workers / K8s Jobs | ✅ |
| Sem Threads / Worker Threads / Background Services | ✅ |
| Sem execução / concorrência / processamento assíncrono | ✅ |
| Desacoplado de OCR / IA / TISS / Engines | ✅ |
| Worker conhece exclusivamente `ExecutionQueuePort` | ✅ |
| Orchestrator usa exclusivamente `ExecutionWorkerPort` | ✅ |

---

## 3. Integração com Message Queue (INF-01)

```
ExecutionWorkerPort
  → depende apenas de ExecutionQueuePort
  → NÃO acessa adapters/stores da Message Queue
  → NÃO chama enqueue / dequeue / acknowledge
  → pode referenciar executionMessageQueueId estruturalmente
```

---

## 4. Integração com Canonical Execution Orchestrator

Ordem estrutural (INF-02):

1. Execution Context  
2. Pipeline Resolver  
3. Execution State Machine  
4. Execution Event Bus  
5. Execution Registry  
6. Execution Trace  
7. Capability Registry  
8. Dependency Registry  
9. Policy Registry  
10. Constraint Registry  
11. Requirement Registry  
12. Resource Registry  
13. Environment Registry  
14. Message Queue  
15. **Worker Foundation**  
16. Context enriquecido (`executionWorkerId`)

Anexa exclusivamente:

- referência `executionWorkerId`
- histórico `execution-worker-attached`
- metadata estrutural (sem execução)

Nenhum Worker é iniciado pelo Orchestrator.

---

## 5. Consumidores estruturais futuros

| Consumidor | Port futuro | Usa agora? |
|------------|-------------|------------|
| OCR Pipeline | `ExecutionWorkerPort` | Não |
| IA | `ExecutionWorkerPort` | Não |

---

## 6. Fronteiras congeladas

- EPC-00 … EPC-24 (exceto Orchestrator) — intactos  
- Message Queue (INF-01) — Port apenas; sem alteração funcional  
- Engines / Capture / Processing / TISS / UI / DB — intactos  
