# INF-02 — Worker Model

**Sprint:** INF-02 — Worker Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Baseline:** `medicflow-enterprise-foundation-v1.0.0`

---

## 1. Modelos canônicos (8)

| Modelo | Kind | Propósito |
|--------|------|-----------|
| `CanonicalWorker` | `canonical-worker` | Registro estrutural do Worker |
| `CanonicalWorkerIdentity` | `canonical-worker-identity` | Identidade opaca (`executionWorkerId`, key, name) |
| `CanonicalWorkerStatus` | `canonical-worker-status` | Status estrutural (registered/started/stopped/paused/resumed) |
| `CanonicalWorkerCapabilities` | `canonical-worker-capabilities` | Declaração do que NÃO é feito |
| `CanonicalWorkerStatistics` | `canonical-worker-statistics` | Contagens in-memory |
| `CanonicalWorkerHealth` | `canonical-worker-health` | Saúde estrutural do store |
| `CanonicalWorkerConfiguration` | `canonical-worker-configuration` | Configuração opaca + `queuePortContract: ExecutionQueuePort` |
| `CanonicalWorkerReference` | `canonical-worker-reference` | Referências estruturais anexadas |

---

## 2. Identidade

- ID canônico: `execution-worker-####`
- Alias anexado ao Context: `executionWorkerId`
- Referência opcional à fila: `executionMessageQueueId` (via `ExecutionQueuePort` apenas)

---

## 3. Status estruturais

| Valor | Significado |
|-------|-------------|
| `registered-structural` | Registrado no store |
| `started-structural` | Marcado como started (sem threads) |
| `stopped-structural` | Marcado como stopped |
| `paused-structural` | Marcado como paused |
| `resumed-structural` | Marcado como resumed |
| `unregistered-structural` | Removido do store |

Nenhum status implica execução real.

---

## 4. Flags de negação (obrigatórias)

Em modelos, resultados e capabilities:

- `executionPerformed: false`
- `threadsSpawned: false`
- `backgroundJobsStarted: false`
- `concurrencyEnabled: false`
- `asynchronousProcessing: false`
- `messagesConsumed: false`
- `processingPerformed: false`
- `realWorkerBackend: false`
- `enginesInvoked: false`
- `implementsBullMq / Hangfire / AzureWorkers / AwsLambda / CloudflareWorkers / KubernetesJobs / WorkerThreads / BackgroundServices: false`
- `usesExecutionQueuePortOnly: true`
- `decoupledFromEngines: true`

---

## 5. Catálogo embutido

`STRUCTURAL_WORKER_FOUNDATION_CAPABILITY` — constante canônica aplicada a todo `CanonicalWorker`.
