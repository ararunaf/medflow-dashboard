# INF-09 — Observability Runtime Architecture

**Sprint:** INF-09 — Enterprise Observability Runtime Foundation  
**Padrão:** ECS-01 Ports & Adapters  
**Data:** 03/08/2026

---

## 1. Posição na Enterprise Foundation

```
Produto
  → Enterprise Runtime
      → getObservabilityRuntimePort()
          → ObservabilityRuntimePort
              → Default | Enterprise | Mock Adapter
                  → InMemoryObservabilityRuntimeStore
                      → Canonical Observability Result

Observability Runtime     ──(prepared)──► getQueueRuntimePort()
Observability Runtime     ──(prepared)──► getWorkerRuntimePort()
Observability Runtime     ──(prepared)──► getSchedulerRuntimePort()
Observability Runtime     ──(prepared)──► getPersistentQueueRuntimePort()
Observability Runtime     ──(prepared)──► getTISSRuntimePort()
Queue Runtime             ──(prepared)──► getObservabilityRuntimePort()  [sem observe/release]
Worker Runtime            ──(prepared)──► getObservabilityRuntimePort()  [sem observe/release]
Scheduler Runtime         ──(prepared)──► getObservabilityRuntimePort()  [sem observe/release]
Persistent Queue Runtime  ──(prepared)──► getObservabilityRuntimePort()  [sem observe/release]
TISS Runtime              ──(prepared)──► getObservabilityRuntimePort()  [sem utilização funcional]
```

---

## 2. Resolução oficial

```
createObservabilityRuntimePort({ provider })
  → ObservabilityRuntimeFactory
      → ObservabilityRuntimeRegistry.has(provider)?
          → MockObservabilityRuntimeAdapter   (mock | test)
          → DefaultObservabilityRuntimeAdapter (default | enterprise)
```

- Default da fundação: `enterprise`
- Providers desconhecidos: falha explícita (sem fallback silencioso)
- `EnterpriseObservabilityRuntimeAdapter` é alias de `DefaultObservabilityRuntimeAdapter`

---

## 3. Contratos canônicos

| Modelo | Papel |
|--------|-------|
| `CanonicalObservabilityScope` | Scope estrutural (`realObservabilityBackend: false`) |
| `CanonicalObservabilitySignal` | Signal referencial (nunca emitido de fato) |
| `CanonicalObservabilityEnvelope` | Envelope referencial (nunca entregue a backend) |
| `CanonicalObservabilityResult` | Envelope de operação (`runtimeReady: true`) |
| `CanonicalObservabilityStatistics` | Contagens in-memory + zeros de backends reais |
| `CanonicalObservabilityHealth` | Saúde estrutural + `queueRuntimeOk` / `workerRuntimeOk` / `schedulerRuntimeOk` / `persistentQueueRuntimeOk` / `tissRuntimeOk` |
| `CanonicalObservabilityCapabilities` | Declaração estática de capacidades / negações |

---

## 4. Fronteiras

| Módulo | Relação |
|--------|---------|
| `queue-runtime` (INF-05) | Dependência preparada — sem enqueue/dequeue cruzado |
| `worker-runtime` (INF-06) | Dependência preparada — sem allocate/execute |
| `scheduler-runtime` (INF-07) | Dependência preparada — sem schedule/cancel |
| `persistent-queue-runtime` (INF-08) | Dependência preparada — sem persist/release |
| `tiss-runtime` | Dependência preparada — sem process/consumo |
| Capture / OCR / XML* / XSD / Namespace | Intocados além de deps TISS |

---

## 5. Checklist ECS-01

| Item | Status |
|------|--------|
| Port único (`ObservabilityRuntimePort`) | ✅ |
| Canonical Models | ✅ |
| Capabilities / Identity | ✅ |
| Provider (`createObservabilityRuntimePort`) | ✅ |
| Factory única | ✅ |
| Registry único | ✅ |
| Default + Enterprise + Mock Adapters | ✅ |
| Store in-memory | ✅ |
| Demo Application health query | ✅ |
| Sem Provider/Adapter/Factory/Registry/Runtime paralelo | ✅ |
| Sem bypass | ✅ |
