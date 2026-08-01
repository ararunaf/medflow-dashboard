# EPC-24 — Execution Context Model

**Sprint:** EPC-24 Sprint 03 — Execution Context Foundation  
**Módulo:** `src/lib/enterprise/execution-context/ports/models.ts`

---

## 1. Princípio

Todos os modelos são **estruturais**.  
Nenhum modelo contém regra de negócio, interpretação clínica, TISS, ANS ou decisão.

---

## 2. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `ExecutionContext` | `execution-context` | Agregado canônico compartilhado na execução |
| `ExecutionContextIdentity` | `execution-context-identity` | Identidade (`contextId`, `executionId`, `correlationId`, …) |
| `ExecutionContextMetadata` | `execution-context-metadata` | Tags, timestamps, notas estruturais |
| `ExecutionContextState` | `execution-context-state` | Status / phase / contadores (sem FSM de negócio) |
| `ExecutionContextReference` | `execution-context-reference` | Refs opacas acumuladas |
| `ExecutionContextHistory` | `execution-context-history` | Histórico append-only in-process |
| `ExecutionContextStage` | `execution-context-stage` | Estágio anexado da composição do pipeline |
| `ExecutionContextCapability` | `execution-context-capability` | Declara o que o Context NÃO executa |
| `ExecutionContextSnapshot` | `execution-context-snapshot` | Snapshot pontual estrutural |
| `ExecutionContextTrace` | `execution-context-trace` | Trace estrutural (`structuralOnly: true`) |

**Total: 10 modelos canônicos.**

Anexo estrutural auxiliar:

| Modelo | Papel |
|--------|-------|
| `ExecutionContextPipelineAttachment` | Composição do Resolver anexada ao Context (sem execução) |

---

## 3. Status / Phase

**Status:** `pending` | `composing` | `ready` | `completed` | `failed` | `cancelled`

**Phase:** `created` | `pipeline-attached` | `structurally-enriched` | `finalized`

---

## 4. Flags explícitas (State / Capability)

```ts
enginesInvoked: false
stagesExecuted: false
processingPerformed: false
structuralTransportOnly: true
decoupledFromEngines: true
implementsOcr: false
implementsAi: false
implementsXmlParser: false
implementsTissRules: false
implementsMapping: false
implementsValidation: false
implementsPersistence: false
```

---

## 5. Port I/O

| Operação | Entrada | Saída |
|----------|---------|-------|
| `createContext` | `CreateContextInput` | `CreateContextResult` |
| `updateContext` | `UpdateContextInput` | `UpdateContextResult` |
| `getContext` | `GetContextInput` | `GetContextResult` |
| `listContexts` | `ListContextsInput` | `ListContextsResult` |
| `health` | — | `ExecutionContextHealth` |
| `capabilities` | — | `ExecutionContextCapabilities` |

Nenhuma operação executa OCR, IA, Rule Engine, Mapping ou qualquer Engine.
