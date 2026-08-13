# Audit Real Discovery — A9-01

| Campo      | Valor                       |
| ---------- | --------------------------- |
| Projeto    | MedicFlow-AI                |
| Baseline   | Enterprise Runtime v1.1     |
| Sprint     | A9-01                       |
| Natureza   | Discovery                   |
| Atualizado | Sprint A9-01                |

---

## 1. Objetivo

Auditoria completa da infraestrutura `Enterprise Audit Runtime` responsável pela futura capability `Audit` (TISS-RUNTIME-05A). Mapeamento integral da arquitetura existente, sem implementação funcional, sem criação de `Runtime`, `Port`, `Gateway`, `Pipeline`, `Composition Root` e sem alteração de qualquer arquivo em `src/`.

---

## 2. Escopo da auditoria

Foram auditados:

- `AuditRuntimePort`
- `AuditRuntimeProviderId` / providers registrados
- `AuditRuntimeFactory`
- `AuditRuntimeRegistry`
- `AuditRuntimeStore` e `adapters`
- `processTissPersistedAudited` (entrypoint TISS-RUNTIME-05A)
- `processTissAuditJob` (operacional worker)
- Reutilização de `QueueRuntimePort`, `WorkerRuntimePort`, `SchedulerRuntimePort`, `Retry`, `Dead Letter` e `ObservabilityRuntimePort`
- State Machine de `PERSISTED` → `AUDITED` (Completed NÃO participa)

---

## 3. AuditRuntimePort

### 3.1 Contrato

`src/lib/enterprise/audit-runtime/ports/audit-runtime-port.ts`

```ts
export interface AuditRuntimePort {
  readonly providerId: AuditRuntimeProviderId;
  openJob(input: OpenAuditJobInput): Promise<OpenAuditJobResult>;
  closeJob(input: CloseAuditJobInput): Promise<CloseAuditJobResult>;
  submitRequest(input: SubmitAuditRequestInput): Promise<SubmitAuditRequestResult>;
  registerFinding(input: RegisterAuditFindingInput): Promise<RegisterAuditFindingResult>;
  getResult(input: GetAuditResultInput): Promise<GetAuditResultResult>;
  stats(input?: AuditStatsInput): Promise<AuditStatsResult>;
  health(): Promise<AuditRuntimeHealth>;
  capabilities(): AuditRuntimeCapabilities;
  providerInfo(): AuditRuntimeInfo;
}
```

### 3.2 Métodos públicos

| Método | Propósito |
|---|---|
| `openJob` | Abre job de auditoria de forma estrutural (não executa auditoria real) |
| `closeJob` | Fecha job de auditoria de forma estrutural |
| `submitRequest` | Cria `AuditRequest` estrutural dentro de um job |
| `registerFinding` | Registra `AuditFinding` estrutural (sem regras/IA) |
| `getResult` | Obtém resultado estrutural por job/request/finding |
| `stats` | Estatísticas do store in-memory |
| `health` | Shape-check de prontidão do adapter e peers |
| `capabilities` | Capacidades declarativas do adapter |
| `providerInfo` | Metadados agregados do provider ativo |

### 3.3 Contratos e modelos canônicos

- `AuditJob`
- `AuditRequest`
- `AuditFinding`
- `AuditResult`
- `AuditStatistics`
- `AuditContext`
- `AIOrchestrationContext`
- `DocumentClassificationContext`
- `DocumentExtractionResult`
- `ValidationResult`
- `AuditRuntimeHealth`
- `AuditRuntimeCapabilities`
- `AuditRuntimeInfo`
- `AuditRuntimeProviderMetadata`
- `AuditRuntimeTelemetry`
- `AuditRuntimeStructuredLog`

### 3.4 Capabilities declaradas (F3-CAP-10)

Todas as operações estruturais estão habilitadas:

- `supportsOpenJob`, `supportsCloseJob`, `supportsSubmitRequest`, `supportsRegisterFinding`, `supportsGetResult`, `supportsStats`, `supportsHealth`, `supportsCanonicalAudit`, `supportsTimeout`, `supportsRetry`, `supportsCancellation`, `supportsTelemetry`
- `usesAIOrchestrationRuntimePort`, `usesValidationRuntimePort`, `usesDocumentExtractionRuntimePort`, `usesDocumentClassificationRuntimePort`, `usesOCRRuntimePort`, `usesIntelligentCaptureRuntimePort`, `usesScannerRuntimePort`, `usesWatchFolderRuntimePort`, `usesUploadRuntimePort`, `usesPersistentQueueRuntimePort`, `usesWorkerRuntimePort`, `usesSchedulerRuntimePort`, `usesObservabilityRuntimePort`, `usesScalabilityRuntimePort`
- `runtimeReady: true`

Todas as flags de execução real permanecem `false`:

- `auditEngineImplemented`, `businessRulesImplemented`, `tissAuditImplemented`, `operatorAuditImplemented`, `automaticAuditImplemented`, `auditSuggestionsImplemented`, `auditJustificationImplemented`, `auditScoreImplemented`, `complianceImplemented`, `automaticCorrectionImplemented`

### 3.5 Health

`AuditRuntimeHealth` realiza shape-check dos Ports Enterprise disponíveis (AIOrchestration, Validation, DocumentExtraction, DocumentClassification, OCR, ICR, Scanner, WatchFolder, Upload, PersistentQueue, Worker, Scheduler, Observability, Scalability) sem executar lógica funcional.

---

## 4. Providers

### 4.1 IDs registrados

`src/lib/enterprise/audit-runtime/ports/types.ts`

```ts
export type AuditRuntimeProviderId = "mock" | "test" | "default" | "enterprise";
```

### 4.2 Providers encontrados

| Provider ID | Adapter | Versão | Status |
|---|---|---|---|
| `mock` | `MockAuditRuntimeAdapter` | `1.0.0` | `ready` |
| `test` | `MockAuditRuntimeAdapter` | `1.0.0` | `ready` |
| `default` | `DefaultAuditRuntimeAdapter` | `0.0.0` (via `DEFAULT_AUDIT_RUNTIME_VERSION`) | `ready` |
| `enterprise` | `DefaultAuditRuntimeAdapter` | `0.0.0` | `ready` |

### 4.3 Confirmação: inexistência do provider `real-tiss`

- O `AuditRuntimeRegistry` NÃO possui registro para `real-tiss`.
- O `AuditRuntimeFactory` não possui `case "real-tiss"`.
- Nenhum `RealTissAuditRuntimeAdapter` foi encontrado em `src/lib/enterprise/audit-runtime/adapters/`.
- O `AuditRuntimeProviderId` é `mock | test | default | enterprise` exclusivamente.

### 4.4 Provider recomendado para ativação futura

- Provider ID: `real-tiss`
- Adapter: `RealTissAuditRuntimeAdapter` (a ser criado em Sprint futura)
- Estratégia: estender `AuditRuntimeFactory` com `case "real-tiss"` e registrar `AuditRuntimeRegistry` sem alterar `EnterpriseRuntime`, `Ports`, `Pipeline` ou `Composition Root`.

---

## 5. Factory

### 5.1 Arquitetura

`src/lib/enterprise/audit-runtime/factory/audit-runtime-factory.ts`

```
Application → Enterprise Runtime → AuditRuntimePort → Adapter ← Factory ← Registry
```

### 5.2 Resolução

- `createAuditRuntimePort(options)` → `getSharedFactory().create(options)`
- Default: `provider: "enterprise"`
- Providers desconhecidos lançam erro explicitamente (sem fallback).
- Mapeamento interno:
  - `mock` / `test` → `MockAuditRuntimeAdapter`
  - `default` / `enterprise` → `DefaultAuditRuntimeAdapter`

### 5.3 Extensão futura para `real-tiss`

No `instantiate` da `AuditRuntimeFactory`, adicionar:

```ts
case "real-tiss":
  return new RealTissAuditRuntimeAdapter({
    provider: "real-tiss",
    store: this.store,
    enterpriseDeps,
  });
```

Nenhum `Port` novo é necessário.

---

## 6. Registry

### 6.1 Estrutura

`src/lib/enterprise/audit-runtime/registry/audit-runtime-registry.ts`

- 4 registros built-in: `mock`, `test`, `default`, `enterprise`.
- Métodos: `register`, `get`, `has`, `list`, `listByStatus`, `snapshot`.
- Sem lógica de negócio, sem IA, sem regras TISS.

### 6.2 Registros atuais

```ts
const BUILTIN_REGISTRATIONS = [
  { providerId: "mock", name: "Mock Audit Runtime", ... },
  { providerId: "test", name: "Test Audit Runtime", ... },
  { providerId: "default", name: "Default Audit Runtime", ... },
  { providerId: "enterprise", name: "Enterprise Audit Runtime", ... },
];
```

### 6.3 Extensão futura

Adicionar à `BUILTIN_REGISTRATIONS`:

```ts
{
  providerId: "real-tiss",
  name: "RealTiss Audit Runtime",
  version: "1.0.0",
  status: "ready",
  adapterId: "real-tiss-audit-runtime",
  vendor: "real-tiss",
  capabilities: DEFAULT_AUDIT_RUNTIME_ENGINE_CAPABILITIES,
  description: "RealTiss production-grade audit runtime adapter.",
}
```

---

## 7. Store

### 7.1 Contrato

`src/lib/enterprise/audit-runtime/store/audit-runtime-store.ts`

- `AuditRuntimeStore` gerencia `AuditJob`, `AuditRequest`, `AuditFinding`, `AuditResult`, `AuditStatistics`.
- `InMemoryAuditRuntimeStore` é a implementação in-process.
- Acesso exclusivo via Adapter — nunca diretamente pelo produto.

### 7.2 Estado da Store

- Sem I/O externo obrigatório.
- Prontidão via `health()`.
- Não persiste em banco na F3-CAP-10.

---

## 8. Pipeline e State Machine

### 8.1 Pipeline Audit (TISS-RUNTIME-05A)

```
Job PERSISTED
  ↓
Worker consome via QueueRuntimePort
  ↓
AuditRuntimePort.openJob / getResult
  ↓
QueueRuntimePort.enqueue(status AUDITED)
```

- Único entrypoint: `processTissPersistedAudited` (`src/lib/enterprise/runtime/process-tiss-persisted-audited.ts`)
- Reutiliza `getEnterpriseRuntime()`, `QueueRuntimePort`, `WorkerRuntimePort`, `SchedulerRuntimePort`, `ObservabilityRuntimePort`, `AuditRuntimePort`, `Retry` e `Dead Letter`.

### 8.2 Audit State Machine

```
PERSISTED
  ↓
AUDITED
  ↓
COMPLETED   (futura Sprint; NÃO executada nesta Sprint)
```

- `PERSISTED → AUDITED` é o escopo da TISS-RUNTIME-05A.
- `AUDITED → COMPLETED` é escopo futuro da TISS-RUNTIME-05B.
- `Completed` NÃO foi executado e NÃO será mapeado nesta Sprint.

### 8.3 Confirmação: Completed NÃO participa

- `processTissAuditJob` retorna `completedExecuted: false`.
- `processTissPersistedAudited` retorna `completedExecuted: false`.
- Nenhum `CompletedRuntimePort` foi ativado.
- O estado `COMPLETED` aparece apenas como próximo estágio do State Machine.

---

## 9. Workers

### 9.1 Workers identificados

| Worker | Função | Status |
|---|---|---|
| `WorkerRuntimePort` (padrão) | Aloca e consome da `enterprise-tiss` queue | REUTILIZADO |
| `processTissPersistedAudited` | Entrypoint oficial TISS-RUNTIME-05A | REUTILIZADO |
| `processTissAuditJob` | Processamento operacional do job `PERSISTED → AUDITED` | REUTILIZADO |

### 9.2 Condição de `processTissAuditJob`

- Valida `getQueueRuntimePort` e `getAuditRuntimePort`.
- Verifica `tissJobStatus === "PERSISTED"`.
- Invoca `AuditRuntimePort.openJob` e `getResult`.
- Reenfileira mensagem com `status: "AUDITED"`.
- Nunca executa `Completed`.

---

## 10. Queue

- `QueueRuntimePort` da `Enterprise Runtime` é reutilizada.
- Queue: `enterprise-tiss`.
- Mensagens `PERSISTED` consomidas; mensagens `AUDITED` produzidas.
- Sem criação de queue paralela.

---

## 11. Scheduler, Retry, Dead Letter e Observability

### 11.1 Scheduler

- `SchedulerRuntimePort` reutilizado.
- Apenas shape-check; sem agendamento novo.

### 11.2 Retry

- Via `QueueRuntimePort.getRetryInfrastructure()`.
- `processTissPersistedAudited` verifica `retryInfrastructure`.

### 11.3 Dead Letter

- Via `QueueRuntimePort.getDeadLetterRuntimePort()`.
- `processTissPersistedAudited` verifica `deadLetterRuntime`.

### 11.4 Observability

- `ObservabilityRuntimePort` reutilizado.
- `processTissPersistedAudited` faz `void runtime.getObservabilityRuntimePort()`.
- Sem métricas separadas.

---

## 12. Audit Runtime Dependency Matrix

| Componente | Status | Classificação | Notas |
|---|---|---|---|
| `EnterpriseRuntime` | REUTILIZADO | REUTILIZADO | `getEnterpriseRuntime()` é o entrypoint; `getAuditRuntimePort()` já existente |
| `AuditRuntimePort` | REUTILIZADO | REUTILIZADO | Port canônico; nenhum novo Port |
| `AuditRuntimeFactory` | REUTILIZADO | REUTILIZADO | `AuditRuntimeFactory.create` resolve `mock/test/default/enterprise` |
| `AuditRuntimeRegistry` | REUTILIZADO | REUTILIZADO | 4 providers built-in; futuro `real-tiss` via `register` |
| `QueueRuntimePort` | REUTILIZADO | REUTILIZADO | `enterprise-tiss` compartilhada |
| `WorkerRuntimePort` | REUTILIZADO | REUTILIZADO | Aloca worker padrão |
| `SchedulerRuntimePort` | REUTILIZADO | REUTILIZADO | Shape-check apenas |
| `Retry` | REUTILIZADO | REUTILIZADO | Via `QueueRuntimePort` |
| `Dead Letter` | REUTILIZADO | REUTILIZADO | Via `QueueRuntimePort` |
| `ObservabilityRuntimePort` | REUTILIZADO | REUTILIZADO | Shape-check apenas |
| `InMemoryAuditRuntimeStore` | REUTILIZADO | REUTILIZADO | Store in-process; futuro RealTiss pode usar outra store |
| `CompletedRuntimePort` | NÃO UTILIZADO | NÃO UTILIZADO | Fora do escopo de A9-01 |
| `RealTissAuditRuntimeAdapter` | NÃO EXISTE | — | A ser implementado em Sprint futura de Activation |

Nenhum componente foi classificado como "Novo".

---

## 13. Audit Extension Points

Pontos oficiais onde o futuro `RealTissAuditRuntimeAdapter` poderá evoluir **sem modificar** a arquitetura congelada:

1. **Adapter concreto**: criar `RealTissAuditRuntimeAdapter implements AuditRuntimePort` em `src/lib/enterprise/audit-runtime/adapters/`.
2. **Factory**: adicionar `case "real-tiss"` em `AuditRuntimeFactory.instantiate`.
3. **Registry**: registrar `real-tiss` em `AuditRuntimeRegistry`.
4. **Runtime override**: `getEnterpriseRuntime({ auditRuntimePort: createAuditRuntimePort({ provider: "real-tiss" }) })` — sem alterar `DefaultEnterpriseRuntime`.
5. **Store**: futuro `RealTissAuditRuntimeStore` pode implementar `AuditRuntimeStore` e ser injetado pelo `Factory`.
6. **Worker/Pipeline**: `processTissAuditJob` continua inalterado; apenas a implementação do `AuditRuntimePort` muda.

Nenhum destes pontos altera `EnterpriseRuntime`, `Pipeline`, `Queue`, `Ports`, `Factories` ou `Registries` congelados.

---

## 14. Security Hooks

Pontos arquiteturais onde `BLOCO S — Enterprise Security` poderá se conectar futuramente como camada transversal, **sem modificar** a arquitetura congelada:

| Hook | Localização futura | O que será possível |
|---|---|---|
| `openJob` / `closeJob` | `RealTissAuditRuntimeAdapter` | Registro de criação/fechamento de job com identidade do operador |
| `submitRequest` | `RealTissAuditRuntimeAdapter` | Hash SHA-256 do payload submetido |
| `registerFinding` | `RealTissAuditRuntimeAdapter` | Assinatura digital do finding |
| `getResult` | `RealTissAuditRuntimeAdapter` | Verificação de integridade documental |
| `CanonicalQueueMessage` | customAttributes | Cadeia de custódia e `previousJobId` |
| `processTissAuditJob` | wrapper ou interceptor | Imutabilidade da transição `PERSISTED → AUDITED` |
| `AuditRuntimeStore` | implementação real | Auditoria criptográfica de leitura/escrita |

**Nenhum destes mecanismos foi implementado nesta Sprint.** Registrados apenas como pontos de extensão arquitetural.

---

## 15. Estratégia oficial de ativação do `RealTissAuditRuntimeAdapter`

1. **Sprint de Activation futura** criar `RealTissAuditRuntimeAdapter` implementando `AuditRuntimePort`.
2. **Provider ID** `real-tiss` registrado em `AuditRuntimeRegistry`.
3. **Factory** estendida com `case "real-tiss"`.
4. **Store** reutilizada ou substituída via `Factory` sem mudar o Port.
5. **Runtime** ativado via `getEnterpriseRuntime({ auditRuntimePort: createAuditRuntimePort({ provider: "real-tiss" }) })` ou por opção passada no `Factory`.
6. **Worker/Pipeline** inalterados: `processTissPersistedAudited` e `processTissAuditJob` continuam consumindo `AuditRuntimePort`.
7. **Certificação**: testar `PERSISTED → AUDITED` com `real-tiss` mantendo `Completed` desativado.

---

## 16. Confirmações

- ✅ `AuditRuntimePort` auditado.
- ✅ Providers `mock`, `test`, `default`, `enterprise` mapeados.
- ✅ Provider `real-tiss` confirmado inexistente.
- ✅ `AuditRuntimeFactory` e `AuditRuntimeRegistry` mapeados.
- ✅ `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter` e `Observability` reutilizados.
- ✅ Pipeline `PERSISTED → AUDITED` confirmado.
- ✅ `Completed` NÃO executado e NÃO mapeado além do estado futuro.
- ✅ `Security Hooks` documentados sem implementação.
- ✅ `Enterprise Runtime Baseline v1.1` preservada.

---

## 17. Referências

- [`ENTERPRISE_BASELINE_V1_1.md`](./ENTERPRISE_BASELINE_V1_1.md)
- [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md)
- [`PRODUCTION_GAP_TRACKER.md`](./PRODUCTION_GAP_TRACKER.md)
- [`REAL_PROVIDER_CERTIFICATION_MATRIX.md`](./REAL_PROVIDER_CERTIFICATION_MATRIX.md)
- [`ARCHITECTURAL_DECISION_LOG.md`](./ARCHITECTURAL_DECISION_LOG.md)
