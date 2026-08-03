# INF-08 — Persistent Queue Runtime Architecture

**Sprint:** INF-08 — Enterprise Persistent Queue Runtime Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Data:** 03/08/2026

---

## 1. Posição na Enterprise Foundation

```
Produto
  → Enterprise Runtime
      → getPersistentQueueRuntimePort()
          → PersistentQueueRuntimePort
              → Default | Enterprise | Mock Adapter
                  → InMemoryPersistentQueueRuntimeStore
                      → Canonical Persistent Queue Result

Persistent Queue Runtime ──(prepared)──► getQueueRuntimePort()
Persistent Queue Runtime ──(prepared)──► getWorkerRuntimePort()
Persistent Queue Runtime ──(prepared)──► getSchedulerRuntimePort()
Queue Runtime            ──(prepared)──► getPersistentQueueRuntimePort()  [sem persist/release]
Worker Runtime           ──(prepared)──► getPersistentQueueRuntimePort()  [sem persist/release]
Scheduler Runtime        ──(prepared)──► getPersistentQueueRuntimePort()  [sem persist/release]
TISS Runtime             ──(prepared)──► getPersistentQueueRuntimePort()  [sem utilização funcional]
```

---

## 2. Resolução oficial

```
createPersistentQueueRuntimePort({ provider })
  → PersistentQueueRuntimeFactory
      → PersistentQueueRuntimeRegistry.has(provider)?
          → MockPersistentQueueRuntimeAdapter   (mock | test)
          → DefaultPersistentQueueRuntimeAdapter (default | enterprise)
```

- Default da fundação: `enterprise`
- Providers desconhecidos: falha explícita (sem fallback silencioso)
- `EnterprisePersistentQueueRuntimeAdapter` é alias de `DefaultPersistentQueueRuntimeAdapter`

---

## 3. Contratos canônicos

| Modelo | Papel |
|--------|-------|
| `CanonicalPersistentQueue` | Fila persistente estrutural (`realPersistentBackend: false`) |
| `CanonicalPersistentMessage` | Mensagem referencial (nunca persistida de fato) |
| `CanonicalPersistentEnvelope` | Envelope referencial (nunca entregue) |
| `CanonicalPersistentQueueResult` | Envelope de operação (`runtimeReady: true`) |
| `CanonicalPersistentQueueStatistics` | Contagens in-memory + zeros de backends reais |
| `CanonicalPersistentQueueHealth` | Saúde estrutural + `queueRuntimeOk` / `workerRuntimeOk` / `schedulerRuntimeOk` |
| `CanonicalPersistentQueueCapabilities` | Declaração estática de capacidades / negações |

---

## 4. Fronteiras

| Módulo | Relação |
|--------|---------|
| `queue-runtime` (INF-05) | Dependência preparada — sem enqueue/dequeue cruzado |
| `worker-runtime` (INF-06) | Dependência preparada — sem allocate/execute |
| `scheduler-runtime` (INF-07) | Dependência preparada — sem schedule/cancel |
| Capture / OCR / XML* / XSD / Namespace | Intocados além de deps TISS |

---

## 5. Checklist ECS-01

| Item | Status |
|------|--------|
| Port único (`PersistentQueueRuntimePort`) | ✅ |
| Canonical Models | ✅ |
| Capabilities / Identity | ✅ |
| Provider (`createPersistentQueueRuntimePort`) | ✅ |
| Factory única | ✅ |
| Registry único | ✅ |
| Default + Enterprise + Mock Adapters | ✅ |
| Store in-memory | ✅ |
| Demo Application health query | ✅ |
| Sem Provider/Adapter/Factory/Registry/Runtime paralelo | ✅ |
| Sem bypass | ✅ |
