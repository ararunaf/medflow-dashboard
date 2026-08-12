# Real Provider Registry

Catálogo oficial de providers reais ativados no Enterprise Runtime.

## Status de Ativação

| Capability          | Provider ID | Adapter                                  | Versão    | Status          |
| ------------------- | ----------- | ---------------------------------------- | --------- | --------------- |
| OCR                 | `azure`     | Azure Document Intelligence              | 1.0.0     | Ativo           |
| Document Extraction | `real-tiss` | RealTissDocumentExtractionRuntimeAdapter | 1.0.0     | Ativo           |
| **Validation**      | `real-tiss` | **RealTissValidationRuntimeAdapter**     | **1.0.0** | **Certificado** |
| XML Validation      | —           | —                                        | —         | Discovery       |
| Enrichment          | `real-tiss` | **RealTissAutoFillRuntimeAdapter**       | **1.0.0** | **Ativo**       |
| XML Generation      | —           | —                                        | —         | Discovery       |
| Batch               | —           | —                                        | —         | Discovery       |
| Protocol            | —           | —                                        | —         | Discovery       |

## Validation Provider

**Provider:** `real-tiss`  
**Adapter:** `src/lib/enterprise/validation-runtime/adapters/real-tiss-validation-runtime-adapter.ts`  
**Factory:** `ValidationRuntimeFactory` — `case "real-tiss"`  
**Registry:** `ValidationRuntimeRegistry` — 5 providers (mock, test, default, enterprise, real-tiss)  
**Port:** `ValidationRuntimePort` (sem alteração)  
**Entrypoint:** `getEnterpriseRuntime().getValidationRuntimePort()`  
**Composition Root:** `DefaultEnterpriseRuntime`  
**Regras TISS ativadas:** campos obrigatórios, tipo de guia, valores ausentes, extração com falha.

## Garantias preservadas

- `ValidationRuntimePort` não foi alterado.
- `getEnterpriseRuntime()` continua sendo o único entrypoint.
- Nenhum novo `Port`, `Gateway`, `Runtime`, `Pipeline` ou `Composition Root` foi criado.
- `processTissValidationJob` e `processTissParsedValidated` não foram alterados.
- Retry, Dead Letter, Worker, Queue, Scheduler e Observability foram reutilizados.
