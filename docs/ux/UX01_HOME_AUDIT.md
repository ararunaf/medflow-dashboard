# UX-01 — Home Audit

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  
**Rota:** `/` — `src/routes/index.tsx`  
**Meta title:** “Dashboard”

---

## 1. O que existe hoje?

A Home autenticada monta `AppShell` e contém:

| Bloco | Quem vê | Natureza |
|-------|---------|----------|
| `PilotHomeBanner` | `tenant_settings:read` | Implantação / onboarding |
| `PageHeader` com saudação + data | Todos | Institucional / acolhimento |
| Links: Piloto, Ajuda, Executivo, Central de IA | Condicionais | Mistura implantação + IA |
| 4× `StatCard` (abertos, confirmados, trocas, disponibilidade) | Todos | **Operacional clínico (plantões)** |
| `OperationalIaHomeCard` + `IaLegend` | Gestores (`isOperationalManager`) | **IA operacional (plantões)** |
| Lista “Escala do dia” | Todos | **Operacional clínico** |
| Card “Visão operacional” | Todos | Resumo plantões + menção Realtime |
| Card “Trocas em andamento” | Todos | **Operacional clínico** |

**Não existe na Home:**

- Filas de processamento (OCR, auditoria, correção)
- Atalhos Captura / Processamento / TISS
- `OperationalQuickActions` (ficam em `/central`)
- KPIs de risco financeiro documental
- Monitoramento 24×7 / SLA
- Breadcrumbs / seletor de competência

**Loader:** prefetch de `dashboard`, `operationalReadiness`, `operationalCommandCenter`.

---

## 2. O que realmente é operacional?

### Operacional clínico (Pega Plantão / escalas)

- Métricas de plantões  
- Escala do dia  
- Trocas pendentes  
- Card IA → Central (gestores)

### Operacional documental / faturamento

- **Nada** na Home atual

### Operacional plataforma

- Banner de progresso do piloto (implantação, não operação 24×7)

---

## 3. O que é apenas institucional?

| Elemento | Motivo |
|----------|--------|
| Saudação “Bom dia, Nome” | Relacional |
| Data por extenso | Relacional |
| Links Piloto / Ajuda | Implantação e suporte |
| `PilotHomeBanner` | Onboarding comercial |
| Link “Início executivo” | Superfície comercial/demo |

Esses elementos têm valor no piloto, mas **não definem** um Centro Operacional de guias TISS.

---

## 4. O que deve permanecer?

| Elemento | Decisão |
|----------|---------|
| Shell + branding | Permanecer |
| Bloco plantões (métricas + escala + trocas) | Permanecer **como seção** (role-aware) |
| Card IA / atalho Central (gestores) | Permanecer (compacto) |
| Design tokens / StatCard / PageHeader | Permanecer |
| Prefetch leve de dashboard plantões | Permanecer (opcional reduzir CC prefetch) |

---

## 5. O que deverá sair da Home (ou ser rebaixado)?

| Elemento | Ação recomendada (UX-02) |
|----------|---------------------------|
| Piloto / Ajuda como CTAs principais do header | Mover para grupo Implantação / rodapé |
| `PilotHomeBanner` dominante | Mostrar só se piloto incompleto; colapsável |
| Home = única narrativa “escala do dia” | Deixar de ser o herói para roles financeiros/ops documentais |
| Prefetch agressivo do command center para todos | Revisar (performance) — opcional |

---

## 6. Home alvo — Centro Operacional

> Especificação congelada; implementação em UX-02.

### Para roles com `financial_closing:read` (e gestores documentais)

Hero operacional:

1. **Filas críticas** — OCR pendente, auditoria, correção, aguardando revisão  
2. **Quick Actions** — Nova captura, Abrir processamento, TISS, Analytics  
3. **Risco / impacto** — síntese do dashboard de processamento  
4. **Secundário** — plantões do dia (compacto) + IA plantões

### Para `professional`

Manter foco em escala / plantões / disponibilidade (já alinhado).

### Para gestores sem financeiro

Manter Central + plantões; adicionar leitura Analytics se policy permitir no futuro (hoje Analytics é menu-gated financial).

---

## 7. Respostas obrigatórias da sprint

| Pergunta | Resposta |
|----------|----------|
| O que existe hoje? | Dashboard de plantões + piloto + IA operacional |
| O que é operacional? | Quase só eixo clínico (plantões) |
| O que é institucional? | Saudação, piloto, ajuda, executivo |
| O que deve permanecer? | Shell, métricas plantão (seção), card IA, design kit |
| O que deve sair / rebaixar? | Primazia do piloto e da narrativa só-clínica para operadores documentais |

**A Home está preparada para um Centro Operacional?**  
**NÃO**
