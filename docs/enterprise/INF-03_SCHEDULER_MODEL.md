# INF-03 — Scheduler Model

**Sprint:** INF-03 — Scheduler Foundation  
**Padrão:** ECS-01 — modelos canônicos estruturais

---

## 1. Modelos canônicos

| Modelo | Kind | Papel |
|--------|------|-------|
| `CanonicalSchedule` | `canonical-schedule` | Aggregate estrutural do Schedule |
| `CanonicalScheduleIdentity` | `canonical-schedule-identity` | Identidade opaca (`executionSchedulerId`) |
| `CanonicalScheduleConfiguration` | `canonical-schedule-configuration` | Configuração estrutural (sem cron) |
| `CanonicalScheduleStatus` | `canonical-schedule-status` | Status opaco estrutural |
| `CanonicalScheduleCapabilities` | `canonical-schedule-capabilities` | Capacidades declaradas (negação explícita) |
| `CanonicalScheduleStatistics` | `canonical-schedule-statistics` | Contagens in-memory |
| `CanonicalScheduleHealth` | `canonical-schedule-health` | Saúde estrutural do store |
| `CanonicalScheduleReference` | `canonical-schedule-reference` | Referências opacas anexadas |

---

## 2. Identidade

- ID primário: `executionSchedulerId`
- Formato gerado: `execution-scheduler-0001`
- Alias `id` = `executionSchedulerId`
- Anexado ao Execution Context exclusivamente como referência estrutural

---

## 3. Status estruturais

| Valor | Significado |
|-------|-------------|
| `structural` | Genérico estrutural |
| `registered-structural` | Registrado (default após `registerSchedule`) |
| `enabled-structural` | Habilitado estruturalmente (sem cron) |
| `disabled-structural` | Desabilitado estruturalmente |
| `paused-structural` | Pausado estruturalmente |
| `resumed-structural` | Retomado estruturalmente |
| `unregistered-structural` | Removido estruturalmente |
| `unknown` | Estado opaco desconhecido |

Nenhum status implica execução, timer ou job.

---

## 4. Flags de negação (obrigatórias)

Em Schedule, Status, Configuration, Capabilities, Statistics e Health:

- `executionPerformed: false`
- `scheduleExecuted: false`
- `cronUsed: false`
- `timersUsed: false`
- `jobsDispatched: false`
- `workersStarted: false`
- `processingPerformed: false`
- `realSchedulerBackend: false`
- `enginesInvoked: false`

---

## 5. Integração com Worker Foundation

`CanonicalScheduleConfiguration.workerPortContract = "ExecutionWorkerPort"`

O Schedule pode carregar `executionWorkerId` como referência opaca.
Nenhum Worker é iniciado. Nenhum Job é disparado.

---

## 6. Store

`InMemoryExecutionSchedulerStore` armazena apenas configuração estrutural.

- Sem persistência
- Sem concorrência
- Sem execução
