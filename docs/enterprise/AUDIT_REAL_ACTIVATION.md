# Audit Real Activation — A9-02

| Campo      | Valor                       |
| ---------- | --------------------------- |
| Projeto    | MedicFlow-AI                |
| Baseline   | Enterprise Runtime v1.1     |
| Sprint     | A9-02                       |
| Natureza   | Activation                  |
| Atualizado | Sprint A9-02                |

---

## 1. Objetivo

Ativar o provider `real-tiss` do `AuditRuntimePort` sem alterar `EnterpriseRuntime`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Pipeline`, `Composition Root` ou qualquer `Runtime` existente.

---

## 2. Arquitetura de ativação

```
getEnterpriseRuntime({ auditRuntimePort: createAuditRuntimePort({ provider: "real-tiss" }) })
  → AuditRuntimePort (real-tiss)
    → RealTissAuditRuntimeAdapter
      → DefaultAuditRuntimeAdapter (lifecycle, retry, telemetry, statistics, health, store)
        → InMemoryAuditRuntimeStore
```

- Nenhum `Port`, `Runtime`, `Gateway`, `Pipeline` ou `Composition Root` novo foi criado.
- `RealTissAuditRuntimeAdapter` implementa o `AuditRuntimePort` canônico.
- Toda a lógica operacional é delegada ao `DefaultAuditRuntimeAdapter`.

---

## 3. Arquivos alterados

### 3.1 Implementação

- `src/lib/enterprise/audit-runtime/adapters/real-tiss-audit-runtime-adapter.ts` (novo)
- `src/lib/enterprise/audit-runtime/adapters/index.ts`
- `src/lib/enterprise/audit-runtime/ports/types.ts`
- `src/lib/enterprise/audit-runtime/factory/audit-runtime-factory.ts`
- `src/lib/enterprise/audit-runtime/registry/audit-runtime-registry.ts`
- `src/lib/enterprise/audit-runtime/index.ts`

### 3.2 Testes

- `scripts/enterprise/tests/audit-runtime-engine.test.ts` (atualizado)
- `scripts/enterprise/tests/tiss-runtime-05a-audit-real-activation.test.ts` (novo)

### 3.3 Documentação

- `docs/enterprise/AUDIT_REAL_ACTIVATION.md` (este arquivo)
- `docs/enterprise/OPER_INF_ROADMAP.md` (atualizado)
- `docs/enterprise/PRODUCTION_GAP_TRACKER.md` (atualizado)
- `docs/enterprise/REAL_PROVIDER_CERTIFICATION_MATRIX.md` (atualizado)

---

## 4. Provider `real-tiss` registrado

### 4.1 `AuditRuntimeProviderId`

```ts
export type AuditRuntimeProviderId = "mock" | "test" | "default" | "enterprise" | "real-tiss";
```

### 4.2 `AuditRuntimeFactory` resolução

```ts
case "real-tiss":
  return new RealTissAuditRuntimeAdapter({
    provider: "real-tiss",
    store: this.store,
    enterpriseDeps,
  });
```

### 4.3 `AuditRuntimeRegistry` registro

| Campo | Valor |
|---|---|
| `providerId` | `real-tiss` |
| `name` | `RealTiss Audit Runtime` |
| `version` | `1.0.0` |
| `status` | `ready` |
| `adapterId` | `real-tiss-audit-runtime` |
| `vendor` | `real-tiss` |
| `capabilities` | `DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES` |

---

## 5. Reutilização do `DefaultAuditRuntimeAdapter`

O `RealTissAuditRuntimeAdapter` delega integralmente:

- `openJob` → `DefaultAuditRuntimeAdapter.openJob`
- `closeJob` → `DefaultAuditRuntimeAdapter.closeJob`
- `submitRequest` → `DefaultAuditRuntimeAdapter.submitRequest`
- `registerFinding` → `DefaultAuditRuntimeAdapter.registerFinding`
- `getResult` → `DefaultAuditRuntimeAdapter.getResult`
- `stats` → `DefaultAuditRuntimeAdapter.stats`
- `health` → `DefaultAuditRuntimeAdapter.health` (com `provider` sobrescrito para `real-tiss`)
- `capabilities` → `DefaultAuditRuntimeAdapter.capabilities` (com `provider` e `adapterId` reais)
- `providerInfo` → metadados próprios de `real-tiss`
- `AbortSignal`, `timeout`, `retry`, `telemetry`, `store` → via `DefaultAuditRuntimeAdapter`

Nenhuma lógica foi duplicada.

---

## 6. Pipeline `PERSISTED → AUDITED`

O pipeline continua inalterado:

```
PERSISTED
  ↓ Worker consome via QueueRuntimePort
  ↓ AuditRuntimePort.openJob / getResult
  ↓ QueueRuntimePort.enqueue(status AUDITED)
```

- `Completed` continua retornando `completedExecuted: false`.
- Nenhuma transição `AUDITED → COMPLETED` é executada.

---

## 7. Canonical Audit Metadata

Metadados canônicos preservados no `AuditJob` / `CanonicalQueueMessage`:

| Campo | Origem | Status |
|---|---|---|
| `correlationId` | `message.metadata.customAttributes.correlationId` | Preservado |
| `sessionId` | `message.metadata.customAttributes.sessionId` | Preservado |
| `documentId` | `message.metadata.customAttributes.documentId` | Preservado |
| `previousJobId` | `message.messageId` | Preservado |
| `tenantId` | `customAttributes` canônico | Mapeado para extensão futura |
| `runtimeId` | `getEnterpriseRuntime().runtimeId` | Preservado |
| `traceId` | `customAttributes` canônico | Mapeado para extensão futura |
| `actor` | `customAttributes` / `metadata` | Mapeado para extensão futura |
| `timestamp UTC` | `new Date().toISOString()` | Preservado |
| `auditVersion` | `REALTISS_AUDIT_RUNTIME_VERSION` (`1.0.0`) | Preservado |

---

## 8. Audit Integrity Matrix

| Mecanismo | Status | Notas |
|---|---|---|
| Hash | NÃO IMPLEMENTADO | Planejado para BLOCO S |
| Assinatura Digital | NÃO IMPLEMENTADO | Planejado para BLOCO S |
| Cadeia de Custódia | NÃO IMPLEMENTADO | Planejado para BLOCO S; `previousJobId` preservado |
| Retry | IMPLEMENTADO | Herdado de `DefaultAuditRuntimeAdapter` + `QueueRuntimePort.getRetryInfrastructure()` |
| DLQ | IMPLEMENTADO | Herdado de `QueueRuntimePort.getDeadLetterRuntimePort()` |
| Telemetria | IMPLEMENTADO | Herdado de `DefaultAuditRuntimeAdapter` (`AuditRuntimeTelemetry` / `AuditRuntimeStructuredLog`) |

---

## 9. Audit Future Integrations

Integrações futuras planejadas para fases de `Security` e `Observability`, sem implementação nesta Sprint:

- **Azure Key Vault** — armazenamento de chaves de assinatura
- **HSM** — geração e custódia de chaves privadas
- **ICP-Brasil** — certificados digitais para assinatura
- **OAuth2 / JWT** — autenticação do ator de auditoria
- **OpenTelemetry** — distributed tracing
- **Azure Monitor** — métricas operacionais
- **SIEM** — ingestão de logs de auditoria de segurança

---

## 10. Evidence Package

Estrutura futura do pacote de evidências para assinatura/auditability:

- `XML` original gerado
- `Batch` manifest
- `Protocol` metadata
- `Hash` (SHA-256 futuro)
- `Timestamp` UTC
- `Telemetria` estrutural
- `Cadeia de Custódia` (`previousJobId` já preservado)

Nenhum destes mecanismos foi implementado nesta Sprint, exceto a preservação de metadados e telemetria estrutural.

---

## 11. Confirmações

- ✅ Provider `real-tiss` ativado.
- ✅ `AuditRuntimePort` reutilizado.
- ✅ `DefaultAuditRuntimeAdapter` reutilizado.
- ✅ `AuditRuntimeFactory` e `AuditRuntimeRegistry` estendidos.
- ✅ `getEnterpriseRuntime()` ativa `real-tiss` via override.
- ✅ Pipeline `PERSISTED → AUDITED` validado.
- ✅ `Completed` NÃO executado.
- ✅ `Enterprise Runtime Baseline v1.1` preservada.
- ✅ Nenhum `Runtime`, `Port`, `Gateway`, `Pipeline` ou `Composition Root` novo.

---

## 12. Referências

- [`AUDIT_REAL_DISCOVERY.md`](./AUDIT_REAL_DISCOVERY.md)
- [`ENTERPRISE_BASELINE_V1_1.md`](./ENTERPRISE_BASELINE_V1_1.md)
- [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md)
- [`PRODUCTION_GAP_TRACKER.md`](./PRODUCTION_GAP_TRACKER.md)
- [`REAL_PROVIDER_CERTIFICATION_MATRIX.md`](./REAL_PROVIDER_CERTIFICATION_MATRIX.md)
