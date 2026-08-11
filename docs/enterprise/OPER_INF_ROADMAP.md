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
| **OPER-INF-D** | Próxima ativação operacional INF | ⏳ Próxima Sprint |

---

## Regras permanentes (congeladas)

- Arquitetura Enterprise: **CONGELADA**
- Foundations 4–7: **CONGELADAS**
- Dual Path AER-GA03-A1: **ELIMINADO**
- Proibido criar novo Runtime / Port / Gateway / pipeline paralelo
- Proibido reintroduzir execução paralela
- Consumidores não acessam filas diretamente — apenas via `QueueRuntimePort`
- Scheduler aciona Worker apenas via `WorkerRuntimePort` (nunca Queue direto)

---

## Fluxo operacional atual (pós OPER-INF-S)

```
getEnterpriseRuntime()
  → SchedulerRuntimePort
    → WorkerRuntimePort
      → QueueRuntimePort
        → Backend Persistente (OPER-INF-Q)
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

---

## Próxima Sprint

**OPER-INF-D** — próxima ativação operacional INF (sem alterar fases futuras além desta marcação).
