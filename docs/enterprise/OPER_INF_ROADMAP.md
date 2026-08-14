# OPER-INF — Roadmap Oficial de Ativação Operacional INF

| Campo      | Valor             |
| ---------- | ----------------- |
| Atualizado | Sprint S4-02 |

**Natureza:** ativação operacional dos Runtimes INF já congelados (sem nova arquitetura).  
**Pipeline oficial:** Enterprise Runtime → Ports existentes  
**Entrypoint único:** `getEnterpriseRuntime()`

---

## Status das Sprints

| Sprint | Descrição | Status |
|--------|-----------|--------|
| **OPER-INF-Q** | Ativar backend persistente do `QueueRuntimePort` | ✅ Concluída |
| **OPER-INF-W** | Ativar Worker operacional via `QueueRuntimePort` | ✅ Concluída |
| **OPER-INF-S** | Ativar Scheduler operacional via `WorkerRuntimePort` | ✅ Concluída |
| **OPER-INF-D** | Ativar Dead Letter operacional via `DeadLetterRuntimePort` → `QueueRuntimePort` | ✅ Concluída |
| **OPER-INF-O** | Ativar Observability operacional via Ports existentes (somente leitura) | ✅ Concluída |
| **ARC-25** | Documentar e congelar a arquitetura oficial do Enterprise Runtime | ✅ Concluída |
| **OPER-INF-R** | Ativar Retry operacional (decisão de reenvio) | ✅ Concluída |
| **TISS-RUNTIME-01D** | Discovery da arquitetura funcional do TISS Runtime | ✅ Concluída |
| **TISS-RUNTIME-01A** | Ativar entrada operacional do boletim no pipeline oficial (Intake → Queue) | ✅ Concluída |
| **TISS-RUNTIME-01B** | Ativar OCR operacional no Worker (consumo via `QueueRuntimePort`) | ✅ Concluída |
| **TISS-RUNTIME-01C** | Ativar Parser / Extraction operacional no mesmo pipeline | ✅ Concluída |
| **TISS-RUNTIME-02A** | Ativar Validação operacional no Worker (consumo de `PARSED`) | ✅ Concluída |
| **TISS-RUNTIME-02B** | Ativar Enriquecimento operacional no Worker (consumo de `VALIDATED`) | ✅ Concluída |
| **TISS-RUNTIME-03A** | Ativar XML TISS operacional no Worker (consumo de `ENRICHED`) | ✅ Concluída |
| **TISS-RUNTIME-03B** | Ativar Lote operacional no Worker (consumo de `XML_GENERATED`) | ✅ Concluída |
| **TISS-RUNTIME-04A** | Ativar Protocolo operacional no Worker (consumo de `BATCH_CREATED`) | ✅ Concluída |
| **TISS-RUNTIME-04B** | Ativar Persistência operacional no Worker (consumo de `PROTOCOL_SENT`) | ✅ Concluída |
| **A8-FREEZE-01** | Congelar oficialmente a Enterprise Runtime Baseline v1.1 | ✅ Concluída |
| **A8-ADL-01** | Criar Architectural Decision Log da Baseline v1.1 | ✅ Concluída |
| **A9-01** | Audit Real Discovery — mapear arquitetura Audit sem implementação | ✅ Concluída |
| **A9-02** | Audit Real Activation — ativar provider real-tiss do AuditRuntimePort | ✅ Concluída |
| **A9-03** | Audit Real Production Certification — certificar provider real-tiss | ✅ Concluída |
| **A10-01** | Completed Real Discovery — auditar arquitetura do Completed Runtime | ✅ Concluída |
| **TISS-RUNTIME-05A** | Ativar Auditoria operacional no Worker (consumo de `PERSISTED`) | ✅ Concluída |
| **TISS-RUNTIME-05B** | Ativar Completed operacional no Worker (consumo de `AUDITED`) | ✅ Concluída |
| **A10-FINAL-01** | Encerramento do Bloco A | ✅ Concluída |
| **A10-DOC-02** | Sincronização da documentação do Bloco A | ✅ Concluída |
| **S1-01** | Enterprise Security Discovery — mapear arquitetura de seguranca sem implementação | ✅ Concluída |
| **S1-02** | Enterprise Security Activation — infraestrutura canônica do `SecurityRuntimePort` | ✅ Concluída |
| **S1-03** | Enterprise Security Production Certification — certificação de produção do `real-tiss` e scaffolding | ✅ Concluída |
| **S2-01** | Identity & Authentication Discovery — mapear identidade e autenticação existente sem implementação | ✅ Concluída |
|| **S2-02** | Identity & Authentication Activation — infraestrutura canônica do `IdentityRuntimePort` | ✅ Concluída |
| **S2-03** | Identity Runtime Production Certification — certificação de produção do `real-tiss` do `IdentityRuntimePort` | ✅ Concluída |
| **S3-01** | Authorization & Access Control Discovery — mapear arquitetura de autorização e controle de acesso sem implementação | ✅ Concluída |
|| **S3-02** | Authorization & Access Control Activation — infraestrutura canônica do `AuthorizationRuntimePort` | ✅ Concluída |
|| **S3-03** | Authorization & Access Control Production Certification — certificação de produção do `real-tiss` do `AuthorizationRuntimePort` | ✅ Concluída |

|||| **S4-01** | Enterprise Tenant Runtime Discovery — mapear arquitetura de tenants sem implementação | ✅ Concluída |
|||| **S4-02** | Enterprise Tenant Runtime Activation — infraestrutura canônica do `TenantRuntimePort` | ⚡ Activation |

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Concluído — Discovery, Activation e/ou Production Certification realizados. |
| ⚡ | Activation concluído, mas Production Certification pendente. |
| ⏸️ | Pendente — ainda sem provider real, sem Production Certification e aguardando sprint futura. |
| 🔮 | Future Capability — previsto no roadmap, mas não iniciado. |
| — | Não aplicável / não iniciado. |

**Roadmap vigente:** ✅ OPER-INF-Q · ✅ OPER-INF-W · ✅ OPER-INF-S · ✅ OPER-INF-D · ✅ OPER-INF-O · ✅ ARC-25 · ✅ OPER-INF-R · ✅ TISS-RUNTIME-01D · ✅ TISS-RUNTIME-01A · ✅ TISS-RUNTIME-01B · ✅ TISS-RUNTIME-01C · ✅ TISS-RUNTIME-02A · ✅ TISS-RUNTIME-02B · ✅ TISS-RUNTIME-03A · ✅ TISS-RUNTIME-03B · ✅ TISS-RUNTIME-04A · ✅ TISS-RUNTIME-04B · ✅ A8-FREEZE-01 · ✅ TISS-RUNTIME-05A · ✅ TISS-RUNTIME-05B · ✅ A10-FINAL-01 · ✅ A10-DOC-02 · ✅ S1-01 · ✅ S1-02 · ✅ S1-03 · ✅ S2-01 · ✅ S2-02 · ✅ S2-03 · ✅ S3-01 · ✅ S3-02 · ✅ S3-03 · ✅ S4-01 · ⚡ S4-02

**Baseline Oficial v1.1:** [`ENTERPRISE_BASELINE_V1_1.md`](./ENTERPRISE_BASELINE_V1_1.md)
**Architectural Decision Log:** [`ARCHITECTURAL_DECISION_LOG.md`](./ARCHITECTURAL_DECISION_LOG.md)
**Referência obrigatória:** [`ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`](./ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md)  
**Discovery TISS:** [`TISS_RUNTIME_DISCOVERY.md`](./TISS_RUNTIME_DISCOVERY.md)

---

## Regras permanentes (congeladas)

- Arquitetura Enterprise: **CONGELADA**
- Foundations 4–7: **CONGELADAS**
- Dual Path AER-GA03-A1: **ELIMINADO**
- Proibido criar novo Runtime / Port / Gateway / pipeline paralelo
- Proibido reintroduzir execução paralela
- Consumidores não acessam filas diretamente — apenas via `QueueRuntimePort`
- Scheduler aciona Worker apenas via `WorkerRuntimePort` (nunca Queue direto)
- Queue envia para Dead Letter apenas via `DeadLetterRuntimePort` (contrato interno)
- Dead Letter **não** decide reenvio — apenas armazenamento definitivo (retry = OPER-INF-R)
- Retry **nunca executa** — apenas decide e agenda; Worker executa; Scheduler controla o tempo; Queue transporta
- Observability **apenas coleta e expõe** — nunca executa regras, nunca altera o fluxo, nunca interfere na execução
- TISS Runtime **reutiliza exclusivamente** a arquitetura oficial congelada e Ports existentes (ver Discovery)

---

## Fluxo operacional atual (pós OPER-INF-R)

```
getEnterpriseRuntime()
  → SchedulerRuntimePort
    → WorkerRuntimePort
      → QueueRuntimePort
        → Backend Persistente (OPER-INF-Q)
        → DeadLetterRuntimePort (OPER-INF-D — contrato interno)
          → QueueRuntimePort (isolamento enterprise-dead-letter)
        → DefaultRetryInfrastructure (OPER-INF-R — NÃO é Port)
          → QueueRuntimePort (transporte)
          → SchedulerRuntimePort (tempo / backoff)
          → WorkerRuntimePort (executor via Scheduler)
  → ObservabilityRuntimePort (OPER-INF-O — somente leitura dos Ports acima)
```

---

## Escopo concluído

### OPER-INF-Q
- Backend persistente atrás do mesmo `QueueRuntimePort`
- Sem novos Ports / Gateways / Runtime

### OPER-INF-W
- Worker operacional: polling, claim, lock, ACK, NACK, heartbeat, graceful shutdown
- Consumo exclusivo via `QueueRuntimePort`
- Sem Scheduler / Retry Engine / Dead Letter / Batch / XML / SOAP / IA

### OPER-INF-S
- Scheduler operacional: polling temporal, agendamento, cancelamento, heartbeat, graceful shutdown, concorrência, recuperação pós-restart
- Acionamento exclusivo via `WorkerRuntimePort` (decide QUANDO acionar o Worker)
- Sem Cron / Queue direto / novos Ports / Gateways / regras de negócio

### OPER-INF-D
- Dead Letter operacional: armazenamento definitivo, isolamento da fila principal, motivo, tentativas, timestamp, metadata, consulta por id, purge
- Exclusivo via `DeadLetterRuntimePort` → `QueueRuntimePort` (contrato interno; sem Port Enterprise novo)
- Sem retry / reprocessamento / scheduler / worker / regras de negócio

### OPER-INF-O
- Observability operacional: métricas, health checks, runtime status, contadores, timers, throughput, filas pendentes, workers ativos, scheduler status, dead-letter stats, runtime diagnostics
- Reutilização exclusiva dos Ports existentes (somente leitura via `stats` / shape)
- Sem dashboards / Grafana / Prometheus / OpenTelemetry / alertas / tracing / logs externos
- Sem novos Ports / Gateways / Runtimes / alteração do pipeline oficial

### OPER-INF-R
- Retry operacional: policy, counter, delay, exponential backoff, max attempts, status, metadata, scheduling
- Reutilização exclusiva de `SchedulerRuntimePort` + `WorkerRuntimePort` + `QueueRuntimePort`
- Retry **nunca** executa processamento — apenas agenda nova tentativa
- Dead Letter permanece destino definitivo após exceder `maxAttempts`
- Sem novos Ports / Gateways / Runtimes / alteração do Enterprise Runtime / Foundations / pipeline oficial

---

## Escopo concluído (ARC-25)

### ARC-25
- Documento permanente `ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`
- Arquitetura oficial, pipeline único, cadeia operacional e regras RULE-20/23/25/26
- Sem alteração de `src/`, Runtime, Ports, Gateways ou testes

---

## Escopo concluído (TISS-RUNTIME-01D)

### TISS-RUNTIME-01D
- Documento `TISS_RUNTIME_DISCOVERY.md` — pipeline funcional oficial TISS
- Integração com Enterprise Runtime, ciclo do boletim, entradas/saídas, Ports reutilizados
- Respostas obrigatórias (entrada, OCR, Parser, Validação, Enriquecimento, XML, Lote, Protocolo, Persistência, Auditoria, Retry, Dead Letter)
- Sequência oficial das sprints futuras
- Sem alteração de `src/`, Runtime, Ports, Gateways ou arquitetura

---

## Escopo concluído (TISS-RUNTIME-01A)

### TISS-RUNTIME-01A
- Entrada operacional do boletim TISS: Documento → `getEnterpriseRuntime()` → `QueueRuntimePort.enqueue` → Job TISS com status **RECEIVED**
- Campos do Job: `jobId`, `status`, `correlationId`, `createdAt`, `source`, `queueName`
- Reutilização exclusiva de Queue / Worker / Scheduler / Retry / Dead Letter / Observability (Ports existentes)
- Wiring no bridge de Intake Capture (`registerCaptureDocumentIntakeBridge`) — best-effort
- Sem OCR / Parser / XML / Validação / Enriquecimento / Lote / Protocolo / Auditoria funcional
- Sem novo Port / Gateway / Runtime / Pipeline

---

## Escopo concluído (TISS-RUNTIME-01B)

### TISS-RUNTIME-01B
- Capability OCR operacional: Job **RECEIVED** → `WorkerRuntimePort` → `OCRRuntimePort.process` → Job **OCR_COMPLETED** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissReceivedOcr` via `getEnterpriseRuntime()`
- Parser **não** executado (`parserExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

---

## Escopo concluído (TISS-RUNTIME-01C)

- Capability Parser operacional: Job **OCR_COMPLETED** → `WorkerRuntimePort` → `DocumentExtractionRuntimePort` (submitRequest / getResult) → Job **PARSED** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissOcrParsed` via `getEnterpriseRuntime()`
- Validação **não** executada (`validationExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-02A)

- Capability Validation operacional: Job **PARSED** → `WorkerRuntimePort` → `ValidationRuntimePort` (submitRequest / getResult) → Job **VALIDATED** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissParsedValidated` via `getEnterpriseRuntime()`
- Enriquecimento **não** executado (`enrichmentExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-02B)

- Capability Enrichment operacional: Job **VALIDATED** → `WorkerRuntimePort` → `AutoFillRuntimePort` (prepareAutoFill / getResult) → Job **ENRICHED** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissValidatedEnriched` via `getEnterpriseRuntime()`
- XML **não** executado (`xmlExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-03A)

- Capability XML TISS operacional: Job **ENRICHED** → `WorkerRuntimePort` → `XMLTISSRuntimePort` (prepareXMLDocument / getResult) → Job **XML_GENERATED** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissEnrichedXmlGenerated` via `getEnterpriseRuntime()`
- Batch / Protocolo / Persistência / Auditoria **não** executados (`batchExecuted: false`, `protocolExecuted: false`, `persistenceExecuted: false`, `auditExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-03B)

- Capability Lote operacional: Job **XML_GENERATED** → `WorkerRuntimePort` → `BatchRuntimePort` (prepareBatch / getBatch) → Job **BATCH_CREATED** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissXmlGeneratedBatchCreated` via `getEnterpriseRuntime()`
- Protocolo / Persistência / Auditoria **não** executados (`protocolExecuted: false`, `persistenceExecuted: false`, `auditExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-04A)

- Capability Protocol operacional: Job **BATCH_CREATED** → `WorkerRuntimePort` → `ProtocolRuntimePort` (prepareProfile / getProfile) → Job **PROTOCOL_SENT** → reenqueue via `QueueRuntimePort`
- Hook `processMessage` no `WorkerQueueConsumer` (OPER-INF-W) — sem alterar contrato `WorkerRuntimePort`
- Entrypoint `processTissBatchCreatedProtocolSent` via `getEnterpriseRuntime()`
- Persistência / Auditoria **não** executados (`persistenceExecuted: false`, `auditExecuted: false`); demais capabilities fora de escopo
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-05A)

- Capability Audit operacional: Job **PERSISTED** → `WorkerRuntimePort` → `AuditRuntimePort` → Job **AUDITED** → reenqueue via `QueueRuntimePort`
- Provider `real-tiss` certificado na A9-03.
- Sem novo Port / Gateway / Runtime / Pipeline

## Escopo concluído (TISS-RUNTIME-05B)

- Capability Completed operacional: Job **AUDITED** → `WorkerRuntimePort` → encerramento → Job **COMPLETED** (estado terminal) → ACK definitivo via `QueueRuntimePort`
- Provider `real-tiss` certificado na A10-03.
- Sem novo Port / Gateway / Runtime / Pipeline

## Próxima Sprint

Convergência final do pipeline funcional TISS: encerramento de todos os estágios, conforme [`TISS_RUNTIME_DISCOVERY.md`](./TISS_RUNTIME_DISCOVERY.md).

---

## Certificação End-to-End do Pipeline Enterprise

Após **A9-03**, deverá ocorrer obrigatoriamente a certificação:

**ENTERPRISE END-TO-END PIPELINE CERTIFICATION**

Fluxo oficial completo a ser certificado:

```
OCR
  ↓
Parser
  ↓
Validation
  ↓
Enrichment
  ↓
XML
  ↓
Batch
  ↓
Protocol
  ↓
Persistence
  ↓
Audit
  ↓
Completed
```

Essa certificação deverá ser concluída **ANTES** do início do:

**BLOCO S — Enterprise Security Certification**

## A8-FREEZE-01 — Enterprise Baseline v1.1 Freeze

- A `Enterprise Runtime Baseline v1.1` foi congelada oficialmente após A8-E2E-01.
- Documento oficial: `docs/enterprise/ENTERPRISE_BASELINE_V1_1.md`.
- Pipeline congelado: `RECEIVED → OCR_COMPLETED → PARSED → VALIDATED → ENRICHED → XML_GENERATED → BATCH_CREATED → PROTOCOL_SENT → PERSISTED → AUDITED → COMPLETED`.
- `Audit` (TISS-RUNTIME-05A) e `Completed` (TISS-RUNTIME-05B) estão Production Certified (A9-03 / A10-03).
- `XMLValidationRuntimePort`, `SOAPRuntimePort`, `OperatorRuntimePort` e `ReturnRuntimePort` permanecem em Discovery.

## A8-ADL-01 — Architectural Decision Log

- Documento oficial criado: `docs/enterprise/ARCHITECTURAL_DECISION_LOG.md`.
- Registra ADL-001 a ADL-009, princípios arquiteturais, matriz de dependências, exemplos de violação e regras de evolução futura.
- Nenhuma decisão arquitetônica pode ser alterada sem aprovação formal de uma nova baseline.

## A9-01 — Audit Real Discovery

- Documento oficial criado: `docs/enterprise/AUDIT_REAL_DISCOVERY.md`.
- Mapeamento integral do `AuditRuntimePort`, providers, factory, registry, workers, queue, scheduler, retry, dead letter, observability, pipeline e state machine.
- Provider `real-tiss` certificado na A9-03.
- `Completed` certificado na A10-03.
- Zero alterações em `src/`.

## A9-02 — Audit Real Activation

- Provider `real-tiss` ativado em `src/lib/enterprise/audit-runtime/adapters/real-tiss-audit-runtime-adapter.ts`.
- `AuditRuntimeProviderId`, `AuditRuntimeFactory`, `AuditRuntimeRegistry` e `adapters/index.ts` atualizados.
- `RealTissAuditRuntimeAdapter` reutiliza `DefaultAuditRuntimeAdapter` para lifecycle, retry, observability, telemetry, statistics, health, capabilities, providerInfo, `AbortSignal` e `AuditRuntimeStore`.
- Testes `audit-runtime-engine.test.ts` e `tiss-runtime-05a-audit-real-activation.test.ts` validam `PERSISTED → AUDITED`.
- `Completed` certificado na A10-03.
- Documento: `docs/enterprise/AUDIT_REAL_ACTIVATION.md`.

## A9-03 — Audit Real Production Certification

- Provider `real-tiss` do `AuditRuntimePort` certificado para produção.
- Teste `tiss-runtime-05b-audit-real-production-certification.test.ts` aprovado.
- Nenhum arquivo em `src/` alterado.
- Documentos `AUDIT_PRODUCTION_CERTIFICATION.md` e matrizes publicados.
- `Completed` certificado na A10-03.
- `Enterprise Runtime Baseline v1.1` preservada.

## A10-01 — Completed Real Discovery

- Auditoria completa do `Completed Runtime` concluída.
- `CompletedRuntimePort`, `CompletedRuntimeFactory`, `CompletedRuntimeRegistry`, `CompletedRuntimeAdapters` e `CompletedRuntimeProviderId` ativados e certificados com `real-tiss`.
- `processTissCompletedJob` valida a transição terminal `AUDITED → COMPLETED`.
- Mapeados State Machine, Dependency Matrix, Extension Points, Security Hooks, Completed Finalization Matrix, Final Artifact Matrix, Operational Closure Checklist e Future Security Integration.
- `Completed` certificado na A10-03.
- Documento: `docs/enterprise/COMPLETED_REAL_DISCOVERY.md`.
