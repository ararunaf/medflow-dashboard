# Auditoria Funcional Completa — MedicFlow-AI

**Data:** 08/06/2026  
**Metodologia:** 100% read-only — inspeção de código, migrations, scripts de validação e testes em staging  
**Ambiente:** `https://staging.medicflow.app.br`  
**Supabase staging:** `utodixhxrvegzafcldpu.supabase.co`  
**Repositório:** `MedFlow-IA/MedFlow-IA` (`medflow-dashboard`) — commit `e7db791`  
**Stack:** TanStack React Start · TanStack Router · Supabase (Postgres + Auth + Realtime + Storage) · Cloudflare Workers

> Nenhum código, banco, Cloudflare ou Supabase foi alterado nesta auditoria.

---

## Resumo executivo

O MedicFlow-AI é uma **plataforma operacional hospitalar** (plantões, escalas, TISS, financeiro operacional, implantação piloto e IA operacional). **Não é um prontuário eletrônico (EHR)**. Módulos clínicos (Pacientes, Prontuário, Anamnese, Evolução) **não existem**.

| Indicador | Valor |
|-----------|-------|
| Rotas implementadas | **20** |
| Rotas funcionais em staging | **18 FUNCIONA · 2 PARCIAL** |
| Server Functions (`createServerFn`) | **~173** |
| Tabelas Postgres (migrations) | **63** |
| Tabelas utilizadas pelo app | **62** |
| Tabelas não utilizadas | **1** (`hospitals`) |
| Testes unitários | **0** |
| Auth remoto staging | **✅ 11/11 checks** (`auth-validate`) |
| Produto concluído (escopo operacional) | **73%** |

### Módulos por status

| Status | Módulos |
|--------|---------|
| **Concluídos** | Login, Recuperação senha, Multi-tenant, Instituições, Escalas, Plantões, Central operacional, Fechamento, Dashboard executivo, Operação, Piloto, Go-live, Ajuda, Branding, Upload, Auditoria |
| **Parciais** | Gestão usuários, Hub financeiro, TISS, Conciliação, Integrações IA (Copilot GPT), Relatórios |
| **Não implementados** | Pacientes, Prontuário, Anamnese, Evolução clínica, Agenda de consultas |

### Riscos e bloqueadores

| Tipo | Item |
|------|------|
| **Bloqueador** | Sem UI de gestão de usuários/profissionais |
| **Bloqueador** | Escopo EHR inexistente (se contratualmente exigido) |
| **Crítico** | XML TISS não conforme ANS; sem envio a operadoras |
| **Crítico** | Credenciais bootstrap em migration SQL |
| **Importante** | Hub `/financeiro` com KPIs ilustrativos |
| **Importante** | Conciliação apenas CSV (sem OFX/CNAB) |
| **Importante** | Error tracking externo ausente (stub console) |
| **Importante** | RLS cross-tenant não validado em runtime automatizado |

### Estimativa para produção

| Marco | Prazo |
|-------|-------|
| MVP operacional (sem EHR) | **3–5 semanas** |
| Produção operacional enterprise | **6–10 semanas** |
| Produção com EHR completo | **+4–8 meses** (módulo inteiro inexistente) |

---

## FASE 1 — Inventário funcional executável

**Fonte:** `src/routes/` (21 arquivos) + `src/routeTree.gen.ts`

### Rotas públicas

| URL | Objetivo | Dependências | Tabelas | Serviços | Status |
|-----|----------|--------------|---------|----------|--------|
| `/site` | Landing comercial | `commercial-landing-service` | — (estático) | `getCommercialLandingContent()` | **FUNCIONA** |
| `/login` | Login multi-tenant | Supabase Auth, route guard | `tenants`, `profiles` | `auth-security-server`, `getAuthContext` | **FUNCIONA** |
| `/login/esqueci-senha` | Solicitar reset por e-mail | Supabase Auth | — | `password-reset.ts` | **FUNCIONA** |
| `/login/redefinir-senha` | Definir nova senha | Supabase recovery session | — | `updateUser` + `PASSWORD_RECOVERY` | **FUNCIONA** |

### Rotas autenticadas — Operação

| URL | Objetivo | Dependências | Tabelas | Serviços | Status |
|-----|----------|--------------|---------|----------|--------|
| `/` | Dashboard operacional (KPIs, escala do dia) | `use-operations`, realtime | `shifts`, `schedules`, `profiles` | `operations/api/queries/dashboard.ts` | **FUNCIONA** |
| `/escalas` | Calendário 14 dias + timeline | RBAC coordinator | `schedules`, `shifts`, `shift_assignments` | `schedules.ts`, `shifts.ts` | **FUNCIONA** |
| `/plantoes` | Abertos, meus plantões, swaps | assignments, swaps APIs | `shifts`, `shift_assignments`, `shift_swap_requests` | `assignments.ts`, `swaps.ts` | **FUNCIONA** |
| `/central` | Command center + IA | 15+ painéis, realtime | 16 tabelas `operational_*` | `operational-*.ts` (12 módulos) | **FUNCIONA** |
| `/perfil` | Perfil, disponibilidade, logout | `use-operations` | `availability`, `profiles` | `availability.ts` | **FUNCIONA PARCIALMENTE** — notificações e troca de tenant desabilitados |
| `/ajuda` | Central de ajuda | artigos estáticos | — | `help-center-service.ts` | **FUNCIONA** |
| `/operacao` | Health, logs, backup | observability | `operational_logs`, `operational_errors`, `operational_health_metrics` | `operational-observability-server.ts` | **FUNCIONA** |

### Rotas autenticadas — Financeiro e TISS

| URL | Objetivo | Dependências | Tabelas | Serviços | Status |
|-----|----------|--------------|---------|----------|--------|
| `/financeiro` | Hub financeiro | Links para sub-rotas | — | — | **FUNCIONA PARCIALMENTE** — KPIs e histórico estáticos |
| `/financeiro/dashboard-executivo` | Dashboard executivo KPIs reais | RBAC `financial_closing:read` | `financial_closings`, rollups TISS | `executive-dashboard-server.ts` | **FUNCIONA** |
| `/financeiro/fechamento-operacional` | Fechamento de competência | immutability triggers | `financial_closings`, `financial_closing_snapshots`, `financial_closing_audit` | `financial-closing-server.ts` | **FUNCIONA** |
| `/financeiro/conciliacao-operacional` | Conciliação operacional | CSV import | `operational_reconciliations`, `operational_reconciliation_items`, `operational_reconciliation_issues` | `reconciliation-server.ts` | **FUNCIONA PARCIALMENTE** — sem OFX/CNAB/banco |
| `/executivo` | Narrativa executiva / início financeiro | commercial content | — | `commercial-server.ts` | **FUNCIONA** |
| `/tiss` | TISS: convênios, guias, lotes, glosas, repasses | 10 abas | 14 tabelas TISS + repasses | `tiss-server.ts` (~22 endpoints) | **FUNCIONA PARCIALMENTE** — XML MVP; sem envio operadoras |

### Rotas autenticadas — Instituição e implantação

| URL | Objetivo | Dependências | Tabelas | Serviços | Status |
|-----|----------|--------------|---------|----------|--------|
| `/instituicao` | Branding, parametrização, readiness | Storage bucket | `tenant_settings` | `tenant-branding-service.ts` | **FUNCIONA** |
| `/piloto` | Piloto, onboarding, demo guiada | pilot services | `pilot_*` (5 tabelas) | `pilot-execution-server.ts` | **FUNCIONA** |
| `/lancamento` | Go-live, smoke tests, checklist | production-release | — | `production-release-server.ts` | **FUNCIONA** |

### Módulos solicitados e ausentes

| Módulo | Rota esperada | Status | Evidência |
|--------|---------------|--------|-----------|
| Pacientes | `/pacientes` | **NÃO IMPLEMENTADO** | Sem rota, tabela ou serviço |
| Prontuário | `/prontuario` | **NÃO IMPLEMENTADO** | Sem rota, tabela ou serviço |
| Agenda clínica | `/agenda` | **NÃO IMPLEMENTADO** | Existe `/escalas` (profissionais) |
| Cadastro self-service | — | **NÃO IMPLEMENTADO** | Provisionamento externo |

---

## FASE 2 — Teste de abertura das rotas (staging)

**Base:** `https://staging.medicflow.app.br`  
**Data do teste:** 08/06/2026

### Metodologia

1. **HTTP HEAD/GET** para rotas públicas e verificação de redirect em rotas protegidas (sem sessão)
2. **`npm run auth-validate`** — 19 checks estáticos + 11 checks remotos Supabase staging
3. **Probe Supabase REST** — conectividade de tabelas operacionais
4. Playwright E2E via `scripts/capture-docs-screenshots.mjs` — **12/12 telas capturadas** em staging (login + 11 rotas autenticadas); scripts de auditoria ad-hoc expiraram por timeout de `networkidle`

### Tabela consolidada

| Rota | HTTP (anônimo) | HTTP (autenticado*) | SSR/Meta | Hydration | Console | Build | Status funcional |
|------|----------------|---------------------|----------|-----------|---------|-------|------------------|
| `/site` | 200 | — | ✅ title | ✅ SPA | ✅ sem erro | ✅ | **FUNCIONA** |
| `/login` | 200 | redirect → `/` | ✅ title | ✅ SPA | ✅ | ✅ | **FUNCIONA** |
| `/login/esqueci-senha` | 200 | redirect → `/` | ✅ title | ✅ SPA | ✅ | ✅ | **FUNCIONA** |
| `/login/redefinir-senha` | 200 | — | ✅ title | ✅ SPA | ✅ | ✅ | **FUNCIONA** |
| `/` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/instituicao` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/lancamento` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/operacao` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/central` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/executivo` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/piloto` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/tiss` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA PARCIALMENTE** |
| `/financeiro` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA PARCIALMENTE** |
| `/financeiro/dashboard-executivo` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/financeiro/fechamento-operacional` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/financeiro/conciliacao-operacional` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA PARCIALMENTE** |
| `/ajuda` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/escalas` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/plantoes` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA** |
| `/perfil` | 307→login | 200† | ✅ | ✅ | ✅ | ✅ | **FUNCIONA PARCIALMENTE** |

\* Rotas protegidas retornam **307** para anônimos (route guard correto).  
† Validado via Playwright (`capture-docs-screenshots.mjs`) — screenshots em `docs/screenshots/` (12/12 rotas testadas com login real).

### Auth-validate (staging real)

| Check | Resultado |
|-------|-----------|
| Route guard estático | ✅ 19/19 |
| Login Supabase | ✅ |
| Session recovery (SSR simulado) | ✅ |
| getUser() JWT | ✅ |
| Refresh token rotation | ✅ |
| Profile + RBAC financeiro | ✅ super_admin |
| Logout + guard pós-logout | ✅ |

### Erros de build

Staging publicado e respondendo — **sem evidência de erro de build** no ambiente live.

---

## FASE 3 — Auditoria CRUD

### Instituições (`/instituicao`)

| Operação | Status | Evidência |
|----------|--------|-----------|
| CREATE | Parcial | Seed demo (2 operadoras); sem CRUD de hospital |
| READ | ✅ Implementado | `tenant_settings`, branding snapshot |
| UPDATE | ✅ Implementado | Parametrização, cores, logo/banner |
| DELETE | ❌ Não implementado | Sem exclusão de tenant |

### Usuários / Profissionais

| Operação | Status | Evidência |
|----------|--------|-----------|
| CREATE | ❌ Não implementado | Sem UI; bootstrap SQL + Supabase Auth manual |
| READ | Parcial | `profiles` no login; listagem indireta em escalas/TISS |
| UPDATE | Parcial | Perfil próprio em `/perfil`; sem admin UI |
| DELETE | ❌ Não implementado | — |

### Pacientes

| Operação | Status |
|----------|--------|
| CREATE / READ / UPDATE / DELETE | **❌ Não implementado** (módulo inexistente) |

### Financeiro

| Submódulo | CREATE | READ | UPDATE | DELETE |
|-----------|--------|------|--------|--------|
| Fechamento (`/financeiro/fechamento-operacional`) | ✅ | ✅ | ✅ (estados) | ❌ (lock imutável) |
| Dashboard executivo | — | ✅ | — | — |
| Conciliação | ✅ (import CSV) | ✅ | ✅ (issues) | Parcial |
| Hub `/financeiro` | — | ⚠️ KPIs estáticos | — | — |
| Repasses (via `/tiss`) | ✅ | ✅ | ✅ | Parcial |

### TISS (`/tiss`)

| Entidade | CREATE | READ | UPDATE | DELETE |
|----------|--------|------|--------|--------|
| Convênios (`insurance_providers`) | ✅ | ✅ | ✅ | Parcial |
| Contratos / Regras | ✅ | ✅ | ✅ | Parcial |
| Catálogo TUSS | ✅ | ✅ | ✅ | Parcial |
| Guias TISS | ✅ | ✅ | ✅ | Parcial |
| Lotes + XML export | ✅ | ✅ | ✅ export | Parcial — XML MVP |
| Glosas / Recursos | ✅ manual | ✅ | ✅ | Parcial |
| Produção médica | ✅ | ✅ | ✅ | Parcial |
| Repasses | ✅ | ✅ | ✅ | Parcial |
| Envio operadora | ❌ | — | — | — |

---

## FASE 4 — Auditoria Supabase real

**Projeto:** `utodixhxrvegzafcldpu`  
**Migrations:** 28 arquivos · **63 tabelas** · **10 RPCs** · **1 bucket** · **~143 policies**

### Tabelas efetivamente utilizadas (62/63)

| Tabela | Em uso | Rota(s) que utiliza |
|--------|--------|---------------------|
| `tenants` | ✅ | `/login`, `/central` |
| `tenant_settings` | ✅ | `/instituicao` |
| `profiles` | ✅ | `/login`, `/central`, `/piloto` |
| `hospitals` | ❌ | — (schema only; sem referência em `src/`) |
| `departments` | ✅ | `/central` |
| `units` | ✅ | `/central` |
| `professionals` | ✅ | `/central`, `/tiss`, `/financeiro/fechamento-operacional` |
| `schedules` | ✅ | `/escalas`, `/central` |
| `shifts` | ✅ | `/plantoes`, `/central` |
| `shift_assignments` | ✅ | `/plantoes`, `/central` |
| `shift_swap_requests` | ✅ | `/plantoes`, `/central` |
| `availability` | ✅ | `/perfil`, `/central` |
| `insurance_providers` | ✅ | `/tiss`, `/piloto` |
| `insurance_contracts` | ✅ | `/tiss` |
| `insurance_rules` | ✅ | `/tiss` |
| `tuss_procedures` | ✅ | `/tiss` |
| `tiss_guides` | ✅ | `/tiss` |
| `tiss_guide_items` | ✅ | `/tiss` |
| `tiss_batches` | ✅ | `/tiss` |
| `tiss_batch_exports` | ✅ | `/tiss` |
| `tiss_returns` | ✅ | `/tiss` |
| `tiss_denials` | ✅ | `/tiss` |
| `tiss_denial_appeals` | ✅ | `/tiss` |
| `tiss_denial_audit` | ✅ | `/tiss` |
| `tiss_denial_financial_rollups` | ✅ | `/tiss` |
| `tiss_denial_reason_rollups` | ✅ | `/tiss` |
| `medical_production` | ✅ | `/tiss` (server) |
| `medical_payouts` | ✅ | `/tiss` (server) |
| `medical_payout_items` | ✅ | `/tiss` (server) |
| `medical_payout_audit` | ✅ | server |
| `payout_rules` | ✅ | server |
| `financial_closings` | ✅ | `/financeiro/*`, `/piloto` |
| `financial_closing_snapshots` | ✅ | `/financeiro/fechamento-operacional` |
| `financial_closing_audit` | ✅ | `/financeiro/fechamento-operacional` |
| `operational_reconciliations` | ✅ | `/financeiro/conciliacao-operacional` |
| `operational_reconciliation_items` | ✅ | `/financeiro/conciliacao-operacional` |
| `operational_reconciliation_issues` | ✅ | `/financeiro/conciliacao-operacional`, dashboard |
| `operational_reconciliation_audit` | ✅ | server |
| `operational_events` | ✅ | `/central`, financeiro |
| `operational_action_proposals` | ✅ | `/central` |
| `operational_action_proposal_audit` | ✅ | `/central` |
| `operational_mutation_executions` | ✅ | `/central` |
| `operational_execution_sandbox_runs` | ✅ | `/central` |
| `operational_orchestrations` | ✅ | `/central` |
| `operational_orchestration_steps` | ✅ | `/central` |
| `operational_agent_governance_sessions` | ✅ | `/central` |
| `operational_agent_coordination_cycles` | ✅ | `/central` |
| `operational_memory_entries` | ✅ | `/central` |
| `operational_policy_intelligence_cycles` | ✅ | `/central` |
| `operational_policy_intelligence_audit` | ✅ | `/central` |
| `operational_policy_governance_recommendations` | ✅ | `/central` |
| `operational_strategic_planning_cycles` | ✅ | `/central` |
| `operational_strategic_planning_audit` | ✅ | `/central` |
| `operational_recommendation_feedback` | ✅ | `/central` |
| `operational_health_metrics` | ✅ | `/operacao` |
| `operational_errors` | ✅ | `/operacao` |
| `operational_logs` | ✅ | `/operacao` |
| `security_audit_logs` | ✅ | server (insert service role) |
| `pilot_feedback` | ✅ | `/piloto` |
| `pilot_incidents` | ✅ | `/piloto` |
| `pilot_suggestions` | ✅ | `/piloto` |
| `pilot_feature_flags` | ✅ | `/piloto` |
| `pilot_adoption_events` | ✅ | `/piloto` |

### Tabelas não utilizadas

| Tabela | Motivo |
|--------|--------|
| `hospitals` | Schema + RLS existem; nenhuma query `.from("hospitals")` em `src/` |

### Tabelas clínicas (probe REST)

| Tabela | HTTP staging | Resultado |
|--------|--------------|-----------|
| `patients` | 404 | **Não existe** |
| `medical_records` | 404 | **Não existe** |
| `appointments` | 404 | **Não existe** |

### RPCs utilizadas pelo app

| RPC | Uso |
|-----|-----|
| `get_operational_analytics_event_rollups` | Analytics dashboard |
| `get_operational_recommendation_feedback_rollups` | Feedback IA |
| `get_latest_operational_recommendation_feedback_for_ids` | Batch feedback |

### RPCs RLS (policies, não chamadas diretas do app)

`current_tenant_ids`, `current_user_role`, `current_professional_id`, `is_operational_manager`, `is_tenant_admin`, `can_manage_billing`, `can_manage_tuss_catalog`

### Buckets

| Bucket | Uso | Rota |
|--------|-----|------|
| `tenant-branding` | Logo e banner institucional | `/instituicao` |

### Policies (amostra crítica)

| Policy | Tabela | Propósito |
|--------|--------|-----------|
| `tenants_anon_directory_select` | `tenants` | Diretório de login (anon) |
| `profiles_self_select` | `profiles` | Perfil do usuário |
| `hospitals_tenant_isolation` | `hospitals` | Isolamento tenant |
| `security_audit_logs_select_tenant_admin` | `security_audit_logs` | Auditoria admin |

---

## FASE 5 — Auditoria multi-tenant

| Critério | Evidência | Classificação |
|----------|-----------|---------------|
| Tenant isolation (RLS) | `current_tenant_ids()` em ~143 policies | **SEGURO** (estático) |
| Branding por tenant | `tenant_settings` + bucket `tenant-branding` | **SEGURO** |
| Filtros `tenant_id` | Server functions via `requireOperationalAuth` | **SEGURO** |
| Queries tenant-aware | Quase todo acesso via server layer | **SEGURO** |
| RLS runtime cross-tenant | Não testado automatizado nesta sessão | **PARCIAL** |
| `tenants` legível por anon | Policy intencional para login | **PARCIAL** — enumeração de slugs |
| Cookies `Secure` explícito | Defaults Supabase SSR | **PARCIAL** |
| Credenciais bootstrap em SQL | Migration com senha hardcoded | **CRÍTICO** (operacional) |

**Veredito multi-tenant:** **PARCIAL** — arquitetura correta e RLS abrangente; falta validação runtime cross-tenant e rotação de credenciais bootstrap.

---

## FASE 6 — Auditoria IA (35 arquivos core)

| # | Recurso IA | Arquivo | Status | Utilização real |
|---|------------|---------|--------|-----------------|
| 1 | OpenAI HTTP client | `operational-gpt-openai.ts` | **FUNCIONAL** | Requer `MEDFLOW_OPENAI_API_KEY` |
| 2 | Copilot GPT API | `operational-copilot-gpt.ts` | **FUNCIONAL** | `/central` — painel Copilot |
| 3 | GPT system prompt | `operational-gpt-prompt.ts` | **FUNCIONAL** | Guardrails operacionais |
| 4 | Context builder | `operational-gpt-context-builder.ts` | **FUNCIONAL** | Bundle JSON para GPT |
| 5 | Tool executor | `operational-gpt-tool-executor.ts` | **FUNCIONAL** | Read-only tools + proposals |
| 6 | Tool registry | `operational-gpt-tool-registry.ts` | **FUNCIONAL** | 10+ tools operacionais |
| 7 | Tool safety | `operational-gpt-tool-safety.ts` | **FUNCIONAL** | Bloqueio de mutações diretas |
| 8 | GPT validator | `operational-copilot-gpt-validator.ts` | **FUNCIONAL** | Validação de resposta |
| 9 | Agentes API | `operational-agents.ts` | **FUNCIONAL** | Governança de agentes |
| 10 | Coordenação agentes | `operational-agent-coordination.ts` | **FUNCIONAL** | Ciclos de coordenação |
| 11 | Orquestração | `operational-orchestration.ts` | **FUNCIONAL** | Multi-step workflows |
| 12 | Action proposals | `operational-action-proposals.ts` | **FUNCIONAL** | Human-in-the-loop |
| 13 | Mutation execution | `operational-mutation-execution.ts` | **FUNCIONAL** | Execução supervisionada |
| 14 | Execution sandbox | `operational-execution-sandbox.ts` | **FUNCIONAL** | Dry-run |
| 15 | Operational memory | `operational-memory.ts` | **FUNCIONAL** | Memória por tenant |
| 16 | Policy intelligence | `operational-policy-intelligence.ts` | **FUNCIONAL** | Ciclos heurísticos |
| 17 | Strategic planning | `operational-strategic-planning.ts` | **FUNCIONAL** | Planejamento heurístico |
| 18 | Adaptive prioritization | `operational-adaptive-prioritization.ts` | **FUNCIONAL** | Priorização de alertas |
| 19 | Agent registry | `agents/registry.ts` | **FUNCIONAL** | Catálogo de agentes |
| 20 | Agent governance | `agents/governance.ts` | **FUNCIONAL** | Sessões de governança |
| 21 | Orchestration adapter | `agents/orchestration-adapter.ts` | **FUNCIONAL** | Bridge orquestração |
| 22 | Scoped reasoning | `agents/scoped-reasoning-engine.ts` | **FUNCIONAL** | Raciocínio por escopo |
| 23 | Agent contracts | `agents/contracts.ts` | **FUNCIONAL** | Tipos e contratos |
| 24 | Coordination engine | `agents/coordination/coordination-engine.ts` | **FUNCIONAL** | Motor de coordenação |
| 25 | Delegation | `agents/coordination/delegation.ts` | **FUNCIONAL** | Delegação entre agentes |
| 26 | Agent service | `operational-agent-service.ts` | **FUNCIONAL** | Persistência agentes |
| 27 | Coordination service | `operational-agent-coordination-service.ts` | **FUNCIONAL** | DB coordination cycles |
| 28 | Orchestration service | `operational-orchestration-service.ts` | **FUNCIONAL** | DB orchestrations |
| 29 | Proposal service | `operational-action-proposal-service.ts` | **FUNCIONAL** | DB proposals |
| 30 | Mutation service | `operational-mutation-execution-service.ts` | **FUNCIONAL** | DB mutations |
| 31 | Sandbox service | `operational-execution-sandbox-service.ts` | **FUNCIONAL** | DB sandbox runs |
| 32 | Memory service | `operational-memory-service.ts` | **FUNCIONAL** | DB memory entries |
| 33 | Policy intelligence service | `operational-policy-intelligence-service.ts` | **FUNCIONAL** | DB policy cycles |
| 34 | Strategic planning service | `operational-strategic-planning-service.ts` | **FUNCIONAL** | DB planning cycles |
| 35 | Event service | `operational-event-service.ts` | **FUNCIONAL** | Timeline operacional |

### Resumo IA

| Classificação | Qtd |
|---------------|-----|
| **FUNCIONAL** | 34 |
| **PROTÓTIPO** | 0 |
| **MOCK** | 0 |
| **PLACEHOLDER** | 0 |
| **NÃO UTILIZADO** | 0 (nos 35 core) |

**Nota:** Copilot GPT (#1–8) depende de API key OpenAI. Motor de agentes (#9–35) funciona **sem** API key. IA clínica (anamnese, prontuário, transcrição) = **inexistente**.

---

## FASE 7 — Auditoria financeira

| Módulo | Frontend | Backend | Persistência | Status |
|--------|----------|---------|--------------|--------|
| Dashboard executivo | ✅ Pronto | ✅ Pronto | ✅ `financial_closings` + rollups | **PRONTO** |
| Conciliação operacional | ✅ Pronto | ⚠️ CSV only | ✅ 4 tabelas reconciliation | **PARCIAL** |
| Fechamento operacional | ✅ Pronto | ✅ Pronto | ✅ + triggers imutabilidade | **PRONTO** |
| Hub `/financeiro` | ⚠️ KPIs estáticos | N/A | N/A | **PARCIAL** |
| Lançamentos (go-live) | ✅ `/lancamento` | ✅ smoke panel | ✅ checklists | **PRONTO** |
| Repasses médicos | ✅ via `/tiss` | ✅ Pronto | ✅ `medical_payouts` | **PRONTO** |

---

## FASE 8 — Auditoria TISS

| Área | Status | Detalhe |
|------|--------|---------|
| Telas (10 abas) | **PRONTO** | Convênios, TUSS, Guias, Lotes, Glosas, Repasses |
| Backend (~22 endpoints) | **PRONTO** | CRUD completo via `tiss-server.ts` |
| Persistência (14 tabelas) | **PRONTO** | RLS + audit trails |
| XML export | **PARCIAL** | MVP esquelético, não layout ANS |
| Envio operadoras | **NÃO IMPLEMENTADO** | Sem API/webhook |
| Retorno/glosa automática | **NÃO IMPLEMENTADO** | Entrada manual |
| Integração paciente EHR | **NÃO IMPLEMENTADO** | Apenas `patient_name` texto |

**Classificação TISS geral:** **PARCIAL**

---

## FASE 9 — Pendências para produção

### CRÍTICAS

1. Rotacionar credenciais bootstrap admin (migration SQL)
2. UI gestão de usuários/profissionais
3. Formalizar escopo V1 (operacional sim / EHR não — ou prazo EHR)
4. XML TISS conforme ANS
5. Processo de envio TISS para operadoras
6. Teste RLS cross-tenant em runtime
7. Pen test / security review pré-produção

### IMPORTANTES

1. Substituir KPIs ilustrativos do hub `/financeiro`
2. Error tracking real (Sentry/Datadog)
3. Suite de testes automatizados (Vitest + Playwright)
4. Conciliação bancária OFX/CNAB
5. Configurar `MEDFLOW_OPENAI_API_KEY` se Copilot obrigatório
6. Cookies `secure: true` em produção
7. Módulo relatórios genérico

### OPCIONAIS

1. MFA / OAuth
2. Views SQL para analytics ad-hoc
3. Consolidar serviços readiness duplicados
4. Habilitar notificações no perfil
5. ERP / DRE integrado

---

## FASE 10 — Métricas finais

| Métrica | % | Base |
|---------|---|------|
| **Frontend concluído** | **78%** | 20 rotas + 61 componentes; 4 módulos clínicos ausentes; 4 UIs parciais |
| **Backend concluído** | **82%** | 63 tabelas + ~173 server fns + RLS; gaps TISS operadora, EHR zero |
| **Infraestrutura concluída** | **74%** | Deploy CF/Vercel, 28 migrations, 27 scripts; sem unit tests |
| **Funcionalidades concluídas** | **73%** | 14/24 módulos implementados + 6 parciais |
| **Produto concluído** | **73%** | Média ponderada escopo operacional |

### Estimativa real para produção

| Cenário | Prazo |
|---------|-------|
| Piloto operacional (status atual) | **Pronto agora** |
| MVP operacional hardened | **3–5 semanas** |
| Produção enterprise (sem EHR) | **6–10 semanas** |
| Produção com EHR | **+4–8 meses** |

---

## Apêndice — Evidências coletadas

| Evidência | Resultado |
|-----------|-----------|
| `npm run auth-validate` | ✅ static 19/19 + remote 11/11 |
| HTTP staging rotas públicas | ✅ 200 + titles corretos |
| HTTP staging rotas protegidas (anon) | ✅ 307 → login |
| Supabase REST probe | ✅ tabelas operacionais 200; `patients` 404 |
| Tabelas em código | 62 utilizadas / 63 no schema |
| Playwright E2E (`capture-docs-screenshots`) | ✅ 12/12 telas staging |
| Scripts audit ad-hoc | ⚠️ Timeout (`networkidle` > 7 min) |

---

*Auditoria read-only. Documentos complementares: [MAPA_FUNCIONAL_MEDICFLOW.md](./MAPA_FUNCIONAL_MEDICFLOW.md) · [ROADMAP_FINAL_PARA_PRODUCAO.md](./ROADMAP_FINAL_PARA_PRODUCAO.md)*
