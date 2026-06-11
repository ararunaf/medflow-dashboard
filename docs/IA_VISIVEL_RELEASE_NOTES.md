# Sprint IA-Visível — Release Notes

**Data de fechamento:** 11 de junho de 2026  
**Ambiente:** `https://staging.medicflow.app.br`  
**Commit funcional:** `44ec564` — `feat(ia): tornar Central de IA visível e integrada à UX`  
**Commit evidências:** `1c50898` — `docs(ia): adicionar evidências visuais e prontidão comercial`  
**Deploy Cloudflare:** Version ID `9de09ca4-1482-4185-b594-d15dc4564f64`

---

## Resumo da Sprint IA-Visível

A Sprint IA-Visível fechou a lacuna de **discoverability** identificada na auditoria UX: a rota `/central` existia com capacidades de IA, mas era difícil de encontrar para managers operacionais. A sprint tornou a inteligência artificial **visível e descobrível** nos primeiros 3 minutos de demo comercial — sem alterar regras de negócio, banco, Supabase ou Cloudflare.

**Escopo:** UX e navegação apenas.

---

## Melhorias implementadas

| Fase | Entrega | Superfície |
|------|---------|------------|
| Menu | Item **Central de IA** (`/central`) | `app-shell.tsx` — visível para `coordinator`, `tenant_admin`, `super_admin` |
| Rebranding | **Central de IA Operacional** | `command-center-view.tsx`, `central.tsx`, `index.tsx`, `executivo.tsx`, demo guiada |
| Dashboard | Card **IA Operacional** na Home | `operational-ia-home-card.tsx` — alertas, recomendações, propostas + CTA |
| Copilot | Painéis movidos para o **topo** de `/central` | Visibilidade imediata ao entrar na rota |
| Badges IA | Componente `ia-badge.tsx` | Recomendações, forecast, alertas inteligentes, propostas supervisionadas |

**Decisão de branding:** *Central de IA Operacional* adotada (português institucional); *MedicFlow AI Center* reservada para materiais internacionais.

---

## Screenshots gerados

Capturados em staging (1920×1080, perfil manager) via `scripts/capture-ia-screenshots.mjs`:

| # | Arquivo | Conteúdo validado |
|---|---------|-------------------|
| 1 | `docs/screenshots/12-menu-central-ia.png` | Menu lateral — item **Central de IA** |
| 2 | `docs/screenshots/13-dashboard-ia-card.png` | Home — card **IA Operacional** + métricas + CTA |
| 3 | `docs/screenshots/14-central-ia-operacional.png` | Central de IA Operacional — painéis completos |
| 4 | `docs/screenshots/15-copilot-topo.png` | Copiloto operacional (IA) no topo |

> Referência legada: `11-central-operacional.png` (pré-sprint). Novos assets numerados 12–15 com sufixo descritivo para evitar conflito com `12-ajuda.png`.

---

## Nova nota UX IA

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Nota UX IA** | 4,8 / 10 | **7,6 / 10** |

**Gaps fechados:** menu dedicado, card na Home, Copilot no topo, badges IA nos painéis, rebranding consistente.

**Próximos passos UX (roadmap):** tour 60s no primeiro login; artigos na Ajuda; badges em `/plantoes` e `/escalas` para persona médica.

---

## Nova nota comercial IA

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Nota comercial IA** | 7,2 / 10 | **8,4 / 10** |

**Argumento central:** IA visível desde o primeiro login — menu **Central de IA**, card na Home e Copiloto no topo aparecem nos primeiros 3 minutos de demo.

---

## Prontidão para demonstrações

**Status: ✅ Pronta**

| Critério | Evidência |
|----------|-----------|
| IA visível no menu | `12-menu-central-ia.png` |
| IA visível na Home | `13-dashboard-ia-card.png` |
| Central rebrandada | `14-central-ia-operacional.png` |
| Copilot no topo | `15-copilot-topo.png` |
| Demo guiada | `docs/DEMO_IA_10_MINUTOS.md` |
| Deck executivo | `docs/MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md` |
| Staging live | `staging.medicflow.app.br` |

**Roteiro recomendado (3 min):** Login → Home (card IA) → menu **Central de IA** → Copilot no topo.

---

## Prontidão para pilotos

**Status: ✅ Pronta com ressalvas operacionais**

| Aspecto | Status | Observação |
|---------|--------|------------|
| Discoverability UX | ✅ | Menu + card + links Home/Executivo |
| Funcionalidade core | ✅ | Scoring, alertas, recomendações, agentes, propostas |
| Copilot GPT | ⚠️ | Requer `MEDFLOW_OPENAI_API_KEY` no ambiente do piloto |
| Managers | ✅ | Perfil completo de IA |
| Médicos | ⚠️ | Central sem Copilot/analytics — narrativa oral necessária |
| Onboarding | ⚠️ | Tour 60s ainda no roadmap |

**Conclusão:** Piloto operacional com managers está pronto. Piloto com médicos exige alinhamento de expectativa.

---

## Documentação consolidada

| Documento | Propósito |
|-----------|-----------|
| [SPRINT_IA_VISIVEL.md](./SPRINT_IA_VISIVEL.md) | Escopo técnico e entregas da sprint |
| [PRONTIDAO_COMERCIAL_IA.md](./PRONTIDAO_COMERCIAL_IA.md) | Checklist comercial e auditoria visual |
| [MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md](./MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md) | Deck executivo com mapeamento de screenshots IA |
| [DEMO_IA_10_MINUTOS.md](./DEMO_IA_10_MINUTOS.md) | Roteiro demo IA |
| [scripts/capture-ia-screenshots.mjs](../scripts/capture-ia-screenshots.mjs) | Script reutilizável para futuras capturas |

---

## Conclusão

A Sprint IA-Visível está **concluída**. A IA MedicFlow-AI passou de recurso oculto em `/central` para diferencial visível no menu, na Home e no Copilot — com evidências visuais, documentação comercial e script de captura versionados no repositório.

**Sem alterações funcionais neste fechamento.** Apenas consolidação e publicação das evidências.
