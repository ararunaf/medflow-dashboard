# Sprint IA-Visível — MedicFlow-AI

**Data:** 11 de junho de 2026  
**Escopo:** UX e navegação apenas (sem alteração de regras de negócio, banco ou Supabase)

---

## Objetivo

Tornar a inteligência artificial **visível e descobrível** para perfis operacionais (`coordinator`, `tenant_admin`, `super_admin`) sem alterar lógica de backend.

---

## Decisão de rebranding

| Opção avaliada | Decisão |
|----------------|---------|
| Central de IA Operacional | **Adotada** — consistente com item de menu “Central de IA”, português institucional, clara para hospitais |
| MedicFlow AI Center | Descartada — mistura inglês no produto BR; reservada para materiais internacionais |

---

## Entregas por fase

### Fase 1 — Menu

- Item **Central de IA** em `app-shell.tsx`
- Rota: `/central`
- Visibilidade: `isOperationalManager()` → `coordinator`, `tenant_admin`, `super_admin`
- Ícone: `Brain` (Lucide)

### Fase 2 — Rebranding

Texto **Central de IA Operacional** aplicado em:

| Superfície | Arquivo |
|------------|---------|
| Título da central | `command-center-view.tsx` |
| Meta title | `central.tsx` |
| Link Home | `index.tsx` |
| Quick action Executivo | `executivo.tsx` |
| Demo guiada | `guided-demo-service.ts` |

### Fase 3 — Dashboard

- Card **IA Operacional** na Home (`operational-ia-home-card.tsx`)
- Métricas: alertas ativos, recomendações, propostas pendentes
- CTA: **Abrir Central de IA**
- Visível apenas para operational managers

### Fase 4 — Copilot

- Painéis Copilot (contexto + GPT) movidos para **topo** de `/central`, logo após faixa de coordenação
- Visibilidade imediata ao entrar na rota (sem scroll longo)

### Fase 5 — Badges IA

Componente reutilizável: `ia-badge.tsx`

| Painel | Badge |
|--------|-------|
| Recomendações operacionais | Título + badge IA |
| Forecast (baseline) | Badge IA no pill de projeção |
| Alertas inteligentes | Título renomeado + badge IA |
| Propostas operacionais | Título + badge IA |

---

## Screenshots (capturados em staging — 11/06/2026)

Gerados em `docs/screenshots/` via `scripts/capture-ia-screenshots.mjs`, perfil manager, resolução 1920×1080:

| # | Arquivo | Conteúdo | Status |
|---|---------|----------|--------|
| 1 | `12-menu-central-ia.png` | Sidebar com item **Central de IA** destacado | ✅ |
| 2 | `13-dashboard-ia-card.png` | Home — card **IA Operacional** com contadores | ✅ |
| 3 | `14-central-ia-operacional.png` | `/central` — título + Copilot no topo | ✅ |
| 4 | `15-copilot-topo.png` | Close-up painel **Copiloto operacional (IA)** | ✅ |

> Referência legada: `11-central-operacional.png`. Deploy: Version ID `9de09ca4-1482-4185-b594-d15dc4564f64`.

---

## Arquivos alterados

### Código

- `src/components/app-shell.tsx`
- `src/components/operational/ia-badge.tsx` *(novo)*
- `src/components/operational/operational-ia-home-card.tsx` *(novo)*
- `src/components/operational/command-center-view.tsx`
- `src/components/operational/operational-recommendations-panel.tsx`
- `src/components/operational/operational-alert-feed.tsx`
- `src/components/operational/operational-action-proposals-panel.tsx`
- `src/routes/index.tsx`
- `src/routes/central.tsx`
- `src/routes/executivo.tsx`
- `src/lib/services/guided-demo/guided-demo-service.ts`

### Documentação

- `docs/DEMO_IA_10_MINUTOS.md`
- `docs/MEDICFLOW_DEMO_COMERCIAL.md`
- `docs/SPRINT_IA_VISIVEL.md` *(este arquivo)*

---

## Validação

| Check | Comando | Resultado |
|-------|---------|-----------|
| Build | `npm run build` | OK |
| Build staging | `npm run build:staging` | OK |
| SSR | `npm run ssr-validate:fast` | OK |
| Staging | `npm run staging-validate:fast` | Pendência pré-existente: `manifest.webmanifest` ≠ `manifest.json` (não relacionada à sprint) |

### Regressões evitadas

- RBAC inalterado — apenas `isOperationalManager` para menu/card IA
- Queries existentes reutilizadas (`command-center`, `action-proposals`, alertas derivados)
- Rotas e APIs sem mudança
- Profissionais e financeiros não veem menu/card IA (comportamento esperado)

---

## Relatório executivo

A Sprint IA-Visível fecha a lacuna de **discoverability** identificada na auditoria UX: a rota `/central` existia, mas a IA era difícil de encontrar. Com menu dedicado, card na Home e Copilot no topo, o cliente percebe IA nos **primeiros 3 minutos** de demo comercial.

**Próximo passo recomendado:** capturar screenshots em staging e atualizar deck comercial (`MEDICFLOW_PRESENTACAO_EXECUTIVA_PPT.md`) com novos assets.
