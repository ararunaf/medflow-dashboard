# INF-05 — Health Center Foundation

**Sprint:** INF-05 — Health Center Foundation (Fase B — Enterprise Infrastructure)  
**Data:** 01/08/2026  
**Baseline Foundation:** `medicflow-enterprise-foundation-v1.0.0`  
**Padrão:** ECS-01 Ports & Adapters  
**Referência INF-04:** `b179ea9`  
**Resultado esperado:** infraestrutura estrutural de Health Center; comportamento do produto inalterado  
**Encerramento:** esta sprint encerra oficialmente a Fase B — Enterprise Infrastructure

---

## 1. Objetivo

Criar a infraestrutura canônica do Health Center da plataforma Enterprise.

O objetivo **NÃO** é monitorar o sistema.

O objetivo é definir a arquitetura oficial para centralização futura da saúde operacional da plataforma.

---

## 2. Proibições (congelamento)

É **PROIBIDO** nesta sprint:

- alterar qualquer módulo EPC-00 até EPC-24 (exceto Canonical Execution Orchestrator);
- alterar qualquer módulo das INF-01 até INF-04;
- alterar Rule Engine, Workflow, OCR, IA, Capture, Processing, TISS;
- alterar qualquer tela do produto;
- alterar banco de dados / criar migrations;
- criar APIs REST;
- implementar monitoramento real / health checks reais / polling / dashboards;
- consultar banco, serviços externos, filas, workers ou Observability observations;
- executar diagnósticos automáticos.

---

## 3. Arquitetura obrigatória (ECS-01)

```
Application
  → ExecutionHealthCenterPort
    → Adapter (DefaultExecutionHealthCenterAdapter | MockExecutionHealthCenterAdapter)
      → InMemoryExecutionHealthCenterStore
        ← ExecutionHealthCenterFactory
          ← ExecutionHealthCenterProvider
```

Integração com Observability: exclusivamente via `ExecutionObservabilityPort` (INF-04).  
Nenhuma observation é consultada.

---

## 4. Módulo

`src/lib/enterprise/health-center-foundation/`

| Camada | Artefato |
|--------|----------|
| Port | `ExecutionHealthCenterPort` |
| Adapters | `DefaultExecutionHealthCenterAdapter`, `MockExecutionHealthCenterAdapter` |
| Store | `InMemoryExecutionHealthCenterStore` |
| Factory | `ExecutionHealthCenterFactory` |
| Provider | `ExecutionHealthCenterProvider` / `createExecutionHealthCenterPort` |
| Catálogo | 12 componentes estruturalmente monitoráveis (futuro) |

---

## 5. Operações do Port

- `registerComponent()` — estrutural (não monitora)
- `unregisterComponent()` — estrutural
- `getComponent()` — cria/obtém Component estrutural
- `listComponents()` — lista estrutural in-memory
- `statistics()` — estatísticas in-memory
- `health()` — prontidão estrutural (não é health check real)
- `capabilities()` — declaração estática de capacidades

Nenhuma operação executa monitoramento, health checks, polling, dashboards ou consultas externas.

---

## 6. Componentes estruturais

Registrados estruturalmente (futuramente monitoráveis):

Message Queue, Worker Foundation, Scheduler Foundation, Observability Foundation, OCR, IA, Rule Engine, Workflow, TISS, Storage, Banco de Dados, Importação.

Nenhum monitoramento é implementado.

---

## 7. Integração com Orchestrator

```
Execution Context
  → … registries …
  → Message Queue
  → Worker Foundation
  → Scheduler Foundation
  → Observability Foundation
  → Health Center Foundation
  → Context enriquecido (executionHealthCenterId)
```

Anexa exclusivamente `executionHealthCenterId`.

---

## 8. Testes

```bash
npm run enterprise:health-center-foundation:test
```
