# UX-01 — Navigation Audit

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  
**Fonte principal:** `src/components/app-shell.tsx`

---

## 1. Origem da configuração

| Item | Detalhe |
|------|---------|
| Arquivo | `src/components/app-shell.tsx` |
| Função | `navForRole(role)` |
| Formato | Array inline `NavItem[]` (não há JSON/YAML de menu) |
| Filtro | `can()` / `isOperationalManager()` de `src/lib/auth/rbac.ts` |
| Consumo | Sidebar desktop + bottom nav mobile (mesma lista) |

Não existe registry externo de navegação. Quick actions operacionais vivem em arquivo separado:

- `src/lib/operations/actions/operational-action-registry.ts`
- UI: `src/components/operational/operational-quick-actions.tsx` (usado em `/central`, **não** na Home)

---

## 2. Inventário de itens de menu

Ordem atual (antes do filtro RBAC):

| # | Label | Rota | Gate `require` |
|---|-------|------|----------------|
| 1 | Home | `/` | — |
| 2 | Piloto | `/piloto` | `tenant_settings_read` |
| 3 | Go-live | `/lancamento` | `tenant_settings_read` |
| 4 | Ajuda | `/ajuda` | — |
| 5 | Executivo | `/executivo` | `financial` |
| 6 | Central de IA | `/central` | `operational_manager` |
| 7 | Escalas | `/escalas` | — |
| 8 | Plantões | `/plantoes` | — |
| 9 | Financeiro | `/financeiro` | `financial` |
| 10 | Dashboard fin. | `/financeiro/dashboard-executivo` | `financial` |
| 11 | Fechamento | `/financeiro/fechamento-operacional` | `financial` |
| 12 | TISS | `/tiss` | — |
| 13 | Captura | `/captura` | `financial` |
| 14 | Processamento | `/processamento` | `financial` |
| 15 | Analytics | `/analytics` | `financial` |
| 16 | Instituição | `/instituicao` | — |
| 17 | Painel ops | `/operacao` | `tenant_settings_read` |
| 18 | Perfil | `/perfil` | — |

### Itens **não** presentes no menu (existem como rota)

| Rota | Como se chega |
|------|----------------|
| `/financeiro/conciliacao-operacional` | Links no hub `/financeiro` |
| `/captura/revisao/$sessionId` | Deep link a partir de Captura/Processamento |
| `/site` | Landing pública |
| `/login*` | Auth |

---

## 3. Componentes e dependências

```
AppShell
  ├── useRouteContext(__root__) → auth.profile.role
  ├── useTenantBranding() → logo/banner
  ├── can / isOperationalManager (rbac)
  ├── Link (TanStack Router)
  ├── GuidedDemoStrip
  └── PilotFeedbackShell
```

Dependências **não** tocadas para reorganizar menu (UX-02):

- Runtime enterprise  
- Stores/adapters de captura  
- Matriz `roleCapabilities` (apenas reusar os mesmos gates)

---

## 4. Permissões na navegação

| Gate UI | Capacidade / regra | Roles típicos que veem |
|---------|--------------------|------------------------|
| `financial` | `financial_closing:read` | coordinator, financial, tenant_admin, super_admin |
| `tenant_settings_read` | `tenant_settings:read` | quase todos (incl. professional) |
| `operational_manager` | `super_admin \| tenant_admin \| coordinator` | gestores |
| (sem gate) | sessão autenticada | todos |

### Problemas de IA de navegação

1. **Lista plana longa** para gestores financeiros (~15–18 itens).  
2. **Captura/Processamento/Analytics** usam gate `financial` — semanticamente estranho para operação documental 24×7 (não é “financeiro”, é “operação”). UX-02 pode **relabelar/regurar só no menu** reusando a mesma capability, ou documentar a necessidade futura de capability dedicada (fora do escopo sem alterar RBAC).  
3. **TISS** é sempre visível (incl. professional com `tiss:read`), mas Captura exige `financial` — profissional vê faturamento TISS mas não captura.  
4. **Piloto / Go-live / Ajuda** no topo competem com operação do dia a dia.  
5. **Conciliação** oculta no menu.

---

## 5. Possibilidades de expansão (sem alterar RBAC)

| Expansão | Viabilidade |
|----------|-------------|
| Agrupar itens em seções no `AppShell` | Alta — só UI |
| Extrair `navForRole` para `lib/navigation/nav-config.ts` | Alta |
| Bottom nav primária + drawer “Mais” | Alta |
| Quick actions de captura na Home | Alta — estender registry |
| Breadcrumbs | Alta — novo componente |
| Novas capabilities RBAC | **Fora** — proibido nesta trilha até decisão explícita |

---

## 6. Agrupamentos recomendados (congelados)

### Desktop sidebar

```
OPERAÇÃO
  Home
  Processamento
  Captura
  Analytics

CLÍNICO
  Escalas
  Plantões

FATURAMENTO
  TISS
  Financeiro
  Dashboard fin.
  Fechamento
  Conciliação          ← incluir no menu
  Executivo

IA
  Central de IA

MONITORAMENTO
  Painel ops

ADMINISTRAÇÃO
  Instituição

IMPLANTAÇÃO
  Piloto
  Go-live
  Ajuda

CONTA
  Perfil
```

Visibilidade de cada item continua pelo mesmo `require` atual.

### Mobile (primários sugeridos)

| Slot | Item | Motivo |
|------|------|--------|
| 1 | Home | hub |
| 2 | Processamento / Plantões | role-dependent |
| 3 | Captura / Escalas | role-dependent |
| 4 | Central / TISS | role-dependent |
| 5 | Mais… | restante |

---

## 7. Quick Actions

| Origem | Escopo atual | Lacuna |
|--------|--------------|--------|
| `deriveOperationalQuickActions` | Escalas, vagas, swaps, perfil + alertas IA | Zero atalhos Captura/OCR/Processamento/TISS |
| Home header links | Piloto, Ajuda, Executivo, Central | Institucionais / IA; não operacionais documentais |
| Executivo cards | Dashboard, conciliação, instituição, Central | Comercial |

**Recomendação UX-02:** dual registry — `operational-plantao` e `operational-documental` — filtrado por role/capability existente.

---

## 8. Descoberta por domínio (estado atual)

| Domínio | Localização no menu | Velocidade de achado |
|---------|---------------------|----------------------|
| Processamento | Item 14 (após TISS) | Lenta |
| Captura | Item 13 | Lenta |
| OCR | Embutido em Captura/Processamento (sem item próprio) | Parcial |
| Auditoria | Fila dentro de Processamento | Parcial |
| Plantões | Item 8 — destaque razoável | Boa |
| Financeiro | Itens 9–11 | Média |
| IA | Item 6 | Boa (gestores) |
| Monitoramento | Analytics + Painel ops dispersos | Fraca |

---

## 9. Conclusão da auditoria de navegação

A navegação é **funcional e RBAC-aware**, porém **otimizada para plantões + piloto**, não para Centro Operacional de guias TISS.

**UX-02 pode reorganizar 100% da navegação** apenas alterando `AppShell` + registries de atalhos + Home, **sem** mudar Roles, Capabilities, Gates de serviço ou Enterprise Foundation.
