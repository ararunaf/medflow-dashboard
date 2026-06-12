# Checklist de Implantação — Novo Cliente Piloto

**Documento:** GTM-2 — Fase 5  
**Data:** 11/06/2026  
**Versão:** V1  
**Modelo:** Implantação assistida (não self-service)

---

## Como usar este checklist

- Marque cada item conforme concluído (`☐` → `☑`)
- **Responsável:** quem executa a tarefa
- **Bloqueante:** itens marcados com 🔴 impedem go-live se não concluídos
- Tempo estimado total: **2–3 dias úteis** (setup) + **30 dias** (piloto)

---

## Fase 0 — Pré-venda e alinhamento comercial

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 0.1 | Contrato/NDA de piloto assinado | Comercial | 🔴 | ☐ |
| 0.2 | Escopo alinhado: operação + TISS MVP (sem EHR/prontuário) | Comercial + sponsor | 🔴 | ☐ |
| 0.3 | Segmento identificado (hospital / cooperativa / escalas / plantonistas) | Comercial | | ☐ |
| 0.4 | Sponsor interno nomeado no cliente | Cliente | 🔴 | ☐ |
| 0.5 | Equipe piloto mapeada (admin, escalista, N médicos, financeiro) | Cliente | 🔴 | ☐ |
| 0.6 | Calendário de 30 dias acordado | CS + sponsor | | ☐ |
| 0.7 | Ambiente definido (staging dedicado ou produção piloto) | TI MedicFlow | 🔴 | ☐ |

---

## Fase 1 — Infraestrutura e tenant (Dia 0)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 1.1 | Projeto Supabase ativo com migrations aplicadas (`npx supabase db push`) | TI MedicFlow | 🔴 | ☐ |
| 1.2 | Variáveis de ambiente configuradas (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) | TI MedicFlow | 🔴 | ☐ |
| 1.3 | Deploy Cloudflare/Vercel funcional | TI MedicFlow | 🔴 | ☐ |
| 1.4 | `MEDFLOW_OPENAI_API_KEY` configurada (se IA Copilot no piloto) | TI MedicFlow | | ☐ |
| 1.5 | Registro `tenants` criado (slug, name, type) | TI MedicFlow | 🔴 | ☐ |
| 1.6 | `tenant_settings` inicializado | TI MedicFlow | 🔴 | ☐ |
| 1.7 | Bootstrap admin executado e **credenciais rotacionadas** | TI MedicFlow | 🔴 | ☐ |
| 1.8 | Bucket `tenant-branding` acessível | TI MedicFlow | | ☐ |
| 1.9 | RLS validado (`scripts/auth-validate.mjs` ou equivalente) | TI MedicFlow | 🔴 | ☐ |
| 1.10 | URL de acesso comunicada ao cliente | CS | | ☐ |

**SQL mínimo — tenant:**

```sql
-- Exemplo ilustrativo — ajustar valores reais
INSERT INTO tenants (slug, name, type) VALUES ('cliente-piloto', 'Hospital Cliente', 'hospital');
-- tenant_settings vinculado ao tenant_id gerado
```

---

## Fase 2 — Estrutura operacional (Dia 0–1)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 2.1 | Unidades criadas (mín. 2: ex. UTI, PS) | TI MedicFlow ou escalista | 🔴 | ☐ |
| 2.2 | Departamentos/setores criados (mín. 2: diurno, noturno) | TI MedicFlow ou escalista | 🔴 | ☐ |
| 2.3 | Seed demo TISS aplicado (se ambiente demo) | Admin | | ☐ |
| 2.4 | Convênios reais cadastrados (se produção piloto) | Admin / financeiro | | ☐ |
| 2.5 | Procedimentos TUSS cadastrados (mín. 10) | Financeiro | | ☐ |
| 2.6 | Regras de repasse (`payout_rules`) inseridas via SQL | TI MedicFlow | | ☐ |

**Dependência:** unidades + departamentos são **obrigatórios** antes de criar escalas.

---

## Fase 3 — Usuários e perfis (Dia 0–1)

> **Não existe UI de cadastro.** Todo usuário é provisionado via Supabase Auth + SQL.

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 3.1 | Usuário `tenant_admin` criado (Auth + `profiles`) | TI MedicFlow | 🔴 | ☐ |
| 3.2 | Usuário `coordinator` (escalista) criado | TI MedicFlow | 🔴 | ☐ |
| 3.3 | Usuários `professional` criados (mín. 4 para piloto; ideal 8–12) | TI MedicFlow | 🔴 | ☐ |
| 3.4 | Usuário `financial` criado (se módulo TISS no piloto) | TI MedicFlow | | ☐ |
| 3.5 | Registros `professionals` vinculados (CRM, especialidade opcional) | TI MedicFlow | 🔴 | ☐ |
| 3.6 | `profiles.tenant_id` conferido = tenant do piloto | TI MedicFlow | 🔴 | ☐ |
| 3.7 | Credenciais entregues de forma segura (1:1, não e-mail em massa) | CS | 🔴 | ☐ |
| 3.8 | Login testado para cada perfil | CS | 🔴 | ☐ |
| 3.9 | Recuperação de senha testada | CS | | ☐ |

**Papéis mínimos para piloto:**

| Papel RBAC | Qtd mínima | Função |
|------------|:----------:|--------|
| `tenant_admin` | 1 | Branding, piloto, go-live |
| `coordinator` | 1 | Escalas e central |
| `professional` | 4 | Aceite de plantões |
| `financial` | 1 | TISS e fechamento |

**Checklist por usuário:**

```
☐ Criado no Supabase Auth (email + senha)
☐ Registro em profiles (id, tenant_id, role, full_name)
☐ Registro em professionals (se role = professional ou coordinator)
☐ Login bem-sucedido em /login (instituição correta selecionada)
☐ Menu correto para o papel (RBAC)
```

---

## Fase 4 — Configuração institucional (Dia 1)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 4.1 | Logo uploadado | Admin cliente | | ☐ |
| 4.2 | Nome institucional configurado | Admin cliente | 🔴 | ☐ |
| 4.3 | E-mail e telefone de suporte | Admin cliente | | ☐ |
| 4.4 | Fuso horário (`America/Sao_Paulo`) | Admin cliente | | ☐ |
| 4.5 | Painel readiness em `/instituicao` revisado | Admin cliente | | ☐ |
| 4.6 | Demo guiada iniciada (7 passos) | CS + admin | | ☐ |

---

## Fase 5 — Dados operacionais iniciais (Dia 1–2)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 5.1 | 1ª escala criada e publicada | Escalista | 🔴 | ☐ |
| 5.2 | Mín. 5 turnos com status `open` | Escalista | 🔴 | ☐ |
| 5.3 | Mix de status: open + pending + confirmed (ideal) | Escalista | | ☐ |
| 5.4 | ≥ 3 profissionais com disponibilidade ativa | Profissionais | | ☐ |
| 5.5 | ≥ 1 aceite de plantão testado | Profissional | 🔴 | ☐ |
| 5.6 | ≥ 1 confirmação de plantão testada | Profissional | 🔴 | ☐ |
| 5.7 | Dashboard `/` exibe KPIs (não vazio) | CS | | ☐ |
| 5.8 | Central `/central` exibe alertas ou status normal | Escalista | | ☐ |

**Volume sugerido para demo realista:**

| Artefato | Quantidade |
|----------|:----------:|
| Escalas | 2–3 |
| Turnos (shifts) | 15–20 |
| Plantões abertos | 3–5 |
| Confirmações pendentes | 2–3 |
| Swaps pendentes | 1–2 |
| Profissionais | 8–12 |

---

## Fase 6 — Dados financeiros e TISS (Dia 2–3)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 6.1 | Convênios cadastrados (≥ 2) | Financeiro | | ☐ |
| 6.2 | Contratos e regras vinculados | Financeiro | | ☐ |
| 6.3 | Guias TISS criadas (≥ 5) | Financeiro | | ☐ |
| 6.4 | Lote TISS criado e export XML testado | Financeiro | | ☐ |
| 6.5 | Competência financeira aberta | Financeiro | | ☐ |
| 6.6 | Dashboard executivo `/executivo` com KPIs | Financeiro + sponsor | | ☐ |

---

## Fase 7 — Validação técnica (Dia 3)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 7.1 | Smoke tests em `/lancamento` — 100% passando | TI MedicFlow | 🔴 | ☐ |
| 7.2 | Health operacional OK em `/operacao` | TI MedicFlow | 🔴 | ☐ |
| 7.3 | Realtime funcionando (dashboard atualiza) | TI MedicFlow | | ☐ |
| 7.4 | IA Central acessível (escalista/admin) | CS | | ☐ |
| 7.5 | Copilot responde (se API key configurada) | CS | | ☐ |
| 7.6 | Export de backup operacional testado | TI MedicFlow | | ☐ |
| 7.7 | Documentação entregue ao cliente (manuais) | CS | | ☐ |

**Manuais a entregar:**

- `docs/MANUAL_INSTITUICAO_MEDICFLOW.md`
- `docs/MANUAL_PROFISSIONAL_MEDICFLOW.md`
- `docs/PILOTO_30_DIAS.md`

---

## Fase 8 — Kick-off e go-live (Dia 3–4)

| # | Item | Responsável | Bloqueante | ☐ |
|---|------|-------------|:----------:|---|
| 8.1 | Kick-off realizado com sponsor + equipe | CS | 🔴 | ☐ |
| 8.2 | Escopo e limitações comunicados (sem EHR, TISS manual) | CS | 🔴 | ☐ |
| 8.3 | Treinamento admin (30 min) | CS | | ☐ |
| 8.4 | Treinamento escalista (30 min) | CS | | ☐ |
| 8.5 | Treinamento médicos (15 min, async ou live) | Escalista + CS | | ☐ |
| 8.6 | Treinamento financeiro (45 min, se aplicável) | CS | | ☐ |
| 8.7 | Canal de suporte definido (WhatsApp, e-mail, ticket) | CS | 🔴 | ☐ |
| 8.8 | Calendário de checkpoints semanais confirmado | CS | | ☐ |
| 8.9 | **GO-LIVE declarado** | Sponsor + CS | 🔴 | ☐ |

---

## Fase 9 — Acompanhamento piloto (Dias 4–30)

| # | Item | Responsável | Frequência | ☐ |
|---|------|-------------|------------|---|
| 9.1 | Checkpoint semanal (D7, D14, D21, D28) | CS | Semanal | ☐ |
| 9.2 | Coleta feedback em `/piloto` | Admin | D24 | ☐ |
| 9.3 | Registro incidentes em `/piloto` | Admin | Contínuo | ☐ |
| 9.4 | Métricas consolidadas (ver PILOTO_30_DIAS.md) | CS | D28 | ☐ |
| 9.5 | Apresentação resultados ao sponsor | CS + Comercial | D29 | ☐ |
| 9.6 | Decisão GO / NO-GO / extensão | Sponsor | D30 | ☐ |

---

## Checklist rápido — dados mínimos para demo realista

Use como referência ao preparar o ambiente antes do kick-off:

### Instituição
- [ ] Tenant com slug único
- [ ] Branding (logo + cores)
- [ ] Nome + contato configurados
- [ ] 2+ unidades, 2+ departamentos

### Médicos / profissionais
- [ ] 8–12 usuários `professional` com `professionals` vinculado
- [ ] 1–2 `coordinator`
- [ ] 1 `tenant_admin`
- [ ] 1 `financial` (se TISS no escopo)
- [ ] CRM/especialidade opcional (texto livre)

### Especialidades
- [ ] N/A — campo texto em `professionals` (sem catálogo)

### Escalas
- [ ] 2–3 schedules publicadas
- [ ] Vinculadas a unidade + departamento

### Plantões
- [ ] 15–20 shifts (mix open/pending/confirmed)
- [ ] 3–5 abertos para captação
- [ ] 2–3 confirmações pendentes
- [ ] 1–2 swaps pendentes

### Produção
- [ ] Registros `medical_production` para plantões executados
- [ ] Vinculados a profissionais e competência

### Financeiro
- [ ] Competência aberta
- [ ] Snapshot gerado (ideal)
- [ ] Repasses calculados (se `payout_rules` configuradas)

### TISS
- [ ] 2 convênios
- [ ] 5–10 guias em status variados
- [ ] 1–2 lotes
- [ ] 1 export XML
- [ ] 2–3 glosas (manual)

---

## Bloqueadores conhecidos — não contornáveis sem desenvolvimento

| Bloqueador | Workaround atual |
|------------|------------------|
| Sem cadastro self-service | Provisionamento manual Supabase + SQL |
| Sem UI gestão de usuários | Runbook SQL documentado no manual |
| Sem push/e-mail de plantões | Comunicação externa (WhatsApp) + link `/plantoes` |
| XML TISS não ANS-compliant | Demo de export; envio manual à operadora |
| Sem envio automático TISS | Processo manual pós-export |
| Hub `/financeiro` com KPIs ilustrativos | Usar `/executivo` para KPIs reais |

---

## Referências

- [GTM_PILOTO_READY.md](./GTM_PILOTO_READY.md) — parecer de prontidão
- [PILOTO_30_DIAS.md](./PILOTO_30_DIAS.md) — plano de 30 dias
- [MANUAL_INSTITUICAO_MEDICFLOW.md](./MANUAL_INSTITUICAO_MEDICFLOW.md)
- [LOCAL_SETUP.md](../LOCAL_SETUP.md) — setup técnico local
- [deploy-checklist.md](./deploy-checklist.md) — deploy staging/produção

---

*Documento gerado em 11/06/2026 — GTM-2 Fase 5.*
