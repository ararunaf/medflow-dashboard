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
| **OPER-INF-R** | Ativar Retry operacional (decisão de reenvio) | ⏳ Próxima Sprint |

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

---

## Fluxo operacional atual (pós OPER-INF-D)

```
getEnterpriseRuntime()
  → SchedulerRuntimePort
    → WorkerRuntimePort
      → QueueRuntimePort
        → Backend Persistente (OPER-INF-Q)
        → DeadLetterRuntimePort (OPER-INF-D — contrato interno)
          → QueueRuntimePort (isolamento enterprise-dead-letter)
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

---

## Próxima Sprint

**OPER-INF-R** — ativação operacional do Retry (decisão de reenvio; Dead Letter permanece somente armazenamento definitivo).
