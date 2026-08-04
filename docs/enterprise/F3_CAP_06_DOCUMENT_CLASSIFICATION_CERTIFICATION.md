# F3-CAP-06 — Document Classification Runtime Certification

**Sprint:** F3-CAP-06 — Enterprise Document Classification Runtime Foundation
**Gate administrativo:** F3-CAP-06A — Enterprise Document Classification Runtime Integration Gate (pendente — gate administrativo separado)
**Data:** 2026-08-04
**Branch:** corrente

---

## 1. Resumo Executivo

A Sprint F3-CAP-06 entrega a **Enterprise Document Classification Runtime Foundation**
no padrão ECS-01 (Port → Provider → Factory → Registry → Adapter → Store), adicionando
orquestração estrutural de jobs/requests/documentos de classificação
(`openJob`/`closeJob`/`submitRequest`/`registerDocument`/`getResult`/`stats`) ao módulo
`document-classification-runtime` já existente, **sem remover ou alterar comportamento**
dos métodos DIP-04/CLASS-01 (`coordinateClassification`, `classify`, `getSession`,
`listSessions`, `listProviderReferences`) usados pelo Capture Engine Runtime, pelo OCR
Runtime e pelo Document Classification Provider Adapter (rule-based).

Nenhuma engine de classificação real (IA, ML, LLM, embeddings, template matching,
roteamento automático, visão computacional) foi importada ou integrada neste módulo.
Todas as flags `*Implemented` da superfície F3-CAP-06 permanecem literalmente `false`.

**Parecer:** **GO** para a análise administrativa do gate F3-CAP-06A. A certificação
final (`F3_CAP_06_FINAL_CERTIFICATION.md`) fica pendente de gate administrativo,
conforme praticado nas sprints F3-CAP anteriores.

---

## 2. Checklist de aceite

| Critério | Status |
|----------|--------|
| ECS-01 seguido integralmente | ✓ |
| Orquestração estrutural F3-CAP-06 criada (openJob/closeJob/submitRequest/registerDocument/getResult/stats) | ✓ |
| DIP-04 / CLASS-01 preservado (`coordinateClassification`/`classify`/`getSession`/`listSessions`/`listProviderReferences`) | ✓ |
| `ports/models.ts` (CanonicalDocumentClassification* DIP-04) preservado sem alteração | ✓ |
| `enterpriseDeps` opcional no adapter default/enterprise (antes obrigatório) | ✓ |
| Todas as flags `*Implemented` (F3-CAP-06) literalmente `false` | ✓ |
| Nenhum import de IA/ML/LLM/embeddings/template matching real | ✓ |
| Nenhuma alteração em `capture-engine-runtime`, `scanner-runtime`, `watch-folder-runtime`, `upload-runtime`, `ocr-runtime`, `intelligent-capture-runtime`, `document-classification-provider`, Capture produto, Centro Operacional | ✓ |
| TypeScript (`npx tsc --noEmit`) PASS | ✓ 0 erros |
| ESLint (`npm run lint`) PASS | ✓ 0 errors (7 warnings pré-existentes, não relacionados) |
| Enterprise suite completa (`scripts/enterprise/tests/*.test.ts`) PASS | ✓ 1388 pass / 0 fail |
| Capture suite (`npm run capture:test:all`) PASS | ✓ 198 pass / 0 fail / 1 skipped |
| `enterprise:document-classification-runtime:test` PASS | ✓ 26 pass / 0 fail |
| `enterprise:ocr-runtime:test` PASS (sem regressão) | ✓ 25 pass / 0 fail |
| `enterprise:capture-engine-runtime:test` PASS (sem regressão) | ✓ 12 pass / 0 fail |
| `enterprise:storage-manager-runtime:test` PASS (sem regressão) | ✓ 15 pass / 0 fail |
| `enterprise:runtime:test` PASS (sem regressão) | ✓ 6 pass / 0 fail |
| Nenhuma funcionalidade de classificação real introduzida na superfície F3-CAP-06 | ✓ |
| Apenas Foundation estrutural (F3-CAP-06) + compat DIP-04/CLASS-01 preservada | ✓ |

---

## 3. Arquivos criados

| Arquivo |
|---------|
| `src/lib/enterprise/document-classification-runtime/ports/canonical.ts` |
| `src/lib/enterprise/document-classification-runtime/ports/capabilities.ts` |
| `src/lib/enterprise/document-classification-runtime/registry/document-classification-runtime-registry.ts` |
| `src/lib/enterprise/document-classification-runtime/registry/index.ts` |
| `src/lib/enterprise/document-classification-runtime/adapters/mock-document-classification-runtime-adapter.ts` (reescrito) |
| `docs/enterprise/F3_CAP_06_ENTERPRISE_DOCUMENT_CLASSIFICATION_RUNTIME.md` |
| `docs/enterprise/F3_CAP_06_DOCUMENT_CLASSIFICATION_ARCHITECTURE.md` |
| `docs/enterprise/F3_CAP_06_DOCUMENT_CLASSIFICATION_CERTIFICATION.md` |

---

## 4. Arquivos alterados

| Arquivo | Motivo |
|---------|--------|
| `src/lib/enterprise/document-classification-runtime/ports/identity.ts` | Ids estruturais F3-CAP-06 (job/request/document/result) + DIP-04 preservado |
| `src/lib/enterprise/document-classification-runtime/ports/types.ts` | Tipos F3-CAP-06 (CAP) convivendo com tipos DIP-04 preservados; `enterpriseDeps` com getters opcionais + peers estruturais |
| `src/lib/enterprise/document-classification-runtime/ports/document-classification-runtime-port.ts` | Port único — métodos estruturais + DIP-04 preservados |
| `src/lib/enterprise/document-classification-runtime/ports/index.ts` | Barrel comprehensivo (CAP + DIP-04) |
| `src/lib/enterprise/document-classification-runtime/store/document-classification-runtime-store.ts` | Contrato estendido (jobs/requests/documents/results + sessões) |
| `src/lib/enterprise/document-classification-runtime/store/in-memory-document-classification-runtime-store.ts` | Implementação estendida |
| `src/lib/enterprise/document-classification-runtime/store/index.ts` | Barrel estendido |
| `src/lib/enterprise/document-classification-runtime/adapters/default-document-classification-runtime-adapter.ts` | Reescrito — CAP estrutural + DIP-04/CLASS-01 preservado; `enterpriseDeps` opcional |
| `src/lib/enterprise/document-classification-runtime/adapters/index.ts` | Barrel com `EnterpriseDocumentClassificationRuntimeAdapter` |
| `src/lib/enterprise/document-classification-runtime/factory/document-classification-runtime-factory.ts` | Reescrito — registry-based; provider default `enterprise` |
| `src/lib/enterprise/document-classification-runtime/providers/create-document-classification-runtime-port.ts` | `DocumentClassificationRuntimeProvider` (create/get/getFactory) |
| `src/lib/enterprise/document-classification-runtime/providers/index.ts` | Barrel |
| `src/lib/enterprise/document-classification-runtime/demo/document-classification-runtime-health-query.ts` | `getDocumentClassificationRuntimeHealthSummary` retorna `{health, capabilities, info, architectureLayer}` |
| `src/lib/enterprise/document-classification-runtime/index.ts` | Barrel comprehensivo do módulo |
| `src/lib/enterprise/runtime/enterprise-runtime.ts` | `createDocumentClassificationRuntimePort` com `provider: "enterprise"` + deps estruturais lazy (ICR/Scanner/WatchFolder/Upload/PQR/Worker/Scheduler/Observability/Scalability) |
| `src/lib/enterprise/runtime/types.ts` | Comentários atualizados para referenciar F3-CAP-06 (sem alteração de campos/assinaturas) |
| `scripts/enterprise/tests/document-classification-runtime-engine.test.ts` | Reescrito para estilo F3-CAP-06 (26 testes), preservando cobertura DIP-04/CLASS-01 |
| `scripts/enterprise/tests/document-classification-provider-engine.test.ts` | Assert `getDocumentClassificationRuntimePort().providerId === "enterprise"` (antes `"default"`) |

`ports/models.ts` **não foi alterado** — CanonicalDocumentClassification* (DIP-04)
preservados integralmente. `document-classification-provider`, `capture-engine-runtime`,
`scanner-runtime`, `watch-folder-runtime`, `upload-runtime`, `ocr-runtime`,
`intelligent-capture-runtime` **não foram alterados** (apenas 1 assert de teste externo
atualizado para refletir o novo `providerId` default).

---

## 5. Confirmações negativas (obrigatórias)

| Pergunta | Resposta |
|----------|----------|
| Existe classificação real (IA / ML / LLM / embeddings / RAG)? | Não |
| Existe template matching? | Não |
| Existe roteamento automático? | Não |
| Existe visão computacional? | Não |
| Existe OCR real neste módulo? | Não (permanece exclusivo do OCR Runtime → OCR Provider Adapter) |
| Existe geração de XML / regras TISS neste módulo? | Não |
| `capture-engine-runtime` foi alterado? | Não |
| `scanner-runtime` foi alterado? | Não |
| `watch-folder-runtime` foi alterado? | Não |
| `upload-runtime` foi alterado? | Não |
| `ocr-runtime` foi alterado? | Não |
| `intelligent-capture-runtime` foi alterado? | Não |
| `document-classification-provider` foi alterado? | Não |
| Módulos de produto Capture foram alterados? | Não |
| Centro Operacional foi alterado? | Não |
| `coordinateClassification`/`classify`/`getSession`/`listSessions`/`listProviderReferences` mudaram de comportamento no caminho feliz (deps presentes)? | Não |

---

## 6. Parecer

**GO** para análise administrativa do gate F3-CAP-06A — Enterprise Document
Classification Runtime Integration Gate. Certificação final pendente de aprovação
administrativa.
