# F3-CAP-05 — OCR Runtime Architecture

**Sprint:** F3-CAP-05  
**Padrão arquitetural:** ECS-01  
**Camada:** Enterprise Foundation

---

## Diagrama lógico

```text
Produto / Application
        │
        ▼
Enterprise Runtime
  getOCRRuntimePort()
  health().ocrRuntimeOk
        │
        ▼
OCRRuntimePort
        │
        ▼
OCRRuntimeFactory  ←  OCRRuntimeRegistry
        │               (mock | test | default | enterprise)
        ▼
DefaultOCRRuntimeAdapter
  (= EnterpriseOCRRuntimeAdapter)
  ou MockOCRRuntimeAdapter
        │
        ├──► InMemoryOCRRuntimeStore ──► OCRResult (openJob/closeJob/submitRequest/
        │                                registerDocument/getResult/stats — F3-CAP-05)
        │
        └──► Canonical Execution Orchestrator ──► OCRProviderPort ──► Azure Adapter
             (coordinateOcr / process — DIP-03 / OCR-01 preservado)

Deps estruturais (shape only no health, F3-CAP-05):
  IntelligentCaptureRuntimePort
  ScannerRuntimePort
  WatchFolderRuntimePort
  UploadRuntimePort
  PersistentQueueRuntimePort
  WorkerRuntimePort
  SchedulerRuntimePort
  ObservabilityRuntimePort
  ScalabilityRuntimePort
```

---

## Estrutura de pastas

```text
src/lib/enterprise/ocr-runtime/
  ports/
    ocr-runtime-port.ts   # Port único — CAP + DIP-03 preservado
    canonical.ts          # Contratos F3-CAP-05 (OCRJob/OCRRequest/OCRDocument/OCRResult...)
    capabilities.ts       # OCRRuntimeEngineCapabilities
    identity.ts           # Ids F3-CAP-05 + createOCRRuntimeSessionId (DIP-03)
    types.ts              # Tipos vendor-agnósticos (CAP + DIP convivendo)
    models.ts             # CanonicalOCR* (DIP-03/OCR-01 preservado, sem alteração)
  providers/    # createOCRRuntimePort / OCRRuntimeProvider
  factory/      # OCRRuntimeFactory
  registry/     # mock | test | default | enterprise
  adapters/     # Default / Enterprise (alias) / Mock
  store/        # OCRRuntimeStore + InMemory (jobs/requests/documents/results + sessões)
  demo/         # getOCRRuntimeHealthSummary()
  index.ts
```

---

## Operações estruturais do Port (F3-CAP-05)

| Operação | Comportamento nesta fundação |
|----------|------------------------------|
| `openJob` | Cria `OCRJob` canônico in-memory (`status: "job-open"`) |
| `closeJob` | Fecha `OCRJob` (`status: "job-closed"`) |
| `submitRequest` | Cria `OCRRequest` estrutural dentro de um job (sem disparar engine) |
| `registerDocument` | Registra referência estrutural de `OCRDocument` (sem ler bytes/páginas) |
| `getResult` | Retorna `OCRResult` canônico por job/request/documento (sem extração real) |
| `stats` | Estatísticas estruturais do store in-memory |
| `health` | Prontidão do store + shape das deps estruturais + saúde DIP-03 quando presentes |
| `capabilities` | Declaração estática (CAP + DIP-03) |
| `providerInfo` | Metadados agregados do provider ativo |

Nenhuma destas operações executa OCR real, extrai texto real ou lê páginas/pixels reais.

## Operações preservadas do Port (DIP-03 / OCR-01)

| Operação | Comportamento preservado |
|----------|---------------------------|
| `coordinateOcr` | Coordena sessão OCR via Orchestrator + OCR Provider Adapter (sem bytes) |
| `process` | Executa OCR real exclusivamente via `OCRProviderPort.process()` |
| `getSession` / `listSessions` | Consultam sessões DIP-03 no mesmo store |
| `listProviderReferences` | Lista referências estruturais de providers (HTTP só no Adapter do `OCRProviderPort`) |

Quando `enterpriseDeps.getOrchestratorPort` e `enterpriseDeps.getOCRProviderPort` **não**
estão presentes, `coordinateOcr()`/`process()` retornam `ok: false` com
`code: "OCR_RUNTIME_PROVIDER_DEPS_MISSING"` — as operações estruturais F3-CAP-05
continuam funcionando normalmente (não dependem destes Ports).

---

## Dependências estruturais

Injetadas via `OCRRuntimeEnterpriseDeps` e validadas apenas por shape no `health()`
(nunca se chama `.health()` dos peers — evita ciclos e efeitos colaterais):

| Dep | Consumo funcional |
|-----|-------------------|
| Intelligent Capture Runtime | Não |
| Scanner Runtime | Não |
| Watch Folder Runtime | Não |
| Upload Runtime | Não |
| Persistent Queue Runtime | Não |
| Worker Runtime | Não |
| Scheduler Runtime | Não |
| Observability Runtime | Não |
| Scalability Runtime | Não |
| Canonical Execution Orchestrator | Sim — `coordinateOcr()` / `process()` (DIP-03) |
| OCR Provider Adapter | Sim — `process()` executa OCR real via `OCRProviderPort` (OCR-01) |

---

## Composition Root

Único ponto de integração no produto:

- `EnterpriseRuntime.getOCRRuntimePort()`
- `EnterpriseRuntimeHealth.ocrRuntimeOk`

O OCR Runtime é construído **antes** de Intelligent Capture Runtime, Scanner Runtime,
Watch Folder Runtime e Upload Runtime no composition root; os getters estruturais são
lazy (`() => this.xRuntimePort`) para permanecerem válidos apenas no momento de uso
(`health()`), sem exigir ordem de inicialização.

Não há bypass direto do Domain para Adapter/Store. HTTP Azure permanece exclusivo do
`OCRProviderPort` Adapter (Azure Document Intelligence) — nunca neste módulo.
