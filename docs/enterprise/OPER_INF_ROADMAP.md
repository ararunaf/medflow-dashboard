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
| **TISS-RUNTIME-01** | Ativação operacional TISS Runtime | ⏳ Planejada |

**Roadmap vigente:** ✓ OPER-INF-Q · ✓ OPER-INF-W · ✓ OPER-INF-S · ✓ OPER-INF-D · ✓ OPER-INF-O · ✓ ARC-25 · ✓ OPER-INF-R · ⏳ TISS-RUNTIME-01

**Referência obrigatória:** [`ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`](./ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md)

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

## Próxima Sprint

**TISS-RUNTIME-01** — ativação operacional do TISS Runtime sobre a arquitetura oficial congelada.
