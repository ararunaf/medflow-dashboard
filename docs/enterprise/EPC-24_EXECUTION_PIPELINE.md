# EPC-24 — Execution Pipeline

**Sprint:** EPC-24 Sprint 01 — Canonical Execution Orchestrator  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/canonical-execution-orchestrator/ports/pipeline.ts`  
**Documento pai:** [`EPC-24_CANONICAL_EXECUTION_ORCHESTRATOR.md`](./EPC-24_CANONICAL_EXECUTION_ORCHESTRATOR.md)

---

## 1. Pipeline canônico

O Orquestrador coordena **exclusivamente** o fluxo estrutural:

```
Document Intake
  ↓
Document Processing
  ↓
Processing Provider
  ↓
OCR Provider
  ↓
TISS Mapping
  ↓
TISS Vocabulary
  ↓
TISS Profile
  ↓
Healthcare Model
  ↓
Contract Rule Binding
  ↓
TISS Rule Runtime
  ↓
AI Auditor
```

**Sem executar OCR, IA, Mapping, regras ou validações.**

Constante: `CANONICAL_ORCHESTRATION_PIPELINE` / `CANONICAL_EXECUTION_STEPS`.

---

## 2. Steps (`CanonicalExecutionStepName`)

| Ordem | Step | Port Foundation | Contrato |
|------:|------|-----------------|----------|
| 0 | `document-intake` | `document-intake` | `DocumentIntakePort` |
| 1 | `document-processing` | `document-processor` | `DocumentProcessorPort` |
| 2 | `processing-provider` | `processing-provider` | `ProcessingProviderPort` |
| 3 | `ocr-provider` | `ocr-provider` | `OCRProviderPort` |
| 4 | `tiss-mapping` | `tiss-mapping` | `TISSMappingPort` |
| 5 | `tiss-vocabulary` | `tiss-vocabulary` | `TISSVocabularyPort` |
| 6 | `tiss-profile` | `tiss-profile` | `TISSProfilePort` |
| 7 | `healthcare-model` | `healthcare-model` | `HealthcareModelPort` |
| 8 | `contract-rule-binding` | `contract-rule-binding` | `ContractRuleBindingPort` |
| 9 | `tiss-rule-runtime` | `tiss-rule-runtime` | `TISSRuleRuntimePort` |
| 10 | `ai-auditor` | `ai-auditor` | `AIAuditorPort` |

Fonte: `FOUNDATION_PORT_CHAIN`.

---

## 3. Operação `startExecution`

Na Sprint 01, `startExecution()`:

1. Materializa `CanonicalExecutionRequest`
2. Cria os 11 steps em estado `pending` com `portRef` / `portContract`
3. Percorre estruturalmente o pipeline (marca `completed` + `artifactRef` opaco)
4. Persiste `CanonicalExecutionContext`, `CanonicalExecutionResult`, `CanonicalExecutionTrace`
5. Retorna o pacote completo

Flags explícitas no result:

- `enginesInvoked: false`
- `orchestrationViaPortsOnly: true`

---

## 4. Integração futura

Documentação de como o Orquestrador utilizará cada Port — **sem implementação funcional**:

| Port | Uso futuro |
|------|------------|
| DocumentIntakePort | Criar intake real a partir do request |
| DocumentProcessorPort | Processar documento estruturalmente |
| ProcessingProviderPort | Despachar provider adequado |
| OCRProviderPort | Extrair texto (OCR real) |
| TISSMappingPort | Aplicar mappings origem → modelo |
| TISSVocabularyPort | Resolver vocabulário TISS |
| TISSProfilePort | Resolver profile aplicável |
| HealthcareModelPort | Montar modelo canônico |
| ContractRuleBindingPort | Resolver bindings contratuais |
| TISSRuleRuntimePort | Orquestrar sub-pipeline de regras (EPC-23) |
| AIAuditorPort | Produzir AuditExplanation |

Fonte de código: `FUTURE_PORT_INTEGRATION_NOTES`.

---

## 5. Tracing

Cada execução produz um `CanonicalExecutionTrace` com:

- `executionId` / `correlationId`
- `steps` (snapshot)
- `startedAt` / `finishedAt` / `durationMs`
- `status`
- `errors` / `warnings`
- `portsOnly: true`

Sem persistência. Sem banco. Store in-process apenas.

---

## 6. Isolamento

- Nenhum Engine é importado por valor (apenas **type-only** dos Ports)
- Nenhum acoplamento direto entre Engines
- Comunicação futura exclusivamente via Ports injetados (`FoundationPortRegistry`)
