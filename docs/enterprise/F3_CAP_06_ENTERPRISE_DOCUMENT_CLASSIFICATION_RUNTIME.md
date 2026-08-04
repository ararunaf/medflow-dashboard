# F3-CAP-06 — Enterprise Document Classification Runtime Foundation

**Sprint:** F3-CAP-06 — Enterprise Document Classification Runtime Foundation
**Roadmap:** Fase 3 — Bloco A — Captura Inteligente
**Padrão:** ECS-01 (Port → Provider → Factory → Registry → Adapter → Store)
**Data:** 2026-08-04

---

## Objetivo

Criar a camada oficial de orquestração estrutural de **jobs / requests / documentos de
classificação** (`openJob`, `closeJob`, `submitRequest`, `registerDocument`, `getResult`,
`stats`), no mesmo padrão ECS-01 das demais Foundations F3-CAP (Scanner, Watch Folder,
Upload, Intelligent Capture, OCR Runtime).

**Ela NÃO executa classificação real. NÃO usa IA. NÃO usa ML. NÃO usa LLM. NÃO usa OCR
real. NÃO faz template matching. NÃO faz roteamento automático. NÃO usa visão
computacional. Apenas orquestra estruturalmente jobs/requests/documentos de
classificação.**

Este módulo **preserva integralmente** o contrato DIP-04 / CLASS-01 já existente
(`coordinateClassification`, `classify`, `getSession`, `listSessions`,
`listProviderReferences`), usado pelo Capture Engine Runtime, pelo OCR Runtime e pelo
Document Classification Provider Adapter (rule-based) para coordenação e execução real
de classificação.

---

## Escopo entregue

| Item | Status |
|------|--------|
| `ports/canonical.ts` (contratos F3-CAP-06: `DocumentClassificationJob`, `DocumentClassificationRequest`, `DocumentClassificationDocument`, `DocumentClassificationResult`, `ClassificationHealth`, `ClassificationCapabilities`...) | Criado |
| `ports/capabilities.ts` (`DocumentClassificationRuntimeEngineCapabilities`) | Criado |
| `ports/identity.ts` (estendido — geradores de id F3-CAP-06 + DIP-04 preservados) | Estendido |
| `ports/types.ts` (estendido — CAP + DIP convivendo) | Estendido |
| `ports/models.ts` (CanonicalDocumentClassification* DIP-04) | Preservado sem alteração |
| `ports/document-classification-runtime-port.ts` (openJob/closeJob/submitRequest/registerDocument/getResult/stats/providerInfo + coordinateClassification/classify/getSession/listSessions/listProviderReferences) | Estendido |
| Provider / Factory / Registry (`mock`, `test`, `default`, `enterprise`) | Criados |
| Adapters (`DefaultDocumentClassificationRuntimeAdapter` = `EnterpriseDocumentClassificationRuntimeAdapter`, `MockDocumentClassificationRuntimeAdapter`) | Reescritos |
| Store in-memory (jobs/requests/documents/results **+** sessões DIP-04) | Estendido |
| Demo `getDocumentClassificationRuntimeHealthSummary()` (com `info` via `providerInfo()`) | Atualizado |
| Integração Enterprise Runtime (`getDocumentClassificationRuntimePort()` provider `"enterprise"` + deps estruturais) | Atualizada |
| Teste `enterprise:document-classification-runtime:test` (F3-CAP-06 + DIP-04 preservado) | Reescrito |

---

## Fora de escopo (proibido nesta sprint)

- Classificação real / IA / ML / LLM / embeddings / RAG
- Template matching, roteamento automático, visão computacional
- OCR real (permanece exclusivo do OCR Runtime → OCR Provider Adapter)
- Alterações em `capture-engine-runtime`, `scanner-runtime`, `watch-folder-runtime`,
  `upload-runtime`, `ocr-runtime`, `intelligent-capture-runtime`, `document-classification-provider`,
  módulos de produto Capture, Centro Operacional (exceto wiring do
  `enterprise-runtime.ts`)
- Qualquer bypass do Document Classification Provider Adapter para coordenação/execução
  real (permanece exclusivamente via `coordinateClassification()` / `classify()`)

---

## Capabilities (todas `false` para implementação real)

- `classificationImplemented`
- `documentRecognitionImplemented`
- `templateRecognitionImplemented`
- `medicalGuideRecognitionImplemented`
- `documentCategoryImplemented`
- `automaticRoutingImplemented`
- `confidenceScoreImplemented`
- `multiClassifierImplemented`
- `layoutClassificationImplemented`
- `semanticClassificationImplemented`

Campos DIP-04 preservados em `DocumentClassificationRuntimeCapabilities`: `implementsAi`,
`implementsMachineLearning`, `implementsRuleEngine`, `implementsEmbeddings`,
`implementsLlm`, `implementsOcrForClassification` — todos `false` (o Runtime nunca
implementa IA/ML/LLM; apenas o `DocumentClassificationProviderPort` Adapter implementa
regras — rule-based, sem IA).

---

## Contratos estruturais (F3-CAP-06)

- `DocumentClassificationJob`, `DocumentClassificationRequest`, `DocumentClassificationDocument`
- `DocumentCategory`, `DocumentType`, `ClassificationStatus`, `ClassificationConfidence`
- `ClassificationMetadata`, `ClassificationContext`, `ClassificationRule`
- `DocumentClassificationResult`, `ClassificationHealth`, `ClassificationCapabilities`
- `CanonicalClassificationStatistics`, `CanonicalClassificationOperation`, `CanonicalClassificationProvider`

Contratos DIP-04 preservados (`ports/models.ts`): `CanonicalDocumentClassificationRequest`,
`CanonicalDocumentClassificationResult`, `CanonicalDocumentClassificationSession`,
`CanonicalDocumentClassificationIdentity`, `CanonicalDocumentClassificationMetadata`,
`CanonicalDocumentClassificationReference`, `CanonicalDocumentClassificationConfiguration`,
`CanonicalDocumentClassificationCapabilities`, `CanonicalDocumentClassificationProviderReference`.

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

Preservado (coordenação/execução real — DIP-04 / CLASS-01):

- Canonical Execution Orchestrator (`getOrchestratorPort`)
- OCR Runtime (`getOCRRuntimePort`) — hop anterior na cadeia (sem OCR real neste módulo)
- Document Classification Provider Adapter (`getDocumentClassificationProviderPort`) — rule-based

---

## Acesso oficial

```ts
const port = runtime.getDocumentClassificationRuntimePort();
const health = await runtime.health(); // health.documentClassificationRuntimeOk

// F3-CAP-06 — orquestração estrutural
const opened = await port.openJob({});
const submitted = await port.submitRequest({ jobId: opened.job!.jobId });
const result = await port.getResult({ jobId: opened.job!.jobId });

// DIP-04 / CLASS-01 — coordenação/execução real preservada
const coordinated = await port.coordinateClassification(canonicalDocumentClassificationRequest);
const classified = await port.classify(classifyDocumentInput);
```

Fluxo estrutural (F3-CAP-06):

`Produto → Enterprise Runtime → DocumentClassificationRuntimePort → Adapter → Store → DocumentClassificationResult`

Fluxo DIP-04 / CLASS-01 preservado (coordenação + execução real):

`Produto → Enterprise Runtime → Capture Engine Runtime → OCR Runtime → DocumentClassificationRuntimePort → Canonical Execution Orchestrator → DocumentClassificationProviderPort → DefaultDocumentClassificationAdapter`
