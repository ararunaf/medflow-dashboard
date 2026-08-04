# UX-01 — Route Inventory

**Sprint:** UX-01 — Enterprise Operational Center (READ ONLY)  
**Data:** 2026-08-04  
**Fonte:** `src/routeTree.gen.ts` + `src/routes/*`

---

## 1. Total

**24 entradas de rota** (incluindo filhos e parâmetro dinâmico `$sessionId`).

Router: TanStack file-based. Não há Next.js App Router / Pages Router / react-router.

---

## 2. Inventário classificado

### Operação

| Path | Arquivo | Notas |
|------|---------|-------|
| `/` | `routes/index.tsx` | Home atual (plantões) |
| `/captura` | `routes/captura.tsx` | Captura Inteligente |
| `/captura/revisao/$sessionId` | `routes/captura/revisao.$sessionId.tsx` | Deep workspace |
| `/processamento` | `routes/processamento.tsx` | Centro de filas |
| `/operacao` | `routes/operacao.tsx` | Health / backup (plataforma) |

### Clínico

| Path | Arquivo | Notas |
|------|---------|-------|
| `/escalas` | `routes/escalas.tsx` | Janela 14 dias |
| `/plantoes` | `routes/plantoes.tsx` | Abertos / Meus / Swaps |
| `/perfil` | `routes/perfil.tsx` | Disponibilidade / conta |

### Faturamento

| Path | Arquivo | Notas |
|------|---------|-------|
| `/tiss` | `routes/tiss.tsx` | Convênios, guias, lotes, XML, glosas… |
| `/financeiro` | `routes/financeiro.tsx` | Hub (KPIs ilustrativos) |
| `/financeiro/dashboard-executivo` | `routes/financeiro.dashboard-executivo.tsx` | KPIs reais |
| `/financeiro/fechamento-operacional` | `routes/financeiro.fechamento-operacional.tsx` | Fechamento |
| `/financeiro/conciliacao-operacional` | `routes/financeiro.conciliacao-operacional.tsx` | Conciliação |
| `/executivo` | `routes/executivo.tsx` | Início comercial/executivo |

### IA

| Path | Arquivo | Notas |
|------|---------|-------|
| `/central` | `routes/central.tsx` | Central de IA Operacional (plantões) |

> Nota: painéis de auditoria/correção da captura são **IA documental embutida** em `/captura` e `/processamento`, sem rota dedicada “Auditor IA” / “Supervisor IA”.

### Monitoramento

| Path | Arquivo | Notas |
|------|---------|-------|
| `/analytics` | `routes/analytics.tsx` | KPIs de captura |
| `/operacao` | (também Operação) | Health checks, erros, backup |

### Administração

| Path | Arquivo | Notas |
|------|---------|-------|
| `/instituicao` | `routes/instituicao.tsx` | Settings / branding tenant |

### Implantação

| Path | Arquivo | Notas |
|------|---------|-------|
| `/piloto` | `routes/piloto.tsx` | Checklist piloto |
| `/lancamento` | `routes/lancamento.tsx` | Go-live |
| `/ajuda` | `routes/ajuda.tsx` | Help center |

### Legacy / institucional público

| Path | Arquivo | Notas |
|------|---------|-------|
| `/site` | `routes/site.tsx` | Landing comercial (sem AppShell) |

### Auth

| Path | Arquivo | Notas |
|------|---------|-------|
| `/login` | `routes/login.tsx` | Login |
| `/login/esqueci-senha` | `routes/login.esqueci-senha.tsx` | Recovery |
| `/login/redefinir-senha` | `routes/login.redefinir-senha.tsx` | Reset |

### Deep Links

| Path | Tipo | Query / params |
|------|------|----------------|
| `/captura/revisao/$sessionId` | Deep link operacional | `sessionId`; `returnTo` usado no fluxo |
| `/processamento?queue=` | Deep link de fila | queues: `ocr_pendente`, `parser`, `auditoria`, … |
| `/central?opsFocus=` | Deep link IA | `availability`, `pressure`, `coverage`, `swaps`, … |
| `/plantoes?tab=` | Deep link clínico | `disponiveis`, `swaps`, … |
| `/escalas` + `opsFocus` | Deep link a partir da Central | conflitos / abertos |
| `/ajuda?tab=&article=` | Deep link documentação | artigos help |
| `/financeiro/*` | Deep links financeiros | guard `assertFinancialReadAccess` |

---

## 3. Matriz rota × menu × guard

| Path | No menu? | Route guard além de auth |
|------|----------|---------------------------|
| `/` | Sim | Auth global |
| `/captura` | Sim (`financial`) | **Sem** beforeLoad financial |
| `/captura/revisao/$sessionId` | Não (deep) | Auth global |
| `/processamento` | Sim (`financial`) | **Sem** beforeLoad financial |
| `/analytics` | Sim (`financial`) | **Sem** beforeLoad financial |
| `/tiss` | Sim | Auth global |
| `/central` | Sim (`operational_manager`) | **Sem** beforeLoad manager |
| `/financeiro*` | Parcial* | `assertFinancialReadAccess` |
| `/executivo` | Sim | `assertFinancialReadAccess` |
| `/operacao` | Sim | Soft UI (`tenant_settings`) |
| `/piloto`, `/lancamento` | Sim | Soft UI |
| `/site`, `/login*` | N/A | Públicos |

\* Conciliação existe mas **fora** do menu lateral.

**Implicação UX (não alterar RBAC agora):** a reorganização de menu pode melhorar descoberta; endurecimento de `beforeLoad` em captura/central é decisão de segurança **separada** e fora do escopo UX-01/UX-02 se a regra for “não alterar gates”.

---

## 4. Rotas inexistentes (desejáveis na Fase 3 — só inventário)

| Path conceitual | Classificação |
|-----------------|---------------|
| `/scanner` ou `/captura/scanner` | Nova área |
| `/monitoramento/sla` | Nova área |
| `/monitoramento/producao` | Nova área (além da aba TISS Produção) |
| `/ia/supervisor` | Placeholder / split de `/central` |
| `/ia/auditor` | Placeholder (hoje embutido na captura) |
| `/filas` (enterprise workers) | Nova área |
| `/operadoras` (admin global) | Parcial via TISS Convênios |

---

## 5. Documentação legada

`docs/ROUTES_FORENSIC_AUDIT.md` (08/06/2026) está **parcialmente desatualizado**: não lista captura/processamento/analytics/conciliação. Este inventário UX-01 é a fonte canônica atual para navegação.

---

## 6. Conclusão

Todas as rotas necessárias ao Centro Operacional documental **já existem** (`/captura`, `/processamento`, `/analytics`, `/tiss`) ou têm deep links. O gap é de **arquitetura de informação e Home**, não de ausência total de rotas.
