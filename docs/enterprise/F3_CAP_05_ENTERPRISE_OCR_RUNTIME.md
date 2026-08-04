# F3-CAP-05 — Enterprise OCR Runtime Foundation

**Sprint:** F3-CAP-05 — Enterprise OCR Runtime Foundation  
**Roadmap:** Fase 3 — Bloco A — Captura Inteligente  
**Padrão:** ECS-01 (Port → Provider → Factory → Registry → Adapter → Store)  
**Data:** 2026-08-04

---

## Objetivo

Criar a camada oficial de orquestração estrutural de **jobs / requests / documentos OCR**
(`openJob`, `closeJob`, `submitRequest`, `registerDocument`, `getResult`, `stats`), no mesmo
padrão ECS-01 das demais Foundations F3-CAP (Scanner, Watch Folder, Upload, Intelligent Capture).

**Ela NÃO executa OCR real. NÃO extrai texto. NÃO lê páginas/pixels. Apenas orquestra
estruturalmente jobs/requests/documentos OCR.**

Este módulo **preserva integralmente** o contrato DIP-03 / OCR-01 já existente
(`coordinateOcr`, `process`, `getSession`, `listSessions`, `listProviderReferences`),
usado pelo Capture Engine Runtime e pelo OCR Provider Adapter (Azure Document
Intelligence) para coordenação e execução real de OCR.

---

## Escopo entregue

| Item | Status |
|------|--------|
| `ports/canonical.ts` (contratos F3-CAP-05: `OCRJob`, `OCRRequest`, `OCRDocument`, `OCRResult`, `OCRHealth`, `OCRCapabilities`...) | Criado |
| `ports/capabilities.ts` (`OCRRuntimeEngineCapabilities`) | Criado |
| `ports/identity.ts` (estendido — geradores de id F3-CAP-05 + DIP-03 preservados) | Estendido |
| `ports/types.ts` (estendido — CAP + DIP convivendo) | Estendido |
| `ports/models.ts` (CanonicalOCR* DIP-03) | Preservado sem alteração |
| `ports/ocr-runtime-port.ts` (openJob/closeJob/submitRequest/registerDocument/getResult/stats/providerInfo + coordinateOcr/process/getSession/listSessions/listProviderReferences) | Estendido |
| Provider / Factory / Registry (`mock`, `test`, `default`, `enterprise`) | Criados |
| Adapters (`DefaultOCRRuntimeAdapter` = `EnterpriseOCRRuntimeAdapter`, `MockOCRRuntimeAdapter`) | Reescritos |
| Store in-memory (jobs/requests/documents/results **+** sessões DIP-03) | Estendido |
| Demo `getOCRRuntimeHealthSummary()` | Criado |
| Integração Enterprise Runtime (`getOCRRuntimePort()` provider `"enterprise"` + deps estruturais) | Atualizada |
| Teste `enterprise:ocr-runtime:test` (F3-CAP-05 + DIP-03 preservado) | Reescrito |

---

## Fora de escopo (proibido nesta sprint)

- OCR real / extração de texto real / leitura de páginas ou pixels reais
- Tesseract, Azure Document Intelligence, Google Cloud Vision, AWS Textract, ABBYY, PaddleOCR
- IA, classificação, geração de XML, regras TISS
- Alterações em `intelligent-capture-runtime`, `scanner-runtime`, `watch-folder-runtime`,
  `upload-runtime`, módulos de produto Capture, Centro Operacional
- Qualquer bypass do OCR Provider Adapter para coordenação/execução real (permanece
  exclusivamente via `coordinateOcr()` / `process()`)

---

## Capabilities (todas `false` para implementação real)

- `ocrEngineImplemented`
- `pdfOcrImplemented`
- `imageOcrImplemented`
- `documentRecognitionImplemented`
- `textExtractionImplemented`
- `barcodeRecognitionImplemented`
- `qrRecognitionImplemented`
- `layoutAnalysisImplemented`
- `tableRecognitionImplemented`
- `handwritingRecognitionImplemented`
- `multiEngineImplemented`
- `confidenceScoreImplemented`
- `languageDetectionImplemented`

Campos DIP-03 preservados em `OCRRuntimeCapabilities`: `implementsAzure`,
`implementsGoogleVision`, `implementsAwsTextract`, `implementsTesseract`, `implementsAi`,
`implementsClassification`, `implementsXml`, `implementsTiss` — todos `false` (o Runtime
nunca implementa vendors; apenas o `OCRProviderPort` Adapter implementa, ex.: Azure).

---

## Contratos estruturais (F3-CAP-05)

- `OCRJob`, `OCRRequest`, `OCRDocument`, `OCRPage`
- `OCREngine`, `OCRLanguage`, `OCRStatus`, `OCRConfidence`
- `OCRMetadata`, `OCRProcessingContext`
- `OCRResult`, `OCRHealth`, `OCRCapabilities`
- `CanonicalOCRStatistics`, `CanonicalOCROperation`

Contratos DIP-03 preservados (`ports/models.ts`): `CanonicalOCRRequest`, `CanonicalOCRResult`,
`CanonicalOCRSession`, `CanonicalOCRIdentity`, `CanonicalOCRMetadata`, `CanonicalOCRReference`,
`CanonicalOCRConfiguration`, `CanonicalOCRCapabilities`, `CanonicalOCRProviderReference`.

---

## Wiring estrutural de dependências

Preparado (sem consumo funcional — shape-check apenas em `health()`):

- Intelligent Capture Runtime
- Scanner Runtime
- Watch Folder Runtime
- Upload Runtime
- Persistent Queue Runtime
- Worker Runtime
- Scheduler Runtime
- Observability Runtime
- Scalability Runtime

Preservado (coordenação/execução real — DIP-03 / OCR-01):

- Canonical Execution Orchestrator (`getOrchestratorPort`)
- OCR Provider Adapter (`getOCRProviderPort`) — ex.: Azure Document Intelligence

---

## Acesso oficial

```ts
const port = runtime.getOCRRuntimePort();
const health = await runtime.health(); // health.ocrRuntimeOk

// F3-CAP-05 — orquestração estrutural
const opened = await port.openJob({});
const submitted = await port.submitRequest({ jobId: opened.job!.jobId });
const result = await port.getResult({ jobId: opened.job!.jobId });

// DIP-03 / OCR-01 — coordenação/execução real preservada
const coordinated = await port.coordinateOcr(canonicalOcrRequest);
const processed = await port.process(processOcrInput);
```

Fluxo estrutural (F3-CAP-05):

`Produto → Enterprise Runtime → OCRRuntimePort → Adapter → Store → OCRResult`

Fluxo DIP-03 / OCR-01 preservado (coordenação + execução real):

`Produto → Enterprise Runtime → Capture Engine Runtime → OCRRuntimePort → Canonical Execution Orchestrator → OCRProviderPort → Azure Adapter`
