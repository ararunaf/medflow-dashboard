# F3-CAP-06 — Document Classification Runtime Architecture

**Sprint:** F3-CAP-06
**Padrão arquitetural:** ECS-01
**Camada:** Enterprise Foundation

---

## Diagrama lógico

```text
Produto / Application
        │
        ▼
Enterprise Runtime
  getDocumentClassificationRuntimePort()
  health().documentClassificationRuntimeOk
        │
        ▼
DocumentClassificationRuntimePort
        │
        ▼
DocumentClassificationRuntimeFactory  ←  DocumentClassificationRuntimeRegistry
        │                                (mock | test | default | enterprise)
        ▼
DefaultDocumentClassificationRuntimeAdapter
  (= EnterpriseDocumentClassificationRuntimeAdapter)
  ou MockDocumentClassificationRuntimeAdapter
        │
        ├──► InMemoryDocumentClassificationRuntimeStore ──► DocumentClassificationResult
        │      (openJob/closeJob/submitRequest/registerDocument/getResult/stats — F3-CAP-06)
        │
        └──► Canonical Execution Orchestrator ──► OCR Runtime
                       │
                       └──► DocumentClassificationProviderPort ──► Rule-based Adapter
             (coordinateClassification / classify — DIP-04 / CLASS-01 preservado)

Deps estruturais (shape only no health, F3-CAP-06):
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
src/lib/enterprise/document-classification-runtime/
  ports/
    document-classification-runtime-port.ts   # Port único — CAP + DIP-04 preservado
    canonical.ts          # Contratos F3-CAP-06 (DocumentClassificationJob/Request/Document/Result...)
    capabilities.ts       # DocumentClassificationRuntimeEngineCapabilities
    identity.ts            # Ids F3-CAP-06 + createDocumentClassificationRuntimeSessionId (DIP-04)
    types.ts               # Tipos vendor-agnósticos (CAP + DIP convivendo)
    models.ts              # CanonicalDocumentClassification* (DIP-04/CLASS-01 preservado, sem alteração)
  providers/    # createDocumentClassificationRuntimePort / DocumentClassificationRuntimeProvider
  factory/      # DocumentClassificationRuntimeFactory
  registry/     # mock | test | default | enterprise
  adapters/     # Default / Enterprise (alias) / Mock
  store/        # DocumentClassificationRuntimeStore + InMemory (jobs/requests/documents/results + sessões)
  demo/         # getDocumentClassificationRuntimeHealthSummary()
  index.ts
```

---

## Operações estruturais do Port (F3-CAP-06)

| Operação | Comportamento nesta fundação |
|----------|------------------------------|
| `openJob` | Cria `DocumentClassificationJob` canônico in-memory (`status: "job-open"`) |
| `closeJob` | Fecha `DocumentClassificationJob` (`status: "job-closed"`) |
| `submitRequest` | Cria `DocumentClassificationRequest` estrutural dentro de um job (sem disparar classificador) |
| `registerDocument` | Registra referência estrutural de `DocumentClassificationDocument` (sem ler conteúdo real) |
| `getResult` | Retorna `DocumentClassificationResult` canônico por job/request/documento (sem classificação real) |
| `stats` | Estatísticas estruturais do store in-memory |
| `health` | Prontidão do store + shape das deps estruturais + saúde DIP-04 quando presentes |
| `capabilities` | Declaração estática (CAP + DIP-04) |
| `providerInfo` | Metadados agregados do provider ativo |

Nenhuma destas operações executa classificação real, usa IA/ML/LLM ou lê conteúdo real
de documentos.

## Operações preservadas do Port (DIP-04 / CLASS-01)

| Operação | Comportamento preservado |
|----------|---------------------------|
| `coordinateClassification` | Coordena sessão de classificação via Orchestrator + OCR Runtime + Classification Provider health (sem classificar) |
| `classify` | Executa classificação real exclusivamente via `DocumentClassificationProviderPort.classify()` (rule-based) |
| `getSession` / `listSessions` | Consultam sessões DIP-04 no mesmo store |
| `listProviderReferences` | Lista referências estruturais de Classification Providers (sem conexão externa) |

Quando `enterpriseDeps.getOrchestratorPort` + `enterpriseDeps.getOCRRuntimePort` +
`enterpriseDeps.getDocumentClassificationProviderPort` **não** estão presentes,
`coordinateClassification()`/`classify()` retornam `ok: false` com
`code: "CLASSIFICATION_RUNTIME_PROVIDER_DEPS_MISSING"` — as operações estruturais
F3-CAP-06 continuam funcionando normalmente (não dependem destes Ports).

---

## Dependências estruturais

Injetadas via `DocumentClassificationRuntimeEnterpriseDeps` e validadas apenas por shape
no `health()` (nunca se chama `.health()` dos peers estruturais — evita ciclos e efeitos
colaterais):

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
| Canonical Execution Orchestrator | Sim — `coordinateClassification()` / `classify()` (DIP-04) |
| OCR Runtime | Sim — `coordinateClassification()` consulta saúde (DIP-04); sem OCR real neste módulo |
| Document Classification Provider Adapter | Sim — `classify()` executa classificação real rule-based via `DocumentClassificationProviderPort` (CLASS-01) |

---

## Composition Root

Único ponto de integração no produto:

- `EnterpriseRuntime.getDocumentClassificationRuntimePort()`
- `EnterpriseRuntimeHealth.documentClassificationRuntimeOk`

O Document Classification Runtime é construído **antes** de Intelligent Capture Runtime,
Scanner Runtime, Watch Folder Runtime, Upload Runtime, Persistent Queue Runtime, Worker
Runtime, Scheduler Runtime, Observability Runtime e Scalability Runtime no composition
root; os getters estruturais são lazy (`() => this.xRuntimePort`) para permanecerem
válidos apenas no momento de uso (`health()`), sem exigir ordem de inicialização.

Não há bypass direto do Domain para Adapter/Store. Classificação real permanece exclusiva
do `DocumentClassificationProviderPort` Adapter (rule-based) — nunca neste módulo.
