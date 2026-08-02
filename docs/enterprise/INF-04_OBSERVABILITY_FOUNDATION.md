# INF-04 — Observability Foundation

**Sprint:** INF-04 — Observability Foundation (Fase B — Enterprise Infrastructure)  
**Data:** 01/08/2026  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`  
**Padrão:** ECS-01 Ports & Adapters  
**Referência INF-03:** `d4fe8cf`  
**Resultado esperado:** infraestrutura estrutural de Observabilidade; comportamento do produto inalterado

---

## 1. Objetivo

Criar a infraestrutura canônica de Observabilidade da plataforma Enterprise.

O objetivo **NÃO** é monitorar o sistema.

O objetivo é estabelecer a arquitetura oficial para observabilidade futura.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- alterar qualquer módulo EPC-00 até EPC-24 (exceto Canonical Execution Orchestrator);
- alterar Rule Engine, Workflow, OCR, IA, Capture, Processing, TISS;
- alterar qualquer tela do produto;
- alterar banco de dados / criar migrations;
- criar APIs REST;
- implementar logs reais / métricas reais / tracing distribuído;
- integrar OpenTelemetry / Prometheus / Grafana / Azure Monitor / CloudWatch / Datadog / Elastic APM;
- enviar qualquer evento para serviços externos.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionObservabilityPort
    → Adapter (DefaultExecutionObservabilityAdapter | MockExecutionObservabilityAdapter)
      → InMemoryExecutionObservabilityStore
        ← ExecutionObservabilityFactory
          ← ExecutionObservabilityProvider
```

Integração com Schedulers: exclusivamente via `ExecutionSchedulerPort` (INF-03).

---

## 4. Módulo

`src/lib/enterprise/observability-foundation/`

| Camada | Artefato |
|--------|----------|
| Port | `ExecutionObservabilityPort` |
| Adapters | `DefaultExecutionObservabilityAdapter`, `MockExecutionObservabilityAdapter` |
| Store | `InMemoryExecutionObservabilityStore` |
| Factory | `ExecutionObservabilityFactory` |
| Provider | `ExecutionObservabilityProvider` / `createExecutionObservabilityPort` |
| Consumer refs | OCR, IA, Rule Engine, Workflow, TISS, Importação, Auditoria (estrutural) |

---

## 5. Operações do Port

- `registerObservation()` — estrutural (não gera logs)
- `unregisterObservation()` — estrutural
- `getObservation()` — cria/obtém Observation estrutural
- `listObservations()` — lista estrutural in-memory
- `statistics()` — estatísticas in-memory
- `health()` — prontidão estrutural
- `capabilities()` — declaração estática de capacidades

Nenhuma operação gera logs, métricas, tracing ou transmissão.

---

## 6. Integração com Orchestrator

Fluxo estrutural:

```
Execution Context
  → … registries …
  → Message Queue
  → Worker Foundation
  → Scheduler Foundation
  → Observability Foundation
  → Context enriquecido (executionObservabilityId)
```

Anexa exclusivamente `executionObservabilityId`. Nenhum monitoramento real ocorre.

---

## 7. Testes

```bash
npm run enterprise:observability-foundation:test
```
