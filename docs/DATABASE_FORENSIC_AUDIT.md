# Auditoria Forense de Banco de Dados — MedicFlow-AI

**Data:** 08/06/2026  
**Projeto Supabase (staging):** `utodixhxrvegzafcldpu`  
**URL:** `https://utodixhxrvegzafcldpu.supabase.co`  
**Evidência de configuração:** `.env.staging` linha 5-7

---

## Metodologia

1. Extração de schema via `supabase/migrations/*.sql` (29 arquivos)
2. Probe HTTP via Supabase REST API (`/rest/v1/{table}?select=id&limit=1`)
3. Comparação entre schema declarado (migrations) e banco live (staging)

**Limitação:** Inspeção de views, funções e policies no banco live requer `service_role` key — **EVIDÊNCIA NÃO ENCONTRADA** de acesso com service role nesta auditoria. Views/funções/policies documentadas abaixo vêm exclusivamente das migrations SQL.

---

## Tabelas (59 identificadas nas migrations)

| # | Tabela | Módulo |
|---|--------|--------|
| 1 | `tenants` | Multi-tenant |
| 2 | `tenant_settings` | Instituição |
| 3 | `profiles` | Auth/RBAC |
| 4 | `hospitals` | Estrutura |
| 5 | `departments` | Estrutura |
| 6 | `units` | Estrutura |
| 7 | `professionals` | Cadastro profissional |
| 8 | `schedules` | Escalas |
| 9 | `shifts` | Plantões |
| 10 | `shift_assignments` | Plantões |
| 11 | `shift_swap_requests` | Plantões |
| 12 | `availability` | Disponibilidade |
| 13 | `insurance_providers` | TISS |
| 14 | `insurance_contracts` | TISS |
| 15 | `insurance_rules` | TISS |
| 16 | `tuss_procedures` | TISS |
| 17 | `tiss_guides` | TISS |
| 18 | `tiss_guide_items` | TISS |
| 19 | `tiss_batches` | TISS |
| 20 | `tiss_batch_exports` | TISS |
| 21 | `tiss_returns` | TISS |
| 22 | `tiss_denials` | TISS |
| 23 | `tiss_denial_appeals` | TISS |
| 24 | `tiss_denial_audit` | TISS |
| 25 | `tiss_denial_financial_rollups` | TISS |
| 26 | `tiss_denial_reason_rollups` | TISS |
| 27 | `medical_production` | Repasses |
| 28 | `medical_payouts` | Repasses |
| 29 | `medical_payout_items` | Repasses |
| 30 | `medical_payout_audit` | Repasses |
| 31 | `payout_rules` | Repasses |
| 32 | `financial_closings` | Fechamento |
| 33 | `financial_closing_snapshots` | Fechamento |
| 34 | `financial_closing_audit` | Fechamento |
| 35 | `operational_reconciliations` | Conciliação |
| 36 | `operational_reconciliation_items` | Conciliação |
| 37 | `operational_reconciliation_issues` | Conciliação |
| 38 | `operational_reconciliation_audit` | Conciliação |
| 39 | `operational_events` | IA operacional |
| 40 | `operational_action_proposals` | IA operacional |
| 41 | `operational_action_proposal_audit` | IA operacional |
| 42 | `operational_mutation_executions` | IA operacional |
| 43 | `operational_execution_sandbox_runs` | IA operacional |
| 44 | `operational_orchestrations` | IA operacional |
| 45 | `operational_orchestration_steps` | IA operacional |
| 46 | `operational_agent_governance_sessions` | IA operacional |
| 47 | `operational_agent_coordination_cycles` | IA operacional |
| 48 | `operational_memory_entries` | IA operacional |
| 49 | `operational_policy_intelligence_cycles` | IA operacional |
| 50 | `operational_policy_intelligence_audit` | IA operacional |
| 51 | `operational_policy_governance_recommendations` | IA operacional |
| 52 | `operational_strategic_planning_cycles` | IA operacional |
| 53 | `operational_strategic_planning_audit` | IA operacional |
| 54 | `operational_recommendation_feedback` | IA operacional |
| 55 | `operational_health_metrics` | Observabilidade |
| 56 | `operational_errors` | Observabilidade |
| 57 | `operational_logs` | Observabilidade |
| 58 | `security_audit_logs` | Segurança |
| 59 | `pilot_feedback` | Piloto |
| 60 | `pilot_incidents` | Piloto |
| 61 | `pilot_suggestions` | Piloto |
| 62 | `pilot_feature_flags` | Piloto |
| 63 | `pilot_adoption_events` | Piloto |

*Lista completa em `docs/evidence/tables-from-migrations.txt`*

---

## Tabelas clínicas — busca específica

| Tabela | Migration SQL | Supabase REST (live) | Resultado |
|--------|---------------|----------------------|-----------|
| `patients` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `patient` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `medical_records` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `clinical_records` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `appointments` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `encounters` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `consultas` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |
| `prontuarios` | **NÃO** | HTTP 404 | **EVIDÊNCIA NÃO ENCONTRADA** |

### Tabelas operacionais — verificação de conectividade (controle positivo)

| Tabela | Supabase REST (live) |
|--------|----------------------|
| `tiss_guides` | HTTP 200 |
| `shifts` | HTTP 200 |
| `profiles` | HTTP 200 |
| `tenants` | HTTP 200 |

**Conclusão:** O banco staging está acessível e contém tabelas operacionais. Tabelas clínicas **não existem** no endpoint REST.

---

## Campo relacionado a paciente (contexto TISS, não EHR)

```sql
-- 20250513201000_tiss_operational_foundation.sql
CREATE TABLE public.tiss_guides (
  ...
  patient_name text NOT NULL,
  ...
);
```

Este é um campo textual na guia de faturamento TISS, não uma entidade de paciente com prontuário.

---

## Views

**EVIDÊNCIA NÃO ENCONTRADA** de `CREATE VIEW` nas 29 migrations analisadas.

---

## Funções (amostra das migrations)

| Função | Migration | Propósito |
|--------|-----------|-----------|
| `current_tenant_ids()` | `20250512000000_init_enterprise.sql` | Multi-tenant RLS |
| `tenant_settings_set_updated_at()` | `20250514120000_tenant_settings_branding_readiness.sql` | Trigger |
| `tiss_denial_exposure()` | `20250513210000_tiss_returns_denials_appeals.sql` | Cálculo TISS |
| `tiss_denial_financial_rollup_add()` | `20250513210000_tiss_returns_denials_appeals.sql` | Rollup TISS |
| `tiss_denials_apply_rollup_delta()` | `20250513210000_tiss_returns_denials_appeals.sql` | Rollup TISS |

**EVIDÊNCIA NÃO ENCONTRADA** de funções relacionadas a pacientes, prontuário, consultas ou atendimento clínico.

---

## Policies (RLS) — amostra

| Policy | Tabela | Migration |
|--------|--------|-----------|
| `tenants_anon_directory_select` | `tenants` | init_enterprise |
| `profiles_self_select` | `profiles` | init_enterprise |
| `hospitals_tenant_isolation` | `hospitals` | init_enterprise |
| `medical_production_select_tenant` | `medical_production` | medical_payouts_foundation |
| `tiss_returns_select_tenant` | `tiss_returns` | tiss_returns_denials_appeals |
| `operational_memory_entries_select_manager` | `operational_memory_entries` | operational_memory_learning |
| `security_audit_logs_select_tenant_admin` | `security_audit_logs` | security_audit_logs |

**EVIDÊNCIA NÃO ENCONTRADA** de policies para tabelas clínicas (não existem tabelas correspondentes).

---

## Migrations relacionadas a módulos clínicos

| Tema | Encontrada | Evidência |
|------|------------|-----------|
| pacientes | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| prontuário | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| agenda clínica | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |
| atendimento clínico | **NÃO** | EVIDÊNCIA NÃO ENCONTRADA |

### Migrations existentes (29 arquivos)

Todas relacionadas a: enterprise init, scheduling, RBAC, events, analytics, TISS, medical payouts, financial closing, reconciliation, tenant settings, observability, pilot, security audit.

*Lista completa em `docs/evidence/migrations-list.txt`*

---

## Conclusão da auditoria de banco

1. **Schema (migrations):** 63 tabelas operacionais/financeiras/TISS — zero tabelas clínicas EHR.
2. **Banco live (staging):** tabelas clínicas retornam HTTP 404; tabelas operacionais retornam HTTP 200.
3. **Única referência a paciente:** campo `patient_name` em `tiss_guides` (faturamento).

**STATUS:** EVIDÊNCIA NÃO ENCONTRADA de módulo clínico no banco de dados.

---

*Evidências: `docs/evidence/tables-from-migrations.txt`, `docs/evidence/migrations-list.txt`*
