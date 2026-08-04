# F3-CAP-11 — Enterprise TISS Mapping Runtime

## Status

Foundation ECS-01 estrutural entregue. Nenhum mapeamento TISS funcional.

## Objetivo

Criar a Foundation oficial do **Enterprise TISS Mapping Runtime**, responsável futuramente por converter dados extraídos para um Modelo Canônico TISS, desacoplando a aplicação das particularidades de cada operadora e de cada versão do padrão TISS.

Esta sprint **não** implementa mapeamento, operadoras, XML, preenchimento automático, IA, banco, persistência ou APIs.

## Escopo entregue

- `src/lib/enterprise/tiss-mapping-runtime/` (ECS-01)
- `TISSMappingRuntimePort` + modelos canônicos
- Provider `createTISSMappingRuntimePort()`
- Factory `TISSMappingRuntimeFactory`
- Registry: `mock` / `test` / `default` / `enterprise`
- Adapters: `DefaultTISSMappingRuntimeAdapter`, `EnterpriseTISSMappingRuntimeAdapter` (alias), `MockTISSMappingRuntimeAdapter`
- Store: `TISSMappingRuntimeStore` + `InMemoryTISSMappingRuntimeStore` (sem persistência)
- Demo: `getTISSMappingRuntimeHealthSummary()`
- Integração Enterprise Runtime: `getTISSMappingRuntimePort()` + `tissMappingRuntimeOk`
- Teste: `enterprise:tiss-mapping-runtime:test`

## Declarações obrigatórias

| Declaração | Valor |
|-----------|-------|
| Mapeamento TISS implementado? | **Não** |
| Operadoras implementadas? | **Não** |
| XML criado? | **Não** |
| Preenchimento automático? | **Não** |
| IA utilizada? | **Não** |
| Banco / persistência? | **Não** |
| APIs? | **Não** |
| Contratos | Exclusivamente estruturais |

## Capabilities (todas `false`)

- `mappingEngineImplemented`
- `operatorMappingImplemented`
- `templateMappingImplemented`
- `canonicalModelImplemented`
- `guideTransformationImplemented`
- `fieldNormalizationImplemented`
- `tissVersionMappingImplemented`
- `layoutMappingImplemented`
- `xmlMappingImplemented`
- `autoFillPreparationImplemented`

## TISSMappingContext

Contrato estrutural capaz de receber futuramente:

- `DocumentClassificationContext`
- `DocumentExtractionResult`
- `ValidationResult`
- `AuditResult`
- `AIOrchestrationContext`

Sem qualquer processamento.

## Modelo Canônico (somente contratos)

Guias: SP/SADT · Consulta · Internação · Honorários · Resumo de Internação · Odontológica · Anexo

Operadoras: Unimed · Hapvida · Bradesco Saúde · SulAmérica · Amil · CASSI · GEAP · IPM · Operadora Genérica

Versões: TISS 4.00 · TISS 4.01 · FutureVersion

## Integração estrutural (shape-check apenas)

AIOrchestrationRuntime · AuditRuntime · ValidationRuntime · DocumentExtractionRuntime · DocumentClassificationRuntime · OCRRuntime · IntelligentCaptureRuntime · ScannerRuntime · WatchFolderRuntime · UploadRuntime

## Proibido (não entregue)

Mapeamento funcional · Operadoras · XML TISS · Preenchimento automático · IA · Banco · Persistência · APIs · Integrações com operadoras · Regras de negócio

## Roadmap

Roadmap Fase 3 permanece **CONGELADO**. Não iniciar F3-CAP-11A nesta sprint.
