# Runbook Operacional — Implantação de Cliente Piloto

**Documento:** PILOT-READY — Fase 1  
**Data:** 11/06/2026  
**Versão:** V1  
**Modelo:** Implantação assistida (B2B)  
**Objetivo:** Implantar um novo piloto em **menos de 1 dia útil** de trabalho da equipe MedicFlow (com automação P0)

---

## Visão geral

Este runbook cobre as **8 etapas operacionais** entre a assinatura comercial e o go-live do piloto. Não altera arquitetura, IA ou regras de negócio — apenas prepara o ambiente.

| Etapa | Responsável principal | Tempo hoje (manual) | Tempo alvo (automatizado) |
|:-----:|----------------------|:-------------------:|:-------------------------:|
| 1. Criar tenant | TI MedicFlow | 45–60 min | 5 min |
| 2. Criar usuários | TI MedicFlow | 90–120 min | 15 min |
| 3. Configurar branding | Admin cliente | 30–45 min | 30–45 min |
| 4. Configurar instituição | TI + admin cliente | 45–60 min | 20 min |
| 5. Configurar especialidades | TI MedicFlow | 15–20 min | 5 min |
| 6. Configurar escalistas | TI MedicFlow | 20–30 min | 10 min |
| 7. Configurar médicos | TI MedicFlow | 60–90 min | 15 min |
| 8. Publicar primeira escala | Escalista | 45–60 min | 30 min |
| **Total setup MedicFlow** | | **5–7 h** | **1,5–2 h** |
| Validação + kick-off | CS + TI | 2–3 h | 2–3 h |
| **Total dia útil** | | **7–10 h (1–1,5 dias)** | **4–5 h (< 1 dia)** |

> Referência completa: [CHECKLIST_IMPLANTACAO.md](./CHECKLIST_IMPLANTACAO.md) (9 fases, 70+ itens).

---

## Pré-requisitos (antes da Etapa 1)

| Item | Verificação |
|------|-------------|
| Contrato/NDA de piloto assinado | Comercial |
| Sponsor interno nomeado no cliente | Cliente |
| Equipe piloto mapeada (admin, escalista, N médicos, financeiro) | Cliente |
| Ambiente definido (staging dedicado ou produção piloto) | TI MedicFlow |
| Projeto Supabase com migrations aplicadas | `npx supabase db push` |
| Deploy funcional (Cloudflare/Vercel) | `docs/deploy-checklist.md` |
| Variáveis de ambiente configuradas | `.env.local` / staging |
| Credenciais bootstrap **rotacionadas** | `20250517171500_bootstrap_system_admin.sql` |

**Comandos de validação pré-implantação:**

```bash
npm run migration-validate
npm run seed-validate
npm run auth-validate
```

---

## Etapa 1 — Criar tenant

**Responsável:** TI MedicFlow  
**Tempo estimado:** 45–60 min (manual) → **5 min** (com `provision-pilot-tenant.mjs`)  
**Bloqueante:** Sim

### O que é criado

| Entidade | Tabela | Observação |
|----------|--------|------------|
| Instituição lógica | `tenants` | `slug` único, visível em `/login` |
| Parametrização inicial | `tenant_settings` | Backfill automático ou insert explícito |
| Hospital raiz | `hospitals` | Obrigatório — FK de `units` |
| Bucket branding | `tenant-branding` | Storage Supabase (já provisionado globalmente) |

### Procedimento manual (estado atual)

**1.1** Confirmar migrations aplicadas:

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

**1.2** Inserir tenant no SQL Editor do Supabase:

```sql
INSERT INTO public.tenants (slug, name)
VALUES ('cliente-piloto', 'Hospital Cliente Piloto')
RETURNING id, slug;
-- Anotar o UUID retornado como <TENANT_ID>
```

**1.3** Garantir `tenant_settings` (se backfill não cobriu):

```sql
INSERT INTO public.tenant_settings (
  tenant_id,
  institution_name,
  contact_email,
  operational_timezone
) VALUES (
  '<TENANT_ID>',
  'Hospital Cliente Piloto',
  'contato@cliente.com.br',
  'America/Sao_Paulo'
) ON CONFLICT (tenant_id) DO NOTHING;
```

**1.4** Criar hospital raiz (obrigatório para unidades):

```sql
INSERT INTO public.hospitals (tenant_id, name)
VALUES ('<TENANT_ID>', 'Hospital Principal')
RETURNING id;
-- Anotar como <HOSPITAL_ID>
```

**1.5** Validar tenant visível no login:

```bash
npm run seed-validate
```

### Critério de conclusão

- [ ] Tenant aparece no seletor de instituição em `/login`
- [ ] `tenant_settings` existe para o `tenant_id`
- [ ] Hospital raiz criado
- [ ] RLS validado (`auth-validate` sem falhas críticas)

### Automação futura

→ `scripts/provision-pilot-tenant.mjs` (especificado em [PILOT_READY.md](./PILOT_READY.md#especificação-provision-pilot-tenantmjs))

---

## Etapa 2 — Criar usuários

**Responsável:** TI MedicFlow  
**Tempo estimado:** 90–120 min (manual) → **15 min** (automatizado)  
**Bloqueante:** Sim

### Papéis mínimos para piloto

| Papel RBAC | Qtd mínima | Função |
|------------|:----------:|--------|
| `tenant_admin` | 1 | Branding, piloto, go-live |
| `coordinator` | 1 | Escalas e central de IA |
| `professional` | 4 (ideal 8–12) | Aceite de plantões |
| `financial` | 1 | TISS e fechamento (se no escopo) |

> **Não existe UI de cadastro.** Cada usuário exige Supabase Auth + SQL em `profiles`.

### Procedimento manual (por usuário)

**2.1** Criar usuário no Supabase Dashboard → Authentication → Users:

- Email: `admin@cliente.com.br`
- Senha temporária (forçar troca no 1º login)
- Anotar o UUID do usuário como `<USER_ID>`

**2.2** Inserir perfil:

```sql
INSERT INTO public.profiles (id, tenant_id, full_name, role)
VALUES (
  '<USER_ID>',
  '<TENANT_ID>',
  'Maria Silva — Admin',
  'tenant_admin'  -- ou coordinator, professional, financial
);
```

**2.3** Repetir para cada membro da equipe piloto.

**2.4** Testar login:

1. Acessar `/login`
2. Selecionar instituição `cliente-piloto`
3. Email + senha
4. Verificar menu conforme RBAC (`src/lib/auth/rbac.ts`)

**2.5** Entregar credenciais de forma segura (1:1, nunca e-mail em massa).

### Checklist por usuário

```
☐ Criado no Supabase Auth (email + senha)
☐ Registro em profiles (id, tenant_id, role, full_name)
☐ profiles.tenant_id = <TENANT_ID> do piloto
☐ Login bem-sucedido em /login
☐ Menu correto para o papel
☐ Recuperação de senha testada (opcional D0)
```

### Critério de conclusão

- [ ] 1 `tenant_admin` ativo
- [ ] 1 `coordinator` ativo
- [ ] ≥ 4 `professional` ativos
- [ ] 1 `financial` ativo (se TISS no escopo)
- [ ] `npm run auth-validate` passa para perfis críticos

### Automação futura

→ `scripts/provision-pilot-tenant.mjs` (criação em lote via Admin API)

---

## Etapa 3 — Configurar branding

**Responsável:** Admin cliente (com suporte CS)  
**Tempo estimado:** 30–45 min  
**Bloqueante:** Parcial (nome institucional é bloqueante para go-live)

### Rota

`/instituicao` — self-service para `tenant_admin`

### Campos em `tenant_settings`

| Campo | Obrigatório go-live | Exemplo |
|-------|:-------------------:|---------|
| `institution_name` | Sim | Hospital São Lucas |
| `primary_color` | Não | `#1e3a5f` |
| `secondary_color` | Não | `#0d9488` |
| `logo_url` | Recomendado | Upload no bucket `tenant-branding` |
| `banner_url` | Não | Upload |
| `favicon_url` | Não | Upload |
| `contact_email` | Sim (ou telefone) | suporte@cliente.com.br |
| `support_phone` | Sim (ou e-mail) | (11) 99999-0000 |
| `operational_timezone` | Sim | `America/Sao_Paulo` |
| `currency` | Não | `BRL` |

### Procedimento

**3.1** Login como `tenant_admin`  
**3.2** Navegar para `/instituicao`  
**3.3** Upload de logo (PNG/SVG, máx. 2 MB recomendado)  
**3.4** Definir cores primária e secundária  
**3.5** Preencher nome institucional, e-mail e telefone de suporte  
**3.6** Confirmar fuso `America/Sao_Paulo`  
**3.7** Revisar painel de readiness (validação `validateTenantForPilot()`)

### Critério de conclusão

- [ ] Logo visível no menu lateral
- [ ] Nome institucional exibido no app shell
- [ ] Contato de suporte preenchido
- [ ] Painel readiness em verde ou amarelo (sem vermelho bloqueante)

### Nota

Branding é **self-service** — não automatizar upload de assets do cliente. O script de provisionamento pode pré-preencher valores default; o cliente personaliza na Etapa 3.

---

## Etapa 4 — Configurar instituição

**Responsável:** TI MedicFlow (estrutura) + admin cliente (parâmetros)  
**Tempo estimado:** 45–60 min (manual) → **20 min** (com seed)  
**Bloqueante:** Sim (unidades + departamentos obrigatórios antes de escalas)

### Estrutura operacional

```
tenants
  └── hospitals (1+ por tenant)
        └── units (mín. 2: ex. UTI, PS)
              └── departments (mín. 2: diurno, noturno)
                    └── schedules → shifts
```

### Procedimento manual — unidades e departamentos

**4.1** Criar unidades (se não feito na Etapa 1):

```sql
INSERT INTO public.units (tenant_id, hospital_id, name, type)
VALUES
  ('<TENANT_ID>', '<HOSPITAL_ID>', 'UTI', 'hospital'),
  ('<TENANT_ID>', '<HOSPITAL_ID>', 'Pronto-Socorro', 'hospital')
RETURNING id, name;
-- Anotar IDs: <UNIT_UTI_ID>, <UNIT_PS_ID>
```

**4.2** Criar departamentos:

```sql
INSERT INTO public.departments (tenant_id, unit_id, name)
VALUES
  ('<TENANT_ID>', '<UNIT_UTI_ID>', 'Plantão Diurno'),
  ('<TENANT_ID>', '<UNIT_PS_ID>', 'Plantão Noturno')
RETURNING id, name;
-- Anotar IDs: <DEPT_DIURNO_ID>, <DEPT_NOTURNO_ID>
```

**4.3** (Opcional — ambiente demo) Aplicar seed TISS demo:

- Rota `/instituicao` → botão "Aplicar seed demo" (`demo_seed:apply`)
- Cria 2 operadoras + 1 contrato (não cria escalas/usuários)

**4.4** (Produção piloto) Cadastrar convênios reais em `/tiss` — responsável financeiro, Dia 1–2.

### Critério de conclusão

- [ ] ≥ 2 unidades criadas
- [ ] ≥ 2 departamentos criados
- [ ] Vínculo unit → department validado
- [ ] Seed TISS demo aplicado (se ambiente demo) OU convênios reais cadastrados

### Automação futura

→ `scripts/seed-pilot-data.mjs` (2 unidades + 2 departamentos)

---

## Etapa 5 — Configurar especialidades

**Responsável:** TI MedicFlow  
**Tempo estimado:** 15–20 min (manual) → **5 min** (automatizado)  
**Bloqueante:** Não (opcional, mas recomendado para demo realista)

### Limitação do produto

**Não existe catálogo de especialidades.** O campo `professionals.specialty` é texto livre.

### Procedimento

**5.1** Definir especialidades do piloto (ex.: Clínica Médica, Cardiologia).

**5.2** Atribuir ao criar registros `professionals` (Etapa 7) ou atualizar:

```sql
UPDATE public.professionals
SET specialty = 'Clínica Médica', crm = 'CRM/SP 123456'
WHERE tenant_id = '<TENANT_ID>' AND profile_id = '<PROFILE_ID>';
```

**5.3** (Opcional) Usar `shifts.role_required` ao criar turnos para filtrar competência futura.

### Critério de conclusão

- [ ] Especialidades definidas para o piloto (mín. 2)
- [ ] Profissionais vinculados com `specialty` preenchida (se aplicável)

### Automação futura

→ `scripts/seed-pilot-data.mjs` (2 especialidades distribuídas entre 10 médicos)

---

## Etapa 6 — Configurar escalistas

**Responsável:** TI MedicFlow + CS (treinamento)  
**Tempo estimado:** 20–30 min (provisionamento) + 30 min (treinamento)  
**Bloqueante:** Sim

### Mapeamento de papel

| Negócio | RBAC | Capabilities-chave |
|---------|------|-------------------|
| Escalista | `coordinator` | `schedules:*`, `shifts:*`, assignments, swaps, TISS write |

### Procedimento

**6.1** Confirmar usuário `coordinator` criado na Etapa 2.

**6.2** (Recomendado) Criar registro `professionals` vinculado ao escalista:

```sql
INSERT INTO public.professionals (tenant_id, profile_id, specialty, crm)
VALUES ('<TENANT_ID>', '<COORDINATOR_USER_ID>', 'Gestão de Escalas', '')
ON CONFLICT (tenant_id, profile_id) DO NOTHING;
```

**6.3** Testar login e menu:

- Rotas visíveis: `/escalas`, `/plantoes`, `/central`, `/tiss`, `/financeiro`
- Rotas **não** visíveis: `/piloto` (go-live), `/lancamento` (smoke — admin only)

**6.4** Agendar treinamento de 30 min (Semana 1, Dia 2–3):

- Criar escala em `/escalas`
- Publicar escala (`draft` → `active`)
- Monitorar alertas em `/central`

### Critério de conclusão

- [ ] Escalista loga com papel `coordinator`
- [ ] Menu operacional completo visível
- [ ] Treinamento agendado ou realizado

---

## Etapa 7 — Configurar médicos

**Responsável:** TI MedicFlow  
**Tempo estimado:** 60–90 min (manual, 8–12 médicos) → **15 min** (automatizado)  
**Bloqueante:** Sim

### Mapeamento de papel

| Negócio | RBAC | Self-service |
|---------|------|:------------:|
| Médico / plantonista | `professional` | `/plantoes`, `/perfil`, `/escalas` (leitura) |

### Procedimento (por médico)

**7.1** Criar no Supabase Auth (Etapa 2, em lote).

**7.2** Inserir `professionals` (obrigatório para aceite de plantões):

```sql
INSERT INTO public.professionals (tenant_id, profile_id, specialty, crm)
VALUES (
  '<TENANT_ID>',
  '<PROFESSIONAL_USER_ID>',
  'Clínica Médica',        -- ou Cardiologia, etc.
  'CRM/SP 100001'
);
```

**7.3** Volume recomendado para piloto realista:

| Artefato | Quantidade |
|----------|:----------:|
| Profissionais (`professional`) | 8–12 |
| Com `professionals` vinculado | 100% |
| Com disponibilidade ativa (D1–2) | ≥ 5 |

**7.4** Entregar credenciais 1:1 (WhatsApp seguro ou call).

**7.5** Orientar médicos:

1. Login em `/login` (selecionar instituição correta)
2. Ativar disponibilidade em `/perfil`
3. Aceitar plantões em `/plantoes`

### Critério de conclusão

- [ ] ≥ 4 médicos provisionados (ideal 8–12)
- [ ] 100% com registro `professionals`
- [ ] ≥ 1 login testado com sucesso
- [ ] Credenciais entregues de forma segura

### Automação futura

→ `scripts/provision-pilot-tenant.mjs` + `scripts/seed-pilot-data.mjs` (10 médicos com especialidades)

---

## Etapa 8 — Publicar primeira escala

**Responsável:** Escalista (`coordinator`)  
**Tempo estimado:** 45–60 min (manual) → **30 min** (com seed pré-carregado)  
**Bloqueante:** Sim

### Pré-requisitos

- Unidades e departamentos criados (Etapa 4)
- Médicos com `professionals` vinculados (Etapa 7)
- Escalista logado como `coordinator`

### Fluxo de publicação

```
createSchedule (status: draft)
    → createShift × N (status: open)
    → updateSchedule (status: active)  ← "publicar"
    → médicos veem turnos em /plantoes
```

### Procedimento na UI (`/escalas`)

**8.1** Criar escala:

- Departamento: ex. Plantão Noturno
- Nome: "Escala Piloto — Semana 1"
- Período: próximos 7–14 dias
- Status inicial: `draft`

**8.2** Adicionar turnos (mín. 5, ideal 15–20):

- Horário início/fim
- Status criado automaticamente: `open`
- Opcional: `role_required` (especialidade)

**8.3** Publicar escala:

- Alterar status de `draft` → `active`
- Turnos ficam visíveis no calendário e em `/plantoes`

**8.4** Validar fluxo ponta a ponta:

1. Médico aceita turno aberto → assignment `pending`
2. Médico confirma → assignment `confirmed`
3. Dashboard `/` exibe KPIs (não vazio)
4. Central `/central` exibe alertas ou status normal

### Volume sugerido (demo realista)

| Artefato | Quantidade |
|----------|:----------:|
| Escalas ativas | 1–2 |
| Turnos (`shifts`) | 15–20 |
| Plantões abertos | 3–5 |
| Confirmações pendentes | 2–3 |
| Aceites testados | ≥ 3 |

### Procedimento SQL alternativo (TI, se seed script disponível)

Ver especificação em [PILOT_READY.md](./PILOT_READY.md#especificação-seed-pilot-datamjs).

### Critério de conclusão

- [ ] ≥ 1 escala com status `active`
- [ ] ≥ 5 turnos com status `open`
- [ ] ≥ 1 aceite de plantão testado
- [ ] ≥ 1 confirmação de plantão testada
- [ ] Dashboard `/` com KPIs visíveis

### Automação futura

→ `scripts/seed-pilot-data.mjs` (20 plantões pré-criados; escalista publica ou script publica automaticamente)

---

## Pós-implantação imediata (mesmo dia)

| Ação | Responsável | Rota / comando |
|------|-------------|----------------|
| Smoke tests 100% | TI MedicFlow | `/lancamento` |
| Health operacional | TI MedicFlow | `/operacao` |
| Demo guiada (7 passos) | CS + admin | `/piloto` |
| Kick-off com equipe | CS | Ver [KICKOFF_CLIENTE_PILOTO.md](./KICKOFF_CLIENTE_PILOTO.md) |
| Declarar go-live | Sponsor + CS | — |

**Comandos finais de validação:**

```bash
npm run auth-validate
npm run seed-validate
```

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [CHECKLIST_IMPLANTACAO.md](./CHECKLIST_IMPLANTACAO.md) | Checklist completo (9 fases) |
| [PILOTO_30_DIAS.md](./PILOTO_30_DIAS.md) | Plano de 30 dias pós go-live |
| [KICKOFF_CLIENTE_PILOTO.md](./KICKOFF_CLIENTE_PILOTO.md) | Kit de kick-off com escopo e limitações |
| [PILOT_READY.md](./PILOT_READY.md) | Relatório de prontidão + specs de automação |
| [MANUAL_INSTITUICAO_MEDICFLOW.md](./MANUAL_INSTITUICAO_MEDICFLOW.md) | Manual do admin |
| [MANUAL_PROFISSIONAL_MEDICFLOW.md](./MANUAL_PROFISSIONAL_MEDICFLOW.md) | Manual do médico |
| [GTM_PILOTO_READY.md](./GTM_PILOTO_READY.md) | Parecer executivo de prontidão |

---

## Histórico de versões

| Versão | Data | Alteração |
|--------|------|-----------|
| V1 | 11/06/2026 | Runbook inicial — 8 etapas com tempos estimados |
