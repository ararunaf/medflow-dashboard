# Auditoria Funcional — MedicFlow-AI

**Data da auditoria:** 08/06/2026  
**Versão auditada:** código-fonte em `MedFlow-IA/` (TanStack React Start + Supabase)  
**Ambiente de validação visual:** `https://staging.medicflow.app.br`  
**Metodologia:** inspeção de rotas, componentes, serviços, migrations SQL e captura de telas. Nenhum recurso foi inferido fora do código.

---

## 1. Resumo executivo

| Métrica | Valor |
|---------|-------|
| Rotas implementadas | 20 |
| Telas principais | 17 autenticadas + 3 públicas |
| Itens de menu (sidebar) | 14 (filtrados por perfil) |
| Perfis de usuário (RBAC) | 5 |
| Supabase Edge Functions | 0 |
| Server Functions (TanStack Start) | ~100+ endpoints |
| Módulos clínicos (Pacientes / Prontuário) | **Não implementados** |

---

## 2. Arquitetura e stack

| Recurso | Localização | Status |
|---------|-------------|--------|
| Frontend SPA/SSR | `src/routes/`, `src/components/` | **Implementado** |
| Roteamento file-based | `src/routeTree.gen.ts` | **Implementado** |
| Autenticação multi-tenant | `src/lib/auth/`, Supabase Auth | **Implementado** |
| Backend server-side | `src/lib/**/api/*-server.ts`, `createServerFn` | **Implementado** |
| Banco de dados Postgres + RLS | `supabase/migrations/` (30 arquivos) | **Implementado** |
| Realtime operacional | `src/lib/realtime/manager.ts` | **Implementado** |
| Deploy Cloudflare Workers | `wrangler.jsonc`, `src/server.ts` | **Implementado** |
| Deploy Vercel (alternativo) | `vercel.json`, `scripts/build-vercel.mjs` | **Implementado** |

---

## 3. Rotas completas

### 3.1 Rotas públicas

| Rota | Arquivo | Componente | Status |
|------|---------|------------|--------|
| `/site` | `src/routes/site.tsx` | Landing comercial | **Implementado** |
| `/login` | `src/routes/login.tsx` | Login multi-tenant | **Implementado** |
| `/login/esqueci-senha` | `src/routes/login.esqueci-senha.tsx` | Recuperação de senha | **Implementado** |
| `/login/redefinir-senha` | `src/routes/login.redefinir-senha.tsx` | Redefinição de senha | **Implementado** |

### 3.2 Rotas autenticadas — Operação

| Rota | Arquivo | Descrição | Status |
|------|---------|-----------|--------|
| `/` | `src/routes/index.tsx` | Dashboard operacional (KPIs, escala do dia) | **Implementado** |
| `/escalas` | `src/routes/escalas.tsx` | Calendário 14 dias + timeline de turnos | **Implementado** |
| `/plantoes` | `src/routes/plantoes.tsx` | Abertos, meus plantões, swaps | **Implementado** |
| `/central` | `src/routes/central.tsx` | Central operacional (command center) | **Implementado** |
| `/perfil` | `src/routes/perfil.tsx` | Perfil, disponibilidade, logout | **Implementado** |
| `/ajuda` | `src/routes/ajuda.tsx` | Central de ajuda (artigos estáticos) | **Implementado** |

### 3.3 Rotas autenticadas — Financeiro e TISS

| Rota | Arquivo | Descrição | Status |
|------|---------|-----------|--------|
| `/financeiro` | `src/routes/financeiro.tsx` | Hub financeiro (KPIs ilustrativos + links) | **Parcial** — KPIs da landing são dados estáticos; dados reais estão nas sub-rotas |
| `/financeiro/dashboard-executivo` | `src/routes/financeiro.dashboard-executivo.tsx` | Dashboard executivo com KPIs reais | **Implementado** |
| `/financeiro/fechamento-operacional` | `src/routes/financeiro.fechamento-operacional.tsx` | Fechamento de competência | **Implementado** |
| `/financeiro/conciliacao-operacional` | `src/routes/financeiro.conciliacao-operacional.tsx` | Conciliação operacional | **Parcial** — importação CSV manual; sem OFX/CNAB/banco |
| `/executivo` | `src/routes/executivo.tsx` | Início executivo / narrativa comercial | **Implementado** |
| `/tiss` | `src/routes/tiss.tsx` | TISS: convênios, guias, lotes, glosas, repasses | **Parcial** — XML MVP; sem envio a operadoras |

### 3.4 Rotas autenticadas — Instituição e implantação

| Rota | Arquivo | Descrição | Status |
|------|---------|-----------|--------|
| `/instituicao` | `src/routes/instituicao.tsx` | Branding, parametrização, readiness | **Implementado** |
| `/piloto` | `src/routes/piloto.tsx` | Piloto, onboarding, demo guiada | **Implementado** |
| `/lancamento` | `src/routes/lancamento.tsx` | Go-live, smoke tests, checklist | **Implementado** |
| `/operacao` | `src/routes/operacao.tsx` | Painel operacional (health, logs, backup) | **Implementado** |

### 3.5 Módulos solicitados e ausentes

| Módulo solicitado | Rota esperada | Status | Evidência |
|-------------------|---------------|--------|-----------|
| **Pacientes** | — | **Não implementado** | Nenhuma rota, tabela ou serviço com "paciente" em `src/` |
| **Prontuário** | — | **Não implementado** | Nenhuma rota, tabela ou serviço clínico/EHR |
| **Agenda de pacientes** | — | **Não implementado** | Existe apenas **Escalas** de profissionais (`/escalas`) |
| **Cadastro self-service** | — | **Não implementado** | Login apenas; usuários provisionados externamente |

---

## 4. Menu de navegação (sidebar)

Configurado em `src/components/app-shell.tsx` — função `navForRole()`.

| Label | Rota | Visibilidade | Status |
|-------|------|--------------|--------|
| Home | `/` | Todos autenticados | **Implementado** |
| Piloto | `/piloto` | `tenant_settings:read` | **Implementado** |
| Go-live | `/lancamento` | `tenant_settings:read` | **Implementado** |
| Ajuda | `/ajuda` | Todos autenticados | **Implementado** |
| Executivo | `/executivo` | `financial_closing:read` | **Implementado** |
| Escalas | `/escalas` | Todos autenticados | **Implementado** |
| Plantões | `/plantoes` | Todos autenticados | **Implementado** |
| Financeiro | `/financeiro` | `financial_closing:read` | **Implementado** |
| Dashboard fin. | `/financeiro/dashboard-executivo` | `financial_closing:read` | **Implementado** |
| Fechamento | `/financeiro/fechamento-operacional` | `financial_closing:read` | **Implementado** |
| TISS | `/tiss` | Todos autenticados | **Implementado** |
| Instituição | `/instituicao` | Todos autenticados | **Implementado** |
| Painel ops | `/operacao` | `tenant_settings:read` | **Implementado** |
| Perfil | `/perfil` | Todos autenticados | **Implementado** |

**Fora do sidebar (acessíveis por URL ou links contextuais):**

| Rota | Acesso | Status |
|------|--------|--------|
| `/central` | Links da Home, alertas, demo guiada | **Implementado** |
| `/financeiro/conciliacao-operacional` | Hub financeiro, Executivo | **Implementado** |

---

## 5. Perfis de usuário (RBAC)

Definidos em `src/lib/auth/rbac.ts` e `src/lib/database.types.ts` (`UserRole`).

| Perfil | Capacidades principais | Status |
|--------|------------------------|--------|
| `super_admin` | Acesso total + reabertura de competência + seed demo | **Implementado** |
| `tenant_admin` | Parametrização, branding, fechamento, seed demo | **Implementado** |
| `coordinator` | Gestão completa de escalas, TISS escrita, fechamento | **Implementado** |
| `professional` | Próprios plantões, swaps, disponibilidade, TISS leitura | **Implementado** |
| `financial` | Repasses, fechamento, TISS; sem gestão global de escala | **Implementado** |

**Cadastro de usuários:** não há tela de cadastro. Provisionamento via Supabase Auth + tabela `profiles` (SQL ou painel Supabase). Bootstrap em `supabase/migrations/20250517171500_bootstrap_system_admin.sql`.

---

## 6. Server Functions (substituto de Edge Functions)

**Supabase Edge Functions:** diretório `supabase/functions/` **não existe**.

Backend implementado via **TanStack Start `createServerFn`** em `src/lib/`.

### 6.1 Domínios e localização

| Domínio | Localização | Qtd. aprox. | Status |
|---------|-------------|-------------|--------|
| Autenticação / segurança | `src/lib/security/*-server.ts` | 3 | **Implementado** |
| Escalas e plantões | `src/lib/operations/api/` | ~25 | **Implementado** |
| Central operacional / IA | `src/lib/operations/api/operational-*.ts` | ~30 | **Implementado** |
| TISS | `src/lib/services/tiss/api/tiss-server.ts` | ~22 | **Parcial** (sem operadora) |
| Fechamento financeiro | `src/lib/services/financial-closing/api/` | ~7 | **Implementado** |
| Repasses médicos | `src/lib/services/medical-payout/api/` | ~9 | **Implementado** |
| Conciliação | `src/lib/services/operational-reconciliation/api/` | ~10 | **Parcial** |
| Dashboard executivo | `src/lib/executive-dashboard/api/` | ~5 | **Implementado** |
| Piloto / go-live | `src/lib/services/pilot-*/`, `production-release/` | ~15 | **Implementado** |
| Comercial / branding | `src/lib/services/commercial/` | ~5 | **Implementado** |

### 6.2 Copilot GPT (opcional)

| Recurso | Localização | Status |
|---------|-------------|--------|
| OpenAI Chat Completions | `src/lib/server/operational-gpt-openai.ts` | **Parcial** — requer `MEDFLOW_OPENAI_API_KEY`; sem chave retorna erro |

---

## 7. Integrações externas

| Integração | Localização | Status |
|------------|-------------|--------|
| Supabase Auth | `src/routes/login.tsx` | **Implementado** |
| Supabase Postgres (PostgREST) | Serviços em `src/lib/services/` | **Implementado** |
| Supabase Realtime | `src/lib/realtime/manager.ts` | **Implementado** |
| Supabase Storage (branding) | `src/routes/instituicao.tsx` | **Implementado** |
| OpenAI (copilot operacional) | `operational-gpt-openai.ts` | **Parcial** |
| Google Fonts | `src/routes/__root.tsx` | **Implementado** |
| Error tracking (Sentry/Datadog) | `src/lib/monitoring/sinks/error-tracker.ts` | **Não implementado** (stub console) |
| TISS XML export | `src/lib/services/tiss/xml-export-service.ts` | **Parcial** — XML esquelético MVP, não layout ANS |
| Envio TISS para operadoras | — | **Não implementado** |
| Webhooks operadoras | — | **Não implementado** |
| ERP / DRE / Banking (OFX, CNAB) | — | **Não implementado** |
| E-mail direto (reset) | Via Supabase Auth | **Implementado** (delegado) |

---

## 8. Módulos funcionais detalhados

### 8.1 Autenticação e sessão

| Recurso | Localização | Status |
|---------|-------------|--------|
| Login multi-tenant (instituição + e-mail + senha) | `src/routes/login.tsx` | **Implementado** |
| Gate anti brute-force | `src/lib/security/auth-security-server.ts` | **Implementado** |
| Esqueci senha | `src/routes/login.esqueci-senha.tsx` | **Implementado** |
| Redefinir senha | `src/routes/login.redefinir-senha.tsx` | **Implementado** |
| Guard de rotas | `src/lib/auth/route-guard.ts`, `__root.tsx` | **Implementado** |
| Auditoria de login | `src/lib/server/security-audit-writer.ts` | **Implementado** |
| Auto-cadastro de usuários | — | **Não implementado** |

### 8.2 Escalas e plantões

| Recurso | Localização | Status |
|---------|-------------|--------|
| Calendário 14 dias | `src/routes/escalas.tsx` | **Implementado** |
| Filtros: conflitos, abertos, sem confirmação | URL `?opsFocus=` | **Implementado** |
| Plantões abertos (aceitar/recusar) | `src/routes/plantoes.tsx` | **Implementado** |
| Meus plantões | `src/routes/plantoes.tsx?tab=meus` | **Implementado** |
| Swaps (solicitar/aprovar/negar) | `src/routes/plantoes.tsx?tab=swaps` | **Implementado** |
| Disponibilidade do profissional | `src/routes/perfil.tsx` | **Implementado** |
| Criação/edição de escalas (coordenador) | `src/lib/operations/api/schedules.ts`, `shifts.ts` | **Implementado** |

### 8.3 Central operacional

| Recurso | Localização | Status |
|---------|-------------|--------|
| KPIs e alertas em tempo real | `src/routes/central.tsx`, `CommandCenterView` | **Implementado** |
| Ações contextuais por alerta | `src/lib/operations/actions/alert-action-map.ts` | **Implementado** |
| Copilot GPT | Painel na central | **Parcial** (depende de API key) |
| Agentes e orquestração | `src/lib/operations/api/operational-*.ts` | **Implementado** |
| Realtime subscriptions | `src/hooks/use-operational-realtime.ts` | **Implementado** |

### 8.4 TISS / Faturamento

| Recurso | Localização | Status |
|---------|-------------|--------|
| Convênios (operadoras) | `/tiss` aba Convênios | **Implementado** |
| Contratos e regras | `/tiss` | **Implementado** |
| Catálogo TUSS | `/tiss` aba TUSS | **Implementado** |
| Guias TISS | `/tiss` aba Guias | **Implementado** |
| Lotes e exportação XML | `/tiss` aba Lotes | **Parcial** — XML MVP |
| Retornos e glosas | `/tiss` aba Glosas | **Implementado** (entrada manual) |
| Recursos de glosa | `/tiss` aba Recursos | **Parcial** — sem integração operadora |
| Produção médica | `/tiss` aba Produção | **Implementado** |
| Repasses | `/tiss` aba Repasses | **Implementado** |
| Envio automático para operadoras | — | **Não implementado** |

### 8.5 Financeiro

| Recurso | Localização | Status |
|---------|-------------|--------|
| Hub financeiro | `/financeiro` | **Parcial** — landing com KPIs ilustrativos |
| Dashboard executivo | `/financeiro/dashboard-executivo` | **Implementado** |
| Fechamento operacional | `/financeiro/fechamento-operacional` | **Implementado** |
| Conciliação operacional | `/financeiro/conciliacao-operacional` | **Parcial** — CSV manual |
| Reabertura de competência | RBAC `financial_closing:reopen` | **Implementado** (admin) |

### 8.6 Instituição e implantação

| Recurso | Localização | Status |
|---------|-------------|--------|
| Branding (logo, banner, cores) | `/instituicao` | **Implementado** |
| Parametrização (timezone, moeda, contato) | `/instituicao` | **Implementado** |
| Seed de catálogo demo | `/instituicao` (admin) | **Parcial** — 2 operadoras fictícias |
| Checklist de implantação | `/piloto` | **Implementado** |
| Demo guiada (7 passos) | `src/lib/services/guided-demo/` | **Implementado** |
| Go-live e smoke tests | `/lancamento` | **Implementado** |
| Painel operacional (health) | `/operacao` | **Implementado** |
| Export de diagnóstico | `/operacao`, `/piloto` | **Implementado** |

### 8.7 Ajuda e onboarding

| Recurso | Localização | Status |
|---------|-------------|--------|
| Central de ajuda | `/ajuda` | **Implementado** |
| Artigos estáticos (guias, FAQ, docs) | `src/lib/services/help-center/` | **Implementado** |
| Preferências de onboarding | `src/lib/services/onboarding/` | **Parcial** — apenas `localStorage` |

---

## 9. Fluxos de navegação identificados

### 9.1 Autenticação
```
/site → /login → / (sucesso)
/login → /login/esqueci-senha → e-mail → /login/redefinir-senha
/perfil → Sair → /login
```

### 9.2 Operação diária
```
/ (Home) → /escalas → /plantoes
         → /central (alertas) → /plantoes | /escalas | /perfil
```

### 9.3 Financeiro
```
/executivo → /financeiro/dashboard-executivo
           → /financeiro/conciliacao-operacional
/financeiro → /financeiro/fechamento-operacional
            → /financeiro/conciliacao-operacional
            → /financeiro/dashboard-executivo
```

### 9.4 Implantação piloto
```
/piloto → /instituicao → /lancamento → /operacao → /ajuda
```

### 9.5 Demo guiada (7 passos)
```
/piloto → / → /central → /executivo → /tiss → /instituicao → /operacao
```

### 9.6 Alertas → ações (Central)
| Alerta | Destino |
|--------|---------|
| Cobertura baixa | `/plantoes?tab=disponiveis` |
| Swaps pendentes | `/plantoes?tab=swaps` |
| Assignments pendentes | `/escalas?opsFocus=sem-confirmacao` |
| Conflitos | `/escalas?opsFocus=conflicts` |
| Risco de disponibilidade | `/central?opsFocus=availability` |

**Total de fluxos documentados:** 6 fluxos principais + 6 fluxos de alerta = **12 fluxos**

---

## 10. Tabelas de banco (módulos)

| Módulo | Tabelas principais | Status |
|--------|-------------------|--------|
| Multi-tenant | `tenants`, `tenant_settings`, `profiles` | **Implementado** |
| Escalas | `schedules`, `shifts`, `shift_assignments`, `shift_swap_requests`, `availability` | **Implementado** |
| TISS | `insurance_providers`, `tiss_guides`, `tiss_batches`, `tiss_denials`, etc. | **Implementado** |
| Repasses | `medical_production`, `medical_payouts`, `payout_rules` | **Implementado** |
| Fechamento | `financial_closings`, `financial_closing_snapshots` | **Implementado** |
| Conciliação | `operational_reconciliations`, `operational_reconciliation_items` | **Implementado** |
| IA operacional | `operational_events`, `operational_orchestrations`, `operational_agent_*` | **Implementado** |
| Pacientes / Prontuário | — | **Não implementado** |

---

## 11. GAPs críticos

| # | GAP | Impacto | Status |
|---|-----|---------|--------|
| 1 | Módulo **Pacientes** inexistente | Impossibilita treinamento clínico de prontuário | **Não implementado** |
| 2 | Módulo **Prontuário** inexistente | Escopo solicitado não coberto | **Não implementado** |
| 3 | **Cadastro self-service** de usuários | Dependência de provisionamento manual | **Não implementado** |
| 4 | **Envio TISS** para operadoras | Faturamento manual pós-export XML | **Não implementado** |
| 5 | XML TISS **não conforme ANS** | Export auditável mas não aceito por operadoras | **Parcial** |
| 6 | Conciliação **sem integração bancária** | Importação CSV apenas | **Parcial** |
| 7 | Hub `/financeiro` com **KPIs ilustrativos** | Pode confundir usuários | **Parcial** |
| 8 | **Error tracking** externo | Observabilidade limitada a console | **Não implementado** |
| 9 | Gestão de **profissionais via UI** | Cadastro via banco/admin externo | **Parcial** |

---

## 12. Screenshots capturados

Salvos em `docs/screenshots/` — ver `DOCUMENTACAO_FINAL_STATUS.md` para inventário completo.

| Tela solicitada | Arquivo | Observação |
|-----------------|---------|------------|
| Login | `01-login.png` | ✓ |
| Dashboard | `02-dashboard.png` | ✓ |
| Agenda | `03-agenda-escalas.png` | Mapeado para **Escalas** (`/escalas`) |
| Pacientes | — | **Não existe no sistema** |
| Prontuário | — | **Não existe no sistema** |
| Financeiro | `05-financeiro.png` | ✓ |
| Relatórios | `06-relatorios-dashboard-executivo.png` | Mapeado para **Dashboard Executivo** |
| Configurações | `07-configuracoes-instituicao.png` | Mapeado para **Instituição** |
| Administração | `08-administracao-piloto.png` | Mapeado para **Piloto** |

---

*Documento gerado por auditoria automatizada do código-fonte. Última revisão: 08/06/2026.*
