# F3-CAP-12 — Enterprise Auto-Fill Runtime

## Status

Foundation ECS-01 estrutural entregue. Nenhum preenchimento automático funcional.

## Objetivo

Criar a Foundation oficial do **Enterprise Auto-Fill Runtime**, responsável futuramente por transformar o Modelo Canônico TISS em uma guia completamente preenchida.

Esta sprint **não** implementa preenchimento automático, geração de XML, escrita em guias, integração com operadoras, IA, banco, persistência ou APIs.

## Escopo entregue

- `src/lib/enterprise/auto-fill-runtime/` (ECS-01)
- `AutoFillRuntimePort` + modelos canônicos
- Provider `createAutoFillRuntimePort()`
- Factory `AutoFillRuntimeFactory`
- Registry: `mock` / `test` / `default` / `enterprise`
- Adapters: `DefaultAutoFillRuntimeAdapter`, `EnterpriseAutoFillRuntimeAdapter` (alias), `MockAutoFillRuntimeAdapter`
- Store: `AutoFillRuntimeStore` + `InMemoryAutoFillRuntimeStore` (sem persistência)
- Demo: `getAutoFillRuntimeHealthSummary()`
- Integração Enterprise Runtime: `getAutoFillRuntimePort()` + `autoFillRuntimeOk`
- Teste: `enterprise:auto-fill-runtime:test`

## Declarações obrigatórias

| Declaração | Valor |
|-----------|-------|
| Preenchimento automático? | **Não** |
| Geração de XML? | **Não** |
| Escrita em guias? | **Não** |
| Integração com operadoras? | **Não** |
| IA utilizada? | **Não** |
| Banco / persistência? | **Não** |
| APIs? | **Não** |
| Contratos | Exclusivamente estruturais |

## Capabilities (todas `false`)

- `autoFillEngineImplemented`
- `guideGenerationImplemented`
- `fieldPopulationImplemented`
- `templatePopulationImplemented`
- `operatorPopulationImplemented`
- `xmlPopulationImplemented`
- `validationIntegrationImplemented`
- `auditIntegrationImplemented`
- `qualityIntegrationImplemented`
- `automaticCompletionImplemented`

## AutoFillContext

Contrato estrutural capaz de receber exclusivamente:

- `CanonicalGuide`
- `CanonicalMappingResult`
- `ValidationResult`
- `AuditResult`
- `AIOrchestrationContext`

Sem qualquer processamento.

## Guias (somente contratos)

SP/SADT · Consulta · Internação · Honorários · Resumo de Internação · Odontológica · Anexos

## Operadoras (somente contratos)

Unimed · Hapvida · Bradesco Saúde · SulAmérica · Amil · CASSI · GEAP · IPM · Operadora Genérica

## Integração estrutural (shape-check apenas)

TISSMappingRuntime · AuditRuntime · ValidationRuntime · DocumentExtractionRuntime · DocumentClassificationRuntime · OCRRuntime · AIOrchestrationRuntime · IntelligentCaptureRuntime · ScannerRuntime · WatchFolderRuntime · UploadRuntime

## Proibido (não entregue)

Preenchimento automático · Geração de XML · Escrita em guias · Integração com operadoras · IA · Banco · Persistência · APIs · Regras TISS · Regras por operadora

## Roadmap

Roadmap permanece **congelado**. Não iniciar F3-CAP-12A nesta sprint.
