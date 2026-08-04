# F3-CAP-12 — Auto-Fill Runtime Architecture

## Visão

```
Produto
  → Enterprise Runtime
    → AutoFillRuntimePort
      → DefaultAutoFillRuntimeAdapter / EnterpriseAutoFillRuntimeAdapter / MockAutoFillRuntimeAdapter
        → InMemoryAutoFillRuntimeStore
          → AutoFillResult (estrutural)
```

## ECS-01

| Camada | Artefato |
|--------|----------|
| Port | `AutoFillRuntimePort` |
| Provider | `createAutoFillRuntimePort()` |
| Factory | `AutoFillRuntimeFactory` |
| Registry | `mock` · `test` · `default` · `enterprise` |
| Adapters | Default / Enterprise (alias) / Mock |
| Store | `AutoFillRuntimeStore` + `InMemoryAutoFillRuntimeStore` |
| Demo | `getAutoFillRuntimeHealthSummary()` |

## Superfície estrutural

| Operação | Comportamento |
|----------|---------------|
| `prepareAutoFill` | Cria sessão canônica estrutural — **não preenche** |
| `getResult` | Lê sessão/resultado do store — **não popula campos** |
| `stats` | Contadores in-memory — **sem métricas funcionais** |
| `health` | Shape-check de Ports peers — **sem consumo funcional** |
| `capabilities` / `providerInfo` | Declaração estática |

## AutoFillContext

Aceita por contrato (sem processar):

1. `CanonicalGuide` (TISS Mapping Runtime)
2. `CanonicalMappingResult` (TISS Mapping Runtime)
3. `ValidationResult`
4. `AuditResult`
5. `AIOrchestrationContext`

## Peers estruturais

Injetados via `enterpriseDeps` (lazy getters). Em `health()`, apenas `portShapeOk` (presença de `health` + `capabilities`).

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

## Fronteiras explícitas

| Existe | Não existe |
|--------|------------|
| Contratos canônicos | Preenchimento automático |
| Store in-memory | Persistência / banco |
| Flags `*Implemented = false` | Geração de XML |
| Wiring Enterprise Runtime | Escrita em guias |
| Shape-check de peers | Integração com operadoras |
| Demo de health | IA / OCR / regras TISS funcionais |

## Enterprise Runtime

- `getAutoFillRuntimePort()`
- `autoFillRuntimeOk` em `EnterpriseRuntimeHealth`
