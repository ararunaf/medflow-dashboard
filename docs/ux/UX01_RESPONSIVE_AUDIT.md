# UX-01 — Responsive Audit

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  
**Fontes:** `app-shell.tsx`, `styles.css`, páginas Home / Processamento / TISS / Escalas

---

## 1. Breakpoints (Tailwind default)

| Prefixo | Largura típica | Uso no shell |
|---------|----------------|--------------|
| `sm` | 640px | Ações do header da Home |
| `md` | 768px | Landing `/site` |
| `lg` | **1024px** | Sidebar desktop vs header+bottom nav mobile |
| `xl` | 1280px | Grids do command center |

Não há breakpoints custom no `@theme` além de tokens de cor/fonte/radius.

---

## 2. Desktop (≥1024px)

| Aspecto | Avaliação |
|---------|-----------|
| Sidebar fixa 256px | OK |
| Conteúdo `max-w-7xl` | OK |
| Menu plano longo | **Gargalo cognitivo** (não de viewport) |
| Ausência de header global | Limitação de contexto (tenant/competência/status) |
| Tabelas TISS / Processamento | Usáveis; algumas com scroll horizontal interno |

**Gargalos:** densidade de navegação; Home não mostra filas documentais.

---

## 3. Notebook (1366×768 / 1440×900)

| Aspecto | Avaliação |
|---------|-----------|
| Sidebar + main | OK |
| Home grid 4 colunas | OK em `lg` |
| Central de IA densa | Pode exigir scroll longo |
| Processamento (dashboard + filtros + tabs + tabela) | Verticalmente longo — esperado |

**Gargalos:** altura útil com GuidedDemoStrip / PilotFeedbackShell ativos.

---

## 4. Tablet (768–1023px)

| Aspecto | Avaliação |
|---------|-----------|
| Trata como **mobile** (`lg:hidden` shell) | Bottom nav + header logo |
| Sem sidebar | OK conceitualmente |
| Bottom nav com muitos itens | **Gargalo crítico** — scroll horizontal |
| Tabelas | `overflow-x-auto` — usáveis com atrito |
| Escalas day strip | Scroll horizontal |

**Gargalos:** navegação inferior sobrecarregada; ausência de “primários vs Mais”.

---

## 5. Mobile (<768px)

| Aspecto | Avaliação |
|---------|-----------|
| Header só branding | Sem ações / busca / menu hamburger |
| Bottom nav scrollável | Funciona, descoberta ruim (~10–18 ícones) |
| Labels `text-[10px]` truncados | Legibilidade limitada |
| `pb-24` no main | Evita overlay — OK |
| Home stats 2 colunas | OK |
| Captura (câmera) | Canal previsto; UX mobile relevante |
| Dropzone / review workspace | Precisa validação visual em UX-02 (não alterado aqui) |

**Gargalos:**

1. Bottom nav com todos os itens RBAC  
2. Sem breadcrumbs em `/captura/revisao/$id`  
3. TISS multi-abas (`flex-wrap`) melhor que bottom nav, mas ainda denso  
4. Piloto/Go-live competem com Captura/Processamento no mesmo trilho

---

## 6. Matriz de gargalos

| ID | Superfície | Severidade | Impacto no Centro Operacional |
|----|------------|------------|-------------------------------|
| R1 | Bottom nav saturada | Alta | Operador não acha Processamento/Captura |
| R2 | Menu desktop sem grupos | Alta | Mesmo problema em notebook |
| R3 | Sem breadcrumbs deep links | Média | Perda de contexto na revisão |
| R4 | Home só plantões | Alta | Mobile não prioriza filas |
| R5 | Strips piloto no rodapé | Baixa–Média | Consome viewport |
| R6 | Tabelas largas | Média | Atrito em tablet |
| R7 | Header mobile sem ações | Média | Sem atalho rápido “Nova captura” |

---

## 7. Performance perceptiva (responsivo)

- Realtime global + heartbeat em qualquer viewport  
- Home prefetcha 3 queries — custo igual em mobile  
- Imagens de logo/banner com `loading="lazy"` — OK  

Reorganizar nav **reduz atrito**; não resolve sozinha carga de queries (opcional em UX-02).

---

## 8. Recomendações (somente especificação)

1. Mobile: 5 slots primários + drawer “Mais”  
2. Desktop: seções colapsáveis  
3. Tablet: herdar mobile primário (não sidebar estreita improvisada)  
4. Deep routes: breadcrumbs  
5. Home role-aware: filas primeiro para operadores documentais  

---

## 9. Conclusão

A base responsiva (sidebar/`lg` + bottom nav) é **sólida para um app de plantões**. Para Centro Operacional com ~18 destinos, o modelo atual é **insuficiente em tablet/mobile** e **cognitivamente saturado no desktop**.

Complexidade de correção em UX-02: **MÉDIA** (shell + Home; sem redesign de cada workbench).
