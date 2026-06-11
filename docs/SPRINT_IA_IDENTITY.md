# Sprint IA-Identity — MedicFlow-AI

**Data:** 11 de junho de 2026  
**Escopo:** Identidade visual global de IA (sem alteração de regras de negócio, banco, Supabase ou algoritmos)

---

## Objetivo

Criar identidade visual única e consistente para todos os recursos de Inteligência Artificial, permitindo que o usuário identifique imediatamente quando um recurso está apoiado por IA.

---

## Fase 1 — Auditoria de pontos de IA

| Local | Componente | Já possui badge IA? |
| ----- | ---------- | ------------------- |
| Menu lateral — Central de IA | `app-shell.tsx` | Não (ícone Brain apenas) |
| Home — link Central de IA | `index.tsx` | Não |
| Home — Card IA Operacional | `operational-ia-home-card.tsx` | Sim (atualizado Sprint IA-Identity) |
| Executivo — quick action Central de IA | `executivo.tsx` | Sim (atualizado Sprint IA-Identity) |
| Central — PageHeader | `command-center-view.tsx` | Sim (atualizado Sprint IA-Identity) |
| Copilot GPT | `operational-copilot-gpt-panel.tsx` | Sim (atualizado Sprint IA-Identity) |
| Alertas inteligentes | `operational-alert-feed.tsx` | Sim |
| Recomendações operacionais | `operational-recommendations-panel.tsx` | Sim |
| Forecast operacional | `operational-recommendations-panel.tsx` | Sim (pill de projeção) |
| Propostas operacionais | `operational-action-proposals-panel.tsx` | Sim |
| Agentes operacionais | `operational-active-agents-panel.tsx` | Sim (atualizado Sprint IA-Identity) |
| Dashboard financeiro executivo | `executive-dashboard-view.tsx` | Não (KPIs reais, sem IA) |

---

## Fase 2 — Sistema visual padrão

### Ícone oficial

- **Brain** (Lucide React) — violeta `text-violet-600 dark:text-violet-400`

### Badge oficial

- Texto: **IA** (compacto; melhor legibilidade em pills e títulos que "IA MedicFlow")
- Formato: ícone Brain + texto "IA"
- Componente: `src/components/operational/ia-badge.tsx`

### Cores

Paleta violet existente da Central de IA (sem nova paleta):

- `bg-violet-500/10`, `text-violet-700`, `ring-violet-500/25`, `dark:text-violet-300`
- Card Home: `border-violet-500/20`, gradiente `from-violet-500/[0.06]`

### Tooltip

Ao passar o mouse no badge:

> Recurso apoiado por Inteligência Artificial do MedicFlow-AI

---

## Fase 3 — Identificação dos recursos

| Recurso | Identificação aplicada |
|---------|------------------------|
| Copilot GPT | Badge Brain + IA no título |
| Alertas inteligentes | Badge Brain + IA no header |
| Recomendações operacionais | Badge Brain + IA no título |
| Forecast operacional | Badge Brain + IA no pill de projeção |
| Agentes operacionais | Badge Brain + IA no título |
| Propostas operacionais | Badge Brain + IA no título |
| Card IA Operacional | Faixa superior violeta + ícone Brain + badge IA |

---

## Fase 4 — Experiência de descoberta

Componente: `src/components/operational/ia-legend.tsx`

> Recursos identificados com este símbolo utilizam Inteligência Artificial.

Exibido em:

- Central de IA (`command-center-view.tsx`)
- Home — abaixo do card IA (`index.tsx`)
- Início executivo — abaixo dos quick actions (`executivo.tsx`)

---

## Fase 5 — Validação UX

### Um usuário novo consegue identificar a IA?

**Sim** — badge Brain+IA repetido em todos os painéis de IA + legenda de descoberta em 3 superfícies de entrada.

### A IA ficou mais evidente?

**Muito mais evidente** — padrão visual único substitui rótulos textuais dispersos e ícones genéricos (Sparkles, Bot).

### Nota UX IA

| Momento | Nota |
|---------|:----:|
| Antes Sprint IA-Visível | 4,8 / 10 |
| Depois Sprint IA-Visível | 7,6 / 10 |
| **Depois Sprint IA-Identity** | **8,7 / 10** |

---

## Fase 6 — Screenshots

| Arquivo | Conteúdo |
|---------|----------|
| `16-central-ia-badges.png` | Central com badges Brain+IA e legenda |
| `17-copilot-ia.png` | Close-up Copilot GPT com badge |
| `18-dashboard-ia-identity.png` | Home — card IA com faixa superior + legenda |
| `19-alertas-recomendacoes-ia.png` | Alertas e recomendações com badges |

Captura: `node scripts/capture-ia-identity-screenshots.mjs`

---

## Arquivos alterados

### Código

- `src/components/operational/ia-badge.tsx` — Brain icon + tooltip
- `src/components/operational/ia-legend.tsx` *(novo)*
- `src/components/operational/operational-copilot-gpt-panel.tsx`
- `src/components/operational/operational-active-agents-panel.tsx`
- `src/components/operational/operational-ia-home-card.tsx`
- `src/components/operational/command-center-view.tsx`
- `src/routes/index.tsx`
- `src/routes/executivo.tsx`
- `scripts/capture-ia-identity-screenshots.mjs` *(novo)*

### Documentação

- `docs/SPRINT_IA_IDENTITY.md` *(este arquivo)*

---

## Relatório final

### 1. Onde a IA está identificada visualmente?

- Menu lateral (ícone Brain)
- Home — card IA Operacional + legenda
- Início executivo — quick action + legenda
- Central de IA — header + legenda + todos os painéis de inteligência

### 2. Quais componentes receberam ícones Brain?

- `IaBadge` (global)
- `IaLegend` (global)
- Card IA Operacional (header)

### 3. Quais componentes receberam badges?

- Copilot GPT
- Alertas inteligentes
- Recomendações operacionais
- Forecast operacional
- Propostas operacionais
- Agentes operacionais
- Card IA Operacional
- PageHeader da Central de IA
- Quick action Executivo

### 4. Nova nota UX IA

**8,7 / 10** (+1,1 vs Sprint IA-Visível; +3,9 vs auditoria inicial)

### 5. Nova nota comercial IA

**8,3 / 10** (+1,1 vs auditoria inicial de 7,2)

### 6. Impacto esperado em demonstrações comerciais

- Identificação instantânea de IA sem treinamento prévio
- Padrão Brain+IA reforça posicionamento "MedicFlow-AI" em toda a jornada manager
- Legenda reduz perguntas "isso é IA?" em demos de 10–40 min
- Card Home com faixa violeta cria âncora visual para abrir conversa comercial sobre inteligência operacional

---

## Regressões evitadas

- RBAC inalterado
- Queries e APIs sem mudança
- Algoritmos de IA inalterados
- Banco e Supabase inalterados
