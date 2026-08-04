# UX-01 — RBAC Audit (UI Reorganization)

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  
**Fontes:** `src/lib/auth/rbac.ts`, `app-shell.tsx`, `route-guard.ts`, `finance-access.ts`

---

## 1. Objetivo desta auditoria

Confirmar se a **reorganização visual/navegacional (UX-02)** pode ocorrer **sem alterar**:

- Roles  
- Permissões (`Capability`)  
- Gates de serviço / `assertCan`  
- Policies Postgres  
- Enterprise Foundation

---

## 2. Roles existentes (congelados)

```
super_admin | tenant_admin | coordinator | professional | financial
```

Fonte: `src/lib/database.types.ts` / matriz `roleCapabilities`.

---

## 3. Capabilities relevantes à UI

| Capability | Uso na navegação atual |
|------------|------------------------|
| `financial_closing:read` | Menu: Executivo, Financeiro*, Captura, Processamento, Analytics; route guard financeiro |
| `tenant_settings:read` | Menu: Piloto, Go-live, Painel ops; soft gates em páginas |
| (helper) `isOperationalManager` | Menu: Central de IA; card IA na Home |
| `tiss:read` / `tiss:write` | Página TISS (ações); menu TISS sempre visível se autenticado |
| Demais schedules/shifts/swaps | Escalas / Plantões (lógica de página) |

Nenhuma capability nova é **obrigatória** para reagrupar o menu.

---

## 4. Mapa Role × Visibilidade de menu (resumo)

| Item | professional | financial | coordinator | tenant/super admin |
|------|:------------:|:---------:|:-----------:|:------------------:|
| Home, Ajuda, Escalas, Plantões, TISS, Instituição, Perfil | ✓ | ✓ | ✓ | ✓ |
| Piloto, Go-live, Painel ops | ✓* | ✓* | ✓ | ✓ |
| Central de IA | — | — | ✓ | ✓ |
| Executivo, Financeiro*, Captura, Processamento, Analytics | — | ✓ | ✓ | ✓ |

\* `tenant_settings:read` está em PROFESSIONAL_CAPS e FINANCIAL_CAPS.

---

## 5. Gates de rota vs gates de menu

| Camada | O que faz | Alterar em UX-02? |
|--------|-----------|-------------------|
| `evaluateRouteGuard` | Auth session → login | **Não** |
| `assertFinancialReadAccess` | Redirect `/` sem `financial_closing:read` | **Não** (reusar) |
| Soft `can()` em páginas | Empty/denied UI | **Não** (reusar) |
| `navForRole` filters | Esconde itens | **Sim** — só reorganização visual/ordem/grupos |

### Lacunas já existentes (não introduzidas por UX)

- `/captura`, `/processamento`, `/analytics`: menu exige `financial`, rota **não** chama `assertFinancialReadAccess`.  
- `/central`: menu exige manager, rota **não** tem beforeLoad de role.

**Decisão UX-01:** documentar apenas. Endurecer guards seria alteração de gates — **fora** se a restrição “não alterar Gates” for literal. Reorganização de menu **não depende** de fechar essas lacunas.

---

## 6. Confirmação formal

| Pergunta | Resposta |
|----------|----------|
| Reorganizar sidebar/grupos exige novas roles? | **NÃO** |
| Reorganizar Home exige novas capabilities? | **NÃO** |
| Incluir Conciliação no menu exige novo gate? | **NÃO** — reusa `financial` |
| Quick actions documentais exigem mudar `roleCapabilities`? | **NÃO** — filtrar com `can()` existente |
| Mobile “Mais” exige mudar RBAC? | **NÃO** |
| Alguma alteração funcional de autorização é necessária para UX-02? | **NÃO** |

---

## 7. Ressalva de produto (não bloqueante)

O gate `financial` em Captura/Processamento/Analytics é **semanticamente desalinhado** com “operação documental 24×7”. Corrigir isso com capability dedicada (ex.: `capture:operate`) seria evolução de RBAC — **sprint futura**, não pré-requisito de UX-02.

Enquanto isso, UX-02 deve:

- Continuar usando `financial_closing:read` / mesmos `require`  
- Apenas **renomear labels de grupo** (“Operação” em vez de misturar sob Financeiro)

---

## 8. Conclusão

**Toda a reorganização de navegação e Home pode ocorrer SEM alterar Roles, Permissões ou Gates.**

RBAC permanece 100% congelado na trilha UX-01 → UX-02.
