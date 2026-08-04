# F3-CAP-13 — Quality Runtime Architecture

## Visão

```
Produto
  → Enterprise Runtime
    → QualityRuntimePort
      → DefaultQualityRuntimeAdapter / EnterpriseQualityRuntimeAdapter / MockQualityRuntimeAdapter
        → InMemoryQualityRuntimeStore
          → QualityResult (estrutural)
```

## ECS-01

| Camada | Artefato |
|--------|----------|
| Port | `QualityRuntimePort` |
| Provider | `createQualityRuntimePort()` |
| Factory | `QualityRuntimeFactory` |
| Registry | `mock` · `test` · `default` · `enterprise` |
| Adapters | Default / Enterprise (alias) / Mock |
| Store | `QualityRuntimeStore` + `InMemoryQualityRuntimeStore` |
| Demo | `getQualityRuntimeHealthSummary()` |

## Superfície estrutural

| Operação | Comportamento |
|----------|---------------|
| `prepareQualityAssessment` | Cria assessment canônico estrutural — **não avalia** |
| `getResult` | Lê assessment/resultado do store — **não calcula score** |
| `stats` | Contadores in-memory — **sem métricas funcionais** |
| `health` | Shape-check de Ports peers — **sem consumo funcional** |
| `capabilities` / `providerInfo` | Declaração estática |

## QualityContext

Aceita por contrato (sem processar):

1. `OCRResult` (OCR Runtime)
2. `DocumentClassificationResult` (Document Classification Runtime)
3. `DocumentExtractionResult` (Document Extraction Runtime)
4. `ValidationResult` (Validation Runtime)
5. `CanonicalMappingResult` (TISS Mapping Runtime)
6. `AutoFillResult` (Auto Fill Runtime)
7. `AuditResult` (Audit Runtime)
8. `AIOrchestrationContext` (AI Orchestration Runtime)

## Contratos canônicos

`QualityContext` · `QualityAssessment` · `QualityScore` · `QualityMetric` · `QualityIssue` · `QualityStatistics` · `QualityCapabilities` · `QualityStatus` · `QualityHealth` · `QualityDecision`

## Métricas futuras (somente contratos)

| MetricKind | Descrição estrutural |
|------------|----------------------|
| `ocr-confidence` | Confiança OCR |
| `classification-quality` | Qualidade da Classificação |
| `extraction-completeness` | Completude da Extração |
| `validation-consistency` | Consistência da Validação |
| `mapping-quality` | Qualidade do Mapping |
| `auto-fill-quality` | Qualidade do Auto Fill |
| `xml-readiness` | Prontidão para XML |
| `operator-readiness` | Prontidão para Operadora |
| `human-review-need` | Necessidade de Revisão Humana |
| `overall-score` | Score Geral |

Nenhuma métrica é calculada nesta sprint.

## Peers estruturais

Injetados via `enterpriseDeps` (lazy getters). Em `health()`, apenas `portShapeOk` (presença de `health` + `capabilities`).

- Auto Fill Runtime
- TISS Mapping Runtime
- Audit Runtime
- Validation Runtime
- Document Extraction Runtime
- Document Classification Runtime
- OCR Runtime
- AI Orchestration Runtime
- Intelligent Capture Runtime
- Scanner Runtime
- Watch Folder Runtime
- Upload Runtime

## Enterprise Runtime

- `getQualityRuntimePort()`
- `health().qualityRuntimeOk`

## Limites explícitos

- **Não** existe score funcional
- **Não** existe avaliação automática
- **Não** existe decisão automática
- **Não** existe IA
- Toda a Sprint é **exclusivamente estrutural**
