# GTM Piloto Ready — Parecer Executivo de Prontidão

**Documento:** GTM-2 — Relatório Consolidado  
**Data:** 11/06/2026  
**Versão:** V1  
**Escopo da auditoria:** Prontidão operacional para pilotos comerciais (sem alteração de regras de negócio, IA, banco, Supabase ou arquitetura)  
**Ambiente de referência:** `https://staging.medicflow.app.br`  
**Commit auditado:** `e7db791` (auditorias 08–11/06/2026)

---

## Sumário executivo

O MedicFlow-AI está **pronto para pilotos comerciais assistidos** no escopo **operacional + TISS MVP + IA operacional**, desde que a implantação seja conduzida pela equipe MedicFlow com provisionamento manual de tenant e usuários.

**Veredito:** **GO CONDICIONAL** para piloto de 30 dias com hospitais, cooperativas, gestores de escala e grupos de plantonistas — **não GO** para onboarding self-service ou escopo clínico (EHR/prontuário).

| Dimensão | Status | Nota |
|----------|--------|:----:|
| Operação (escalas, plantões, central) | ✅ Pronto | L4 Operacional |
| IA operacional (central, alertas, copilot) | ✅ Pronto com ressalvas | Requer API key OpenAI |
| TISS MVP (CRUD, XML export) | ⚠️ Parcial | Manual pós-export |
| Financeiro (fechamento, executivo) | ✅ Pronto | Hub landing ilustrativo |
| Onboarding institucional | ⚠️ Parcial | Sem self-service |
| Módulo clínico (pacientes/prontuário) | ❌ Inexistente | Fora do escopo piloto |

---

## Respostas às quatro perguntas-chave

### 1. O MedicFlow-AI está pronto para piloto?

**Sim, condicionalmente.**

O produto suporta um piloto real de 30 dias nos segmentos-alvo quando:

- A implantação é **assistida** (2–3 dias de setup pela equipe MedicFlow)
- O escopo comercial exclui **prontuário eletrônico, pacientes e envio automático TISS**
- O cliente aceita **provisionamento manual** de usuários e profissionais
- A equipe de escalistas e admins recebe treinamento de 30–45 minutos

**Evidências de prontidão:**

- 20 rotas implementadas, 12 screenshots validados em staging
- Fluxo completo escala → plantão → confirmação → swap
- Central de IA Operacional com alertas, agentes e copilot
- TISS end-to-end (convênio → guia → lote → XML)
- Fechamento financeiro com snapshot e trava
- Hub `/piloto` com checklist, demo guiada (7 passos), feedback e smoke tests
- RBAC com 5 papéis e 30+ capabilities
- Documentação corporativa completa (manuais, workflows, demo comercial)

### 2. O que ainda impede implantação?

| # | Impedimento | Impacto | Contornável no piloto? |
|---|-------------|---------|:----------------------:|
| 1 | **Sem cadastro self-service** | Cliente não inicia sozinho | ✅ Sim — implantação assistida |
| 2 | **Sem UI de gestão de usuários/profissionais** | Cada médico exige SQL + Supabase Auth | ✅ Sim — runbook manual |
| 3 | **Sem criação de tenant na UI** | Instituição criada via SQL | ✅ Sim — TI MedicFlow |
| 4 | **Seed demo limitado** (2 operadoras TISS) | Não popula escalas/plantões | ✅ Sim — criação manual ou SQL |
| 5 | **Sem push/e-mail** para convocação | Baixa adesão de médicos | ⚠️ Parcial — WhatsApp + links |
| 6 | **XML TISS não ANS-compliant** | Não substitui sistema de faturamento | ⚠️ Parcial — demo de export |
| 7 | **Sem envio TISS à operadora** | Processo manual | ⚠️ Parcial — escopo V1 documentado |
| 8 | **Módulos Pacientes/Prontuário inexistentes** | Expectativa clínica não atendida | ❌ Não — alinhar escopo |
| 9 | **`payout_rules` sem UI** | Repasse requer SQL | ✅ Sim — TI configura antes |
| 10 | **Bootstrap credentials em migration** | Risco de segurança | ✅ Sim — rotacionar antes do piloto |

**Conclusão:** Nenhum impedimento bloqueia piloto **assistido** no escopo operacional. Os bloqueadores críticos afetam **escala** (muitos clientes simultâneos) e **self-service**, não a viabilidade do primeiro piloto.

### 3. Quais riscos existem?

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:-------------:|:-------:|-----------|
| **Baixa adesão de médicos** (sem notificações push) | Alta | Alto | Comunicação ativa do escalista; links diretos; meta DAU ≥ 40% |
| **Expectativa de prontuário/EHR** | Média | Alto | Kick-off com escopo explícito; material comercial atualizado |
| **Setup manual demorado** (> 3 dias) | Média | Médio | Pré-carregar dados; checklist de implantação |
| **Copilot IA indisponível** (sem API key) | Baixa | Médio | Confirmar env; fallback para alertas sem LLM |
| **Credenciais bootstrap expostas** | Baixa | Crítico | Rotacionar antes de qualquer piloto real |
| **XML TISS rejeitado por operadora** | Alta | Médio | Posicionar como MVP; não prometer conformidade ANS |
| **Hub financeiro com KPIs fictícios** | Média | Baixo | Direcionar para `/executivo` (KPIs reais) |
| **Dependência de staging compartilhado** | Média | Médio | Tenant isolado por cliente; RLS validado |
| **Incidente operacional sem error tracking** | Baixa | Médio | Monitorar `/operacao`; canal suporte dedicado |
| **Churn pós-piloto por falta de autonomia** | Média | Alto | Roadmap transparente; CS proativo semanas 3–4 |

### 4. Quais melhorias são recomendadas antes do primeiro cliente?

Priorizadas por impacto no sucesso do **primeiro** piloto (sem alterar arquitetura/banco):

| Prioridade | Melhoria | Esforço | Impacto no piloto |
|:----------:|----------|:-------:|:-----------------:|
| 🔴 P0 | **Rotacionar credenciais bootstrap** | 1h | Segurança |
| 🔴 P0 | **Runbook SQL de provisionamento** (tenant + users + professionals) | 1–2 dias | Reduz setup de 3 para 1,5 dias |
| 🔴 P0 | **Script de seed operacional** (unidades, escalas, 15 turnos) | 2–3 dias | Demo realista sem criação manual |
| 🟠 P1 | **Pacote de credenciais seguras** (template + entrega 1:1) | 4h | Experiência de primeiro login |
| 🟠 P1 | **Confirmar `MEDFLOW_OPENAI_API_KEY`** no ambiente piloto | 1h | IA Copilot funcional |
| 🟠 P1 | **Material kick-off** (1-pager escopo + limitações) | 4h | Alinhamento de expectativa |
| 🟡 P2 | Tour 60s Central de IA (roadmap) | 3–5 dias | Ativação pós-login |
| 🟡 P2 | Artigos Ajuda: Copilot, agentes, propostas | 2 dias | Autodescoberta |
| 🟡 P2 | Substituir KPIs ilustrativos em `/financeiro` | 1–2 dias | Credibilidade financeira |

> **Nota:** UI de cadastro de profissionais e signup self-service são recomendados para **escala pós-piloto**, não como pré-requisito do primeiro cliente assistido.

---

# FASE 1 — Auditoria de Onboarding

## Pergunta central: um cliente consegue iniciar sozinho?

**Resposta: Não.**

O MedicFlow-AI opera em modelo **B2B assistido**. Não existe fluxo de cadastro, criação de tenant ou convite de profissionais self-service.

## Mapa do fluxo de onboarding

```
/site (marketing)
    ↓ [manual]
SQL: tenant + admin bootstrap
    ↓ [manual]
Supabase Auth: usuários + profiles + professionals
    ↓ [self-service]
/login → / (dashboard)
    ↓ [admin self-service]
/piloto (checklist + demo 7 passos)
/instituicao (branding + readiness)
    ↓ [coordinator self-service]
/escalas (1ª escala + turnos)
    ↓ [professional self-service]
/plantoes (aceitar + confirmar)
    ↓ [admin self-service]
/lancamento (smoke tests) → go-live
```

## Detalhamento por etapa

| Etapa | Self-service? | Rota / mecanismo | Gargalo |
|-------|:-------------:|------------------|---------|
| **Cadastro** | ❌ Não | Não existe — apenas `/site` marketing | Sem signup |
| **Login** | ✅ Sim | `/login` — instituição + email + senha | Requer perfil pré-provisionado |
| **Primeiro acesso** | ⚠️ Parcial | `/` + banner piloto (admin) | Profissional vê dashboard vazio |
| **Configuração inicial** | ⚠️ Parcial | `/piloto`, `/instituicao` | Tenant já deve existir |
| **Criação de instituição** | ❌ Não | SQL bootstrap | Sem UI de criação |
| **Cadastro de profissionais** | ❌ Não | Supabase Auth + SQL | Sem UI admin |
| **Primeira escala** | ✅ Sim | `/escalas` (coordinator) | Requer units/departments |
| **Primeiro plantão** | ✅ Sim | `/escalas` → `/plantoes` | Requer professionals vinculados |

## Gargalos identificados

| # | Gargalo | Severidade | Quem resolve |
|---|---------|:----------:|--------------|
| 1 | Provisionamento de tenant (SQL) | 🔴 Crítico | TI MedicFlow |
| 2 | Criação de usuários sem UI | 🔴 Crítico | TI MedicFlow |
| 3 | Vínculo `profiles` ↔ `professionals` | 🔴 Crítico | TI MedicFlow |
| 4 | Units/departments sem UI clara | 🟠 Alto | TI ou escalista |
| 5 | Dashboard vazio no D1 | 🟠 Alto | Pré-carregar turnos |
| 6 | Demo guiada só em sessionStorage | 🟡 Baixo | Reiniciar se nova sessão |
| 7 | Onboarding prefs em localStorage | 🟡 Baixo | Não sincroniza dispositivos |
| 8 | Sem tour interativo 60s | 🟡 Baixo | Roadmap |

## Ferramentas de onboarding existentes (pontos positivos)

- **Demo guiada** — 7 passos navegáveis (`/piloto` → `/` → `/central` → `/executivo` → `/tiss` → `/instituicao` → `/operacao`)
- **Checklist de implantação** — painel em `/piloto` + banner na home
- **Smoke tests** — `/lancamento` valida conectividade
- **Manuais** — instituição e profissional com screenshots
- **Central de ajuda** — `/ajuda` com guias estáticos
- **Readiness panel** — `/instituicao` exibe indicadores

---

# FASE 2 — Auditoria de Dados

## Dados necessários para demo/piloto realista

### Dependências entre entidades

```
tenants → tenant_settings, units, departments
       → profiles (via Auth) → professionals
units + departments → schedules → shifts
professionals + shifts → shift_assignments, availability, swaps
shifts (executados) → medical_production
insurance_providers → contracts → rules → tiss_guides → batches
financial_closings → snapshots → medical_payouts
```

### Checklist de dados — demo realista

#### Instituição
| Item | Obrigatório | Método |
|------|:-----------:|--------|
| Tenant (slug, name, type) | ✅ | SQL |
| tenant_settings (nome, contato) | ✅ | `/instituicao` |
| Branding (logo, cores) | Recomendado | `/instituicao` |
| 2+ unidades (UTI, PS, etc.) | ✅ | SQL ou contexto escalas |
| 2+ departamentos (diurno, noturno) | ✅ | SQL ou contexto escalas |

#### Médicos / profissionais
| Item | Obrigatório | Método |
|------|:-----------:|--------|
| Auth user + profile | ✅ | Supabase + SQL |
| Registro professionals | ✅ (para plantões) | SQL |
| CRM / especialidade | Opcional | SQL (texto livre) |
| Volume piloto: 8–12 profissionais | Recomendado | SQL |
| 1 admin + 1 escalista + 1 financeiro | ✅ | SQL |

#### Especialidades
| Item | Status |
|------|--------|
| Catálogo de especialidades | ❌ Não existe |
| Campo texto em professionals | ✅ Opcional |

#### Escalas
| Item | Obrigatório | Volume demo |
|------|:-----------:|:-----------:|
| Schedules publicadas | ✅ | 2–3 |
| Vínculo unit + department | ✅ | — |

#### Plantões
| Item | Obrigatório | Volume demo |
|------|:-----------:|:-----------:|
| Shifts | ✅ | 15–20 |
| Status mix (open/pending/confirmed) | Recomendado | 3–5 abertos |
| Assignments | Recomendado | 2–3 pendentes |
| Swaps | Opcional | 1–2 |
| Disponibilidade ativa | Recomendado | 5–8 profissionais |

#### Produção
| Item | Obrigatório | Volume demo |
|------|:-----------:|:-----------:|
| medical_production | Para repasse | 3+ registros |
| Vínculo plantão executado | ✅ | — |

#### Financeiro
| Item | Obrigatório | Volume demo |
|------|:-----------:|:-----------:|
| Competência aberta | ✅ | 1 mês |
| Snapshot | Recomendado | 1 |
| payout_rules | Para repasses | SQL |
| Conciliação CSV | Opcional | 1 amostra |

#### TISS
| Item | Obrigatório | Volume demo |
|------|:-----------:|:-----------:|
| Convênios | ✅ | 2 (seed ou real) |
| Contratos + regras | Recomendado | 1+ |
| Procedimentos TUSS | Recomendado | 10–20 |
| Guias TISS | Recomendado | 5–10 |
| Lotes + export XML | Recomendado | 1–2 |
| Glosas (manual) | Opcional | 2–3 |

### Seed existente vs. necessidade

| Recurso | O que faz | Lacuna |
|---------|-----------|--------|
| `demo_seed:apply` em `/instituicao` | 2 operadoras + 1 contrato | Não cria escalas/plantões/usuários |
| Bootstrap SQL | Admin super_admin | Credenciais hardcoded |
| Guided demo | Tour de 7 rotas | Zero seeding de dados |
| Staging pré-carregado | Cenário comercial completo | Manual, não reproduzível via UI |

**Tempo de setup estimado:**

| Cenário | Tempo |
|---------|:-----:|
| Com runbook + seed script (recomendado P0) | 1–1,5 dias |
| Manual completo (estado atual) | 2–3 dias |
| Demo comercial (staging pronto) | 0 dias |

---

# FASE 3 — Piloto de 30 Dias

Documento completo: **[PILOTO_30_DIAS.md](./PILOTO_30_DIAS.md)**

| Semana | Foco | Meta principal |
|:------:|------|----------------|
| **1** | Fundação e ativação | 1 escala + 3 aceites + smoke OK |
| **2** | Operação e IA | 10 plantões confirmados + Central em uso |
| **3** | Financeiro e TISS | Competência aberta + 1 XML export |
| **4** | Consolidação e decisão | NPS ≥ 7 + decisão GO/NO-GO |

---

# FASE 4 — Critérios de Sucesso

## 4.1 Adoção

| Métrica | Meta piloto | Medição |
|---------|:-----------:|---------|
| Taxa de login (usuários provisionados) | ≥ 90% | Audit + confirmação |
| DAU médio (30 dias) | ≥ 40% | Sessões / usuários |
| Profissionais com ≥ 1 aceite | ≥ 60% | Assignments |
| Escalista acessos/semana | ≥ 3 | Navegação |
| Tempo até 1º aceite (desde go-live) | ≤ 72h | Timestamps |

## 4.2 Uso da IA

| Métrica | Meta piloto | Medição |
|---------|:-----------:|---------|
| Acessos à Central de IA (escalista/admin) | ≥ 15 sessões | Navegação |
| Alertas visualizados | ≥ 80% emitidos | Central |
| Propostas IA revisadas | ≥ 5 | Painel propostas |
| Copilot — perguntas feitas | ≥ 3 | Sessões (se API key) |
| Satisfação IA (feedback piloto) | ≥ 7/10 | `/piloto` feedback |

## 4.3 Cobertura de escalas

| Métrica | Meta piloto | Medição |
|---------|:-----------:|---------|
| Plantões publicados (30 dias) | ≥ 30 | Shifts |
| Taxa confirmação global | ≥ 75% | confirmed / aceitos |
| Plantões abertos não preenchidos (fim de semana) | ≤ 20% | Status open |
| Tempo médio aceite → confirmação | < 24h | Assignments |
| Swaps resolvidos | ≥ 70% | Swap requests |

## 4.4 Engajamento

| Métrica | Meta piloto | Medição |
|---------|:-----------:|---------|
| NPS piloto | ≥ 7 | Survey D24 |
| Feedback registrado em `/piloto` | ≥ 5 entradas | pilot_feedback |
| Incidentes críticos | 0 | pilot_incidents |
| Checkpoints semanais realizados | 4/4 | CS |
| Sugestões registradas | ≥ 3 | pilot_suggestions |

## 4.5 Operação

| Métrica | Meta piloto | Medição |
|---------|:-----------:|---------|
| Smoke tests (início e fim) | 100% pass | `/lancamento` |
| Uptime percebido | ≥ 99% | `/operacao` health |
| Tempo resposta suporte L1 | < 4h úteis | CS |
| Competência financeira processada | 1 ciclo | Fechamento |
| Export TISS XML | ≥ 1 | `/tiss` |

### Scorecard de decisão (D30)

| Score | Resultado |
|:-----:|-----------|
| ≥ 70% métricas atingidas | **GO comercial** |
| 50–69% | **Extensão +30 dias** |
| < 50% | **NO-GO** ou replanejamento |

---

# FASE 5 — Checklist de Implantação

Documento completo: **[CHECKLIST_IMPLANTACAO.md](./CHECKLIST_IMPLANTACAO.md)**

**9 fases, 70+ itens verificáveis:**

0. Pré-venda e alinhamento  
1. Infraestrutura e tenant  
2. Estrutura operacional (units/departments)  
3. Usuários e perfis (manual)  
4. Configuração institucional  
5. Dados operacionais iniciais  
6. Dados financeiros e TISS  
7. Validação técnica (smoke + health)  
8. Kick-off e go-live  
9. Acompanhamento piloto (D4–30)

---

# FASE 6 — Matriz de prontidão por segmento

| Segmento | Pronto? | Rotas-chave | Ressalva principal |
|----------|:-------:|-------------|-------------------|
| **Hospital / UPA** | ✅ | `/escalas`, `/central`, `/tiss` | Sem EHR; TISS manual |
| **Cooperativa médica** | ✅ | `/plantoes`, `/tiss`, `/executivo` | Repasses via SQL inicial |
| **Gestão de escalas** | ✅ | `/escalas`, `/plantoes`, `/central` | Sem import Excel |
| **Grupo de plantonistas** | ⚠️ | `/plantoes`, `/perfil` | Sem push; IA limitada para médico |

---

# Decisão final

## STATUS: **GO CONDICIONAL**

### Condições para execução do primeiro piloto

| # | Condição | Status |
|---|----------|:------:|
| 1 | Implantação assistida (não self-service) | ✅ Modelo definido |
| 2 | Escopo operacional + TISS MVP (sem EHR) | ✅ Documentado |
| 3 | Credenciais bootstrap rotacionadas | ☐ A executar |
| 4 | Runbook de provisionamento pronto | ☐ Recomendado P0 |
| 5 | Ambiente isolado por tenant (RLS) | ✅ Arquitetura existente |
| 6 | CS + sponsor alocados | ☐ Comercial |
| 7 | Checklists e plano 30 dias entregues | ✅ Este pacote GTM-2 |

### O que está pronto

- ✅ Operação diária (escalas, plantões, central, swaps)
- ✅ IA operacional visível (central, alertas, copilot*)
- ✅ TISS MVP (CRUD + export XML)
- ✅ Financeiro (fechamento, executivo, conciliação CSV)
- ✅ Piloto assistido (checklist, demo, feedback, smoke)
- ✅ Documentação corporativa (manuais, workflows, 12 screenshots)
- ✅ Staging validado (`staging.medicflow.app.br`)

*Copilot requer `MEDFLOW_OPENAI_API_KEY`

### O que NÃO está pronto (e não bloqueia piloto assistido)

- ❌ Onboarding self-service
- ❌ UI gestão de usuários/profissionais
- ❌ Módulo pacientes/prontuário
- ❌ Envio automático TISS
- ❌ XML ANS-compliant
- ❌ Notificações push/e-mail
- ❌ Import em massa de escalas

---

## Entregáveis GTM-2

| # | Documento | Caminho | Fase |
|---|-----------|---------|:----:|
| 1 | Plano piloto 30 dias | `docs/PILOTO_30_DIAS.md` | 3 |
| 2 | Checklist implantação | `docs/CHECKLIST_IMPLANTACAO.md` | 5 |
| 3 | Parecer executivo | `docs/GTM_PILOTO_READY.md` | 6 |

---

## Referências cruzadas

| Documento | Conteúdo |
|-----------|----------|
| [MANUAL_INSTITUICAO_MEDICFLOW.md](./MANUAL_INSTITUICAO_MEDICFLOW.md) | Implantação detalhada |
| [MANUAL_PROFISSIONAL_MEDICFLOW.md](./MANUAL_PROFISSIONAL_MEDICFLOW.md) | Jornada do médico |
| [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md) | Roteiro de demo |
| [MAPA_DE_MATURIDADE.md](./MAPA_DE_MATURIDADE.md) | 73% conclusão, L4 operacional |
| [DOCUMENTACAO_FINAL_STATUS.md](./DOCUMENTACAO_FINAL_STATUS.md) | NO-GO escopo EHR |
| [PRONTIDAO_COMERCIAL_IA.md](./PRONTIDAO_COMERCIAL_IA.md) | IA pronta para pilotos |
| [LOCAL_SETUP.md](../LOCAL_SETUP.md) | Setup técnico |

---

*Parecer emitido em 11/06/2026 — GTM-2 Preparação para Piloto Comercial. Revisar após primeiro piloto real ou implementação dos itens P0.*
