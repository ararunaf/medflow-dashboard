# F3-CAP-13 — Enterprise Quality Runtime

## Status

Foundation ECS-01 estrutural entregue. Nenhuma avaliação automática funcional.

## Objetivo

Criar a Foundation oficial do **Enterprise Quality Runtime**, responsável futuramente por consolidar toda a avaliação de qualidade do pipeline documental.

Esta sprint **não** implementa avaliação automática, score funcional, decisão automática, IA, OCR, auditoria automática, banco, persistência ou APIs.

## Escopo entregue

- `src/lib/enterprise/quality-runtime/` (ECS-01)
- `QualityRuntimePort` + modelos canônicos
- Provider `createQualityRuntimePort()`
- Factory `QualityRuntimeFactory`
- Registry: `mock` / `test` / `default` / `enterprise`
- Adapters: `DefaultQualityRuntimeAdapter`, `EnterpriseQualityRuntimeAdapter` (alias), `MockQualityRuntimeAdapter`
- Store: `QualityRuntimeStore` + `InMemoryQualityRuntimeStore` (sem persistência)
- Demo: `getQualityRuntimeHealthSummary()`
- Integração Enterprise Runtime: `getQualityRuntimePort()` + `qualityRuntimeOk`
- Teste: `enterprise:quality-runtime:test`

## Declarações obrigatórias

| Declaração | Valor |
|-----------|-------|
| Avaliação automática? | **Não** |
| Score funcional? | **Não** |
| Decisão automática? | **Não** |
| IA utilizada? | **Não** |
| OCR? | **Não** |
| Auditoria automática? | **Não** |
| Banco / persistência? | **Não** |
| APIs? | **Não** |
| Integração com operadoras? | **Não** |
| Contratos | Exclusivamente estruturais |

## Capabilities (todas `false`)

- `qualityEngineImplemented`
- `qualityScoreImplemented`
- `ocrQualityImplemented`
- `classificationQualityImplemented`
- `extractionQualityImplemented`
- `validationQualityImplemented`
- `mappingQualityImplemented`
- `autoFillQualityImplemented`
- `auditQualityImplemented`
- `approvalDecisionImplemented`

## QualityContext

Contrato estrutural capaz de receber exclusivamente:

- `OCRResult`
- `DocumentClassificationResult`
- `DocumentExtractionResult`
- `ValidationResult`
- `CanonicalMappingResult`
- `AutoFillResult`
- `AuditResult`
- `AIOrchestrationContext`

Sem qualquer processamento.

## Métricas (somente contratos)

Confiança OCR · Qualidade da Classificação · Completude da Extração · Consistência da Validação · Qualidade do Mapping · Qualidade do Auto Fill · Prontidão para XML · Prontidão para Operadora · Necessidade de Revisão Humana · Score Geral

## Integração estrutural (shape-check apenas)

AutoFillRuntime · TISSMappingRuntime · AuditRuntime · ValidationRuntime · DocumentExtractionRuntime · DocumentClassificationRuntime · OCRRuntime · AIOrchestrationRuntime · IntelligentCaptureRuntime · ScannerRuntime · WatchFolderRuntime · UploadRuntime

## Proibido (não entregue)

Avaliação automática · Score funcional · Decisão automática · Dashboards · Persistência · Banco · Operadoras · XML · IA · Integrações reais

## Roadmap

Roadmap permanece **congelado**. **Não** iniciar F3-CAP-13A nesta entrega.
