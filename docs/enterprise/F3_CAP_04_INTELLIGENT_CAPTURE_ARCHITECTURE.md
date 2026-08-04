# F3-CAP-04 — Intelligent Capture Architecture

**Sprint:** F3-CAP-04  
**Padrão arquitetural:** ECS-01  
**Camada:** Enterprise Foundation

---

## Diagrama lógico

```text
Produto / Application
        │
        ▼
Enterprise Runtime
  getIntelligentCaptureRuntimePort()
  health().intelligentCaptureRuntimeOk
        │
        ▼
IntelligentCaptureRuntimePort
        │
        ▼
IntelligentCaptureRuntimeFactory  ←  IntelligentCaptureRuntimeRegistry
        │                              (mock | test | default | enterprise)
        ▼
DefaultIntelligentCaptureRuntimeAdapter
  (= EnterpriseIntelligentCaptureRuntimeAdapter)
  ou MockIntelligentCaptureRuntimeAdapter
        │
        ▼
InMemoryIntelligentCaptureRuntimeStore
        │
        ▼
CaptureResult

Deps estruturais (shape only no health):
  ScannerRuntimePort
  WatchFolderRuntimePort
  UploadRuntimePort
  OCRRuntimePort (futuro)
  PersistentQueueRuntimePort
  WorkerRuntimePort
  SchedulerRuntimePort
  ObservabilityRuntimePort
```

---

## Estrutura de pastas

```text
src/lib/enterprise/intelligent-capture-runtime/
  ports/        # Port, Canonical Models, Capabilities, Types, Identity
  providers/    # createIntelligentCaptureRuntimePort / IntelligentCaptureRuntimeProvider
  factory/      # IntelligentCaptureRuntimeFactory
  registry/     # mock | test | default | enterprise
  adapters/     # Default / Enterprise (alias) / Mock
  store/        # IntelligentCaptureRuntimeStore + InMemory
  demo/         # getIntelligentCaptureRuntimeHealthSummary()
  index.ts
```

---

## Operações estruturais do Port

| Operação | Comportamento nesta fundação |
|----------|------------------------------|
| `registerSource` | Persiste CaptureSource canônico in-memory |
| `unregisterSource` | Remove do store |
| `discoverSources` | Lista catálogo in-memory |
| `openRequest` | Abre CaptureRequest estrutural (sem captura) |
| `closeRequest` | Fecha CaptureRequest estrutural |
| `route` | Declara CaptureRoute (sem roteamento documental) |
| `envelope` | Cria CaptureEnvelope (sem embalar arquivos) |
| `stats` | Estatísticas do store |
| `health` | Prontidão + shape das deps |
| `capabilities` | Declaração estática |

Nenhuma operação executa OCR, IA, Pipeline, captura automática, leitura de arquivos ou processamento documental.

---

## Dependências estruturais

Injetadas via `IntelligentCaptureRuntimeEnterpriseDeps` e validadas apenas por shape no `health()`:

| Dep | Consumo funcional |
|-----|-------------------|
| Scanner Runtime | Não |
| Watch Folder Runtime | Não |
| Upload Runtime | Não |
| OCR Runtime | Não |
| Persistent Queue Runtime | Não |
| Scheduler Runtime | Não |
| Worker Runtime | Não |
| Observability Runtime | Não |

---

## Composition Root

Único ponto de integração no produto:

- `EnterpriseRuntime.getIntelligentCaptureRuntimePort()`
- `EnterpriseRuntimeHealth.intelligentCaptureRuntimeOk`

Não há bypass direto do Domain para Adapter/Store.
