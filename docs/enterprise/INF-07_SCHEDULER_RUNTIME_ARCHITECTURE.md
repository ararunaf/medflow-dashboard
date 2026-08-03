# INF-07 — Scheduler Runtime Architecture

**Sprint:** INF-07 — Enterprise Scheduler Runtime Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Data:** 03/08/2026

---

## 1. Posição na Enterprise Foundation

```
Produto
  → Enterprise Runtime
      → getSchedulerRuntimePort()
          → SchedulerRuntimePort
              → DefaultSchedulerRuntimeAdapter | EnterpriseSchedulerRuntimeAdapter | MockSchedulerRuntimeAdapter
                  → InMemorySchedulerRuntimeStore
                      → Canonical Scheduler Result

Scheduler Runtime ──(prepared)──► getQueueRuntimePort()    [sem enqueue/dequeue]
Scheduler Runtime ──(prepared)──► getWorkerRuntimePort()   [sem allocate/register]
Queue Runtime     ──(prepared)──► getSchedulerRuntimePort() [sem schedule/cancel]
Worker Runtime    ──(prepared)──► getSchedulerRuntimePort() [sem schedule/cancel]
TISS Runtime      ──(prepared)──► getSchedulerRuntimePort() [sem utilização funcional]
```

---

## 2. Resolução oficial

```
createSchedulerRuntimePort({ provider })
  → SchedulerRuntimeFactory
      → SchedulerRuntimeRegistry.has(provider)?
          → MockSchedulerRuntimeAdapter   (mock | test)
          → DefaultSchedulerRuntimeAdapter (default | enterprise)
```

- Default da fundação: `enterprise`
- Providers desconhecidos: falha explícita (sem fallback silencioso)
- `EnterpriseSchedulerRuntimeAdapter` é alias de `DefaultSchedulerRuntimeAdapter`

---

## 3. Contratos canônicos

| Modelo | Papel |
|--------|-------|
| `CanonicalSchedule` | Schedule estrutural (`realScheduler: false`) |
| `CanonicalSchedulerJob` | Job referencial (`cronImplemented: false`) |
| `CanonicalSchedulerDispatch` | Dispatch referencial (nunca despachado) |
| `CanonicalSchedulerResult` | Envelope de operação (`runtimeReady: true`) |
| `CanonicalSchedulerStatistics` | Contagens in-memory + zeros de backends reais |
| `CanonicalSchedulerHealth` | Saúde estrutural + `queueRuntimeOk` / `workerRuntimeOk` |
| `CanonicalSchedulerCapabilities` | Declaração estática de capacidades / negações |

---

## 4. Fronteiras

| Módulo | Relação |
|--------|---------|
| `scheduler-foundation` (INF-03) | Prefixo estrutural legado — **não** é o Scheduler Runtime Enterprise |
| `queue-runtime` (INF-05) | Dependência preparada — sem processamento |
| `worker-runtime` (INF-06) | Dependência preparada — sem orquestração |
| Capture / OCR / XML* / XSD / Namespace | Intocados além de deps TISS |

---

## 5. Checklist ECS-01

| Item | Status |
|------|--------|
| Port único (`SchedulerRuntimePort`) | ✅ |
| Canonical Models | ✅ |
| Capabilities / Identity | ✅ |
| Provider (`createSchedulerRuntimePort`) | ✅ |
| Factory única | ✅ |
| Registry único | ✅ |
| Default + Enterprise + Mock Adapters | ✅ |
| InMemory Store | ✅ |
| Demo Application (Port-only) | ✅ |
| Integração Enterprise Runtime | ✅ |
| Sem Scheduler real / Cron / Timer | ✅ |
| Sem Provider/Adapter/Factory/Registry paralelo | ✅ |
