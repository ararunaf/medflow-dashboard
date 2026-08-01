# EPC-24 — Execution Trace Model

**Sprint:** EPC-24 Sprint 07  
**Escopo:** Modelos canônicos estruturais do Execution Trace  
**Regra:** Nenhum modelo contém regra de negócio.

---

## 1. Modelos canônicos (12)

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionTrace` | `execution-trace` | Agregado raiz do rastreamento |
| `ExecutionTraceEntry` | `execution-trace-entry` | Entrada anexável (não é log) |
| `ExecutionTraceStep` | `execution-trace-step` | Step estrutural |
| `ExecutionTraceNode` | `execution-trace-node` | Nó estrutural da cadeia |
| `ExecutionTraceReference` | `execution-trace-reference` | Referência opaca |
| `ExecutionTraceMetadata` | `execution-trace-metadata` | Metadados estruturais |
| `ExecutionTraceSnapshot` | `execution-trace-snapshot` | Snapshot estrutural |
| `ExecutionTraceTimeline` | `execution-trace-timeline` | Timeline estrutural |
| `ExecutionTraceCapabilities` | `execution-trace-capabilities` | Capacidades embutidas |
| `ExecutionTraceStatistics` | `execution-trace-statistics` | Estatísticas in-memory |
| `ExecutionTraceHealth` | `execution-trace-health` | Saúde estrutural |
| `ExecutionTraceResult` | `execution-trace-result` | Resultado de operação |

Constante: `STRUCTURAL_TRACE_CAPABILITY`.

---

## 2. Flags estruturais obrigatórias

Todo Trace declara explicitamente:

- `structuralTraceOnly: true`
- `persistenceImplemented: false`
- `databaseUsed: false`
- `logsImplemented: false`
- `telemetryImplemented: false`
- `observabilityExternal: false`
- `enginesInvoked: false`
- `decoupledFromEngines: true`
- `noDirectEngineCoupling: true`

Toda `ExecutionTraceEntry` declara:

- `logsWritten: false`
- `telemetrySent: false`

---

## 3. Relação com Execution Context

O Context **não embute** o Trace.  
Apenas referencia `executionTraceId` via:

- `references[]`
- `metadata.customAttributes`
- `history[]` (`execution-trace-attached`)

O Trace permanece dono dos dados de rastreamento.

---

## 4. Localização

`src/lib/enterprise/execution-trace/ports/models.ts`
