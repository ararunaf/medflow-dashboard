# Enterprise Governance Runtime Discovery — S6-01

| Campo | Valor |
|-------|-------|
| Projeto | MedicFlow-AI |
| Baseline | Enterprise Runtime v1.1 |
| Sprint | S6-01 |
| Tipo | Discovery (somente leitura) |
| Alterações em `src/` | Zero |

---

## 1. Arquitetura encontrada

A base de código já possui uma camada de **governança Enterprise estrutural**, organizada sob o padrão **Ports & Adapters** com matrizes de capabilities, stores in-memory, factories, registries e providers. Nenhum motor está executando regras/políticas/workflows reais — todos os artefatos encontrados são contratos, fachadas, engines in-memory e preparações para ativação futura.

### Blocos identificados

#### E — Enterprise Business Engine
Local: `src/lib/enterprise/business-engine/`
- `business-engine/ports/business-engine-port.ts:63` — `BusinessEnginePort` (contrato único E-01..E-10).
- `business-engine/ports/capabilities.ts:11` — `BusinessEngineCapabilities` com flags `businessRuleCatalogImplemented` .. `businessEngineImplemented`.
- `business-engine/generic-business-engine/generic-business-engine.ts:18` — `GenericBusinessEngine` fachada que injeta os 9 motores.
- Submotores:
  - `business-rule-catalog/business-rule-catalog.ts`
  - `business-rule-execution/business-rule-execution-engine.ts:16` — avalia `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains` sobre fatos.
  - `business-decision-table/business-decision-table-engine.ts:39` — first-match sobre catálogo de regras.
  - `business-transaction/business-transaction-engine.ts`
  - `business-workflow/business-workflow-engine.ts:32` — orquestra transações em estágios.
  - `business-process-orchestration/business-process-orchestration-engine.ts`
  - `business-event-log/business-event-log-engine.ts`
  - `business-audit-trail/business-audit-trail-engine.ts:42` — reconstrói trilha a partir do event log.
  - `business-report/business-report-engine.ts`
- Stores: `InMemoryBusinessRuleCatalogStore`, `InMemoryBusinessDecisionTableStore`, `InMemoryBusinessAuditTrailStore`, `InMemoryBusinessEventLogStore`.

#### EPC-24 — Execution Policy Registry
Local: `src/lib/enterprise/execution-policy-registry/`
- `ports/execution-policy-registry-port.ts:26` — `ExecutionPolicyRegistryPort`.
- `index.ts:2` — descreve fluxo Application → Port → Adapter → Store → Factory → Provider.
- Contrato estritamente estrutural: **NÃO** interpreta políticas, **NÃO** aplica regras, **NÃO** acessa engines.
- Componentes: `DefaultExecutionPolicyRegistryAdapter`, `MockExecutionPolicyRegistryAdapter`, `DefaultExecutionPolicyRegistryStore`, `ExecutionPolicyRegistryFactory`, `ExecutionPolicyRegistryRegistry`.

#### C-10 / ECS-01 — Workflow Runtime
Local: `src/lib/enterprise/workflow-runtime/`
- `ports/workflow-runtime-port.ts:36` — `WorkflowRuntimePort`.
- `ports/capabilities.ts:13` — `WorkflowRuntimeEngineCapabilities` com `workflowImplemented: false` e `automaticDecisionImplemented: false`.
- `index.ts:1` — declara: *“Sem workflow funcional. Sem BPM. Sem decisão automática. Sem execução de runtime.”*
- Componentes: `DefaultWorkflowRuntimeAdapter`, `MockWorkflowRuntimeAdapter`, `WorkflowRuntimeFactory`, `WorkflowRuntimeRegistry`, `InMemoryWorkflowRuntimeStore`.

#### J — Enterprise Master Orchestration
Local: `src/lib/enterprise/master-orchestration/`
- `governance/enterprise-governance-engine.ts:22` — `EnterpriseGovernanceEngine` (J-05) expõe apenas `getCapabilities()`.
- `policy/enterprise-policy-engine.ts:22` — `EnterprisePolicyEngine` (J-04) expõe apenas `getCapabilities()`.
- `ports/capabilities.ts:7` — `EnterpriseMasterOrchestrationCapabilities` J-01..J-10.
- Outros engines estruturais: `EnterpriseCommandEngine`, `EnterpriseOrchestrationEngine`, `EnterpriseSagaEngine`, `EnterpriseRoutingEngine`, `EnterpriseMonitoringEngine`, `EnterpriseRecoveryEngine`, `EnterpriseConsoleEngine`.
- `EnterpriseGovernanceEngine` depende das fachadas `GenericBusinessEngine`, `GenericIntegrationEngine`, `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine`.

#### S5 — Compliance Runtime
Local: `src/lib/enterprise/compliance-runtime/`
- `ports/compliance-runtime-port.ts:35` — `ComplianceRuntimePort`.
- Contrato estrutural: abre/fecha jobs, registra findings, retorna resultados sem executar compliance real.
- `real-tiss-compliance-runtime-adapter.ts` certificado em S5-03, mas continua estrutural.

#### Operational Policy Intelligence & Agent Governance
Local: `src/lib/operations/policy-intelligence/`, `src/lib/services/operations/operational-policy-intelligence-service.ts`, `src/lib/operations/strategic-planning/`
- `policy-intelligence/types.ts:1` — tipos de findings, recomendações e explainability.
- `operational-policy-intelligence-service.ts:216` — `loadOperationalPolicyIntelligenceLayerSummary` e `runOperationalPolicyIntelligenceAnalysis` (somente gestores operacionais).
- `strategic-planning/strategic-governance-preparation-engine.ts:12` — `buildGovernancePreparednessInsight` prepara readiness a partir da policy intelligence.
- Supabase migrations:
  - `supabase/migrations/20250513150000_operational_agent_governance.sql` — tabela `operational_agent_governance_sessions` (estados `idle`, `reasoning`, `awaiting_human_review`, `approved`, `blocked`).
  - `supabase/migrations/20250513180000_operational_policy_intelligence.sql` — tabelas `operational_policy_intelligence_cycles`, `operational_policy_governance_recommendations`, `operational_policy_intelligence_audit` + enum `supervised_policy_lifecycle_state`.

#### Approval UI / Review Workspace
Local: `src/modules/capture/components/ReviewApprovalPanel.tsx`, `src/lib/capture/review/review-workspace-service.ts`, `src/lib/capture/api/review-server.ts`
- Componente de UI de aprovação e endpoints de revisão, mas **sem** um motor Enterprise de aprovação.

---

## 2. Componentes reutilizáveis

| Componente | Localização | Uso |
|------------|-------------|-----|
| `GenericBusinessEngine` | `src/lib/enterprise/business-engine/generic-business-engine/generic-business-engine.ts:18` | Fachada E-01..E-09 |
| `BusinessRuleExecutionEngine` | `src/lib/enterprise/business-engine/business-rule-execution/business-rule-execution-engine.ts:16` | Execução canônica de regras de negócio |
| `BusinessDecisionTableEngine` | `src/lib/enterprise/business-engine/business-decision-table/business-decision-table-engine.ts:39` | First-match de regras |
| `BusinessWorkflowEngine` | `src/lib/enterprise/business-engine/business-workflow/business-workflow-engine.ts:32` | Orquestração de transações |
| `BusinessAuditTrailEngine` | `src/lib/enterprise/business-engine/business-audit-trail/business-audit-trail-engine.ts:42` | Trilha de auditoria a partir do event log |
| `BusinessEventLogEngine` | `src/lib/enterprise/business-engine/business-event-log/business-event-log-engine.ts` | Registro de eventos de negócio |
| `EnterpriseGovernanceEngine` | `src/lib/enterprise/master-orchestration/governance/enterprise-governance-engine.ts:22` | Fachada de governança J-05 |
| `EnterprisePolicyEngine` | `src/lib/enterprise/master-orchestration/policy/enterprise-policy-engine.ts:22` | Fachada de políticas J-04 |
| `ExecutionPolicyRegistryPort` | `src/lib/enterprise/execution-policy-registry/ports/execution-policy-registry-port.ts:26` | Registro canônico de políticas |
| `WorkflowRuntimePort` | `src/lib/enterprise/workflow-runtime/ports/workflow-runtime-port.ts:36` | Porta de workflow estrutural |
| `ComplianceRuntimePort` | `src/lib/enterprise/compliance-runtime/ports/compliance-runtime-port.ts:35` | Porta de compliance estrutural |
| `GenericWorkflowEngine` | `src/lib/enterprise/workflow-engine/generic-workflow-engine.ts` | Fachada de workflow |
| `GenericTissEngine` | `src/lib/enterprise/tiss-engine/generic-tiss-engine.ts` | Fachada TISS |
| `GenericIntegrationEngine` | `src/lib/enterprise/integration-engine/generic-integration-engine.ts` | Fachada de integração |
| `InMemory*Store` | vários (`business-engine/*`, `execution-policy-registry/store`, `workflow-runtime/store`) | Stores padrão in-memory |
| Capability matrices | `business-engine/ports/capabilities.ts`, `master-orchestration/ports/capabilities.ts`, `workflow-runtime/ports/capabilities.ts` | Matrizes de ativação por fase |

---

## 3. RuntimePorts relacionados

- `BusinessEnginePort` (`src/lib/enterprise/business-engine/ports/business-engine-port.ts`)
- `ExecutionPolicyRegistryPort` (`src/lib/enterprise/execution-policy-registry/ports/execution-policy-registry-port.ts`)
- `WorkflowRuntimePort` (`src/lib/enterprise/workflow-runtime/ports/workflow-runtime-port.ts`)
- `ComplianceRuntimePort` (`src/lib/enterprise/compliance-runtime/ports/compliance-runtime-port.ts`)
- `AuditRuntimePort` (`src/lib/enterprise/audit-runtime/ports/audit-runtime-port.ts`)
- `QualityRuntimePort` (`src/lib/enterprise/quality-runtime/ports/quality-runtime-port.ts`) — referências a `approvalStatus`
- `ValidationRuntimePort` (`src/lib/enterprise/validation-runtime/ports/validation-runtime-port.ts`)
- `CompletedRuntimePort` (`src/lib/enterprise/completed-runtime/ports/completed-runtime-port.ts`)
- `SecurityRuntimePort`, `IdentityRuntimePort`, `AuthorizationRuntimePort`, `TenantRuntimePort` — runtime de fundação relacionados à governança.
- `OperatorRuntimePort` — em Discovery, ainda não ativado.

---

## 4. Extension Points

1. **Capability constants** — `E01_BUSINESS_ENGINE_CAPABILITIES` .. `E10_BUSINESS_ENGINE_CAPABILITIES` (`business-engine/ports/capabilities.ts`) e `J01..J10` (`master-orchestration/ports/capabilities.ts`) permitem ativação por fases sem alterar contratos.
2. **Adapter/Provider pattern** — cada Port possui `default`, `mock` e `real-tiss` adapters, permitindo ativação futura via registry sem tocar no Port.
3. **Generic engine fachadas** — `GenericBusinessEngine`, `GenericWorkflowEngine`, `GenericTissEngine`, `GenericIntegrationEngine` e `GenericTissIntegrationEngine` expõem extension points para novos motores de domínio.
4. **Operational events** — tabela `operational_events` com `entity_type` e `event_type` CHECK constraints; novos tipos podem ser adicionados por migrations (`operational_agent_governance.sql`, `operational_policy_intelligence.sql`).
5. **Lifecycle states** — `supervised_policy_lifecycle_state` (`observed`, `analyzed`, `recommended`, `supervised_review`, `validated`) e estados de agente (`idle`, `reasoning`, `awaiting_human_review`, `approved`, `blocked`) servem como estados de extensão para aprovação supervisionada.
6. **Review workspace** — `ReviewApprovalPanel.tsx` e `review-workspace-service.ts` são pontos de extensão para aprovação humana no domínio de captura.
7. **Business rule catalog** — regras canônicas com `conditions` e `actions` (`set-value`, `log`, `deny`) podem ser estendidas sem alterar o engine.

---

## 5. Dependency Matrix

| Componente | Depende de | Observação |
|------------|------------|------------|
| `EnterpriseGovernanceEngine` | `EnterprisePolicyEngine`, `EnterpriseSagaEngine`, `EnterpriseOrchestrationEngine`, `EnterpriseCommandEngine`, `GenericBusinessEngine`, `GenericIntegrationEngine`, `GenericTissEngine`, `GenericTissIntegrationEngine`, `GenericWorkflowEngine` | Apenas capabilities |
| `EnterprisePolicyEngine` | `EnterpriseSagaEngine`, `EnterpriseOrchestrationEngine`, `EnterpriseCommandEngine`, mesmas fachadas | Apenas capabilities |
| `GenericBusinessEngine` | `BusinessRuleCatalog`, `BusinessRuleExecutionEngine`, `BusinessTransactionEngine`, `BusinessWorkflowEngine`, `BusinessProcessOrchestrationEngine`, `BusinessDecisionTableEngine`, `BusinessEventLogEngine`, `BusinessAuditTrailEngine`, `BusinessReportEngine` | Fachada E-01..E-09 |
| `BusinessDecisionTableEngine` | `BusinessRuleExecutionEngine`, `BusinessRuleCatalog` | First-match |
| `BusinessWorkflowEngine` | `BusinessTransactionEngine` | Orquestração de estágios |
| `BusinessAuditTrailEngine` | `BusinessEventLogEngine` | Reconstrução de trilha |
| `ExecutionPolicyRegistryPort` | types, adapters, `ExecutionPolicyRegistryStore`, `ExecutionPolicyRegistryFactory`, `ExecutionPolicyRegistryRegistry` | Somente registro estrutural |
| `WorkflowRuntimePort` | types, adapters, `WorkflowRuntimeStore`, `WorkflowRuntimeFactory`, `WorkflowRuntimeRegistry` | Somente scaffolding |
| `ComplianceRuntimePort` | types, adapters, `ComplianceRuntimeStore`, `ComplianceRuntimeFactory`, `ComplianceRuntimeRegistry` | Scaffolding S5 |
| `OperationalPolicyIntelligence` | `operational_memory_entries`, `operational_policy_intelligence_cycles`, `operational_policy_governance_recommendations`, `operational_policy_intelligence_audit`, RBAC `isOperationalManager()` | Supabase + serviço |
| Review/Approval UI | `capture/review/*`, `ReviewWorkspace`, `review-server.ts` | Camada de captura |

---

## 6. Governance Capability Matrix

| Capability | Status | Evidência |
|------------|--------|-----------|
| Governance Engine | 🟡 Parcial | `EnterpriseGovernanceEngine` (`master-orchestration/governance/enterprise-governance-engine.ts:22`) existente, mas apenas retorna capabilities |
| Policy Engine | 🟡 Parcial | `EnterprisePolicyEngine` (`master-orchestration/policy/enterprise-policy-engine.ts:22`) e `ExecutionPolicyRegistry` estruturais |
| Execution Policy Registry | 🟡 Parcial | `ExecutionPolicyRegistryPort` + adapters + store + factory + registry — não avalia políticas |
| Business Rules | 🟡 Parcial | `BusinessRuleExecutionEngine`/`BusinessRuleCatalog` funcionais in-memory, sem persistência real |
| Workflow Engine | 🟡 Parcial | `BusinessWorkflowEngine` e `WorkflowRuntimePort` estruturais; `workflowImplemented: false` |
| Decision Engine | 🟡 Parcial | `BusinessDecisionTableEngine` executa first-match sobre regras canônicas |
| Approval Engine | 🔴 Ausente | Existe UI (`ReviewApprovalPanel.tsx`) e estados SQL, mas nenhum motor Enterprise de aprovação |
| Business Audit | 🟡 Parcial | `BusinessAuditTrailEngine` + `AuditRuntimePort` (A9-03 production certified) |
| Compliance Engine | 🟡 Parcial | `ComplianceRuntimePort` e `real-tiss` adapter certificado S5-03, mas sem execução real |
| Process Governance | 🟡 Parcial | `BusinessProcessOrchestrationEngine` e `operational_policy_intelligence` |
| Operator Governance | 🔴 Ausente | `OperatorRuntimePort` ainda em Discovery; sem camada de governança operadora |
| TISS Governance | 🟡 Parcial | `GenericTissEngine`, `tiss-intelligence-engine`, `tiss-runtime` com ports e policies estruturais |
| Data Governance | 🔴 Ausente | Nenhum runtime/camada dedicada encontrada |
| Versioning | 🟡 Parcial | Constantes de versão em adapters/registries; sem serviço de versionamento semântico |
| Approval Workflow | 🟡 Parcial | Estados `awaiting_human_review`/`approved`/`blocked` em `operational_agent_governance_sessions` e review workspace |
| Reusable Components | 🟢 Existente | Generic engines, stores, adapters, capability matrices |
| Stores | 🟢 Existente | `InMemory*Store` em cada bloco |
| Factories | 🟢 Existente | `*Factory` e `create*Port` em cada bloco |
| Registries | 🟢 Existente | `*RuntimeRegistry` em cada bloco |
| Boundary Layer | 🟢 Existente | `*Port` interfaces isolam aplicação dos adapters |
| Extension Points | 🟢 Existente | Matrizes de capabilities, lifecycle states, adapter/provider pattern, `operational_events` CHECK |

---

## 7. Gap Analysis

1. **Motores de governança são apenas fachadas** — `EnterpriseGovernanceEngine` e `EnterprisePolicyEngine` retornam capabilities mas não executam lógica.
2. **ExecutionPolicyRegistry não interpreta políticas** — registro estrutural; sem avaliação runtime.
3. **Workflow Runtime é scaffolding puro** — `workflowImplemented: false`, `automaticDecisionImplemented: false`; sem BPM, sem execução assíncrona.
4. **Business engines in-memory** — sem persistência real, sem repositório de regras, sem tabelas de decision tables.
5. **Aprovação sem motor Enterprise** — aprovação vive em UI de captura e eventos operacionais; não há `ApprovalRuntimePort`.
6. **Falta governança de dados** — nenhuma camada de data governance, lineage ou qualidade de dados.
7. **Falta governança de operadora** — `OperatorRuntimePort` em Discovery, sem regras/políticas operadora.
8. **Integração com `getEnterpriseRuntime()`** — nenhum dos novos motores de governança é exposto pelo runtime enterprise congelado.
9. **Produção ainda distante** — nenhum provider `real-tiss` certificado para `BusinessEnginePort`, `ExecutionPolicyRegistryPort` ou `WorkflowRuntimePort`.
10. **Versionamento semântico não existe** — apenas strings de version em adapters e registries.

---

## 8. Estratégia oficial para futuras ativações (S6-02 e S6-03)

### S6-02 — Governance Activation
- Criar/adaptar `RealTissBusinessEngineAdapter`, `RealTissExecutionPolicyRegistryAdapter` e `RealTissWorkflowRuntimeAdapter` **dentro** dos Ports existentes.
- Reutilizar as factories e registries já existentes; **não** criar novos Runtimes, Ports, pipelines ou Composition Roots.
- Manter stores in-memory como default; persistência real via Supabase fica fora do escopo desta sprint.
- Garantir que `getEnterpriseRuntime()` e a `Enterprise Runtime Baseline v1.1` **não** sejam alterados.
- Adicionar/adaptar testes de ativação: `business-engine-activation.test.ts`, `execution-policy-registry-activation.test.ts`, `workflow-runtime-activation.test.ts`.

### S6-03 — Governance Production Certification
- Certificar providers `real-tiss` dos três Ports para produção.
- Validar matrizes de capabilities E-01..E-10, EPC-24, C-10 e J-01..J-10.
- Executar end-to-end estrutural sem execução real de regras/políticas/workflows (conforme baseline congelada).
- Garantir `git diff -- src/` vazio.
- Publicar matrizes e certificados em `docs/enterprise/`.

---

## 9. Validações técnicas (build, tsc, lint, smoke placeholders)

| Comando | Status S6-01 | Notas |
|---------|--------------|-------|
| `npx tsc --noEmit` | ✅ Passou (exit 0, sem erros reportados) | Validado em S6-01 |
| `npm run lint` | ✅ Passou (apenas warnings preexistentes, exit 0) | Validado em S6-01 |
| `npm run build` | ✅ Passou (`vite build` concluído em ~9.5s) | Validado em S6-01 |
| `npm run smoke-check` | ✅ Passou (exit 0) | Validado em S6-01 |

*Os resultados reais serão registrados no sumário da sprint e no `git diff --stat` final.*

---

## 10. Confirmação de zero implementação

- **Nenhum arquivo em `src/` foi modificado** durante a S6-01.
- **Nenhum** Runtime, Port, Adapter, Factory, Registry, Store, Provider, Pipeline ou Composition Root foi criado.
- **Nenhuma** alteração em `EnterpriseRuntime`, `QueueRuntime`, `WorkerRuntime`, `SchedulerRuntime`, `Retry`, `DeadLetter`, `Observability`, `Pipeline`, `Composition Root`, `SecurityRuntime`, `IdentityRuntime`, `AuthorizationRuntime`, `TenantRuntime`, `ComplianceRuntime`, `AuditRuntime` ou `CompletedRuntime`.
- Os únicos artefatos gerados são documentos em `docs/enterprise/`.

---

## 11. Conclusão

A S6-01 mapeou uma base sólida e extensa de componentes de governança Enterprise já presentes no repositório. O padrão Ports & Adapters, as matrizes de capabilities (E-01..E-10, EPC-24, C-10, J-01..J-10) e as fachadas `Generic*` formam um **scaffolding de governança pronto para ativação controlada**. Todos os motores, porém, são estruturais ou in-memory, sem execução real de políticas, regras, workflows, aprovações ou governança de dados/operadoras. A estratégia S6-02/S6-03 pode seguir o mesmo modelo de activation + production certification usado nos blocos anteriores, preservando a `Enterprise Runtime Baseline v1.1` congelada.
