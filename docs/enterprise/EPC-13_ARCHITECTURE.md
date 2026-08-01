# EPC-13 — Document Processing Architecture

**Sprint:** EPC-13 — Document Processing Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-13_DOCUMENT_PROCESSING_FOUNDATION.md`](./EPC-13_DOCUMENT_PROCESSING_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getDocumentProcessorHealthSummary) │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ DocumentProcessorPort                                │
│  process | getProcessing | listProcessings           │
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultDocumentProcessorAdapter                     │
│  MockDocumentProcessorAdapter                        │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ DocumentProcessorStore (DefaultDocumentProcessorStore)│
│  in-process Map — sem banco                          │
└──────────────────────────────────────────────────────┘

Factory (DocumentProcessorFactory) ← Provider (createDocumentProcessorPort)
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Providers

| ProviderId | Adapter | Estado |
|------------|---------|--------|
| `default` | `DefaultDocumentProcessorAdapter` | Implementado |
| `mock` | `MockDocumentProcessorAdapter` | Implementado |
| `test` | `MockDocumentProcessorAdapter` | Implementado |
| `database` | — | Reservado (erro explícito) |
| `remote` | — | Reservado (erro explícito) |
| `registry` | — | Reservado (erro explícito) |

---

## 3. Fronteiras

| Pode | Não pode |
|------|----------|
| Registrar processings canônicos | Executar OCR / IA / parsers |
| Declarar ProcessorType (rótulo) | Conhecer engines específicos |
| Produzir ProcessingOutput único | Expor campos específicos de OCR |
| Referências opacas | Upload / Scanner / TISS |
| Health / capabilities | Alterar UI / APIs / DB |
| PoC Application | Orquestrar Workflow operacional |

---

## 4. Integração futura (FASE 9) — apenas documentação

Nenhum dos componentes abaixo é implementado ou acoplado nesta sprint.

### 4.1 OCR Provider

- Adapter futuro de OCR chama `process()` com `processorType: "OCR"`.
- Produz o **mesmo** `ProcessingOutput` (ex.: `structuredData`, `pages`, `confidence`).
- Processing Foundation **não** importa nem conhece o OCR Provider.
- Application futura: `OcrPort` → mapeia → `DocumentProcessorPort.process`.

### 4.2 AI Provider

- Resultados de IA (classificação, extração assistida) mapeiam para `ProcessingOutput.structuredData`.
- `processorType` pode ser `CUSTOM` ou rótulo futuro.
- Processing Foundation **não** chama `AiProviderPort`.

### 4.3 Workflow

- `customAttributes` / refs opacas podem carregar `workflowId` para orquestração futura.
- Workflow Engine permanece independente; bind é externo.
- Processing Foundation **não** conhece estados de workflow clínico.

### 4.4 Rule Engine

- Application futura pode alimentar Rule Engine com `ProcessingOutput.structuredData`.
- Processing Foundation **não** avalia regras.

### 4.5 Contract Foundation

- Refs opacas (`ProcessingOpaqueReference` / `customAttributes`) podem apontar `contractId`.
- Contract Foundation permanece desacoplada; sem validação contratual aqui.

### 4.6 Document Intake

- Intake registra entrada; Processing registra interpretação canônica.
- Application futura: Intake `READY` → dispara Processor → grava `DocumentProcessingResult`.
- Sem acoplamento de módulos nesta sprint.

### 4.7 Storage

- `rawDataReference` / attachments usam refs opacas (`key`, `container`, `uri`).
- Storage Port permanece independente; sem I/O nesta fundação.

### 4.8 Document Identity

- `documentIdentityReference.documentId` (opaco).
- Application futura resolve via `DocumentIdentityPort`.
- Processing Foundation **não** importa Document Identity Core.

---

## 5. Diagrama de desacoplamento

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ OCR Adapter │  │ XML Adapter │  │ PDF Adapter │  (futuros)
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        ↓
              DocumentProcessorPort
                        ↓
         DocumentProcessingResult
         + ProcessingOutput (único)
                        ↓
     Workflow / Rules / Contract / Intake / UI
              (não veem a tecnologia)
```

---

## 6. Capacitades do Port (adapter)

| Flag | Significado |
|------|-------------|
| `supportsProcess` | Operação `process` |
| `supportsGetProcessing` | Operação `getProcessing` |
| `supportsListProcessings` | Operação `listProcessings` |
| `supportsMultipleProcessorTypes` | Enum ProcessorType |
| `supportsCanonicalOutput` | ProcessingOutput único |
| `supportsDocumentIdentityReference` | Ref opaca |
| `supportsMetadataReference` | Ref opaca |
| `supportsStorageReference` | Ref opaca |
| `supportsOutputReference` | Ref opaca a output |
| `supportsFutureIntegrationHooks` | Prep estrutural (sem bind) |

---

## 7. Isolamento de produto

- Nenhum import de rotas, Server Functions, Settings, Auth, OCR de produto, IA de produto, Captura Inteligente, TISS ou Financeiro.
- Store in-process apenas; zero migrations.
- PoC `getDocumentProcessorHealthSummary` não é exposta em UI/API.
