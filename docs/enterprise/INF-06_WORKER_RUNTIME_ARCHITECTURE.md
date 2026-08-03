# INF-06 — Worker Runtime Architecture

**Sprint:** INF-06 — Enterprise Worker Runtime Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Data:** 03/08/2026

---

## 1. Posição na Enterprise Foundation

```
Produto
  → Enterprise Runtime
      → getWorkerRuntimePort()
          → WorkerRuntimePort
              → DefaultWorkerRuntimeAdapter | EnterpriseWorkerRuntimeAdapter | MockWorkerRuntimeAdapter
                  → InMemoryWorkerRuntimeStore
                      → Canonical Worker Result

Queue Runtime ──(prepared)──► getWorkerRuntimePort()   [sem allocate/register]
Worker Runtime ──(prepared)──► getQueueRuntimePort()   [sem enqueue/dequeue]
TISS Runtime   ──(prepared)──► getWorkerRuntimePort()   [sem utilização funcional]
```

---

## 2. Resolução oficial

```
createWorkerRuntimePort({ provider })
  → WorkerRuntimeFactory
      → WorkerRuntimeRegistry.has(provider)?
          → MockWorkerRuntimeAdapter   (mock | test)
          → DefaultWorkerRuntimeAdapter (default | enterprise)
```

- Default da fundação: `enterprise`
- Providers desconhecidos: falha explícita (sem fallback silencioso)
- `EnterpriseWorkerRuntimeAdapter` é alias de `DefaultWorkerRuntimeAdapter`

---

## 3. Contratos canônicos

| Modelo | Papel |
|--------|-------|
| `CanonicalWorker` | Worker estrutural (`realWorkers: false`) |
| `CanonicalWorkerTask` | Task referencial (`tasksExecuted: false`) |
| `CanonicalWorkerExecution` | Execução referencial (nunca processada) |
| `CanonicalWorkerResult` | Envelope de operação (`runtimeReady: true`) |
| `CanonicalWorkerStatistics` | Contagens in-memory + zeros de backends reais |
| `CanonicalWorkerHealth` | Saúde estrutural + `queueRuntimeOk` |
| `CanonicalWorkerCapabilities` | Declaração estática de capacidades / negações |

---

## 4. Fronteiras

| Módulo | Relação |
|--------|---------|
| `worker-foundation` (INF-02) | Prefixo estrutural legado — **não** é o Worker Runtime Enterprise |
| `queue-runtime` (INF-05) | Dependência preparada bidirecional — sem processamento |
| `scheduler-foundation` | **Não** alterado / **não** usado |
| `message-queue` (INF-01) | Intacto |
| Capture / OCR / XML* / XSD / Namespace | Intocados além de deps TISS |

---

## 5. Checklist ECS-01

| Item | Status |
|------|--------|
| Port único (`WorkerRuntimePort`) | ✅ |
| Canonical Models | ✅ |
| Capabilities / Identity | ✅ |
| Provider (`createWorkerRuntimePort`) | ✅ |
| Factory única | ✅ |
| Registry único | ✅ |
| Default + Enterprise + Mock Adapters | ✅ |
| InMemory Store | ✅ |
| Demo health | ✅ |
| Barrel `index.ts` | ✅ |
| Sem Provider/Adapter/Factory/Registry/Runtime paralelo | ✅ |
| Sem bypass de produto | ✅ |
