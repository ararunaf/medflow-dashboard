# EPC-23 — Runtime Model

**Sprint:** EPC-23 — TISS Rule Runtime Foundation  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-rule-runtime/ports/models.ts`  
**Documento pai:** [`EPC-23_TISS_RULE_RUNTIME_FOUNDATION.md`](./EPC-23_TISS_RULE_RUNTIME_FOUNDATION.md)

---

## 1. Princípio

Todos os modelos são **estruturais e de orquestração**.

- Sem lógica de negócio
- Sem validação TISS / ANS
- Sem execução de regras
- Sem interpretação de contratos
- Sem OCR / AI / parser
- Sem persistência em banco

O Runtime **coordena**; não decide.

---

## 2. Modelos obrigatórios

### 2.1 TISSExecutionContext

**Responsabilidade:** Contexto canônico de uma execução.

| Campo | Papel |
|-------|-------|
| `executionId` | Identidade estável da execução |
| `healthcareModelRef` | Entrada exclusiva (referência opaca) |
| `correlationId` | Correlação entre sistemas |
| `pipelineId` / `traceId` / `resultId` | Ligações estruturais |
| `profileRef` / `bindingRefs` / `rulePackRefs` | Artefatos resolvidos (opacos) |
| `status` | Estado estrutural |

**Garantia:** Recebe exclusivamente Healthcare Model. Não interpreta conteúdo clínico.

---

### 2.2 ExecutionStage

**Responsabilidade:** Estágio individual do pipeline.

| Campo | Papel |
|-------|-------|
| `name` | Nome canônico do estágio |
| `order` | Ordem lógica (0-based) |
| `status` | pending / running / completed / … |
| `artifactRef` | Referência opaca ao artefato |
| `startedAt` / `finishedAt` / `durationMs` | Timing estrutural |
| `errors` / `warnings` | Mensagens estruturais (não decisões) |

---

### 2.3 ExecutionPipeline

**Responsabilidade:** Representar exclusivamente o fluxo FASE 7.

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

**Garantia:** Sem executar nenhuma regra.

Ver [`EPC-23_EXECUTION_PIPELINE.md`](./EPC-23_EXECUTION_PIPELINE.md).

---

### 2.4 ExecutionResult

**Responsabilidade:** Resultado estrutural coletado.

| Campo | Papel |
|-------|-------|
| `healthcareModelRef` … `ruleDispatchRef` | Referências opacas |
| `collectedPayload` | Payload opaco (nunca interpretado) |
| `aiAuditorPrepared` | Prep para AI Auditor (`true`) |
| `errors` / `warnings` | Coletados sem interpretação |

**Garantia:** O Runtime coleta sem interpretar.

---

### 2.5 ExecutionMetadata

**Responsabilidade:** Metadados estruturais da execução.

| Campo | Papel |
|-------|-------|
| `tenantRef` | Referência opaca de tenant |
| `correlationId` | Correlação |
| `channel` / `tags` | Classificação estrutural |
| `customAttributes` | Atributos livres opacos |

---

### 2.6 ExecutionTrace

**Responsabilidade:** Rastreamento canônico (FASE 10).

| Campo | Papel |
|-------|-------|
| `executionId` | Id da execução |
| `correlationId` | Correlação |
| `pipelineId` | Id do pipeline |
| `stages` | Snapshot dos estágios |
| `startedAt` / `finishedAt` / `durationMs` | Timing |
| `status` | Estado |
| `errors` / `warnings` | Agregados estruturais |

**Garantia:** Sem persistência. Sem banco. In-process apenas.

---

## 3. RuntimeCapabilities

Estrutura (FASE 8) — sem implementação funcional:

| Flag | Significado estrutural |
|------|------------------------|
| `supportsParallelExecution` | Prep para execução paralela |
| `supportsBatchExecution` | Prep para lote |
| `supportsVersioning` | Prep para versionamento |
| `supportsTracing` | Tracing estrutural ativo |
| `supportsRollback` | Prep para rollback |
| `supportsRetry` | Prep para retry |

Flags negativas obrigatórias:

- `implementsRuleExecution: false`
- `implementsTissValidation: false`
- `implementsSpecificContracts: false`
- `orchestrationOnly: true`

---

## 4. Cadeia estrutural

```
execution-context
  → execution-stage
  → execution-pipeline
  → execution-result
  → execution-metadata
  → execution-trace
```

Constante: `RUNTIME_STRUCTURAL_CHAIN`.
