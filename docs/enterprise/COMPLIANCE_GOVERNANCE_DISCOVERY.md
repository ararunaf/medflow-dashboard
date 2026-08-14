# S5-01 — Compliance & Governance Discovery

| Campo        | Valor                    |
| ------------ | ------------------------ |
| Sprint       | S5-01                    |
| Tipo         | Discovery (read-only)    |
| Baseline     | Enterprise Runtime v1.1  |
| Atualizado   | Sprint S5-01             |

---

## 1. Arquitetura encontrada (discovery summary)

O projeto MedicFlow-IA possui uma arquitetura Enterprise congelada (`Enterprise Runtime Baseline v1.1`) baseada em `getEnterpriseRuntime()` → `SchedulerRuntimePort` → `WorkerRuntimePort` → `QueueRuntimePort` → `PersistentQueueRuntimePort` / `DeadLetterRuntimePort` / `ObservabilityRuntimePort`. Todos os Runtimes de segurança (`Security`, `Identity`, `Authorization`, `Tenant`, `Audit`, `Completed`) já passaram por Discovery/Activation/Production Certification, mas permanecem como scaffolding canônico sem implementações reais de criptografia, assinatura digital, cadeia de custódia, HSM, SIEM, OpenTelemetry ou LGPD.

Os principais componentes de compliance & governance encontrados estão em quatro camadas:

1. **Segurança e auditoria operacional** (`src/lib/security/` e `src/lib/server/`):
   - `src/lib/server/security-audit-writer.ts` — grava eventos de segurança na tabela `public.security_audit_logs` usando service role, com hash de e-mail/IP.
   - `src/lib/security/security-audit-types.ts` — tipos de categorias, eventos e resultados.
   - `src/lib/security/security-audit-hash.ts` — `hashAuditEmail`/`hashAuditIp` com SHA-256 e pepper.
   - `src/lib/security/session-audit-server.ts` — server function para eventos de sessão vindos do cliente.
   - `src/lib/security/auth-security-server.ts` e `src/lib/security/session-validation.ts` — validação de sessão e gate de login.
   - `src/lib/security/rate-limit.ts`, `brute-force.ts`, `csp.ts`, `sanitize-input.ts`, `safe-external-links.ts`, `secure-redirects.ts`, `upload-validation.ts` — controles de segurança perimétricos.

2. **Autenticação, autorização e isolamento de tenant** (`src/lib/auth/`, `src/lib/domain/`, `src/lib/server/`):
   - `src/lib/auth/rbac.ts` — matriz `roleCapabilities`, funções `can()` e `assertCan()`, roles `super_admin`, `tenant_admin`, `coordinator`, `professional`, `financial`.
   - `src/lib/server/operational-auth.ts` — `requireOperationalAuth()` e `OperationalAuthContext`, resolve `tenantId`, `profile`, `professionalId`.
   - `src/lib/auth/get-auth-context.ts` — `getAuthContext()` isomórfico (SSR + browser).
   - `src/lib/domain/multi-tenant.ts` — convenção `tenant_id` e isolamento por RLS.

3. **Auditoria de negócio e trilha de eventos** (`src/lib/enterprise/business-engine/`, `src/lib/capture/audit/`):
   - `src/lib/enterprise/business-engine/business-audit-trail/business-audit-trail-engine.ts` — reconstrói `CanonicalBusinessAuditTrail` a partir do `BusinessEventLogEngine`.
   - `src/lib/enterprise/business-engine/business-event-log/business-event-log-engine.ts` — eventos canônicos de negócio.
   - `src/lib/capture/audit/engine/preventive-audit-engine.ts` — converte `StructuredGuide` em `AuditFinding` e `AuditReport` com regras TISS.
   - `src/lib/capture/audit/rules/assinaturas-rules.ts`, `autorizacoes-rules.ts`, `tiss-rules.ts` etc. — regras de auditoria preventiva.

4. **Governança e políticas** (`src/lib/enterprise/master-orchestration/`, `src/lib/enterprise/execution-policy-registry/`, `src/lib/operations/policy-intelligence/`):
   - `src/lib/enterprise/master-orchestration/governance/enterprise-governance-engine.ts` — `EnterpriseGovernanceEngine` (J-05), fachada de governança.
   - `src/lib/enterprise/master-orchestration/policy/enterprise-policy-engine.ts` — `EnterprisePolicyEngine` (J-04), fachada de políticas.
   - `src/lib/enterprise/execution-policy-registry/` — Port, Factory, Registry, Adapters, Store e modelos de políticas de execução.
   - `src/lib/operations/policy-intelligence/` — adaptive governance, policy analyzer, supervised review, rollback analyzer.

5. **Supabase / Postgres** (`supabase/migrations/`):
   - `supabase/migrations/20250525120000_security_audit_logs.sql` — tabela `security_audit_logs` com RLS, índices, inserção via service role.
   - `supabase/migrations/20250512000002_operational_rbac_state.sql` — roles, funções `current_user_role()`, `current_professional_id()`, `is_tenant_admin()`, `is_operational_manager()`, RLS policies em `units`, `departments`, `schedules`, `shifts`, `shift_assignments`, `shift_swap_requests`, `availability`, e triggers de state machine.
   - `supabase/migrations/20250514120000_tenant_settings_branding_readiness.sql` — `tenant_settings`, `tenants`, RLS.
   - `supabase/migrations/20250512000003_operational_events_timeline.sql` — timeline de eventos operacionais.
   - `supabase/migrations/20250515130000_operational_observability_v1.sql` — eventos de observabilidade.
   - Múltiplas migrations com `CREATE OR REPLACE FUNCTION`, `CREATE TRIGGER`, `CREATE INDEX`, `CREATE POLICY` e `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.

6. **Backup, retenção e versionamento/histórico**:
   - `src/lib/services/backup-readiness/backup-readiness-service.ts` — checklist e exportação de backup para `tenant`, `financial`, `audit`, `operational`.
   - `src/lib/services/operational-backup/operational-backup-export-service.ts` — bundle operacional para DR.
   - `src/lib/services/medical-payout/retention-service.ts` — retenção de repasses (domínio financeiro, não lifecycle de dados).
   - `src/lib/capture/infrastructure/versioning.ts`, `src/lib/enterprise/contract/ports/versioning.ts`, `rule-pack/ports/versioning.ts`, `metadata/ports/versioning.ts` — contratos de versionamento.
   - `src/lib/enterprise/workflow/ports/history.ts` — contrato de histórico do workflow.

---

## 2. Componentes reutilizáveis (list of reusable components)

| Componente | Arquivo(s) | Uso |
| --- | --- | --- |
| `writeSecurityAudit` | `src/lib/server/security-audit-writer.ts` | Persistir eventos de segurança com hash de PII. |
| `hashAuditEmail` / `hashAuditIp` | `src/lib/security/security-audit-hash.ts` | Pseudonimização de e-mail e IP em logs de auditoria. |
| `requireOperationalAuth` | `src/lib/server/operational-auth.ts` | Resolver contexto operacional em server functions. |
| `getAuthContext` | `src/lib/auth/get-auth-context.ts` | Contexto de autenticação isomórfico. |
| `can` / `assertCan` | `src/lib/auth/rbac.ts` | Checagem de capacidade (RBAC). |
| `roleCapabilities` | `src/lib/auth/rbac.ts` | Matriz role → capabilities. |
| `TENANT_ID_COLUMN` | `src/lib/domain/multi-tenant.ts` | Convenção de coluna de isolamento. |
| `BusinessAuditTrailEngine` | `src/lib/enterprise/business-engine/business-audit-trail/business-audit-trail-engine.ts` | Reconstruir trilha de auditoria canônica. |
| `BusinessEventLogEngine` | `src/lib/enterprise/business-engine/business-event-log/business-event-log-engine.ts` | Log de eventos de negócio. |
| `PreventiveAuditEngine` | `src/lib/capture/audit/engine/preventive-audit-engine.ts` | Auditoria preventiva de guias TISS. |
| `ALL_AUDIT_RULES` | `src/lib/capture/audit/rules/index.ts` | Regras de auditoria preventiva. |
| `backup-readiness` | `src/lib/services/backup-readiness/backup-readiness-service.ts` | Exportação de bundles para DR/compliance. |
| `operational-backup` | `src/lib/services/operational-backup/operational-backup-export-service.ts` | Bundle operacional. |
| `ExecutionPolicyRegistry` | `src/lib/enterprise/execution-policy-registry/` | Registro de políticas de execução. |
| `EnterpriseGovernanceEngine` | `src/lib/enterprise/master-orchestration/governance/enterprise-governance-engine.ts` | Fachada de governança enterprise. |
| `EnterprisePolicyEngine` | `src/lib/enterprise/master-orchestration/policy/enterprise-policy-engine.ts` | Fachada de políticas enterprise. |
| `WorkflowHistory` port | `src/lib/enterprise/workflow/ports/history.ts` | Contrato de histórico de workflow. |
| Versioning ports | `src/lib/enterprise/*/ports/versioning.ts` | Contratos de versionamento. |

---

## 3. RuntimePorts relacionados (Security, Identity, Authorization, Tenant, Audit, Completed, Observability, Queue, Worker, Scheduler, etc.)

| RuntimePort | Diretório | Relação com compliance/governance |
| --- | --- | --- |
| `SecurityRuntimePort` | `src/lib/enterprise/security-runtime/` | Scaffolding para futuras capacidades de criptografia, assinatura, cadeia de custódia. |
| `IdentityRuntimePort` | `src/lib/enterprise/identity-runtime/` | Identidade/autenticação. |
| `AuthorizationRuntimePort` | `src/lib/enterprise/authorization-runtime/` | Autorização / RBAC. |
| `TenantRuntimePort` | `src/lib/enterprise/tenant-runtime/` | Isolamento e resolução de tenant. |
| `AuditRuntimePort` | `src/lib/enterprise/audit-runtime/` | Auditoria do pipeline TISS. |
| `CompletedRuntimePort` | `src/lib/enterprise/completed-runtime/` | Finalização e evidências de pipeline. |
| `ObservabilityRuntimePort` | `src/lib/enterprise/observability-runtime/` | Telemetria e métricas (somente leitura). |
| `QueueRuntimePort` | `src/lib/enterprise/queue-runtime/` | Transporte de jobs e evidências. |
| `PersistentQueueRuntimePort` | `src/lib/enterprise/persistent-queue-runtime/` | Persistência de jobs. |
| `WorkerRuntimePort` | `src/lib/enterprise/worker-runtime/` | Execução de jobs. |
| `SchedulerRuntimePort` | `src/lib/enterprise/scheduler-runtime/` | Agendamento. |
| `ExecutionPolicyRegistryPort` | `src/lib/enterprise/execution-policy-registry/` | Registro de políticas. |
| `BusinessEnginePort` | `src/lib/enterprise/business-engine/ports/` | Eventos e trilhas de auditoria de negócio. |
| `ExecutionContextPort` | `src/lib/enterprise/execution-context/` | Contexto de execução (pode carregar metadados de compliance). |
| `ExecutionStateMachinePort` | `src/lib/enterprise/execution-state-machine/` | Transições de estado e checkpoints de governança. |
| `WorkflowPort` / `WorkflowRuntimePort` | `src/lib/enterprise/workflow/`, `workflow-runtime/` | Histórico e versionamento. |

---

## 4. Extension Points (where future Compliance/Governance Runtime could plug in without altering EnterpriseRuntime/Queue/Worker/Scheduler/Pipeline/Composition Root)

1. **ExecutionPolicyRegistry** — novas políticas de compliance podem ser modeladas como regras de execução sem mudar o orquestrador.
2. **BusinessEventLogEngine + BusinessAuditTrailEngine** — eventos canônicos de negócio já produzem a trilha de auditoria; uma futura camada de evidência pode consumir esses eventos.
3. **SecurityRuntimePort adapters** (`default`, `mock`, `real-tiss`) — é o ponto natural para criptografia, assinatura digital, hash/HSM e cadeia de custódia.
4. **AuditRuntimePort adapters** — pode estender a auditoria do TISS para auditoria de compliance/segurança (evidence package, hash, assinatura).
5. **ExecutionStateMachine / Workflow** — checkpoints de governança podem ser adicionados como transições/validações de estado.
6. **ObservabilityRuntimePort** — pode exportar métricas de compliance (somente leitura).
7. **CanonicalQueueMessage.customAttributes** — campos `tenantId`, `traceId`, `evidenceRef` podem ser estendidos futuramente para carregar metadados de compliance sem alterar o contrato principal.
8. **Master orchestration governance/policy engines** — `EnterpriseGovernanceEngine` e `EnterprisePolicyEngine` são as fachadas de alto nível para agregar futuros motores de compliance.
9. **Supabase migrations / RLS / policies** — novas tabelas, funções e policies de consentimento, classificação e lifecycle podem ser adicionadas sem alterar o app.

---

## 5. Dependency Matrix (components and their dependencies)

| Componente | Dependências principais |
| --- | --- |
| `security-audit-writer.ts` | `security-audit-types.ts`, `security-audit-hash.ts`, `supabase-admin.ts`, `database.types.ts` |
| `security-audit-hash.ts` | `supabase/config.ts`, Web Crypto API (`crypto.subtle.digest`) |
| `session-audit-server.ts` | `security-audit-types.ts`, `rate-limit.ts`, `security-audit-writer.ts` |
| `auth-security-server.ts` | `security-audit-writer.ts`, `session-validation.ts` |
| `operational-auth.ts` | `database.types.ts`, `session-validation.ts`, `security-audit-writer.ts`, `supabase.ts` |
| `get-auth-context.ts` | `database.types.ts`, `supabase/browser.ts`, `supabase/config.ts`, TanStack Start |
| `rbac.ts` | `database.types.ts`, `domain/operations/errors.ts` |
| `capture-http-router.ts` / `fn-helpers.ts` | `operational-auth.ts`, `writeSecurityAudit` |
| `business-audit-trail-engine.ts` | `business-event-log-engine.ts`, `ports/canonical.ts` |
| `preventive-audit-engine.ts` | `audit-context.ts`, `score-calculator.ts`, `capture/audit/rules/*` |
| `backup-readiness-service.ts` | `rbac.ts`, `operational-backup-export-service.ts` |
| `operational-backup-export-service.ts` | `operational-observability-server.ts`, `ServiceCtx` |
| `retention-service.ts` | `medical-payout/types.ts` |
| `enterprise-governance-engine.ts` | `enterprise-policy-engine.ts`, `enterprise-saga-engine.ts`, `enterprise-orchestration-engine.ts`, `enterprise-command-engine.ts`, generic engines |
| `enterprise-policy-engine.ts` | `enterprise-saga-engine.ts`, `enterprise-orchestration-engine.ts`, `enterprise-command-engine.ts`, generic engines |
| `execution-policy-registry/*` | `execution-policy-registry-port.ts`, adapters, factory, registry, store |
| `security_audit_logs` (SQL) | `tenants`, `profiles`, `current_tenant_ids()`, `is_tenant_admin()`, RLS |
| `operational_rbac_state` (SQL) | `profiles`, `professionals`, `units`, `departments`, `schedules`, `shifts`, etc. |

---

## 6. Compliance Capability Matrix

| Capability | Status | Evidência / Nota |
| --- | --- | --- |
| Security Audit | Existente | `security_audit_logs` tabela, `writeSecurityAudit`, `SecurityAuditInput`, categorias de eventos. |
| Data Retention | Parcial | `retention-service.ts` cobre retenção financeira; lifecycle/purging geral ausente. |
| Consent | Ausente | Nenhum gerenciamento de consentimento encontrado. |
| Privacy | Parcial | Hash de e-mail/IP em logs; RLS; sem máscara/anomimização geral de PII. |
| Masking | Parcial | Pseudonimização em audit logs; sem masking em campos de negócio. |
| Anonymization | Ausente | Sem redação/reversão de identidade. |
| Pseudonymization | Parcial | `hashAuditEmail`/`hashAuditIp` pseudonimizam identificadores. |
| Encryption | Ausente | Apenas SHA-256; sem criptografia de dados, chaves, transporte (TLS é infra). |
| Digital Signature | Ausente | Nenhuma assinatura digital/ICP-Brasil implementada. |
| Chain of Custody | Ausente | Nenhum rastreamento de cadeia de custódia. |
| Logs | Existente | `security_audit_logs`, `business-event-log`, `business-audit-trail`, `operational_observability_events`. |
| RLS | Existente | Políticas de RLS em múltiplas tabelas. |
| Tenant Isolation | Existente | `tenant_id` + `current_tenant_ids()` + RLS policies. |
| Data Classification | Ausente | Sem classificação de dados. |
| LGPD | Ausente | Sem consentimento, DPO, direitos do titular, impacto, anonimização. |
| SIEM | Ausente | Nenhuma integração com SIEM. |
| OpenTelemetry | Ausente | `ObservabilityRuntimePort` somente leitura; sem OTel. |
| HSM | Ausente | Sem HSM. |
| TISS Compliance | Parcial | `capture/audit/rules/*`, `tuss-catalog.ts`, validação preventiva; XSD/SOAP real ainda em Discovery. |
| ANS Compliance | Parcial | Catálogo TISS e regras preventivas; sem validação XSD oficial / webservices ANS. |

---

## 7. Governance Capability Matrix

| Capability | Status | Evidência / Nota |
| --- | --- | --- |
| RBAC | Existente | `rbac.ts`, `roleCapabilities`, `can()`, `assertCan()`, roles do banco. |
| Policies | Parcial | RLS policies no Postgres; `execution-policy-registry` e `EnterprisePolicyEngine` são scaffolding. |
| Roles | Existente | `UserRole`, `super_admin`, `tenant_admin`, `coordinator`, `professional`, `financial`. |
| Permissions | Existente | `Capability` e mapeamento role → capabilities. |
| Audit Trail | Existente | `security_audit_logs`, `business-audit-trail`, `operational_events_timeline`. |
| Versioning | Parcial | Contratos de versionamento em capture, contract, rule-pack, metadata. |
| History | Parcial | `workflow/ports/history.ts`, `execution-state-machine` mantém histórico. |
| Soft Delete | Ausente | Sem exclusão lógica generalizada. |
| Backup/Restore | Parcial | `backup-readiness-service.ts` e `operational-backup-export-service.ts`; restore não implementado. |
| Data Lifecycle | Ausente | Sem política de retenção/purging/anonimização por fase. |
| Security Policies | Parcial | CSP, rate limit, brute force, RLS, validação de upload, redirects. |
| Consent Management | Ausente | Sem consentimento. |

---

## 8. Gap Analysis

1. **Privacidade / LGPD** — Não há gerenciamento de consentimento, direitos do titular, DPO, registro de operações de dados, anonimização nem relatórios de impacto.
2. **Criptografia e proteção de dados** — Não existe criptografia de dados em repouso/transito no código (TLS é infra), key management, Key Vault, HSM.
3. **Assinatura digital / ICP-Brasil** — Nenhuma capacidade de assinatura/verificação de documentos ou XMLs TISS.
4. **Cadeia de custódia** — Não há rastreio de quem acessou/alterou evidências, nem integridade com hash criptográfico por artefato.
5. **SIEM / OpenTelemetry** — Observabilidade existe, mas sem exportação OTel, SIEM, tracing distribuído.
6. **Ciclo de vida e classificação de dados** — Sem retenção programada, classificação, soft delete, purging ou anonimização agendada.
7. **Governança operacional** — `EnterprisePolicyEngine`, `EnterpriseGovernanceEngine` e `ExecutionPolicyRegistry` são scaffolding; não há motor de políticas funcional, ABAC, delegação, versionamento de políticas.
8. **Backup/DR** — Existe exportação, mas sem restore automatizado, testes de recuperação, ponto de recuperação definido.
9. **Compliance TISS/ANS real** — XSD/SOAP/webservices das operadoras ainda em Discovery; audit preventivo é interno.

---

## 9. Estratégia oficial para futuras ativações

1. **S5-01 encerra em Discovery** — nenhuma implementação de Compliance/Governance Runtime é feita nesta Sprint.
2. **Futuras sprints seguem o padrão Discovery → Activation → Production Certification**.
3. **Reutilização obrigatória da Baseline v1.1** — novas capabilities devem consumir `EnterpriseRuntime`, `QueueRuntimePort`, `WorkerRuntimePort`, `SchedulerRuntimePort`, `ObservabilityRuntimePort` e os Runtimes já certificados.
4. **Sem criação de novo Runtime/Port/Adapter/Factory/Registry/Store** sem aprovação formal de nova baseline.
5. **Pontos de extensão recomendados**:
   - `SecurityRuntimePort` para criptografia, assinatura, HSM, cadeia de custódia.
   - `AuditRuntimePort` e `BusinessAuditTrailEngine` para evidências e trilha de compliance.
   - `ExecutionPolicyRegistry` e `EnterprisePolicyEngine` para regras de governança declarativas.
   - `ObservabilityRuntimePort` para telemetria de compliance (sempre read-only).
   - Supabase migrations para novas tabelas de consentimento, classificação, lifecycle e policies RLS.
6. **Arquitetura futura de Compliance Runtime** (se aprovada) seguiria o padrão canônico de 9 métodos em `src/lib/enterprise/compliance-runtime/` — fora de escopo de S5-01.
7. **Nenhuma alteração em `EnterpriseRuntime/Queue/Worker/Scheduler/Pipeline/Composition Root` durante S5-01.**

---

## 10. Validações técnicas (build, tsc, lint, smoke placeholders)

| Validação | Comando | Status na Sprint S5-01 |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | Executado após criação do documento. |
| Lint | `npm run lint` | Executado após criação do documento. |
| Build | `npm run build` | Executado após criação do documento. |
| Smoke | `npm run smoke-check` | Executado após criação do documento. |

Resultados concretos são reportados no resumo técnico da Sprint S5-01.

---

## 11. Confirmação de zero implementação

- **Nenhum arquivo em `src/` foi modificado** durante a S5-01.
- **Nenhum Runtime, Port, Adapter, Factory, Registry, Store ou Capability foi criado ou implementado.**
- A única criação/alteração é a documentação em `docs/enterprise/`:
  - `docs/enterprise/COMPLIANCE_GOVERNANCE_DISCOVERY.md` (novo)
  - `docs/enterprise/OPER_INF_ROADMAP.md` (atualização de metadata + linha S5-01)
  - `docs/enterprise/PRODUCTION_GAP_TRACKER.md` (atualização de metadata + seção 37)
  - `docs/enterprise/REAL_PROVIDER_CERTIFICATION_MATRIX.md` (atualização de metadata)
- O `git diff -- src/` deve permanecer vazio.

---

## 12. Conclusão

A Sprint S5-01 mapeou a arquitetura de compliance e governança existente no MedicFlow-IA sem alterar `src/`. Foram identificados blocos de segurança (RBAC, RLS, tenant isolation, security audit logs), auditoria (preventive audit, business audit trail), políticas/governança (scaffolding) e versionamento/histórico. Os principais gaps estão em LGPD/consentimento, criptografia, assinatura digital, cadeia de custódia, HSM/Key Vault, SIEM/OpenTelemetry, classificação e lifecycle de dados. O próximo passo, fora do escopo de S5-01, é a ativação planejada dessas capabilities seguindo o padrão canônico da `Enterprise Runtime Baseline v1.1`.
