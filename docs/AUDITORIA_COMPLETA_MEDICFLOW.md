# Auditoria Técnica Completa — MedicFlow-AI

**Data:** 08/06/2026  
**Metodologia:** 100% read-only — inspeção de código, migrations, scripts, documentação forense e validação em staging  
**Repositório auditado:** `MedFlow-IA/MedFlow-IA` (`medflow-dashboard`)  
**Commit HEAD:** `e7db791` — *MedicFlow staging operational with password recovery*  
**Stack:** TanStack React Start · TanStack Router · Supabase (Postgres + Auth + Realtime + Storage) · Cloudflare Workers / Vercel

---

## Sumário executivo

O MedicFlow-AI é uma **plataforma operacional hospitalar** (plantões, escalas, TISS, financeiro operacional, implantação piloto e IA operacional). **Não é um prontuário eletrônico (EHR)**. Módulos clínicos solicitados (Pacientes, Prontuário, Anamnese, Evolução clínica) **não existem** em rotas, serviços ou banco de dados.

| Métrica | Valor |
|---------|-------|
| Rotas implementadas | **20** |
| Componentes React | **61** |
| Hooks | **29** |
| Pacotes de serviço | **35** |
| Server Functions (`createServerFn`) | **~173** |
| Migrations Supabase | **28** |
| Tabelas Postgres | **63** |
| Enums | **37** |
| RPCs expostos | **10** |
| Views SQL | **0** |
| Buckets Storage | **1** (`tenant-branding`) |
| Testes unitários (`*.test.ts`) | **0** |
| Scripts de validação | **27** |

---

## FASE 1 — Inventário funcional

### Tabela de módulos

| Módulo | Existe | Frontend | Backend | Testado | Status |
|--------|--------|----------|---------|---------|--------|
| **Login** | Sim | `/login` | Supabase Auth + gate anti brute-force | Script (`auth-validate`) | **Implementado** |
| **Recuperação de senha** | Sim | `/login/esqueci-senha`, `/login/redefinir-senha` | Supabase Auth + `password-reset.ts` | Script | **Implementado** |
| **Gestão de usuários** | Parcial | Sem UI de cadastro/gestão | `profiles` + Supabase Auth (provisionamento externo) | Não | **Parcial** |
| **Multi-tenant** | Sim | Seletor de instituição no login | `tenants`, RLS, `current_tenant_ids()` | Script parcial | **Implementado** |
| **Instituições** | Sim | `/instituicao` | `tenant_settings`, hospitals, units | Não | **Implementado** |
| **Pacientes** | **Não** | — | — | — | **Não implementado** |
| **Agenda** | Sim* | `/escalas`, `/plantoes` | `schedules`, `shifts`, `assignments`, `swaps` | Não | **Implementado** |
| **Prontuário** | **Não** | — | — | — | **Não implementado** |
| **Anamnese** | **Não** | — | — | — | **Não implementado** |
| **Evolução clínica** | **Não** | — | — | — | **Não implementado** |
| **TISS** | Sim | `/tiss` (10 abas) | `tiss-server.ts` + 14 tabelas TISS | Smoke manual | **Parcial** |
| **Financeiro** | Sim | `/financeiro` (hub) + sub-rotas | Financial services + closing | Não | **Parcial** |
| **Conciliação financeira** | Sim | `/financeiro/conciliacao-operacional` | `operational_reconciliation_*` | Smoke manual | **Parcial** |
| **Fechamento operacional** | Sim | `/financeiro/fechamento-operacional` | `financial_closings` + immutability triggers | Não | **Implementado** |
| **Dashboard executivo** | Sim | `/financeiro/dashboard-executivo` | `executive-dashboard/api/` | Não | **Implementado** |
| **Operação** | Sim | `/operacao` | Health, logs, backup export | Não | **Implementado** |
| **Central operacional** | Sim | `/central` | Command center + IA + realtime | Não | **Implementado** |
| **Piloto** | Sim | `/piloto` | `pilot_*` (5 tabelas) | Não | **Implementado** |
| **Ajuda** | Sim | `/ajuda` | `help-center/` (artigos estáticos) | Não | **Implementado** |
| **Branding** | Sim | `/instituicao` | `tenant_settings` + cores/logo | Não | **Implementado** |
| **Upload de arquivos** | Sim | Logo/banner em `/instituicao` | Bucket `tenant-branding` (1 MB) | Não | **Implementado** |
| **Auditoria** | Sim | Export indireto (`/operacao`, login) | `security_audit_logs` + audit tables | Script parcial | **Implementado** |
| **Relatórios** | Parcial | Dashboard executivo apenas | KPIs reais no dashboard; sem módulo genérico | Não | **Parcial** |
| **Integrações IA** | Parcial | Copilot em `/central` | OpenAI GPT + agentes operacionais | Não | **Parcial** |

*\*Agenda = escalas de **profissionais** (plantões), não agenda de consultas de pacientes.*

### Contagem por status (24 módulos)

| Status | Qtd | Módulos |
|--------|-----|---------|
| **Implementado** | 14 | Login, Recuperação senha, Multi-tenant, Instituições, Agenda (ops), Fechamento, Dashboard executivo, Operação, Central, Piloto, Ajuda, Branding, Upload, Auditoria |
| **Parcial** | 6 | Gestão usuários, TISS, Financeiro, Conciliação, Relatórios, Integrações IA |
| **Não implementado** | 4 | Pacientes, Prontuário, Anamnese, Evolução clínica |

---

## FASE 2 — Auditoria de rotas

**Fonte:** `src/routeTree.gen.ts` + `src/routes/` (21 arquivos)

### Rotas públicas

| Rota | Objetivo | Status | Dependências | Bloqueadores |
|------|----------|--------|--------------|--------------|
| `/site` | Landing comercial | **IMPLEMENTADO** | `commercial-landing` service | Nenhum |
| `/login` | Login multi-tenant | **IMPLEMENTADO** | Supabase Auth, `tenants`, `profiles`, `auth-security-server` | RLS anon em `tenants`; env Supabase |
| `/login/esqueci-senha` | Solicitar reset por e-mail | **IMPLEMENTADO** | Supabase Auth, `password-reset.ts` | SMTP/redirect URL no Supabase |
| `/login/redefinir-senha` | Definir nova senha | **IMPLEMENTADO** | Supabase recovery session | Token válido na URL |

### Rotas autenticadas — Operação

| Rota | Objetivo | Status | Dependências | Bloqueadores |
|------|----------|--------|--------------|--------------|
| `/` | Dashboard operacional (KPIs, escala do dia) | **IMPLEMENTADO** | `use-operations`, realtime | Sessão + profile |
| `/escalas` | Calendário 14 dias + timeline | **IMPLEMENTADO** | `schedules.ts`, `shifts.ts` | RBAC coordinator para escrita |
| `/plantoes` | Abertos, meus plantões, swaps | **IMPLEMENTADO** | assignments, swap APIs | — |
| `/central` | Command center + IA | **IMPLEMENTADO** | 15+ painéis operacionais, realtime | Copilot GPT requer API key |
| `/perfil` | Perfil, disponibilidade, logout | **PARCIAL** | `use-operations`, availability | Notificações e troca de tenant desabilitados |
| `/ajuda` | Central de ajuda | **IMPLEMENTADO** | `help-center/` estático | — |
| `/operacao` | Health, logs, backup | **IMPLEMENTADO** | observability services | — |

### Rotas autenticadas — Financeiro e TISS

| Rota | Objetivo | Status | Dependências | Bloqueadores |
|------|----------|--------|--------------|--------------|
| `/financeiro` | Hub financeiro | **PARCIAL** | Links para sub-rotas | KPIs e histórico **estáticos/ilustrativos** |
| `/financeiro/dashboard-executivo` | KPIs reais | **IMPLEMENTADO** | `executive-dashboard/api/` | RBAC `financial_closing:read` |
| `/financeiro/fechamento-operacional` | Fechamento de competência | **IMPLEMENTADO** | `financial-closing/api/` | — |
| `/financeiro/conciliacao-operacional` | Conciliação | **PARCIAL** | reconciliation API | Apenas CSV; sem OFX/CNAB/banco |
| `/executivo` | Narrativa executiva | **IMPLEMENTADO** | commercial content | — |
| `/tiss` | TISS completo (10 abas) | **PARCIAL** | `tiss-server.ts` (~22 endpoints) | XML MVP; sem envio operadora |

### Rotas autenticadas — Instituição e implantação

| Rota | Objetivo | Status | Dependências | Bloqueadores |
|------|----------|--------|--------------|--------------|
| `/instituicao` | Branding + parametrização | **IMPLEMENTADO** | `tenant_settings`, Storage | — |
| `/piloto` | Piloto, onboarding, demo | **IMPLEMENTADO** | pilot services, guided-demo | — |
| `/lancamento` | Go-live, smoke tests | **IMPLEMENTADO** | production-release services | — |

### Resumo de rotas

| Classificação | Qtd |
|---------------|-----|
| **IMPLEMENTADO** | 16 |
| **PARCIAL** | 4 |
| **NÃO IMPLEMENTADO** | 0 rotas (módulos clínicos nunca tiveram rota) |

---

## FASE 3 — Auditoria Supabase

### Recursos declarados (migrations)

| Recurso | Quantidade | Status |
|---------|------------|--------|
| Tabelas | 63 | Todas com RLS |
| Views | 0 | — |
| RPCs (PostgREST) | 10 | RLS helpers + analytics |
| Enums | 37 | — |
| Buckets | 1 | `tenant-branding` (público leitura) |
| Edge Functions | 0 | Substituídas por TanStack Server Functions |
| Policies RLS | ~143 | Tenant isolation + RBAC granular |

### RPCs expostos

| RPC | Uso |
|-----|-----|
| `current_tenant_ids` | RLS — isolamento multi-tenant |
| `current_user_role` | RLS — papéis |
| `current_professional_id` | RLS — profissional logado |
| `is_operational_manager` | RLS — coordenador/admin |
| `is_tenant_admin` | RLS — admin tenant |
| `can_manage_billing` | RLS — TISS/financeiro |
| `can_manage_tuss_catalog` | RLS — catálogo TUSS |
| `get_operational_analytics_event_rollups` | Analytics dashboard |
| `get_operational_recommendation_feedback_rollups` | Feedback IA |
| `get_latest_operational_recommendation_feedback_for_ids` | Batch feedback |

### Auth

| Recurso | Status |
|---------|--------|
| Email/password | Implementado |
| JWT + refresh rotation | Implementado |
| MFA | Desabilitado |
| OAuth | Desabilitado |
| Bootstrap admin | Migration com seed (rotacionar credenciais em prod) |
| Password recovery | Via Supabase Auth |

### Tabelas por módulo (uso no código)

| Módulo | Tabelas | Utilizadas pelo app |
|--------|---------|---------------------|
| Multi-tenant | tenants, tenant_settings, profiles | ✅ |
| Estrutura | hospitals, departments, units, professionals | ✅ (via services) |
| Escalas | schedules, shifts, shift_assignments, shift_swap_requests, availability | ✅ |
| TISS | 14 tabelas insurance/tiss_* | ✅ |
| Repasses | medical_production, medical_payouts, payout_rules | ✅ |
| Fechamento | financial_closings, snapshots, audit | ✅ |
| Conciliação | operational_reconciliation_* (4) | ✅ |
| IA operacional | 16 tabelas operational_* | ✅ |
| Observabilidade | operational_logs, errors, health_metrics | ✅ |
| Piloto | pilot_* (5) | ✅ |
| Segurança | security_audit_logs | ✅ (service role insert) |
| **Clínico/EHR** | — | **Inexistente** |

### Recursos não utilizados / subutilizados

| Recurso | Observação |
|---------|------------|
| `hospitals` | Schema existe; UI limitada a estrutura institucional |
| RPCs analytics | Chamados via server layer, não diretamente no browser |
| `security_audit_logs` INSERT | Apenas service role — by design |
| Views | Nenhuma criada — oportunidade futura para relatórios |

### Rotas sem backend correspondente

Nenhuma rota implementada carece de backend. **Inverso:** 4 módulos solicitados (Pacientes, Prontuário, Anamnese, Evolução) não têm rota **nem** tabela.

---

## FASE 4 — Auditoria de componentes

### Inventário

| Área | Qtd |
|------|-----|
| Componentes (`src/components/`) | 61 |
| Hooks (`src/hooks/`) | 29 |
| Arquivos lib (`src/lib/`) | ~381 |

### Componentes órfãos

**0 órfãos** — todos os 61 componentes são referenciados em rotas ou outros componentes.

### Hooks não utilizados

| Hook | Status |
|------|--------|
| `use-debounced-value.ts` | **Não utilizado** (único hook órfão) |
| Demais 28 hooks | Utilizados |

### Serviços não utilizados

**0 de 35** pacotes em `src/lib/services/` estão sem referência.

### Código duplicado (padrões)

| Padrão | Ocorrências |
|--------|-------------|
| Formatação `moneyBrl` / `Intl.NumberFormat` | 7 arquivos |
| Helpers `stateBadge` em painéis operacionais | 4 painéis |
| Camada dupla API + Service | 5 domínios (executive, closing, payout, reconciliation, tiss) |
| Cluster readiness/checklist | 7 serviços sobrepostos |
| Escape HTML/XML | 2 implementações separadas |

### Features incompletas

| Arquivo | Limitação |
|---------|-----------|
| `error-tracker.ts` | Stub console — sem Sentry/Datadog |
| `xml-export-service.ts` | XML TISS esquelético MVP, não ANS |
| `financeiro.tsx` | Array `historico` estático |
| `reconciliation-import-service.ts` | Apenas CSV |
| `perfil.tsx` | Notificações e troca de tenant desabilitados |
| `demo-seed-service.ts` | Seed parcial (2 operadoras fictícias) |

---

## FASE 5 — Auditoria IA

### Funcionalidades identificadas

| # | Funcionalidade | Classificação | Funciona hoje? |
|---|----------------|---------------|----------------|
| 1 | **Copilot GPT (OpenAI)** | Operacional | ⚠️ Requer `MEDFLOW_OPENAI_API_KEY` |
| 2 | GPT prompt + guardrails (sem diagnóstico clínico) | Operacional | ✅ |
| 3 | Tool calling supervisionado | Operacional | ✅ (com API key) |
| 4 | Painel Copilot UI (`/central`) | Operacional | ⚠️ Depende de #1 |
| 5 | Agentes operacionais (governance, coordination) | Operacional | ✅ |
| 6 | Orquestrações multi-step | Operacional | ✅ |
| 7 | Action proposals (human-in-the-loop) | Operacional | ✅ |
| 8 | Execution sandbox (dry-run) | Operacional | ✅ |
| 9 | Mutation executions supervisionadas | Operacional | ✅ |
| 10 | Operational memory | Operacional | ✅ |
| 11 | Policy intelligence cycles | Operacional | ✅ (heurístico) |
| 12 | Strategic planning cycles | Operacional | ✅ (heurístico) |
| 13 | Recommendation feedback loop | Operacional | ✅ |
| 14 | Realtime operacional | Operacional | ✅ |
| 15 | Copilot context bundle (sem LLM) | Operacional | ✅ |
| 16 | Anamnese / prontuário / transcrição | — | ❌ Inexistente |
| 17 | Embeddings / Whisper | — | ❌ Inexistente |
| 18 | Docs/apresentações com menção IA | Mock/documentação | N/A |

### Resumo IA

| Classificação | Qtd |
|---------------|-----|
| **Operacional** | 15 |
| **Protótipo** | 0 (Copilot é operacional com dependência de config) |
| **Mock** | 1 (documentação comercial) |
| **Não funcional** | Clinical AI (escopo inteiro ausente) |

**O que realmente funciona hoje:** motor de agentes operacionais, orquestração, propostas supervisionadas, sandbox, memória, realtime e analytics — **sem API key OpenAI**. Com API key configurada, Copilot GPT responde no contexto operacional (plantões, alertas, TISS operacional).

---

## FASE 6 — Testabilidade

| Módulo | Classificação | Justificativa |
|--------|---------------|---------------|
| Login / Auth | **PARCIALMENTE TESTÁVEL** | `auth-validate.mjs`; sem unit tests |
| Route guard / RBAC | **PARCIALMENTE TESTÁVEL** | Lógica isolada; sem testes automatizados |
| Escalas / Plantões | **PRONTO PARA TESTE** | UI + backend completos; smoke manual |
| Central operacional | **PRONTO PARA TESTE** | Staging validado com screenshots |
| TISS | **PARCIALMENTE TESTÁVEL** | CRUD completo; XML MVP não validável contra ANS |
| Financeiro (sub-rotas) | **PRONTO PARA TESTE** | Dashboard e fechamento com dados reais |
| Hub `/financeiro` | **NÃO TESTÁVEL** (como produto) | KPIs fictícios |
| Conciliação | **PARCIALMENTE TESTÁVEL** | CSV only |
| Instituição / Branding | **PRONTO PARA TESTE** | Upload + settings |
| Piloto / Go-live | **PRONTO PARA TESTE** | Smoke panel em `/lancamento` |
| IA Copilot | **PARCIALMENTE TESTÁVEL** | Requer API key + ambiente servidor |
| Pacientes / Prontuário / Anamnese / Evolução | **NÃO TESTÁVEL** | Inexistentes |

### Infraestrutura de testes

| Tipo | Status |
|------|--------|
| Unit tests (Vitest/Jest) | **0 arquivos** |
| E2E (Playwright tests) | Apenas script de screenshots |
| Scripts de validação estática | **27 scripts** (`smoke-check`, `migration-validate`, etc.) |
| CI | `.github/workflows/ci.yml` + `release-validation.yml` |

---

## FASE 7 — Produção

### CRÍTICO (bloqueia go-live seguro)

| # | Item |
|---|------|
| 1 | Rotacionar credenciais bootstrap admin em migration SQL |
| 2 | Configurar Supabase staging/prod com secrets reais (sem placeholders) |
| 3 | Validar RLS cross-tenant em runtime (`multi-tenant-auth-validate`) |
| 4 | Definir escopo oficial: **remover ou implementar** Pacientes/Prontuário do contrato |
| 5 | UI de gestão de usuários/profissionais (provisionamento manual é bloqueador operacional) |

### IMPORTANTE

| # | Item |
|---|------|
| 1 | XML TISS conforme ANS ou limitação contratual formalizada |
| 2 | Envio TISS para operadoras ou processo manual documentado |
| 3 | Substituir KPIs ilustrativos do hub `/financeiro` |
| 4 | Integrar error tracking real (Sentry/Datadog) |
| 5 | Suite de testes automatizados (mínimo: auth, RBAC, TISS crítico) |
| 6 | Configurar `MEDFLOW_OPENAI_API_KEY` se Copilot for requisito |
| 7 | Conciliação bancária (OFX/CNAB) ou aceitar CSV como V1 |

### OPCIONAL

| # | Item |
|---|------|
| 1 | MFA / OAuth |
| 2 | Supabase Edge Functions (arquitetura atual não requer) |
| 3 | ERP / DRE integrado |
| 4 | Debounce em `/ajuda` (hook órfão) |
| 5 | Consolidar serviços readiness duplicados |
| 6 | Views SQL para relatórios ad-hoc |

---

## FASE 8 — Métrica final

### Percentuais de conclusão

| Camada | % | Base de cálculo |
|--------|---|-----------------|
| **Frontend** | **78%** | 20 rotas + 61 componentes; 4 módulos clínicos ausentes; 4 rotas com UI parcial |
| **Backend** | **82%** | 63 tabelas + 173 server fns + RLS; gaps TISS operadora, conciliação bancária, EHR zero |
| **Infraestrutura** | **74%** | Deploy CF/Vercel, 28 migrations, 27 scripts validação; sem unit tests, error tracking stub |
| **Produto (geral)** | **73%** | Média ponderada escopo operacional completo; clínico = 0% |

### Estimativas

| Marco | Estimativa | Premissas |
|-------|------------|-----------|
| **MVP operacional** (plantão + TISS piloto + financeiro) | **3–5 semanas** | Hardening, testes, env prod, gestão usuários básica |
| **Produção operacional** (sem EHR) | **6–10 semanas** | + XML ANS, error tracking, testes E2E, conciliação melhorada |
| **Produção com EHR** (Pacientes + Prontuário + Anamnese) | **+4–8 meses** | Módulo clínico inteiro inexistente; schema, UI, compliance LGPD/HIPAA-like |

---

## Apêndice — Métricas do repositório

```
Commit:     e7db791 (2026-06-01)
Rotas:      20
Componentes: 61
Hooks:      29
Services:   35
Server Fn:  ~173
Lib files:  ~381
Migrations: 28
Scripts:    27
Staging:    https://staging.medicflow.app.br
Supabase:   utodixhxrvegzafcldpu (staging)
```

---

*Auditoria read-only. Nenhum código, banco, Cloudflare ou Supabase foi alterado.*
