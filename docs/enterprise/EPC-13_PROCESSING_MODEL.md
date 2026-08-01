# EPC-13 — Processing Model

**Sprint:** EPC-13 — Document Processing Foundation  
**Data:** 31/07/2026  
**Natureza:** Especificação dos modelos canônicos — sem OCR, IA, parsers ou domínio clínico  
**Documento pai:** [`EPC-13_DOCUMENT_PROCESSING_FOUNDATION.md`](./EPC-13_DOCUMENT_PROCESSING_FOUNDATION.md)

---

## 1. DocumentProcessingResult (FASE 6)

Modelo canônico do resultado de processamento.  
Nenhum campo específico de saúde, TISS, OCR engine ou vendor.

| Campo | Tipo | Papel |
|-------|------|-------|
| `processingId` | `ProcessingId` | Identificador canônico |
| `processorType` | `ProcessorType` | Tipo estrutural do processador |
| `status` | `ProcessingStatus` | Estado estrutural |
| `startedAt` | ISO string | Início estrutural |
| `finishedAt` | ISO string | Fim estrutural |
| `duration` | number (ms) | Duração estrutural |
| `confidence` | number | Confiança genérica |
| `warnings` | `ProcessingWarning[]` | Avisos estruturais |
| `errors` | `ProcessingError[]` | Erros estruturais |
| `metadataReference` | `ProcessingMetadataReference` | Ref opaca a Metadata |
| `documentIdentityReference` | `ProcessingDocumentIdentityReference` | Ref opaca a Document Identity |
| `outputReference` | `ProcessingOutputReference` | Ref opaca a ProcessingOutput |
| `capabilities` | `ProcessingDeclaredCapability[]` | Capacidades declaradas |
| `tags` | `ProcessingTag[]` | Classificação livre |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |

---

## 2. ProcessorType (FASE 7)

Somente enumeração. Sem lógica de OCR, XML, PDF, Barcode, QRCode, HL7 ou DICOM.

| Valor | Papel estrutural |
|-------|------------------|
| `OCR` | Processador OCR (rótulo) |
| `PDF_TEXT` | Extração de texto PDF (rótulo) |
| `XML` | Processador XML (rótulo) |
| `JSON` | Processador JSON (rótulo) |
| `BARCODE` | Processador Barcode (rótulo) |
| `QRCODE` | Processador QRCode (rótulo) |
| `HL7` | Processador HL7 (rótulo) |
| `DICOM` | Processador DICOM (rótulo) |
| `CUSTOM` | Processador customizado |
| `UNKNOWN` | Tipo desconhecido |

Helpers: `hasKnownProcessorType`, `processingHasKnownProcessorType`, `listProcessorTypes`, constante `PROCESSOR_TYPES`.

---

## 3. ProcessingStatus

Estados estruturais (sem orquestração operacional):

| Status | Papel |
|--------|-------|
| `PENDING` | Pendente |
| `RUNNING` | Em execução (rótulo) |
| `COMPLETED` | Concluído |
| `FAILED` | Falhou |
| `CANCELLED` | Cancelado |
| `UNKNOWN` | Desconhecido |

Constante: `PROCESSING_STATUSES`.

---

## 4. ProcessingOutput (FASE 8) — modelo canônico único de saída

Todo Document Processor (qualquer tecnologia) **deve** produzir este modelo.  
Nenhum campo específico de OCR.

| Campo | Tipo | Papel |
|-------|------|-------|
| `outputId` | `OutputId` | Identificador canônico da saída |
| `contentType` | string | Tipo de conteúdo genérico |
| `structuredData` | `Record<string, unknown>` | Dados estruturados opacos |
| `rawDataReference` | `ProcessingStorageReference` | Ref opaca a dados brutos |
| `metadataReference` | `ProcessingMetadataReference` | Ref opaca a Metadata |
| `confidence` | number | Confiança genérica |
| `language` | string | Idioma (rótulo) |
| `encoding` | string | Encoding (rótulo) |
| `pages` | `ProcessingOutputPage[]` | Páginas estruturais |
| `attachments` | `ProcessingOutputAttachment[]` | Anexos estruturais |

Helpers: `defineProcessingOutput`, `defineOutputPage`, `defineOutputAttachment`, `getOutputPageCount`, `getOutputAttachmentCount`.

### Invariante

```
OCR | PDF_TEXT | XML | JSON | BARCODE | QRCODE | HL7 | DICOM | CUSTOM | UNKNOWN
        ↓
   ProcessingOutput (único)
```

O restante do Enterprise **nunca** conhece qual tecnologia produziu a saída.

---

## 5. Referências opacas

Todas as referências são **opacas**. Document Processing **não** importa nem resolve engines.

| Ref | Uso |
|-----|-----|
| `documentIdentityReference` | Prep Document Identity |
| `metadataReference` | Prep Metadata Engine |
| `rawDataReference` / storage | Prep Storage Port |
| `outputReference` | Aponta ProcessingOutput |
| `ProcessingOpaqueReference` | Extensão genérica (hooks futuros) |

Helpers: `defineDocumentIdentityReference`, `defineMetadataReference`, `defineOutputReference`, `defineStorageReference`, `defineOpaqueReference`, `referencesDocument`, `referencesOutput`.

---

## 6. Operações do Port

| Operação | Papel |
|----------|-------|
| `process(input)` | Registra processamento + saída canônica (in-memory) |
| `getProcessing(input)` | Obtém por `processingId` |
| `listProcessings(input?)` | Lista com filtros estruturais |
| `health()` | Prontidão |
| `capabilities()` | Capacidades do adapter |

`process()` **não** executa OCR, IA, parsers ou I/O externo nesta sprint.

---

## 7. Modelos canônicos contados

| # | Modelo |
|---|--------|
| 1 | `DocumentProcessingResult` |
| 2 | `ProcessingOutput` |
| 3 | `ProcessorType` (enum estrutural) |

Auxiliares tipados (não expandem o núcleo canônico de negócio): pages, attachments, warnings, errors, refs opacas, status.
