# BLOCO I — Permanent Architecture Rule

**Nome:** Enterprise Workflow & Orchestration  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Objetivo arquitetural

Camada de orquestração Enterprise situada imediatamente acima do Bloco H (TISS Enterprise Integration). Responsável por gerenciar, executar, monitorar e coordenar workflows empresariais de alto nível, consumindo exclusivamente a fachada `GenericTissIntegrationEngine` e seu Port `TISSIntegrationPort`.

---

## 2. Regras permanentes

1. **Dependência única para Bloco H:** o Bloco I consome apenas `GenericTissIntegrationEngine` e/ou `TISSIntegrationPort`.
2. **Sem acesso direto:** nenhum módulo do Bloco I pode acessar XML, SOAP, providers, registries, adapters, engines dos Blocos D, E, F, G ou H.
3. **Uma capability por Sprint:** cada Sprint I-01 a I-10 ativa exatamente uma capability, conforme RULE_23.
4. **Nenhuma duplicação de lógica:** toda reutilização ocorre via Ports e fachadas certificadas.
5. **Nenhuma fachada duplicada:** a fachada `GenericTissIntegrationEngine` do Bloco H é a fachada final de integração TISS. O Bloco I não criará outra fachada de integração TISS.
6. **Congelamento obrigatório:** cada Sprint certificada é congelada; nenhuma Sprint congelada pode ser alterada sem uma Sprint de certificação explícita.
7. **I-04 congelada:** as Sprints I-01, I-02, I-03 e I-04 estão congeladas após certificações formais.

---

## 3. Roadmap

| Sprint | Nome | Status |
| ------ | ---- | ------ |
| ARCH-I00 | Enterprise Master Architecture Discovery | ✅ Certificada |
| I-01 | Enterprise Workflow Engine | ✅ Certificada / Congelada |
| I-02 | Workflow Pipeline Engine | ✅ Certificada / Congelada |
| I-03 | Workflow State Machine Engine | ✅ Certificada / Congelada |
| I-04 | Workflow Execution Engine | ✅ Certificada / Congelada |
| I-05 | Workflow Monitoring Engine | ✅ Certificada / Congelada |
| I-06 | Workflow Metrics Engine | ✅ Certificada / Congelada |
| I-07 | Workflow Recovery Engine | ✅ Certificada / Congelada |
| I-08 | Generic Workflow Engine (fachada) | ✅ Certificada / Congelada |
| I-09 | Workflow Audit Engine | 🚧 Autorizada (não iniciada) |
| I-10 | Workflow Retry Engine | ⛔ Não autorizada |

---

## 4. Capabilities

| Capability | I-01 |
| ---------- | ---- |
| `workflowEngineImplemented` | `true` |
| `workflowPipelineImplemented` | `true` |
| `workflowStateMachineImplemented` | `true` |
| `workflowExecutionImplemented` | `true` |
| `workflowMonitoringImplemented` | `true` |
| `workflowMetricsImplemented` | `true` |
| `workflowRecoveryImplemented` | `true` |
| `workflowFacadeImplemented` | `true` |

---

## 5. Componentes certificados

- `src/lib/enterprise/workflow-engine/workflow/enterprise-workflow-engine.ts`
- `src/lib/enterprise/workflow-engine/workflow/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-engine.test.ts`
- `src/lib/enterprise/workflow-engine/pipeline/enterprise-workflow-pipeline-engine.ts`
- `src/lib/enterprise/workflow-engine/pipeline/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-pipeline-engine.test.ts`
- `src/lib/enterprise/workflow-engine/state-machine/enterprise-workflow-state-machine-engine.ts`
- `src/lib/enterprise/workflow-engine/state-machine/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-state-machine-engine.test.ts`
- `src/lib/enterprise/workflow-engine/execution/enterprise-workflow-execution-engine.ts`
- `src/lib/enterprise/workflow-engine/execution/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-execution-engine.test.ts`
- `src/lib/enterprise/workflow-engine/monitoring/enterprise-workflow-monitoring-engine.ts`
- `src/lib/enterprise/workflow-engine/monitoring/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-monitoring-engine.test.ts`
- `src/lib/enterprise/workflow-engine/metrics/enterprise-workflow-metrics-engine.ts`
- `src/lib/enterprise/workflow-engine/metrics/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-metrics-engine.test.ts`
- `src/lib/enterprise/workflow-engine/recovery/enterprise-workflow-recovery-engine.ts`
- `src/lib/enterprise/workflow-engine/recovery/index.ts`
- `scripts/enterprise/tests/enterprise-workflow-recovery-engine.test.ts`
- `src/lib/enterprise/workflow-engine/generic-workflow-engine/generic-workflow-engine.ts`
- `src/lib/enterprise/workflow-engine/generic-workflow-engine/index.ts`
- `scripts/enterprise/tests/generic-workflow-engine.test.ts`

---

## 6. Documentação associada

- `docs/enterprise/I01_ENTERPRISE_WORKFLOW_FINAL_CERTIFICATION.md`
- `docs/enterprise/I02_ENTERPRISE_WORKFLOW_PIPELINE_FINAL_CERTIFICATION.md`
- `docs/enterprise/I03_ENTERPRISE_WORKFLOW_STATE_MACHINE_FINAL_CERTIFICATION.md`
- `docs/enterprise/I04_ENTERPRISE_WORKFLOW_EXECUTION_FINAL_CERTIFICATION.md`
- `docs/enterprise/I05_ENTERPRISE_WORKFLOW_MONITORING_FINAL_CERTIFICATION.md`
- `docs/enterprise/I06_ENTERPRISE_WORKFLOW_METRICS_FINAL_CERTIFICATION.md`
- `docs/enterprise/I07_ENTERPRISE_WORKFLOW_RECOVERY_FINAL_CERTIFICATION.md`
- `docs/enterprise/I08_GENERIC_WORKFLOW_FINAL_CERTIFICATION.md`
- `docs/enterprise/ENTERPRISE_MASTER_ARCHITECTURE.md`
- `docs/enterprise/ENTERPRISE_DEPENDENCY_MAP.md`

---

## 7. Baseline congelada

As Sprints I-01, I-02, I-03, I-04, I-05 e I-06 estão oficialmente congeladas. A I-07 está autorizada, mas não iniciada.
