# UX-01 — UI Architecture

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  
**Escopo:** Arquitetura visual e estrutural da interface autenticada  
**Código alterado:** nenhum

---

## 1. Sumário executivo

A UI autenticada do MedicFlow-AI é uma SPA React (Vite + TanStack Start/Router + Tailwind v4) com **um único shell de navegação** (`AppShell`). Não há layout aninhado por domínio, nem breadcrumbs, nem agrupamento visual de menu.

A arquitetura atual serve bem o **domínio de plantões/escalas + IA operacional + piloto comercial**. O domínio de **Captura → OCR → Processamento → Auditoria → TISS/Faturamento** já possui páginas e componentes, mas a experiência de navegação ainda não está organizada como um **Centro Operacional 24×7**.

---

## 2. Stack de apresentação

| Camada | Tecnologia | Evidência |
|--------|------------|-----------|
| Framework | React + Vite + TanStack Start | `package.json`, `vite.config.ts` |
| Rotas | TanStack Router (file-based) | `src/routes/*`, `src/routeTree.gen.ts` |
| Estilo | Tailwind CSS v4 + design tokens | `src/styles.css` |
| Ícones | Lucide | `app-shell.tsx` |
| Primitivos | Radix / shadcn-like | `src/components/ui/*` |
| Dados UI | TanStack Query + Supabase Realtime | hooks + `RealtimeProvider` em `__root.tsx` |

---

## 3. Hierarquia de layout

```
__root.tsx
  ├── Auth beforeLoad (login / site públicos)
  ├── Providers (Query, Auth, Realtime, Branding, …)
  └── Outlet
        ├── /site, /login*  → layouts próprios (sem AppShell)
        └── rotas autenticadas → cada página monta <AppShell>
              ├── Desktop: aside sidebar (lg+)
              ├── Mobile: header sticky + bottom nav
              ├── main (max-w-7xl)
              ├── GuidedDemoStrip
              └── PilotFeedbackShell
```

**Observação arquitetural:** `AppShell` é aplicado **por página**, não via layout de rota pai. Isso facilita rotas públicas sem shell, mas impede herança consistente de chrome e dificulta breadcrumbs/contextos por domínio.

---

## 4. Superfícies de chrome

### 4.1 Sidebar (desktop, `lg+`)

| Aspecto | Estado atual |
|---------|--------------|
| Componente | `src/components/app-shell.tsx` |
| Largura | `w-64` fixa |
| Branding | Logo + banner tenant |
| Itens | Lista plana filtrada por RBAC (`navForRole`) |
| Agrupamento | **Ausente** |
| Scroll | `overflow-y-auto` no `<nav>` |
| Footer | versão + nome da instituição |

### 4.2 Header

| Aspecto | Estado atual |
|---------|--------------|
| Desktop | **Não há header global** — só sidebar + conteúdo |
| Mobile | Header sticky só com logo/banner (sem busca, sem hamburger, sem ações) |
| Page-level | `PageHeader` (`ui-kit.tsx`) por tela |

### 4.3 Menu mobile

| Aspecto | Estado atual |
|---------|--------------|
| Padrão | Bottom navigation horizontal |
| Capacidade | Mesmos itens da sidebar (pode chegar a ~18) |
| Overflow | `overflow-x-auto` + `min-w-max` |
| Problema | Descoberta degradada com muitos itens |

### 4.4 Breadcrumbs

| Aspecto | Estado atual |
|---------|--------------|
| Componente | **Inexistente** |
| Busca em `src/` | zero ocorrências de `breadcrumb` / `Breadcrumb` |
| Navegação contextual | Links em `PageHeader.actions` e CTAs locais |

---

## 5. Design system observado

Tokens em `src/styles.css`:

- Primary: deep navy  
- Secondary/AI: teal  
- Surfaces: white / light gray  
- Fontes: Plus Jakarta Sans (display) + Inter (sans)

Componentes reutilizáveis de página:

- `PageHeader`, `StatCard`, `EmptyState`, `ErrorState`, `StatusBadge`, `SkeletonRow` (`ui-kit.tsx`)
- `Button`, `Input`, `Label`, `Switch`, `Avatar` (`components/ui/`)
- Família operacional IA (`components/operational/*`)
- Família captura/processamento (`modules/capture/*`)
- Família TISS / financeiro / piloto

**Consistência:** alta dentro de cada família; **média** entre famílias (plantões vs captura vs TISS vs piloto). Visual brand é coerente; informação arquitetura (IA vs operação documental vs plantões) compete no mesmo menu plano.

---

## 6. Arquitetura alvo (congelada para UX-02)

> Apenas especificação — **não implementar nesta sprint**.

### 6.1 Princípio

Reorganizar a UX como **Centro Operacional Enterprise**, sem alterar Runtime, RBAC, APIs ou Foundation.

### 6.2 Grupos de navegação propostos

| Grupo | Conteúdo típico |
|-------|-----------------|
| **Operação** | Home operacional, Processamento, Captura, Filas |
| **Clínico / Plantões** | Escalas, Plantões, Perfil (disponibilidade) |
| **Faturamento** | TISS, Financeiro, Fechamento, Conciliação, Dashboard fin. |
| **IA** | Central de IA, Supervisor/Auditor (futuro) |
| **Monitoramento** | Analytics, Painel ops, Produção/SLA (futuro) |
| **Administração** | Instituição |
| **Implantação** | Piloto, Go-live, Ajuda |
| **Conta** | Perfil |

### 6.3 Home alvo

Home deixa de ser primariamente “escala do dia” e passa a ser **cockpit operacional** com:

1. Saúde das filas (OCR / auditoria / correção)  
2. Atalhos de captura e processamento  
3. Alertas IA + plantões (secundários ou por role)  
4. Entrada rápida para TISS / fechamento (roles financeiros)

### 6.4 Shell alvo

- Sidebar **agrupada** (seções colapsáveis)  
- Header desktop com contexto (tenant, competência, status 24×7)  
- Mobile: bottom nav com **5–6 primários** + “Mais”  
- Breadcrumbs em rotas profundas (`/captura/revisao/$id`, financeiro/*)

---

## 7. Componentes reutilizáveis — inventário útil para UX-02

| Componente | Reuso na reorganização |
|------------|------------------------|
| `AppShell` | Refatorar config de nav (sem mudar RBAC) |
| `PageHeader` / `StatCard` | Manter |
| `OperationalQuickActions` | Estender registry para captura/TISS |
| `CommandCenterView` | Permanecer sob grupo IA |
| Capture pages / Processing* | Permanecer; melhorar entry points |
| TISS page tabs | Permanecer; linkar ao fluxo captura |
| Pilot strips | Manter, reduzir presença na Home operacional |

---

## 8. Performance (impacto na arquitetura UX)

- Realtime + heartbeat globais no shell autenticado  
- Home prefetcha dashboard + readiness + command center  
- Nav plana longa aumenta custo cognitivo (não de bytes)

A reorganização de UX **não exige** mudanças de backend; pode reduzir queries da Home ao separar “Home plantões” de “Home operacional documental”.

---

## 9. Conclusão arquitetural

| Pergunta | Resposta |
|----------|----------|
| Existe shell único e previsível? | **SIM** |
| Existe arquitetura de informação operacional (grupos, breadcrumbs, home de filas)? | **NÃO** |
| O design system permite evolução sem reescrever UI? | **SIM** (~70–80% reaproveitável) |
| A arquitetura visual futura pode ser congelada agora? | **SIM** — ver seção 6 |

**Veredito parcial:** base técnica de UI é sólida; arquitetura de experiência operacional **ainda não está congelada no produto** — esta documentação a congela para UX-02.
