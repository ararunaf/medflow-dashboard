# C-01 — Enterprise XML TISS Runtime

## Status

Foundation ECS-01 estrutural entregue. Nenhuma geração de XML funcional.

## Objetivo

Criar a Foundation oficial do **Enterprise XML TISS Runtime**, responsável futuramente por transformar o Modelo Canônico TISS em documentos XML compatíveis com o padrão TISS/ANS.

Esta sprint **não** implementa geração de XML, serialização, parser, XSD, SOAP, operadoras, assinatura digital, banco, persistência ou APIs.

## Escopo entregue

- `src/lib/enterprise/xml-tiss-runtime/` (ECS-01)
- `XMLTISSRuntimePort` + modelos canônicos
- Provider `createXMLTISSRuntimePort()`
- Factory `XMLTISSRuntimeFactory`
- Registry: `mock` / `test` / `default` / `enterprise`
- Adapters: `DefaultXMLTISSRuntimeAdapter`, `EnterpriseXMLTISSRuntimeAdapter` (alias), `MockXMLTISSRuntimeAdapter`
- Store: `XMLTISSRuntimeStore` + `InMemoryXMLTISSRuntimeStore` (sem persistência)
- Demo: `getXMLTISSRuntimeHealthSummary()`
- Integração Enterprise Runtime: `getXMLTISSRuntimePort()` + `xmlTissRuntimeOk`
- Teste: `enterprise:xml-tiss-runtime:test`

## Declarações obrigatórias

| Declaração | Valor |
|-----------|-------|
| Geração de XML? | **Não** |
| Serialização XML? | **Não** |
| Parser XML? | **Não** |
| XSD? | **Não** |
| SOAP? | **Não** |
| Operadoras? | **Não** |
| Assinatura digital? | **Não** |
| Banco / persistência? | **Não** |
| APIs? | **Não** |
| Contratos | Exclusivamente estruturais |

## Capabilities (todas `false`)

- `xmlGenerationImplemented`
- `xmlSerializationImplemented`
- `xmlParsingImplemented`
- `xmlValidationImplemented`
- `xmlSigningImplemented`
- `xmlCompressionImplemented`
- `batchXmlGenerationImplemented`
- `soapIntegrationImplemented`
- `operatorIntegrationImplemented`
- `schemaValidationImplemented`

## XMLTISSContext

Contrato estrutural capaz de receber exclusivamente:

- `CanonicalGuide`
- `CanonicalMappingResult`
- `AutoFillResult`
- `QualityAssessment`
- `ValidationResult`
- `AuditResult`
- `AIOrchestrationContext`

Sem qualquer processamento.

## Padrões TISS (somente contratos)

Guia SP/SADT · Guia Consulta · Guia Internação · Guia Honorários · Guia Resumo de Internação · Guia Odontológica · Anexos · Lotes · Cabeçalhos · Protocolos

## Versões TISS (somente contratos)

Versionamento · Namespaces · Schemas · Identificação de Versão · Compatibilidade futura

## Integração estrutural (shape-check apenas)

QualityRuntime · AutoFillRuntime · TISSMappingRuntime · AuditRuntime · ValidationRuntime · DocumentExtractionRuntime · DocumentClassificationRuntime · OCRRuntime · AIOrchestrationRuntime · IntelligentCaptureRuntime · ScannerRuntime · WatchFolderRuntime · UploadRuntime

## Proibido (não entregue)

Geração de XML · Serialização · Parser · XSD · SOAP · Operadoras · Persistência · Banco · APIs · Integrações reais

## Roadmap

Roadmap permanece **CONGELADO**. Não iniciar C-01A.
