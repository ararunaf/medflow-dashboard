# Roadmap Final — Trabalho Restante MedicFlow-AI

**Data:** 08/06/2026  
**Baseline:** commit `e7db791` — produto **73% concluído** (escopo operacional)  
**Referências:** [AUDITORIA_COMPLETA_MEDICFLOW.md](./AUDITORIA_COMPLETA_MEDICFLOW.md) · [MAPA_DE_MATURIDADE.md](./MAPA_DE_MATURIDADE.md)

---

## Visão do que falta

O MedicFlow-AI está **maduro para piloto operacional** (plantões, TISS training, financeiro operacional, implantação). Para **produção enterprise** faltam hardening, gestão de usuários e integrações regulatórias. Para **escopo clínico (EHR)** falta **100% do módulo** — estimativa separada de 4–8 meses.

---

## Fase A — MVP operacional (3–5 semanas)

*Objetivo: go-live seguro do escopo V1 operacional em staging → produção*

### CRÍTICO

| # | Entrega | Esforço | Módulos | Critério de done |
|---|---------|---------|---------|------------------|
| A1 | **UI gestão de usuários/profissionais** | 1–2 sem | Gestão usuários | CRUD profiles + invite/reset via admin |
| A2 | **Secrets e env produção** | 2–3 dias | Infra | Zero placeholders; smoke-check prod verde |
| A3 | **Rotacionar credenciais bootstrap** | 1 dia | Segurança | Remover senha hardcoded da migration; seed externo |
| A4 | **Teste RLS cross-tenant runtime** | 2–3 dias | Multi-tenant | `multi-tenant-auth-validate` passando em staging |
| A5 | **Formalizar escopo V1** | 1 dia | Produto | Documento contratual: operacional sim, EHR não |

### IMPORTANTE

| # | Entrega | Esforço | Módulos | Critério de done |
|---|---------|---------|---------|------------------|
| A6 | **Substituir KPIs estáticos `/financeiro`** | 2–3 dias | Financeiro | StatCards com dados reais ou remover |
| A7 | **Error tracking (Sentry/Datadog)** | 3–5 dias | Infra | Substituir stub em `error-tracker.ts` |
| A8 | **Testes mínimos Vitest** | 1 sem | Testes | route-guard, rbac, auth-actions, TISS crítico |
| A9 | **Configurar OpenAI (se Copilot obrigatório)** | 1 dia | Integrações IA | `MEDFLOW_OPENAI_API_KEY` em prod |

### OPCIONAL (Fase A)

| # | Entrega | Esforço |
|---|---------|---------|
| A10 | Habilitar notificações realtime no perfil | 3–5 dias |
| A11 | Remover hook órfão `use-debounced-value` ou usar em `/ajuda` | 1h |
| A12 | Consolidar formatadores `moneyBrl` | 2h |

---

## Fase B — Produção operacional (6–10 semanas total, +3–5 após MVP)

*Objetivo: compliance TISS, observabilidade e integrações financeiras*

### CRÍTICO

| # | Entrega | Esforço | Módulos |
|---|---------|---------|---------|
| B1 | **XML TISS layout ANS** | 2–3 sem | TISS |
| B2 | **Processo envio TISS** (API operadora ou manual formalizado) | 2–4 sem | TISS |

### IMPORTANTE

| # | Entrega | Esforço | Módulos |
|---|---------|---------|---------|
| B3 | **Conciliação bancária OFX/CNAB** | 2–3 sem | Conciliação |
| B4 | **Suite E2E Playwright** (fluxos críticos) | 1–2 sem | Testes |
| B5 | **Módulo relatórios genérico** | 2 sem | Relatórios |
| B6 | **Pen test / security review** | 1 sem | Segurança |
| B7 | **Runbook operacional + DR** | 3–5 dias | Infra |

### OPCIONAL

| # | Entrega | Esforço |
|---|---------|---------|
| B8 | MFA TOTP | 1 sem |
| B9 | Views SQL para analytics ad-hoc | 3–5 dias |
| B10 | Consolidar 7 serviços readiness | 1 sem |
| B11 | OAuth (Google/Microsoft) | 1–2 sem |

---

## Fase C — Módulo clínico EHR (4–8 meses, escopo novo)

*Somente se Pacientes/Prontuário/Anamnese/Evolução forem requisito contratual*

### CRÍTICO (módulo inteiro inexistente)

| # | Entrega | Esforço estimado |
|---|---------|------------------|
| C1 | **Schema clínico** (patients, encounters, records, anamnesis, evolution) | 3–4 sem |
| C2 | **RLS clínico + LGPD** (consentimento, audit trail clínico) | 2–3 sem |
| C3 | **UI Pacientes** (cadastro, busca, histórico) | 3–4 sem |
| C4 | **UI Prontuário** (timeline clínica, documentos) | 4–6 sem |
| C5 | **UI Anamnese** (formulários estruturados, templates) | 3–4 sem |
| C6 | **UI Evolução clínica** | 2–3 sem |
| C7 | **Agenda de consultas** (distinta de escalas de plantão) | 3–4 sem |

### IMPORTANTE (clínico)

| # | Entrega | Esforço |
|---|---------|---------|
| C8 | Integração prontuário ↔ TISS (dados paciente em guias) | 2 sem |
| C9 | Assinatura digital / certificado ICP-Brasil | 4–8 sem |
| C10 | IA clínica (transcrição, sugestão — se desejado) | 8–12 sem |

---

## Cronograma sugerido (sem EHR)

```
Semana  1-2   │ A1 UI usuários │ A2-A4 Infra/segurança │ A5 Escopo
Semana  3     │ A6 Financeiro  │ A7 Error tracking     │ A8 Testes (início)
Semana  4-5   │ A8 Testes      │ A9 OpenAI             │ Smoke prod
──────────────┼──────────────────────────────────────────────────────
Semana  6-8   │ B1 XML ANS     │ B3 Conciliação OFX
Semana  9-10  │ B2 Envio TISS  │ B4 E2E │ B5 Relatórios │ B6 Security review
              │ ► PRODUÇÃO OPERACIONAL
```

---

## Cronograma alternativo (com EHR)

```
Mes 1-2   │ Fase A + B (operacional produção)
Mes 3-4   │ Fase C1-C3 (schema + pacientes)
Mes 5-6   │ Fase C4-C6 (prontuário + anamnese + evolução)
Mes 7-8   │ Fase C7-C10 + integração TISS + compliance
          │ ► PRODUÇÃO COMPLETA (operacional + clínico)
```

---

## Backlog por prioridade consolidado

### 🔴 CRÍTICO (15 itens)

1. UI gestão usuários/profissionais  
2. Env produção sem placeholders  
3. Rotacionar credenciais bootstrap  
4. Teste RLS cross-tenant  
5. Formalizar escopo V1 (sem EHR ou com prazo EHR)  
6. XML TISS ANS  
7. Envio/processamento TISS operadoras  
8. Schema clínico *(se EHR no escopo)*  
9. UI Pacientes *(se EHR)*  
10. UI Prontuário *(se EHR)*  
11. UI Anamnese *(se EHR)*  
12. UI Evolução clínica *(se EHR)*  
13. RLS/LGPD clínico *(se EHR)*  
14. Agenda consultas *(se EHR)*  
15. Pen test pré-produção  

### 🟠 IMPORTANTE (12 itens)

1. Hub financeiro com dados reais  
2. Error tracking vendor  
3. Testes unitários mínimos  
4. OpenAI prod (Copilot)  
5. Conciliação OFX/CNAB  
6. E2E Playwright  
7. Módulo relatórios  
8. Runbook DR  
9. Integração prontuário-TISS *(se EHR)*  
10. Assinatura digital *(se EHR)*  
11. Gestão profissionais completa (CRM, especialidade)  
12. Webhooks operadoras TISS  

### 🟡 OPCIONAL (10 itens)

1. Notificações realtime perfil  
2. MFA  
3. OAuth  
4. Views SQL analytics  
5. Consolidar readiness services  
6. Debounce ajuda  
7. ERP/DRE  
8. Edge Functions Supabase  
9. IA clínica (transcrição)  
10. PWA offline avançado  

---

## Definição de "pronto" por marco

| Marco | Critérios |
|-------|-----------|
| **MVP operacional** | A1–A5 done; smoke-check staging verde; 1 instituição piloto ativa |
| **Produção operacional** | A1–A9 + B1–B7 done; XML ANS ou waiver assinado; E2E verde |
| **Produção EHR** | Fases A + B + C done; compliance LGPD; treinamento clínico |

---

## Investimento estimado (ordem de grandeza)

| Marco | Pessoa-semana | Calendário |
|-------|---------------|------------|
| MVP operacional | 8–12 | 3–5 semanas (2 devs) |
| Produção operacional | 18–25 | 6–10 semanas (2 devs) |
| Módulo EHR completo | 40–60 | 4–8 meses (2–3 devs) |
| **Total produto completo (ops + EHR)** | **58–85** | **7–11 meses** |

---

## Recomendação estratégica

1. **Curto prazo:** executar Fase A e lançar piloto operacional — o produto já suporta treinamento de plantão, TISS MVP e financeiro.  
2. **Médio prazo:** Fase B antes de vender como "produção TISS" — XML ANS é bloqueador comercial.  
3. **Longo prazo:** Fase C **somente** se contrato exigir EHR — hoje representa ~27% do escopo solicitado na auditoria e **0% implementado**.  
4. **Não iniciar EHR** até Fase A concluída — gestão de usuários e segurança são pré-requisitos para qualquer módulo clínico.

---

*Roadmap baseado em auditoria read-only. Estimativas assumem 2 desenvolvedores full-stack familiarizados com o codebase.*
