# Homologação Funcional Completa — MedicFlow-AI (Staging)

**Data:** 11/06/2026  
**Ambiente:** https://staging.medicflow.app.br  
**Supabase:** `utodixhxrvegzafcldpu`  
**Tenant:** MedicFlow-AI V1 Demo (`medflow-v1-demo`)  
**Usuário:** `admin.teste@medicflow.app.br` (RBAC: `tenant_admin`)  
**Metodologia:** API Supabase + Playwright headless + probes HTTP  
**Script reprodutível:** `node scripts/homologacao-completa-staging.mjs`  
**Evidências JSON:** `docs/evidence/homologacao-staging-results.json`

---

## Resumo executivo

Homologação executada com o usuário oficial de teste no tenant demo. O staging está **operacional para demonstração comercial e piloto**, com lacunas conhecidas em CRUD visual de escalas, aceite de plantões por perfil admin e painel de alertas vazio em tenant sem histórico operacional.

| Dimensão | Nota (0–10) | Leitura |
|----------|:-----------:|---------|
| **Produto** | **9,0** | Rotas core carregam; auth, dashboard, TISS e financeiro funcionais |
| **IA** | **8,3** | Copilot GPT responde; forecast, recomendações e agentes visíveis; alertas sem dados |
| **UX** | **7,3** | Navegação sólida; erros React #418 (hydration) e CSP Cloudflare Insights no console |
| **Comercial** | **8,5** | Pronto para demo guiada; requer seed operacional antes de plantões/TISS completos |

### Status por módulo

| Módulo | Status | Síntese |
|--------|--------|---------|
| Fase 1 — Login | **Parcial** | API OK; formulário UI bloqueado por rate-limit durante a sessão |
| Fase 2 — Dashboard | **Funcional** | KPIs, card IA Operacional e menu 5/5 |
| Fase 3 — Central de IA | **Parcial** | Copilot, forecast, recomendações e agentes OK; alertas ausentes |
| Fase 4 — Escalas | **Parcial** | Visualização OK; sem UI de CRUD (backend implementado) |
| Fase 5 — Plantões | **Parcial** | Plantão aberto listado; aceite/swap não exercitados |
| Fase 6 — TISS | **Funcional** | Convênios demo; guias/exportação acessíveis |
| Fase 7 — Financeiro | **Funcional** | Hub, fechamento e dashboard executivo carregam |
| Fase 8 — IA (checklist) | **Parcial** | 5/6 perguntas positivas |

---

## FASE 1 — Login

| Teste | Resultado | Evidência |
|-------|-----------|-----------|
| Login (API Supabase) | ✅ | `signInWithPassword` OK, user `c9164647-…` |
| Vínculo tenant `medflow-v1-demo` | ✅ | `tenant_id` = `9cc7f6f1-4c34-4316-9e06-778f0cbc249e` |
| RBAC `tenant_admin` | ✅ | Perfil confirmado |
| Refresh de sessão | ✅ | `refreshSession` OK |
| Logout (API) | ✅ | `signOut` + sessão limpa |
| Logout (UI) | ⚠️ | Validado via API; botão UI não exercitado (rate-limit no form) |
| Recuperação de senha (API) | ❌ | `email rate limit exceeded` (Supabase Auth) |
| Troca de senha | ⚠️ | Rotas `/login/redefinir-senha` existem; fluxo Perfil não testado manualmente |
| Expiração de sessão | ⚠️ | JWT Supabase ~1h + refresh; sem idle timeout customizado |
| Tela `/login` | ✅ | Screenshot `01-login.png` |

**Classificação:** **Parcial** — auth core sólido; recovery e login via formulário impactados por rate-limit acumulado na sessão de testes.

---

## FASE 2 — Dashboard

| Teste | Resultado | Evidência |
|-------|-----------|-----------|
| Carregamento | ✅ | `/` autenticado |
| Métricas | ✅ | 3 indicadores visíveis |
| Card IA Operacional | ✅ | Presente |
| Navegação (menu) | ✅ | 5/5 links (Escalas, Plantões, Central IA, Financeiro, TISS) |

**Screenshot:** `docs/screenshots/homologacao-staging/02-dashboard.png`

**Classificação:** **Funcional**

---

## FASE 3 — Central de IA

| Componente | Funcional? | Observação |
|------------|:----------:|------------|
| Badges IA | ✅ | 9 marcadores visuais na página |
| Copilot | ✅ | Painel visível; pergunta testada |
| Alertas | ❌ | Painel sem alertas (tenant com operação mínima) |
| Forecast | ✅ | Seção de projeção visível |
| Recomendações | ✅ | Painel de recomendações renderizado |
| Agentes | ✅ | Painel de agentes ativos visível |

**Screenshots:**
- `03-central-ia-full.png` — página completa
- `04-copilot-panel.png` — Copilot
- `05-copilot-resposta.png` — resposta à pergunta *"Quantos plantões abertos existem hoje?"*
- `06-central-ia-scroll.png` — painéis inferiores

**Classificação:** **Parcial** — stack IA visível e responsiva; alertas dependem de volume operacional / regras disparadas.

---

## FASE 4 — Escalas

### Dados preparados para homologação (staging)

O tenant demo estava sem estrutura operacional. Foram criados via Supabase autenticado:

| Entidade | ID / Nome |
|----------|-----------|
| Hospital | `Hospital Homolog Demo` |
| Unidade | `UTI Homolog` |
| Departamento | `Plantao Diurno Homolog` |
| Escala (active) | `Escala Homolog Atualizada` |
| Turno (open) | 13/06/2026 07:00–19:00 |

### Validação

| Teste | Resultado | Observação |
|-------|-----------|------------|
| Página `/escalas` | ✅ | Calendário 14 dias carrega |
| Listagem do plantão homolog | ✅ | Turno visível no calendário |
| CRUD unidade (UI) | ❌ | Provisionamento SQL/API apenas |
| CRUD escala (UI) | ❌ | Somente visualização |
| CRUD turno (UI) | ❌ | Somente visualização |
| CRUD backend | ✅ | `createScheduleFn` / `createShiftFn` implementados |

**Screenshot:** `07-escalas.png`

**Classificação:** **Parcial** — leitura operacional OK; gestão via UI inexistente (gap de produto conhecido).

---

## FASE 5 — Plantões

| Teste | Resultado | Observação |
|-------|-----------|------------|
| Página `/plantoes` | ⚠️ | Conteúdo carrega (screenshot OK); seletor de heading automatizado falhou |
| Abertura / listagem | ✅ | Plantão homolog na aba abertos |
| Aceite | ❌ | `tenant_admin` não é professional — sem botão aceitar |
| Cancelamento | ⚠️ | `cancelShiftFn` implementado; não exercitado na UI |
| Swap | ⚠️ | Módulo implementado; requer 2 profissionais — não exercitado |

**Screenshot:** `08-plantoes.png`

**Classificação:** **Parcial**

---

## FASE 6 — TISS

| Teste | Resultado | Observação |
|-------|-----------|------------|
| Página `/tiss` | ✅ | 10 abas carregam |
| Convênios | ✅ | Seed demo: Convênio Demo Alfa / Beta |
| Guias | ⚠️ | Aba acessível; 0 guias no tenant |
| Exportação XML | ⚠️ | UI de export/lote presente; requer guias/lotes |

**Screenshots:** `09-tiss.png`, `10-tiss-guias.png`

**Classificação:** **Funcional** (MVP — sem envio a operadoras / XML ANS completo)

---

## FASE 7 — Financeiro

| Teste | Resultado | Observação |
|-------|-----------|------------|
| Hub `/financeiro` | ✅ | Links para sub-rotas |
| Lançamentos | ⚠️ | Hub com KPIs parcialmente ilustrativos |
| Fechamento operacional | ✅ | `/financeiro/fechamento-operacional` |
| Dashboard executivo | ✅ | `/financeiro/dashboard-executivo` |

**Screenshots:** `11-financeiro-hub.png`, `12-fechamento.png`, `13-dashboard-executivo.png`

**Classificação:** **Funcional**

---

## FASE 8 — IA (perguntas obrigatórias)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | O Copilot responde? | **Sim** — resposta gerada após pergunta operacional |
| 2 | OpenAI está configurada? | **Sim** — sem erro de chave ausente no worker staging |
| 3 | Alertas aparecem? | **Não** — painel vazio (sem alertas para o snapshot atual) |
| 4 | Forecast funciona? | **Sim** — seção visível na Central de IA |
| 5 | Recomendações funcionam? | **Sim** — painel renderizado |
| 6 | Agentes funcionam? | **Sim** — painel de agentes ativos visível |

**Classificação Fase 8:** **Parcial** (5/6)

---

## FASE 9 — Notas consolidadas

| Dimensão | Nota | Justificativa |
|----------|:----:|---------------|
| Produto | **9,0** | Auth, dashboard, TISS, financeiro e navegação estáveis |
| IA | **8,3** | Copilot GPT ativo; alertas sem dados operacionais |
| UX | **7,3** | Boa estrutura; hydration React #418 e ruído CSP no console |
| Comercial | **8,5** | Demo viável; recomenda-se seed piloto antes de apresentação TISS/plantões |

---

## Evidências visuais

| Arquivo | Descrição |
|---------|-----------|
| [01-login.png](screenshots/homologacao-staging/01-login.png) | Login multi-tenant |
| [02-dashboard.png](screenshots/homologacao-staging/02-dashboard.png) | Dashboard + card IA |
| [03-central-ia-full.png](screenshots/homologacao-staging/03-central-ia-full.png) | Central de IA |
| [04-copilot-panel.png](screenshots/homologacao-staging/04-copilot-panel.png) | Copilot |
| [05-copilot-resposta.png](screenshots/homologacao-staging/05-copilot-resposta.png) | Resposta Copilot |
| [06-central-ia-scroll.png](screenshots/homologacao-staging/06-central-ia-scroll.png) | Painéis IA |
| [07-escalas.png](screenshots/homologacao-staging/07-escalas.png) | Escalas |
| [08-plantoes.png](screenshots/homologacao-staging/08-plantoes.png) | Plantões |
| [09-tiss.png](screenshots/homologacao-staging/09-tiss.png) | TISS |
| [10-tiss-guias.png](screenshots/homologacao-staging/10-tiss-guias.png) | TISS Guias |
| [11-financeiro-hub.png](screenshots/homologacao-staging/11-financeiro-hub.png) | Hub financeiro |
| [12-fechamento.png](screenshots/homologacao-staging/12-fechamento.png) | Fechamento |
| [13-dashboard-executivo.png](screenshots/homologacao-staging/13-dashboard-executivo.png) | Dashboard executivo |
| [14-perfil.png](screenshots/homologacao-staging/14-perfil.png) | Perfil |

---

## Riscos e bloqueadores identificados

| Severidade | Item | Impacto |
|------------|------|---------|
| Média | Rate-limit login (IP/e-mail) após múltiplas tentativas | Bloqueia login via formulário por ~8 min |
| Média | Rate-limit e-mail Supabase Auth | Recovery password falha na sessão |
| Média | React error #418 (hydration mismatch) | Possível flash/instabilidade em algumas rotas |
| Baixa | CSP bloqueia Cloudflare Insights | Ruído no console; sem impacto funcional |
| Produto | Sem UI CRUD escalas/unidades | Homologação operacional depende de SQL/scripts |
| Produto | Aceite plantão requer perfil `professional` | Admin demo não cobre fluxo médico |
| Dados | Tenant demo sem alertas | Central IA parece “vazia” em alertas |

---

## Recomendações pós-homologação

1. **Aguardar cooldown** (~10 min) antes de retestar login/recovery via formulário UI.
2. **Executar seed piloto** (`RUNBOOK_IMPLANTACAO_PILOTO.md`) para 20 plantões, guias TISS e alertas realistas.
3. **Provisionar usuário professional** adicional para validar aceite/swap end-to-end.
4. **Investigar React #418** em staging (provável mismatch SSR/client em componente específico).
5. **Reexecutar homologação:**  
   ```bash
   node scripts/homologacao-completa-staging.mjs
   ```

---

## Referências

- Credenciais teste: `docs/TEST_ADMIN_CREDENTIALS.md`
- Auditoria funcional: `docs/AUDITORIA_FUNCIONAL_COMPLETA.md`
- Runbook piloto: `docs/RUNBOOK_IMPLANTACAO_PILOTO.md`

---

*Relatório gerado automaticamente a partir de `homologacao-completa-staging.mjs` + inspeção manual dos resultados.*
