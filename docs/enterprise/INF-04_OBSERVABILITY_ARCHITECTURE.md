# INF-04 — Observability Architecture

**Sprint:** INF-04 — Observability Foundation  
**Data:** 01/08/2026  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Camadas (ECS-01)

```
Application
    ↓
ExecutionObservabilityPort
    ↓
Adapter (Default | Mock)
    ↓
InMemoryExecutionObservabilityStore
    ↑
ExecutionObservabilityFactory
    ↑
ExecutionObservabilityProvider
```

---

## 2. Fluxo de orquestração canônico

```
Execution Context
  ↓
Pipeline Resolver
  ↓
Execution State Machine
  ↓
Execution Event Bus
  ↓
Execution Registry
  ↓
Execution Trace
  ↓
Capability Registry
  ↓
Dependency Registry
  ↓
Policy Registry
  ↓
Constraint Registry
  ↓
Requirement Registry
  ↓
Resource Registry
  ↓
Message Queue (INF-01)
  ↓
Worker Foundation (INF-02)
  ↓
Scheduler Foundation (INF-03)
  ↓
Observability Foundation (INF-04)
  ↓
Context enriquecido (executionObservabilityId)
```

---

## 3. Dependências permitidas

| De | Para | Via |
|----|------|-----|
| Observability Foundation | Scheduler Foundation | `ExecutionSchedulerPort` apenas |
| Canonical Execution Orchestrator | Observability Foundation | `ExecutionObservabilityPort` apenas |

Proibido:

- acessar adapters/stores concretos do Scheduler
- acoplar OCR / IA / Rule Engine / Workflow / TISS
- integrar backends externos de observabilidade

---

## 4. Adapters

| Adapter | Provider ID | Uso |
|---------|-------------|-----|
| `DefaultExecutionObservabilityAdapter` | `default` | Fundação in-process padrão |
| `MockExecutionObservabilityAdapter` | `mock` / `test` | Testes / homologação |

Não existem adapters específicos para OpenTelemetry, Prometheus, Grafana, Azure Monitor, CloudWatch, Datadog ou Elastic APM.

---

## 5. Store

`InMemoryExecutionObservabilityStore`

- Estrutural
- Sem persistência
- Sem transmissão
- Sem monitoramento

---

## 6. Invariantes

1. Nenhuma operação gera log real
2. Nenhuma operação coleta métrica real
3. Nenhuma operação realiza tracing distribuído
4. Nenhum evento é transmitido
5. Nenhum backend externo é conectado
6. Orchestrator anexa apenas `executionObservabilityId`
7. Desacoplamento total dos Engines
