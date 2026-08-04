# F3-CAP-07 — Enterprise Document Extraction Runtime Foundation

**Sprint:** F3-CAP-07 — Enterprise Document Extraction Runtime Foundation
**Roadmap:** Fase 3 — Bloco A — Captura Inteligente
**Padrão:** ECS-01 (Port → Provider → Factory → Registry → Adapter → Store)
**Data:** 2026-08-04

---

## Objetivo

Criar a Foundation oficial do **Enterprise Document Extraction Runtime**, responsável
futuramente por extrair dados estruturados de documentos classificados.

**Ela NÃO executa extração real. NÃO usa OCR. NÃO usa IA. NÃO usa ML. NÃO usa LLM.
NÃO usa Regex. NÃO usa Template Matching funcional. NÃO lê campos. NÃO preenche guias.
NÃO persiste. NÃO acessa banco. NÃO expõe APIs.**

Nesta Sprint apenas a arquitetura estrutural (contratos, Port, Provider, Factory,
Registry, Adapters, Store, Health, Composition Root) é entregue.

---

## Escopo entregue

| Item | Status |
|------|--------|
| `src/lib/enterprise/document-extraction-runtime/` (ECS-01 completo) | Criado |
| `DocumentExtractionRuntimePort` | Criado |
| Canonical Models + Capabilities + Types + Identity | Criados |
| Contrato `DocumentClassificationContext` (ponte Classification ↔ Extraction) | Criado |
| Contratos `DocumentExtractionRequest` / `DocumentExtractionResult` / `ExtractionJob` / `ExtractionField` / `ExtractionTable` / `ExtractionMetadata` / `ExtractionCapabilities` / `ExtractionStatus` / `ExtractionContext` / `ExtractionConfidence` / `ExtractionStatistics` / `ExtractionSummary` | Criados |
| Provider `createDocumentExtractionRuntimePort()` | Criado |
| Factory `DocumentExtractionRuntimeFactory` | Criada |
| Registry (`mock`, `test`, `default`, `enterprise`) | Criado |
| Adapters Default / Enterprise (alias) / Mock | Criados |
| Store in-memory | Criado |
| Demo `getDocumentExtractionRuntimeHealthSummary()` | Criado |
| Enterprise Runtime `getDocumentExtractionRuntimePort()` + `documentExtractionRuntimeOk` | Integrado |
| Teste `enterprise:document-extraction-runtime:test` | Criado |

---

## Capabilities (todas `false`)

- `fieldExtractionImplemented`
- `structuredExtractionImplemented`
- `medicalGuideExtractionImplemented`
- `tableExtractionImplemented`
- `templateExtractionImplemented`
- `automaticMappingImplemented`
- `confidenceScoreImplemented`
- `barcodeExtractionImplemented`
- `qrExtractionImplemented`
- `pipelineSelectionImplemented`

---

## DocumentClassificationContext

Contrato canônico oficial entre Document Classification Runtime e Document Extraction
Runtime. Contém exclusivamente metadados estruturais:

`documentCategory`, `documentType`, `guideType`, `operator`, `operatorCode`,
`tissVersion`, `templateId`, `documentOrientation`, `documentLanguage`,
`documentQuality`, `recommendedPipeline`, `confidence`, `documentFamily`,
`documentSubtype`, `processingProfile`, `layoutVersion`, `captureSource`,
`documentFingerprint`, `classificationTimestamp`.

Nenhum campo possui implementação funcional nesta sprint.

---

## Dependências estruturais (shape-check)

Document Classification Runtime · OCR Runtime · Intelligent Capture Runtime ·
Scanner Runtime · Watch Folder Runtime · Upload Runtime · Persistent Queue Runtime ·
Worker Runtime · Scheduler Runtime · Observability Runtime · Scalability Runtime

---

## Fora de escopo (proibido)

OCR · Extração · Regex · Template Matching · Machine Learning · LLM · IA ·
Reconhecimento de operadora · Reconhecimento de template · Leitura de campos ·
Preenchimento de guias · Persistência · Banco · APIs
