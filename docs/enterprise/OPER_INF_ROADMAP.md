# OPER-INF — Roadmap Oficial de Ativação Operacional INF

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
| **TISS-RUNTIME-01C** | Ativar Parser / Extraction operacional no mesmo pipeline | ⏳ Próxima |

**Roadmap vigente:** ✓ OPER-INF-Q · ✓ OPER-INF-W · ✓ OPER-INF-S · ✓ OPER-INF-D · ✓ OPER-INF-O · ✓ ARC-25 · ✓ OPER-INF-R · ✓ TISS-RUNTIME-01D · ✓ TISS-RUNTIME-01A · ✓ TISS-RUNTIME-01B · ⏳ TISS-RUNTIME-01C

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

## Próxima Sprint

**TISS-RUNTIME-01C** — ativar Parser / Extraction operacional no Worker (consumo de `OCR_COMPLETED`), conforme [`TISS_RUNTIME_DISCOVERY.md`](./TISS_RUNTIME_DISCOVERY.md).
