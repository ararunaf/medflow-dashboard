# PILOT-READY — Relatório Final de Automação de Implantação

**Documento:** PILOT-READY — Fase 5 (consolidado)  
**Data:** 11/06/2026  
**Versão:** V1  
**Objetivo:** Reduzir tempo de implantação de cliente piloto para **menos de 1 dia útil**  
**Restrições respeitadas:** Sem alteração de arquitetura, IA ou regras de negócio

---

## Sumário executivo

A auditoria do repositório confirma que o MedicFlow-AI está **pronto para pilotos assistidos**, mas o gargalo de implantação é **100% operacional**: provisionamento manual de tenant, usuários e dados iniciais via Supabase Dashboard + SQL.

| Entregável | Status | Caminho |
|------------|:------:|---------|
| Runbook operacional (8 etapas) | ✅ | [RUNBOOK_IMPLANTACAO_PILOTO.md](./RUNBOOK_IMPLANTACAO_PILOTO.md) |
| Auditoria de scripts reutilizáveis | ✅ | Seção abaixo |
| Spec `provision-pilot-tenant.mjs` | ✅ | Especificação abaixo (não implementado) |
| Spec `seed-pilot-data.mjs` | ✅ | Especificação abaixo (não implementado) |
| Kit de kick-off | ✅ | [KICKOFF_CLIENTE_PILOTO.md](./KICKOFF_CLIENTE_PILOTO.md) |
| Relatório final | ✅ | Este documento |

**Meta:** Setup MedicFlow de **5–7 h (manual)** para **1,5–2 h (automatizado)** → implantação completa em **< 1 dia útil**.

---

## Respostas às quatro perguntas-chave

### 1. Quanto tempo leva para implantar um cliente hoje?

| Fase | Tempo | Responsável |
|------|:-----:|-------------|
| Pré-venda e alinhamento | 0,5–1 dia | Comercial + CS |
| Infraestrutura + tenant (SQL) | 1–2 h | TI MedicFlow |
| Usuários (Auth + profiles + professionals) | 2–3 h | TI MedicFlow |
| Estrutura (units + departments) | 45–60 min | TI MedicFlow |
| Branding | 30–45 min | Admin cliente |
| Primeira escala + turnos | 45–60 min | Escalista |
| Dados financeiros mínimos | 1–2 h | Financeiro |
| Validação técnica + kick-off | 2–3 h | TI + CS |
| **Total setup até go-live** | **2–3 dias úteis** | |
| Piloto operacional | 30 dias | Equipe cliente + CS |

**Detalhamento por etapa (runbook):**

| Etapa | Tempo hoje |
|-------|:----------:|
| 1. Criar tenant | 45–60 min |
| 2. Criar usuários | 90–120 min |
| 3. Configurar branding | 30–45 min |
| 4. Configurar instituição | 45–60 min |
| 5. Configurar especialidades | 15–20 min |
| 6. Configurar escalistas | 20–30 min |
| 7. Configurar médicos | 60–90 min |
| 8. Publicar primeira escala | 45–60 min |
| **Subtotal setup** | **5–7 h** |

> Fonte: [GTM_PILOTO_READY.md](./GTM_PILOTO_READY.md), [CHECKLIST_IMPLANTACAO.md](./CHECKLIST_IMPLANTACAO.md), auditoria de código 11/06/2026.

---

### 2. Quanto tempo levaria com automação?

| Fase | Tempo automatizado | Ganho |
|------|:------------------:|:-----:|
| Provisionamento tenant + users + estrutura | 30–45 min | ~3 h |
| Seed operacional (médicos, unidades, plantões, financeiro mínimo) | 10–15 min | ~2 h |
| Branding | 30–45 min | 0 (self-service cliente) |
| Publicar/revisar escala (com seed) | 30 min | ~30 min |
| Validação (`auth-validate` + `seed-validate`) | 15 min | ~30 min |
| Kick-off | 60–90 min | 0 |
| **Total setup até go-live** | **4–5 h (< 1 dia)** | **~50–60%** |

**Cenário otimizado (scripts P0 implementados):**

```
08:00  provision-pilot-tenant.mjs     (30 min)
08:30  seed-pilot-data.mjs            (15 min)
08:45  auth-validate + seed-validate  (15 min)
09:00  Entrega credenciais ao cliente
10:00  Admin: branding (/instituicao) (45 min)
11:00  Escalista: revisar escala seed  (30 min)
12:00  Smoke tests + kick-off          (90 min)
14:00  GO-LIVE
```

---

### 3. Quais etapas são manuais hoje?

| # | Etapa | Mecanismo atual | Automatizável? |
|---|-------|-----------------|:--------------:|
| 1 | Criar tenant | SQL manual no Supabase | ✅ Sim |
| 2 | Criar hospital raiz | SQL manual | ✅ Sim |
| 3 | Criar usuários | Supabase Dashboard (1 a 1) | ✅ Sim |
| 4 | Criar profiles | SQL manual | ✅ Sim |
| 5 | Criar professionals | SQL manual | ✅ Sim |
| 6 | Criar units + departments | SQL manual | ✅ Sim |
| 7 | Configurar branding | UI `/instituicao` (self-service) | ⚠️ Parcial |
| 8 | Configurar especialidades | SQL (texto livre) | ✅ Sim |
| 9 | Criar escalas + turnos | UI `/escalas` ou SQL | ✅ Sim |
| 10 | Seed TISS demo | UI `demo_seed:apply` ou migration | ✅ Já existe |
| 11 | payout_rules | SQL manual | ✅ Sim |
| 12 | medical_production mínima | SQL ou UI `/tiss` | ✅ Sim |
| 13 | Validar RLS/auth | `auth-validate.mjs` | ✅ Já existe |
| 14 | Validar seeds | `seed-validate.mjs` | ✅ Já existe |
| 15 | Entregar credenciais | Processo CS (1:1) | ⚠️ Template |
| 16 | Kick-off e treinamento | Call CS | ❌ Não |
| 17 | Rotacionar bootstrap | Manual TI | ⚠️ Checklist |

**Etapas que permanecem manuais mesmo com automação:**

- Branding (upload de logo/assets do cliente)
- Kick-off e treinamento
- Cadastro de convênios reais (produção piloto)
- Comunicação com médicos (sem push/e-mail)

---

### 4. Quais devem ser automatizadas primeiro?

| Prioridade | Automação | Impacto | Esforço estimado |
|:----------:|-----------|:-------:|:----------------:|
| 🔴 **P0** | `provision-pilot-tenant.mjs` | −3 h setup | 1–2 dias dev |
| 🔴 **P0** | `seed-pilot-data.mjs` | −2 h setup | 2–3 dias dev |
| 🟠 **P1** | Template de credenciais (CSV/PDF seguro) | Experiência 1º login | 4 h |
| 🟠 **P1** | `provision-pilot-tenant.mjs --dry-run` | Validação pré-deploy | incluso P0 |
| 🟡 **P2** | Rotação automática bootstrap credentials | Segurança | 1 dia |
| 🟡 **P2** | `npm run provision-pilot` no package.json | DX | 1 h |

**Justificativa P0:**

1. **Tenant + users** é o maior gargalo (60% do tempo TI) — hoje cada médico = 2 telas (Auth + SQL)
2. **Seed operacional** elimina dashboard vazio no Dia 1 — principal causa de desengajamento inicial
3. Ambos scripts **não alteram arquitetura** — usam Supabase Admin API + SQL existente
4. Scripts de validação (`auth-validate`, `seed-validate`) já existem e servem como gate pós-provisionamento

---

## FASE 2 — Auditoria de scripts reutilizáveis

### Scripts existentes em `scripts/`

| Script | Reutilizável para implantação? | Função |
|--------|:----------------------------:|--------|
| `auth-validate.mjs` | ✅ **Sim** | Valida login, RBAC, sessão, route guard contra Supabase remoto |
| `seed-validate.mjs` | ✅ **Sim** | Valida tenants mínimos, branding RLS, bootstrap; `--fix` backfill `tenant_settings` |
| `lib/staging-domain.mjs` | ⚠️ Parcial | Helpers de domínio staging |
| `capture-docs-screenshots.mjs` | ❌ Não | Playwright para documentação |
| `capture-ia-screenshots.mjs` | ❌ Não | Screenshots IA |
| `capture-ia-identity-screenshots.mjs` | ❌ Não | Screenshots identidade IA |
| `generate-executive-presentation-v2.py` | ❌ Não | Geração PPT |
| `generate-corporate-presentation.py` | ❌ Não | Geração PPT |

### Scripts referenciados em `package.json` mas ausentes do diretório

| Script npm | Provável função | Reutilizável? |
|------------|-----------------|:-------------:|
| `migration-validate` | Audita 28 migrations + tabelas críticas | ✅ Gate pré-implantação |
| `env-check` | Valida variáveis de ambiente | ✅ Gate pré-implantação |
| `multi-tenant-auth-validate` | Isolamento multi-tenant | ✅ Pós-provisionamento |
| `branding-audit` | Audita branding por tenant | ✅ Pós-branding |
| `smoke-check` | Smoke tests programáticos | ✅ Go-live |
| `staging-validate` | Validação staging completa | ⚠️ CI/CD |

### Seeds existentes (não são scripts de provisionamento)

| Recurso | O que cria | Lacuna |
|---------|------------|--------|
| Migration `20250512000000_init_enterprise.sql` | 3 tenants demo | Não é cliente piloto |
| Migration `20250514120000_tenant_settings_branding_readiness.sql` | `medflow-v1-demo` + TISS seed | Sem escalas/usuários |
| Migration `20250517171500_bootstrap_system_admin.sql` | super_admin hardcoded | Credenciais inseguras |
| UI `demo_seed:apply` em `/instituicao` | 2 operadoras + 1 contrato | Sem operação |

### Conclusão da auditoria

**Não existe script de provisionamento de tenant piloto.** Os scripts `auth-validate.mjs` e `seed-validate.mjs` são reutilizáveis como **gates de validação pós-provisionamento**, mas não criam dados.

**Recomendação:** Implementar `provision-pilot-tenant.mjs` e `seed-pilot-data.mjs` conforme especificações abaixo.

---

## Especificação: `provision-pilot-tenant.mjs`

> **Status:** Especificação técnica — **não implementado**  
> **Caminho:** `scripts/provision-pilot-tenant.mjs`  
> **Esforço estimado:** 1–2 dias de desenvolvimento

### Objetivo

Provisionar um tenant piloto completo (tenant + settings + hospital + users + profiles) a partir de um arquivo de configuração JSON, usando Supabase Admin API e service role.

### Pré-requisitos

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Admin API (nunca expor no client) |
| `VITE_SUPABASE_ANON_KEY` | Não | Para validação pós-provisionamento |

### Interface CLI

```bash
# Provisionamento completo
node scripts/provision-pilot-tenant.mjs --config pilot-config.json

# Dry-run (valida config, não escreve)
node scripts/provision-pilot-tenant.mjs --config pilot-config.json --dry-run

# Apenas tenant + estrutura (sem users)
node scripts/provision-pilot-tenant.mjs --config pilot-config.json --skip-users

# Idempotente: atualiza se tenant slug já existe
node scripts/provision-pilot-tenant.mjs --config pilot-config.json --idempotent
```

**npm script sugerido:**

```json
"provision-pilot": "node scripts/provision-pilot-tenant.mjs"
```

### Arquivo de configuração (`pilot-config.json`)

```json
{
  "tenant": {
    "slug": "cliente-piloto",
    "name": "Hospital Cliente Piloto"
  },
  "settings": {
    "institution_name": "Hospital Cliente Piloto",
    "contact_email": "contato@cliente.com.br",
    "support_phone": "(11) 99999-0000",
    "operational_timezone": "America/Sao_Paulo",
    "primary_color": "#1e3a5f",
    "secondary_color": "#0d9488"
  },
  "hospital": {
    "name": "Hospital Principal"
  },
  "users": [
    {
      "email": "admin@cliente.com.br",
      "password": "<TEMP_PASSWORD>",
      "full_name": "Maria Silva — Admin",
      "role": "tenant_admin"
    },
    {
      "email": "escalista@cliente.com.br",
      "password": "<TEMP_PASSWORD>",
      "full_name": "João Escalista",
      "role": "coordinator",
      "professional": { "specialty": "Gestão de Escalas", "crm": "" }
    },
    {
      "email": "financeiro@cliente.com.br",
      "password": "<TEMP_PASSWORD>",
      "full_name": "Ana Financeiro",
      "role": "financial"
    }
  ],
  "professionals": {
    "count": 10,
    "email_pattern": "medico{nn}@cliente.com.br",
    "password_pattern": "<TEMP_PASSWORD>",
    "name_pattern": "Dr(a). Médico {nn}",
    "specialties": ["Clínica Médica", "Cardiologia"],
    "crm_prefix": "CRM/SP"
  }
}
```

### Fluxo de execução

```
1. Carregar e validar pilot-config.json (schema Zod)
2. Conectar Supabase com service_role
3. Verificar migrations aplicadas (probe: tenants, profiles, units)
4. [DRY-RUN] Imprimir plano e sair
5. INSERT tenants → obter tenant_id
6. INSERT tenant_settings (ou upsert se --idempotent)
7. INSERT hospitals → obter hospital_id
8. Para cada user em config.users:
   a. auth.admin.createUser({ email, password, email_confirm: true })
   b. INSERT profiles (id, tenant_id, full_name, role)
   c. INSERT professionals (se professional definido)
9. Para professionals.count em config.professionals:
   a. Gerar email/nome/crm/specialty rotativo
   b. auth.admin.createUser
   c. INSERT profiles (role: professional)
   d. INSERT professionals
10. Gerar pilot-credentials.csv (email, senha temp, papel, tenant_slug)
11. Executar auth-validate.mjs (subprocess) como gate
12. Imprimir resumo: tenant_id, hospital_id, N users criados, caminho CSV
```

### Tabelas afetadas

| Tabela | Operação | RLS |
|--------|----------|-----|
| `tenants` | INSERT | Bypass (service_role) |
| `tenant_settings` | INSERT/UPSERT | Bypass |
| `hospitals` | INSERT | Bypass |
| `auth.users` | CREATE via Admin API | N/A |
| `profiles` | INSERT | Bypass |
| `professionals` | INSERT | Bypass |

### Validações (schema Zod)

- `tenant.slug`: regex `^[a-z0-9-]+$`, 3–40 chars, único
- `users[].role`: enum `user_role`
- `users[].email`: formato email válido
- `settings.operational_timezone`: IANA timezone válido
- `professionals.count`: 1–50

### Tratamento de erros

| Erro | Comportamento |
|------|---------------|
| Slug duplicado (sem `--idempotent`) | Abortar com mensagem clara |
| Slug duplicado (com `--idempotent`) | Reutilizar tenant_id existente |
| Email duplicado no Auth | Skip com warning (idempotente) |
| Falha em user N de M | Rollback users criados nesta execução (transação lógica) |
| auth-validate falha pós-provisionamento | Exit code 1 + relatório |

### Saídas

| Artefato | Formato | Destino |
|----------|---------|---------|
| Resumo de provisionamento | JSON stdout | Console |
| Credenciais | CSV | `pilot-output/<slug>-credentials.csv` (gitignored) |
| Log de auditoria | JSONL | `pilot-output/<slug>-provision.log` |

### Segurança

- `SUPABASE_SERVICE_ROLE_KEY` apenas via env (nunca em config JSON)
- Senhas temporárias geradas com `crypto.randomBytes` se não fornecidas
- CSV de credenciais em `.gitignore` (`pilot-output/`)
- Flag `--dry-run` obrigatória em CI para validar configs
- Não logar senhas em plaintext (mascarar no log)

### Dependências

- `@supabase/supabase-js` (já no projeto)
- `zod` (já no projeto ou adicionar)
- Reutilizar `loadEnv()` de `auth-validate.mjs` (extrair para `scripts/lib/env.mjs`)

### Testes de aceitação

1. `--dry-run` com config válida → plano impresso, zero writes
2. Provisionamento completo → tenant visível em `/login`
3. Login de cada papel → menu RBAC correto
4. `--idempotent` com mesmo slug → sem duplicatas
5. `auth-validate` passa após provisionamento
6. `seed-validate` detecta novo tenant (atualizar MIN_TENANT_SLUGS ou tornar dinâmico)

---

## Especificação: `seed-pilot-data.mjs`

> **Status:** Especificação técnica — **não implementado**  
> **Caminho:** `scripts/seed-pilot-data.mjs`  
> **Esforço estimado:** 2–3 dias de desenvolvimento

### Objetivo

Popular dados operacionais e financeiros mínimos para um tenant piloto já provisionado, permitindo demo realista sem criação manual de escalas.

### Dados a criar

| Entidade | Quantidade | Detalhe |
|----------|:----------:|---------|
| Unidades (`units`) | **2** | UTI + Pronto-Socorro |
| Departamentos (`departments`) | **2** | Plantão Diurno + Plantão Noturno |
| Especialidades (em `professionals`) | **2** | Clínica Médica, Cardiologia |
| Médicos (`professionals`) | **10** | Se não criados por provision script |
| Escalas (`schedules`) | **2** | 1 ativa, 1 draft |
| Plantões (`shifts`) | **20** | Mix: 5 open, 3 assigned, 2 pending confirm |
| Atribuições (`shift_assignments`) | **5** | 2 pending, 3 confirmed |
| Disponibilidade (`availability`) | **8** | Profissionais com toggle ativo |
| Convênios TISS | **2** | Reutilizar `demo_seed:apply` logic ou SQL |
| Contrato TISS | **1** | Vinculado a 1 convênio |
| Produção financeira (`medical_production`) | **5** | Vinculada a shifts executados |
| Competência financeira | **1** | Mês corrente aberta |
| `payout_rules` | **2** | 1 por especialidade (SQL) |

### Pré-requisitos

- Tenant provisionado (`provision-pilot-tenant.mjs` ou manual)
- `SUPABASE_SERVICE_ROLE_KEY` configurada
- Hospital raiz existente para o tenant

### Interface CLI

```bash
# Seed completo para tenant existente
node scripts/seed-pilot-data.mjs --tenant-slug cliente-piloto

# Seed parcial
node scripts/seed-pilot-data.mjs --tenant-slug cliente-piloto --only operational
node scripts/seed-pilot-data.mjs --tenant-slug cliente-piloto --only financial

# Dry-run
node scripts/seed-pilot-data.mjs --tenant-slug cliente-piloto --dry-run

# Publicar escalas automaticamente (draft → active)
node scripts/seed-pilot-data.mjs --tenant-slug cliente-piloto --publish-schedules
```

**npm script sugerido:**

```json
"seed-pilot": "node scripts/seed-pilot-data.mjs"
```

### Fluxo de execução

```
1. Resolver tenant_id por --tenant-slug
2. Verificar hospital_id existente (ou criar se ausente)
3. [DRY-RUN] Imprimir plano de inserts e sair

--- Módulo OPERATIONAL ---
4. INSERT 2 units (UTI, PS) se não existirem
5. INSERT 2 departments (diurno, noturno) se não existirem
6. Verificar professionals existentes; criar até 10 se necessário
7. Atribuir specialties alternadas (Clínica Médica / Cardiologia)
8. INSERT 2 schedules:
   - "Escala Piloto — Semana 1" (draft ou active se --publish-schedules)
   - "Escala Piloto — Semana 2" (draft)
9. INSERT 20 shifts distribuídos nos próximos 14 dias:
   - 5 open (sem assignment)
   - 3 assigned (com assignment pending)
   - 2 com assignment confirmed
   - 10 restantes open (futuro)
10. INSERT 5 shift_assignments (2 pending, 3 confirmed)
11. INSERT 8 availability records (profissionais aleatórios, ativo=true)

--- Módulo FINANCIAL ---
12. INSERT 2 insurance_providers (ou invocar lógica demo_seed)
13. INSERT 1 contract + rules
14. INSERT 5 medical_production vinculados a shifts completed/assigned
15. INSERT 1 financial_closing (competência mês corrente, status open)
16. INSERT 2 payout_rules (SQL):
    - Clínica Médica: R$ 1.500/plantão 12h
    - Cardiologia: R$ 2.000/plantão 12h

17. Imprimir resumo + IDs criados
18. (Opcional) Invocar seed-validate.mjs
```

### Distribuição dos 20 plantões

| Status shift | Qtd | Assignment | Período |
|--------------|:---:|------------|---------|
| `open` | 12 | nenhum | dias 1–14 |
| `assigned` | 3 | `pending` | dias 1–7 |
| `assigned` | 2 | `confirmed` | dias 1–5 |
| `completed` | 3 | `confirmed` | dias -7 a -1 (passado) |

> Shifts `completed` alimentam `medical_production` para KPIs financeiros.

### Horários padrão dos plantões

| Tipo | Início | Fim | Duração |
|------|--------|-----|:-------:|
| Diurno | 07:00 | 19:00 | 12h |
| Noturno | 19:00 | 07:00+1 | 12h |

Timezone: `America/Sao_Paulo` (do `tenant_settings`).

### Tabelas afetadas

| Tabela | Operação |
|--------|----------|
| `units` | INSERT (2) |
| `departments` | INSERT (2) |
| `professionals` | UPDATE specialty / INSERT se faltante |
| `schedules` | INSERT (2) |
| `shifts` | INSERT (20) |
| `shift_assignments` | INSERT (5) |
| `availability` | INSERT (8) |
| `insurance_providers` | INSERT (2) ou reuse demo |
| `contracts` | INSERT (1) |
| `contract_rules` | INSERT (N) |
| `medical_production` | INSERT (5) |
| `financial_closings` | INSERT (1) |
| `payout_rules` | INSERT (2) |

### Configuração opcional (`pilot-seed.json`)

```json
{
  "tenant_slug": "cliente-piloto",
  "units": [
    { "name": "UTI", "type": "hospital" },
    { "name": "Pronto-Socorro", "type": "hospital" }
  ],
  "departments": [
    { "unit": "UTI", "name": "Plantão Diurno" },
    { "unit": "Pronto-Socorro", "name": "Plantão Noturno" }
  ],
  "specialties": ["Clínica Médica", "Cardiologia"],
  "shifts": {
    "total": 20,
    "days_ahead": 14,
    "publish_first": true
  },
  "financial": {
    "insurance_providers": 2,
    "medical_production": 5,
    "payout_rules": true
  }
}
```

### Idempotência

- Verificar existência por `(tenant_id, name)` em units/departments
- Verificar schedules por `(tenant_id, name)` — skip se já existir "Escala Piloto — Semana 1"
- Flag `--force` para recriar (apaga dados piloto anteriores do mesmo tenant — com confirmação interativa ou `--yes`)

### Integração com scripts existentes

| Script | Quando invocar |
|--------|----------------|
| `seed-validate.mjs` | Pós-seed, validar integridade |
| `auth-validate.mjs` | Se criou users adicionais |
| Lógica `demo_seed:apply` | Reutilizar para TISS (extrair para `scripts/lib/demo-tiss-seed.mjs`) |

### Saídas

| Artefato | Formato |
|----------|---------|
| Resumo seed | JSON stdout |
| Mapa de IDs | JSON → `pilot-output/<slug>-seed-map.json` |
| Log | JSONL → `pilot-output/<slug>-seed.log` |

### Testes de aceitação

1. Seed em tenant vazio → 2 units, 2 departments, 20 shifts
2. Dashboard `/` exibe KPIs não vazios após login coordinator
3. `/plantoes` exibe turnos open para professional
4. `/executivo` exibe KPIs financeiros (com medical_production)
5. Re-execução idempotente → zero duplicatas
6. `--dry-run` → plano sem writes

---

## Roadmap de implementação sugerido

| Sprint | Entrega | Resultado |
|--------|---------|-----------|
| S1 (2 dias) | `provision-pilot-tenant.mjs` + `scripts/lib/env.mjs` | Tenant + 13 users em 30 min |
| S2 (3 dias) | `seed-pilot-data.mjs` + `scripts/lib/demo-tiss-seed.mjs` | Demo realista em 15 min |
| S3 (1 dia) | `npm run provision-pilot` + `npm run seed-pilot` + docs | DX completa |
| S4 (0,5 dia) | Template credenciais + checklist automatizado | Entrega ao cliente |

**Resultado final:** Implantação piloto em **4–5 horas** (< 1 dia útil).

---

## Documentação gerada neste pacote

| Documento | Fase | Descrição |
|-----------|:----:|-----------|
| [RUNBOOK_IMPLANTACAO_PILOTO.md](./RUNBOOK_IMPLANTACAO_PILOTO.md) | 1 | 8 etapas com tempos e SQL |
| [KICKOFF_CLIENTE_PILOTO.md](./KICKOFF_CLIENTE_PILOTO.md) | 4 | Escopo, limitações, critérios de sucesso |
| [PILOT_READY.md](./PILOT_READY.md) | 5 | Este relatório + specs de automação |

### Documentação pré-existente relacionada

| Documento | Uso |
|-----------|-----|
| [GTM_PILOTO_READY.md](./GTM_PILOTO_READY.md) | Parecer executivo GO CONDICIONAL |
| [CHECKLIST_IMPLANTACAO.md](./CHECKLIST_IMPLANTACAO.md) | Checklist 9 fases (70+ itens) |
| [PILOTO_30_DIAS.md](./PILOTO_30_DIAS.md) | Plano pós go-live |
| [MANUAL_INSTITUICAO_MEDICFLOW.md](./MANUAL_INSTITUICAO_MEDICFLOW.md) | Manual admin |
| [MANUAL_PROFISSIONAL_MEDICFLOW.md](./MANUAL_PROFISSIONAL_MEDICFLOW.md) | Manual médico |

---

## Histórico de versões

| Versão | Data | Alteração |
|--------|------|-----------|
| V1 | 11/06/2026 | Pacote PILOT-READY completo — runbook, kick-off, specs, relatório |
