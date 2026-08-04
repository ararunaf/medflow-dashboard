# UX-01 — Implementation Plan for UX-02

**Sprint origem:** UX-01 (auditoria)  
**Sprint destino:** UX-02 — Implementação da Nova Navegação  
**Data:** 2026-08-04  

Este plano **não implementa nada**. Define o escopo mínimo viável de UX-02.

---

## 1. Objetivo de UX-02

Reorganizar a experiência autenticada como **Centro Operacional Enterprise**, preservando:

- Enterprise Foundation  
- Runtime / OCR / Capture / XML / TISS engines  
- Roles, Capabilities, Gates  
- APIs e banco  

Alterações permitidas: **UI de navegação, Home, atalhos, breadcrumbs, agrupamentos**.

---

## 2. Fora de escopo (UX-02)

- Qualquer arquivo em `src/lib/enterprise/**`  
- Mudança de RBAC / policies  
- Handoff Captura → Guia TISS (produto; sprint própria)  
- Scanner TWAIN/WIA / Watch Folder funcionais  
- Novos workers  
- Deploy / TAG / push (salvo processo do time)

---

## 3. Workstreams

### W1 — Navigation config

| Tarefa | Arquivos prováveis | Critério |
|--------|--------------------|----------|
| Extrair `navForRole` para config tipada | `lib/navigation/*`, `app-shell.tsx` | Mesmos gates |
| Agrupar itens em seções | `app-shell.tsx` | Sidebar com headings |
| Incluir Conciliação no menu financeiro | config nav | Deep link existente |
| Mobile: primários + “Mais” | `app-shell.tsx` | ≤6 slots fixos |

### W2 — Home operacional

| Tarefa | Arquivos prováveis | Critério |
|--------|--------------------|----------|
| Layout role-aware | `routes/index.tsx` | Finance/manager veem filas |
| Quick actions documentais | registry + Home | Captura, Processamento, TISS |
| Rebaixar piloto/ajuda | Home header | Não dominam first viewport |
| Manter seção plantões | Home | Profissional intacto |

### W3 — Breadcrumbs & deep context

| Tarefa | Critério |
|--------|----------|
| Componente `Breadcrumbs` | Usado em revisão, financeiro/*, processamento |
| Labels pt-BR estáveis | Sem depender de RBAC novo |

### W4 — Quick actions unificadas

| Tarefa | Critério |
|--------|----------|
| Estender `operational-action-registry` ou criar `documental-action-registry` | Atalhos captura/filas |
| Exibir na Home + opcional Processamento | Sem mudar Central plantões |

### W5 — Preparação Fase 3 (só slots)

| Tarefa | Critério |
|--------|----------|
| Seções IA / Monitoramento / Operação reservadas | Comentários ou items `disabled`/ocultos **não** inventar fake routes sem decisão |
| Documentar deep links futuros | Atualizar docs/ux |

---

## 4. Ordem sugerida

```
1. Extrair nav-config (sem mudança visual)
2. Agrupar sidebar desktop
3. Mobile primários + Mais
4. Home role-aware + quick actions
5. Breadcrumbs em deep routes
6. QA visual por role (5 roles)
7. Smoke rotas existentes (sem regressão de path)
```

---

## 5. Test plan (aceitação UX-02)

### Por role

| Role | Deve achar em ≤2 cliques |
|------|--------------------------|
| financial / coordinator | Processamento, Captura, TISS, Fechamento |
| coordinator / admin | Central de IA, Plantões |
| professional | Plantões, Escalas, Perfil |
| todos autenticados | Home, Ajuda |

### Regressão

- [ ] Todos os paths atuais resolvem  
- [ ] `assertFinancialReadAccess` inalterado  
- [ ] Menu não mostra itens sem capability  
- [ ] Deep links `?queue=`, `opsFocus`, revisão `$sessionId`  
- [ ] Nenhum diff em `src/lib/enterprise/**`  
- [ ] Nenhum diff em `rbac.ts` (salvo se time decidir — default: zero)

### Responsivo

- [ ] Desktop: grupos visíveis  
- [ ] Tablet/Mobile: bottom nav ≤6 + Mais  
- [ ] Revisão captura usável com breadcrumbs  

---

## 6. Estimativa de complexidade

| Dimensão | Nível |
|----------|-------|
| Escopo de código UI | Médio |
| Risco de regressão de rota | Baixo–Médio |
| Risco de regressão RBAC | Baixo (se não tocar matriz) |
| Esforço Home role-aware | Médio |
| Esforço total UX-02 | **MÉDIA** (tende a **ALTA** se incluir handoff TISS ou redesign de workbenches) |

**Escopo recomendado UX-02:** W1+W2+W3+W4 → complexidade **MÉDIA**.

---

## 7. Critérios de GO para iniciar UX-02

Já satisfeitos por UX-01:

- [x] Arquitetura documentada  
- [x] Navegação auditada  
- [x] Fluxos mapeados  
- [x] Plano de implementação  
- [x] Sem alteração de código de produto nesta sprint  
- [x] Sem commit/deploy exigidos pela auditoria  
- [x] Foundation congelada  

---

## 8. Entregáveis esperados de UX-02

1. Sidebar agrupada  
2. Mobile nav compacta  
3. Home cockpit (role-aware)  
4. Breadcrumbs  
5. Quick actions documentais  
6. Atualização breve em `docs/ux/` (changelog UX-02)
