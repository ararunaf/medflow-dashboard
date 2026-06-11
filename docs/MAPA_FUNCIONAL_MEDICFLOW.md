# Mapa Funcional — MedicFlow-AI

**Data:** 08/06/2026  
**Versão:** commit `e7db791`  
**Ambiente validado:** `https://staging.medicflow.app.br`  
**Referência:** [AUDITORIA_FUNCIONAL_COMPLETA.md](./AUDITORIA_FUNCIONAL_COMPLETA.md)

---

## 1. Visão geral do produto

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MedicFlow-AI (V1 Operacional)                   │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│  Autenticação │   Operação   │  Financeiro  │    TISS      │ Implantação │
│  Multi-tenant │ Escalas/Plant│ Fechamento   │ Faturamento  │ Piloto/Go-  │
│  RBAC (5)     │ Central + IA │ Conciliação  │ Repasses     │ live        │
├──────────────┴──────────────┴──────────────┴──────────────┴─────────────┤
│  ❌ Módulo Clínico (EHR): Pacientes · Prontuário · Anamnese · Evolução  │
└─────────────────────────────────────────────────────────────────────────┘
```

| Camada | Tecnologia | Status |
|--------|------------|--------|
| Frontend | TanStack React Start + Router + Query | 78% |
| Backend | TanStack Server Functions (~173) | 82% |
| Banco | Supabase Postgres (63 tabelas, RLS) | 95% schema |
| Auth | Supabase Auth + route guard | 90% |
| Deploy | Cloudflare Workers + Vercel alt. | 85% |
| IA | Agentes operacionais + Copilot GPT opcional | 75% |

---

## 2. Mapa de rotas (20 rotas)

### Legenda de status

| Símbolo | Significado |
|---------|-------------|
| 🟢 | FUNCIONA |
| 🟡 | FUNCIONA PARCIALMENTE |
| 🔴 | NÃO FUNCIONA / NÃO IMPLEMENTADO |
| ⚪ | NÃO TESTADO |

### Mapa visual

```
PÚBLICO                          AUTENTICADO
────────                         ───────────
/site 🟢                         / 🟢 Dashboard
/login 🟢                        /escalas 🟢
/login/esqueci-senha 🟢          /plantoes 🟢
/login/redefinir-senha 🟢        /central 🟢
                                 /perfil 🟡
                                 /ajuda 🟢
                                 /operacao 🟢

FINANCEIRO                       TISS + INSTITUIÇÃO
──────────                       ──────────────────
/executivo 🟢                    /tiss 🟡
/financeiro 🟡                   /instituicao 🟢
/financeiro/dashboard-executivo 🟢
/financeiro/fechamento-operacional 🟢
/financeiro/conciliacao-operacional 🟡

IMPLANTAÇÃO
───────────
/piloto 🟢
/lancamento 🟢
```

---

## 3. Mapa de módulos funcionais

### 3.1 Autenticação e identidade

| Funcionalidade | Rota | Backend | DB | Status |
|----------------|------|---------|-----|--------|
| Login multi-tenant | `/login` | Supabase Auth + gate | `tenants`, `profiles` | 🟢 |
| Recuperação senha | `/login/esqueci-senha` | Supabase Auth | — | 🟢 |
| Redefinição senha | `/login/redefinir-senha` | Supabase Auth | — | 🟢 |
| Route guard + RBAC | `__root.tsx` | `route-guard.ts` | `profiles` | 🟢 |
| Gestão de usuários | — | provisionamento externo | `profiles` | 🟡 |
| MFA / OAuth | — | — | — | 🔴 |

### 3.2 Operação hospitalar

| Funcionalidade | Rota | Tabelas | Status |
|----------------|------|---------|--------|
| Dashboard KPIs | `/` | `shifts`, `schedules` | 🟢 |
| Calendário escalas 14d | `/escalas` | `schedules`, `shifts` | 🟢 |
| Plantões abertos | `/plantoes` | `shift_assignments` | 🟢 |
| Meus plantões | `/plantoes?tab=meus` | `shift_assignments` | 🟢 |
| Swaps | `/plantoes?tab=swaps` | `shift_swap_requests` | 🟢 |
| Disponibilidade | `/perfil` | `availability` | 🟢 |
| Central command center | `/central` | `operational_*` (16) | 🟢 |
| Realtime operacional | `/central` | Supabase Realtime | 🟢 |
| Painel observabilidade | `/operacao` | `operational_logs` | 🟢 |

### 3.3 Financeiro operacional

| Funcionalidade | Rota | Tabelas | FE | BE | DB |
|----------------|------|---------|----|----|-----|
| Hub financeiro | `/financeiro` | — | 🟡 | — | — |
| Dashboard executivo | `/financeiro/dashboard-executivo` | closings + rollups | 🟢 | 🟢 | 🟢 |
| Fechamento competência | `/financeiro/fechamento-operacional` | `financial_closings` | 🟢 | 🟢 | 🟢 |
| Conciliação CSV | `/financeiro/conciliacao-operacional` | `operational_reconciliation_*` | 🟢 | 🟡 | 🟢 |
| Narrativa executiva | `/executivo` | — | 🟢 | 🟢 | — |
| Repasses médicos | `/tiss` (aba) | `medical_payouts` | 🟢 | 🟢 | 🟢 |

### 3.4 TISS / Faturamento

| Aba `/tiss` | CRUD | XML | Operadora | Status |
|-------------|------|-----|-----------|--------|
| Convênios | ✅ | — | — | 🟢 |
| Contratos/Regras | ✅ | — | — | 🟢 |
| TUSS | ✅ | — | — | 🟢 |
| Guias | ✅ | — | — | 🟢 |
| Lotes | ✅ | 🟡 MVP | 🔴 | 🟡 |
| Glosas | ✅ manual | — | 🔴 | 🟡 |
| Recursos | ✅ | — | 🔴 | 🟡 |
| Produção | ✅ | — | — | 🟢 |
| Repasses | ✅ | — | — | 🟢 |

### 3.5 Instituição e implantação

| Funcionalidade | Rota | Status |
|----------------|------|--------|
| Branding (logo, cores) | `/instituicao` | 🟢 |
| Parametrização | `/instituicao` | 🟢 |
| Upload logo/banner | `/instituicao` | 🟢 (bucket `tenant-branding`) |
| Checklist piloto | `/piloto` | 🟢 |
| Demo guiada (7 passos) | `/piloto` | 🟢 |
| Go-live smoke tests | `/lancamento` | 🟢 |
| Export diagnóstico | `/operacao`, `/piloto` | 🟢 |
| Central de ajuda | `/ajuda` | 🟢 |

### 3.6 Módulo clínico (ausente)

| Funcionalidade | Rota | FE | BE | DB | Status |
|----------------|------|----|----|-----|--------|
| Pacientes | — | 🔴 | 🔴 | 🔴 | **0%** |
| Prontuário | — | 🔴 | 🔴 | 🔴 | **0%** |
| Anamnese | — | 🔴 | 🔴 | 🔴 | **0%** |
| Evolução clínica | — | 🔴 | 🔴 | 🔴 | **0%** |
| Agenda consultas | — | 🔴 | 🔴 | 🔴 | **0%** |

---

## 4. Mapa de perfis (RBAC)

| Perfil | Rotas principais | Permissões-chave |
|--------|------------------|------------------|
| `super_admin` | Todas | Reabertura competência, seed demo, ops total |
| `tenant_admin` | Instituição, Piloto, Go-live, Ops | Parametrização, branding |
| `coordinator` | Escalas, Plantões, TISS escrita, Fechamento | Gestão escala completa |
| `professional` | Plantões próprios, Perfil, TISS leitura | Sem financeiro |
| `financial` | Financeiro, TISS repasses | Sem gestão global escala |

**Menu sidebar:** 14 itens filtrados por `navForRole()` em `app-shell.tsx`.

---

## 5. Mapa de integrações

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│ CF Workers   │────▶│  Supabase    │
│  (React SPA) │     │ Server Fn    │     │ Postgres+Auth│
└──────────────┘     └──────┬───────┘     │ Realtime     │
                            │             │ Storage      │
                            ▼             └──────────────┘
                     ┌──────────────┐
                     │ OpenAI API   │  (opcional — Copilot)
                     └──────────────┘

❌ Não implementado: Operadoras TISS · Bancos OFX/CNAB · ERP · Sentry
```

| Integração | Status |
|------------|--------|
| Supabase Auth | 🟢 |
| Supabase Postgres | 🟢 |
| Supabase Realtime | 🟢 |
| Supabase Storage | 🟢 |
| OpenAI Copilot | 🟡 (API key) |
| TISS operadoras | 🔴 |
| Banking OFX/CNAB | 🔴 |
| Error tracking | 🔴 (stub) |

---

## 6. Mapa de dados (Supabase)

### Tabelas por domínio

| Domínio | Qtd | Utilização |
|---------|-----|------------|
| Multi-tenant | 3 | 100% |
| Estrutura | 4 | 75% (`hospitals` não usada) |
| Escalas/plantões | 5 | 100% |
| TISS | 14 | 100% |
| Repasses | 5 | 100% |
| Fechamento | 3 | 100% |
| Conciliação | 4 | 100% |
| IA operacional | 16 | 100% |
| Observabilidade | 3 | 100% |
| Piloto | 5 | 100% |
| Segurança | 1 | 100% (insert service role) |
| **Clínico/EHR** | 0 | — |

### Fluxo de dados principal

```
Login → tenant_id (profile) → Server Fn → RLS filter → Postgres
                                    ↓
                              Realtime → /central (alertas)
```

---

## 7. Mapa de IA operacional

```
/central
  ├── Copilot GPT ────────── OpenAI (opcional)
  ├── Agentes ────────────── governance + coordination
  ├── Orquestrações ──────── multi-step workflows
  ├── Action Proposals ───── human-in-the-loop
  ├── Sandbox ────────────── dry-run
  ├── Memory ─────────────── aprendizado operacional
  ├── Policy Intelligence ── ciclos heurísticos
  └── Strategic Planning ─── planejamento heurístico
```

| Componente | Depende OpenAI? | Persiste DB? |
|------------|-----------------|--------------|
| Copilot GPT | ✅ Sim | Proposals |
| Agentes | ❌ Não | ✅ 16 tabelas |
| Scoring/Recommendations | ❌ Não | ✅ events + feedback |
| Realtime | ❌ Não | ✅ subscriptions |

---

## 8. Mapa de navegação (fluxos)

### Fluxo autenticação
```
/site → /login → / (sucesso)
/login → /login/esqueci-senha → email → /login/redefinir-senha
/perfil → Sair → /login
```

### Fluxo operação diária
```
/ (Home) → /escalas → /plantoes
         → /central (alertas) → ações contextuais
```

### Fluxo financeiro
```
/executivo → /financeiro/dashboard-executivo
           → /financeiro/conciliacao-operacional
/financeiro → /financeiro/fechamento-operacional
```

### Fluxo implantação
```
/piloto → /instituicao → /lancamento → /operacao → /ajuda
```

### Demo guiada (7 passos)
```
/piloto → / → /central → /executivo → /tiss → /instituicao → /operacao
```

---

## 9. Mapa de maturidade (L0–L5)

| Nível | Significado | Módulos |
|-------|-------------|---------|
| **L0** Inexistente | Zero implementação | Pacientes, Prontuário, Anamnese, Evolução |
| **L2** Esboço | Backend parcial ou UI mínima | Gestão usuários, Relatórios |
| **L3** Funcional | Uso com limitações | TISS, Financeiro hub, Conciliação, IA Copilot |
| **L4** Operacional | Piloto/staging validado | Login, Escalas, Central, Fechamento, Piloto, etc. |
| **L5** Produção-ready | Testes + observabilidade + compliance | Nenhum módulo ainda |

---

## 10. Percentuais consolidados

| Camada | % |
|--------|---|
| Frontend | **78%** |
| Backend | **82%** |
| Infraestrutura | **74%** |
| Funcionalidades | **73%** |
| **Produto** | **73%** |

---

## 11. Referência cruzada rota → server functions

| Rota | Server entry points |
|------|---------------------|
| `/login` | `auth-security-server.ts` |
| `/escalas`, `/plantoes` | `operations/api/schedules.ts`, `shifts.ts`, `assignments.ts`, `swaps.ts` |
| `/central` | `operations/api/operational-*.ts` (12 módulos) |
| `/tiss` | `tiss/api/tiss-server.ts` |
| `/financeiro/fechamento-operacional` | `financial-closing/api/financial-closing-server.ts` |
| `/financeiro/conciliacao-operacional` | `operational-reconciliation/api/reconciliation-server.ts` |
| `/financeiro/dashboard-executivo` | `executive-dashboard/api/executive-dashboard-server.ts` |
| `/instituicao` | `tenant-branding-service.ts` + Storage |
| `/piloto` | `pilot-execution/api/pilot-execution-server.ts` |
| `/lancamento` | `production-release/api/production-release-server.ts` |
| `/operacao` | `operational-observability/api/operational-observability-server.ts` |

---

*Mapa funcional read-only. Atualizado em 08/06/2026.*
