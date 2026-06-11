# Roadmap Final para Produção — MedicFlow-AI

**Data:** 08/06/2026  
**Baseline:** commit `e7db791` — produto **73% concluído** (escopo operacional)  
**Ambiente atual:** staging operacional em `https://staging.medicflow.app.br`  
**Referências:** [AUDITORIA_FUNCIONAL_COMPLETA.md](./AUDITORIA_FUNCIONAL_COMPLETA.md) · [MAPA_FUNCIONAL_MEDICFLOW.md](./MAPA_FUNCIONAL_MEDICFLOW.md)

---

## Resumo executivo

O MedicFlow-AI está **pronto para piloto operacional** (plantões, TISS training, financeiro operacional, implantação). Para **produção enterprise** faltam hardening de segurança, gestão de usuários e integrações regulatórias TISS. Para **escopo clínico (EHR)** falta **100% do módulo** — estimativa separada de 4–8 meses.

| Marco | Prazo | Pré-requisitos |
|-------|-------|----------------|
| **Piloto operacional** | ✅ Agora | Staging validado, auth OK |
| **MVP operacional hardened** | 3–5 semanas | Fase A completa |
| **Produção enterprise (sem EHR)** | 6–10 semanas | Fase A + B |
| **Produção com EHR** | +4–8 meses | Fase C inteira |

---

## Estado atual (pós-auditoria)

### O que funciona hoje

- 20 rotas operacionais com backend completo
- Auth multi-tenant com 11/11 checks remotos em staging
- 62/63 tabelas Postgres em uso com RLS
- Motor de IA operacional (agentes, orquestração, propostas) sem dependência de OpenAI
- Deploy Cloudflare Workers em staging
- 27 scripts de validação estática

### O que está parcial

- Hub `/financeiro` (KPIs ilustrativos)
- TISS (XML MVP, sem operadoras)
- Conciliação (CSV only)
- Copilot GPT (requer API key)
- Gestão de usuários (sem UI)
- RLS cross-tenant (não testado runtime)

### O que não existe

- Pacientes, Prontuário, Anamnese, Evolução clínica
- Testes unitários (0 arquivos)
- Error tracking externo
- Integração bancária OFX/CNAB
- Envio TISS para operadoras

---

## Fase A — MVP operacional (3–5 semanas)

*Objetivo: go-live seguro do escopo V1 operacional em staging → produção*

### Semana 1–2: Segurança e identidade

| # | Entrega | Esforço | Prioridade | Critério de done |
|---|---------|---------|------------|------------------|
| A1 | **UI gestão de usuários/profissionais** | 1–2 sem | 🔴 CRÍTICO | CRUD profiles + invite/reset via admin |
| A2 | **Rotacionar credenciais bootstrap** | 1 dia | 🔴 CRÍTICO | Remover senha hardcoded da migration; seed externo |
| A3 | **Teste RLS cross-tenant runtime** | 2–3 dias | 🔴 CRÍTICO | `multi-tenant-auth-validate` passando em staging |
| A4 | **Formalizar escopo V1** | 1 dia | 🔴 CRÍTICO | Documento contratual: operacional sim, EHR não (ou prazo EHR) |

### Semana 2–3: Infraestrutura e observabilidade

| # | Entrega | Esforço | Prioridade | Critério de done |
|---|---------|---------|------------|------------------|
| A5 | **Secrets e env produção** | 2–3 dias | 🔴 CRÍTICO | Zero placeholders; smoke-check prod verde |
| A6 | **Error tracking (Sentry/Datadog)** | 3–5 dias | 🟠 IMPORTANTE | Substituir stub em `error-tracker.ts` |
| A7 | **Cookies `secure: true`** | 1 dia | 🟠 IMPORTANTE | `get-auth-context.ts` para HTTPS |
| A8 | **Configurar OpenAI (se Copilot obrigatório)** | 1 dia | 🟠 IMPORTANTE | `MEDFLOW_OPENAI_API_KEY` em prod |

### Semana 3–5: Qualidade e polish

| # | Entrega | Esforço | Prioridade | Critério de done |
|---|---------|---------|------------|------------------|
| A9 | **Substituir KPIs estáticos `/financeiro`** | 2–3 dias | 🟠 IMPORTANTE | StatCards com dados reais ou remover |
| A10 | **Testes mínimos Vitest** | 1 sem | 🟠 IMPORTANTE | route-guard, rbac, auth-actions, TISS crítico |
| A11 | **Smoke HTTP pós-deploy prod** | 1 dia | 🔴 CRÍTICO | `smoke-check` verde em prod URL |
| A12 | **Pen test básico** | 3–5 dias | 🔴 CRÍTICO | Relatório sem achados críticos abertos |

### Opcional Fase A

| # | Entrega | Esforço |
|---|---------|---------|
| A13 | Habilitar notificações realtime no perfil | 3–5 dias |
| A14 | Consolidar formatadores `moneyBrl` | 2h |
| A15 | Remover hook órfão `use-debounced-value` | 1h |

**Gate Fase A → Produção MVP:** A1–A5 + A11 + A12 concluídos.

---

## Fase B — Produção operacional enterprise (6–10 semanas total)

*Objetivo: compliance TISS, observabilidade madura e integrações financeiras*

### Semana 6–8: TISS regulatório

| # | Entrega | Esforço | Prioridade |
|---|---------|---------|------------|
| B1 | **XML TISS layout ANS** | 2–3 sem | 🔴 CRÍTICO |
| B2 | **Processo envio TISS** (API operadora ou manual formalizado) | 2–4 sem | 🔴 CRÍTICO |
| B3 | **Validação XML contra schema ANS** | 1 sem | 🟠 IMPORTANTE |

### Semana 8–10: Financeiro e testes

| # | Entrega | Esforço | Prioridade |
|---|---------|---------|------------|
| B4 | **Conciliação bancária OFX/CNAB** | 2–3 sem | 🟠 IMPORTANTE |
| B5 | **Suite E2E Playwright** (fluxos críticos) | 1–2 sem | 🟠 IMPORTANTE |
| B6 | **Módulo relatórios genérico** | 2 sem | 🟠 IMPORTANTE |
| B7 | **Runbook operacional + DR** | 3–5 dias | 🟠 IMPORTANTE |
| B8 | **Security review completo** | 1 sem | 🔴 CRÍTICO |

### Opcional Fase B

| # | Entrega | Esforço |
|---|---------|---------|
| B9 | MFA TOTP | 1 sem |
| B10 | Views SQL para analytics ad-hoc | 3–5 dias |
| B11 | OAuth (Google/Microsoft) | 1–2 sem |
| B12 | Consolidar 7 serviços readiness | 1 sem |

**Gate Fase B → Produção Enterprise:** B1–B2 + B5 + B8 concluídos.

---

## Fase C — Módulo clínico EHR (4–8 meses)

*Somente se Pacientes/Prontuário/Anamnese/Evolução forem requisito contratual*

### Mês 1–2: Fundação clínica

| # | Entrega | Esforço |
|---|---------|---------|
| C1 | Schema clínico (patients, encounters, records) | 3–4 sem |
| C2 | RLS clínico + LGPD (consentimento, audit trail) | 2–3 sem |
| C3 | UI Pacientes (cadastro, busca, histórico) | 3–4 sem |

### Mês 3–4: Prontuário

| # | Entrega | Esforço |
|---|---------|---------|
| C4 | UI Prontuário (timeline clínica, documentos) | 4–6 sem |
| C5 | UI Anamnese (formulários estruturados) | 3–4 sem |
| C6 | UI Evolução clínica | 2–3 sem |

### Mês 5–8: Integração e compliance

| # | Entrega | Esforço |
|---|---------|---------|
| C7 | Agenda de consultas (distinta de escalas) | 3–4 sem |
| C8 | Integração prontuário ↔ TISS | 2 sem |
| C9 | Assinatura digital ICP-Brasil | 4–8 sem |
| C10 | IA clínica (transcrição, sugestão) | 8–12 sem |

**Gate Fase C:** C1–C7 + C2 (LGPD) concluídos para MVP clínico.

---

## Cronograma visual

### Sem EHR (recomendado para V1)

```
Semana  1-2   │ A1 UI usuários │ A2-A4 Segurança/escopo
Semana  3     │ A5 Env prod    │ A6 Error tracking
Semana  4-5   │ A9 Financeiro  │ A10 Testes │ A11-A12 Smoke+Pen
──────────────┼──────────────────────────────────────────────
              │ ► MVP OPERACIONAL (go-live V1)
Semana  6-8   │ B1 XML ANS     │ B4 Conciliação OFX
Semana  9-10  │ B2 Envio TISS  │ B5 E2E │ B8 Security review
              │ ► PRODUÇÃO ENTERPRISE
```

### Com EHR

```
Mes 1-2   │ Fase A + B (operacional produção)
Mes 3-4   │ Fase C1-C3 (schema + pacientes)
Mes 5-6   │ Fase C4-C6 (prontuário + anamnese + evolução)
Mes 7-8   │ Fase C7-C10 + integração TISS + compliance
          │ ► PRODUÇÃO COMPLETA (operacional + clínico)
```

---

## Backlog consolidado por prioridade

### 🔴 CRÍTICO (7 itens — bloqueiam produção)

| # | Item | Fase | Esforço |
|---|------|------|---------|
| 1 | UI gestão usuários/profissionais | A | 1–2 sem |
| 2 | Rotacionar credenciais bootstrap | A | 1 dia |
| 3 | Teste RLS cross-tenant runtime | A | 2–3 dias |
| 4 | Formalizar escopo V1 | A | 1 dia |
| 5 | Env produção sem placeholders | A | 2–3 dias |
| 6 | XML TISS ANS | B | 2–3 sem |
| 7 | Envio/processamento TISS operadoras | B | 2–4 sem |

### 🟠 IMPORTANTE (10 itens)

| # | Item | Fase | Esforço |
|---|------|------|---------|
| 8 | Error tracking Sentry/Datadog | A | 3–5 dias |
| 9 | Testes Vitest mínimos | A | 1 sem |
| 10 | Substituir KPIs hub `/financeiro` | A | 2–3 dias |
| 11 | Conciliação OFX/CNAB | B | 2–3 sem |
| 12 | Suite E2E Playwright | B | 1–2 sem |
| 13 | Módulo relatórios genérico | B | 2 sem |
| 14 | Runbook + DR | B | 3–5 dias |
| 15 | Pen test / security review | A+B | 1–2 sem |
| 16 | OpenAI key em prod (se Copilot) | A | 1 dia |
| 17 | Cookies secure em HTTPS | A | 1 dia |

### ⚪ OPCIONAL (8 itens)

| # | Item | Fase |
|---|------|------|
| 18 | MFA TOTP | B |
| 19 | OAuth Google/Microsoft | B |
| 20 | Views SQL analytics | B |
| 21 | Consolidar serviços readiness | B |
| 22 | Notificações perfil | A |
| 23 | ERP / DRE integrado | Futuro |
| 24 | Debounce em `/ajuda` | A |
| 25 | Supabase Edge Functions | N/A (arquitetura atual não requer) |

### EHR (se no escopo — 10 itens adicionais)

| # | Item | Fase | Esforço |
|---|------|------|---------|
| 26 | Schema clínico | C | 3–4 sem |
| 27 | RLS/LGPD clínico | C | 2–3 sem |
| 28 | UI Pacientes | C | 3–4 sem |
| 29 | UI Prontuário | C | 4–6 sem |
| 30 | UI Anamnese | C | 3–4 sem |
| 31 | UI Evolução clínica | C | 2–3 sem |
| 32 | Agenda consultas | C | 3–4 sem |
| 33 | Integração prontuário ↔ TISS | C | 2 sem |
| 34 | Assinatura digital ICP-Brasil | C | 4–8 sem |
| 35 | IA clínica | C | 8–12 sem |

---

## Riscos do roadmap

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Escopo EHR incluído sem prazo | Atraso 4–8 meses | Formalizar escopo V1 (A4) |
| XML ANS mais complexo que estimado | Atraso TISS 2–4 sem | Contratar especialista ANS |
| Operadoras sem API padronizada | Envio TISS manual | Processo manual documentado (B2) |
| RLS cross-tenant falha em runtime | Vazamento de dados | Teste A3 antes de go-live |
| Credenciais bootstrap vazam | Comprometimento total | A2 imediato |
| Zero testes automatizados | Regressões em produção | A10 mínimo antes de MVP |

---

## Métricas de progresso (gates)

| Gate | % Produto | Critérios |
|------|-----------|-----------|
| **Atual (staging)** | 73% | Piloto operacional |
| **MVP (Fase A)** | ~85% | A1–A5 + A11 + A12 |
| **Enterprise (Fase B)** | ~92% | + B1–B2 + B5 + B8 |
| **EHR (Fase C)** | 100%* | + módulo clínico inteiro |

*\*100% apenas se EHR for requisito; sem EHR, 92% = produto completo V1.*

---

## Equipe sugerida

| Fase | Perfis | Tamanho |
|------|--------|---------|
| A (MVP) | 2 fullstack + 1 DevOps | 3 pessoas |
| B (Enterprise) | + 1 especialista TISS/ANS | 4 pessoas |
| C (EHR) | + 2 devs clínico + 1 compliance | 6–7 pessoas |

---

## Checklist go-live produção

- [ ] A1 UI gestão usuários
- [ ] A2 Credenciais bootstrap rotacionadas
- [ ] A3 RLS cross-tenant validado
- [ ] A4 Escopo V1 documentado e assinado
- [ ] A5 Env produção configurado
- [ ] A6 Error tracking ativo
- [ ] A10 Testes Vitest passando
- [ ] A11 Smoke prod verde
- [ ] A12 Pen test sem críticos
- [ ] B1 XML ANS validado
- [ ] B2 Processo TISS operadoras definido
- [ ] B5 E2E fluxos críticos passando
- [ ] B7 Runbook publicado
- [ ] B8 Security review aprovado

---

*Roadmap baseado em auditoria funcional read-only de 08/06/2026. Nenhum código foi alterado.*
