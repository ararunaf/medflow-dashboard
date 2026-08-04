# F3-CAP-10 — Audit Runtime Architecture

## Fluxo estrutural oficial

```
Produto
  → Enterprise Runtime
    → AuditRuntimePort
      → DefaultAuditRuntimeAdapter / EnterpriseAuditRuntimeAdapter / MockAuditRuntimeAdapter
        → InMemoryAuditRuntimeStore
          → AuditResult (canônico estrutural)
```

## Camadas ECS-01

| Pasta | Responsabilidade |
|-------|------------------|
| `ports/` | Port, canonical models, capabilities, identity, types |
| `providers/` | `createAuditRuntimePort()` |
| `factory/` | `AuditRuntimeFactory` |
| `registry/` | Catálogo mock/test/default/enterprise |
| `adapters/` | Default / Enterprise (alias) / Mock |
| `store/` | Contrato + InMemory (sem banco) |
| `demo/` | `getAuditRuntimeHealthSummary()` |
| `index.ts` | Barrel público |

## Contratos canônicos

AuditRequest · AuditResult · AuditIssue · AuditFinding · AuditRecommendation · AuditJustification · AuditScore · AuditStatistics · AuditSummary · AuditMetadata · AuditContext · AuditHealth · AuditCapabilities · AuditStatus

## Operações estruturais

`openJob` · `closeJob` · `submitRequest` · `registerFinding` · `getResult` · `stats` · `health` · `capabilities` · `providerInfo`

Nenhuma operação executa auditoria real, IA, regras TISS ou correção.

## Composition Root

`DefaultEnterpriseRuntime`:

- resolve `createAuditRuntimePort({ provider: "enterprise", enterpriseDeps })`
- expõe `getAuditRuntimePort()`
- agrega `auditRuntimeOk` em `health()`

Peers injetados via lazy getters; `health()` apenas faz **shape-check** (`health` + `capabilities` presentes) — **não** chama `peer.health()`.

## Limites explícitos

- Nenhuma auditoria foi implementada
- Nenhuma IA foi utilizada
- Nenhuma regra TISS foi criada
- Todos os contratos são exclusivamente estruturais
- Store é in-process; sem migrations, sem I/O externo
