# EPC-23 — Execution Pipeline

**Sprint:** EPC-23 — TISS Rule Runtime Foundation  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-rule-runtime/ports/pipeline.ts`  
**Documento pai:** [`EPC-23_TISS_RULE_RUNTIME_FOUNDATION.md`](./EPC-23_TISS_RULE_RUNTIME_FOUNDATION.md)

---

## 1. Pipeline canônico (FASE 7)

O `ExecutionPipeline` representa **exclusivamente**:

```
Recebimento do Healthcare Model
  ↓
Resolução do Profile
  ↓
Resolução do Contract Binding
  ↓
Resolução dos Rule Packs
  ↓
Despacho para Rule Engine
  ↓
Coleta do resultado
```

**Sem executar nenhuma regra.**

---

## 2. Estágios (`ExecutionStageName`)

| Ordem | Nome | Operação do Port |
|------:|------|------------------|
| 0 | `receive-healthcare-model` | `startExecution()` |
| 1 | `resolve-profile` | `resolveProfile()` |
| 2 | `resolve-contract-binding` | `resolveBindings()` |
| 3 | `resolve-rule-packs` | `resolveRulePacks()` |
| 4 | `dispatch-rule-engine` | `dispatchRules()` |
| 5 | `collect-result` | `collectResults()` |

Constante: `EXECUTION_PIPELINE_STAGES`.

---

## 3. Pipeline de orquestração Enterprise

Visão ampliada (documentação estrutural — `RUNTIME_ORCHESTRATION_PIPELINE`):

```
healthcare-model
  → tiss-profile
  → contract-rule-binding
  → rule-packs
  → rule-engine
  → expression-engine
  → execution-result
  → ai-auditor
```

O Expression Engine é invocado **futuramente pelo Rule Engine**, não diretamente pelo Runtime.  
O AI Auditor consome o `ExecutionResult` **após** a coleta.

---

## 4. Integração futura (FASE 9)

Documentação de como o Runtime utilizará cada componente — **sem implementação funcional**:

| Componente | Sprint | Uso futuro pelo Runtime |
|------------|--------|-------------------------|
| Healthcare Model | EPC-19 | Entrada exclusiva (`healthcareModelRef`) |
| TISS Profile | EPC-22 | `resolveProfile` → `TISSProfilePort` |
| Contract Foundation | EPC-11 | Fora do Runtime (sem interpretação) |
| Contract Rule Binding | EPC-17 | `resolveBindings` → binding refs |
| Rule Packs | EPC-09 | `resolveRulePacks` → pack refs |
| Rule Engine | EPC-06A | `dispatchRules` → despacho real |
| Expression Engine | EPC-06B | Invocado pelo Rule Engine |
| AI Auditor | EPC-18 | Pós-`ExecutionResult` |
| OCR | EPC-15 | Upstream do Healthcare Model; Runtime nunca chama OCR |

Fonte de código: `FUTURE_INTEGRATION_NOTES`.

---

## 5. Tracing (FASE 10)

Cada execução produz um `ExecutionTrace` com:

- `executionId`
- `correlationId`
- `pipelineId`
- `stages` (snapshot)
- `startedAt` / `finishedAt` / `durationMs`
- `status`
- `errors` / `warnings`

Sem persistência. Sem banco. Store in-process apenas.

---

## 6. Garantias

| Garantia | Status |
|----------|--------|
| Nenhuma regra executada | ✅ `rulesExecuted: false` / `implementsRuleExecution: false` |
| Nenhuma validação TISS | ✅ |
| Nenhum contrato específico | ✅ |
| Resultado não interpretado | ✅ `collectsResultsWithoutInterpretation: true` |
| Preparado para AI Auditor | ✅ `aiAuditorPrepared: true` |
| Prep estrutural batch/parallel/tracing | ✅ capabilities |
