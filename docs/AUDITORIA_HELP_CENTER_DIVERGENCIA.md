# AUDITORIA HELP-CENTER-02 — Divergência entre relatório HELP-CENTER-01 e staging

**Data da auditoria:** 12/06/2026  
**Ambiente verificado:** `https://staging.medicflow.app.br/ajuda`  
**Commit HEAD do repositório:** `319fde9` — *chore(staging): sincronizar UX login, IA visível, homologação e documentação comercial* (11/06/2026 22:52 -0300)  
**Escopo:** investigação apenas — nenhuma alteração de código

---

## Resumo executivo

O relatório HELP-CENTER-01 descreve entrega completa (UI, assets, build, staging). A auditoria comprova que **a implementação existe somente no working tree local, sem commit e sem deploy**. O staging continua servindo a versão antiga de `/ajuda` (apenas biblioteca de artigos). Os screenshots anexados ao relatório foram gerados por **fixture HTML estático offline**, não pela rota real autenticada nem pelo ambiente publicado.

**Veredito:** a funcionalidade está **parcialmente implementada** (código local completo, porém não versionado nem publicado).

---

## FASE 1 — Auditoria da rota `src/routes/ajuda.tsx`

### Perguntas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | O componente Workflow realmente está sendo renderizado? | **Sim, no working tree local.** Via `<HelpCenterExecutive />`, que contém a seção `#workflow` com `ImagePreviewCard`. |
| 2 | O componente PPT realmente está sendo renderizado? | **Sim, no working tree local.** Mesmo componente, seção `#apresentacao` com links PDF/PPTX. |
| 3 | Em qual linha? | Import na **linha 4**; renderização incondicional na **linha 84**. Workflow e PPT ficam dentro de `HelpCenterExecutive` (linhas 97–158 de `help-center-executive.tsx`). |
| 4 | Existem condicionais ocultando esses blocos? | **Não.** `<HelpCenterExecutive />` é renderizado sem `if`, feature flag ou RBAC. |

### Evidência — working tree (com HELP-CENTER-01)

```tsx
// src/routes/ajuda.tsx — linha 4
import { HelpCenterExecutive } from "@/components/help-center/help-center-executive";

// src/routes/ajuda.tsx — linha 84
<HelpCenterExecutive />
```

### Evidência — versão commitada em HEAD (o que o staging reflete)

```bash
git show HEAD:src/routes/ajuda.tsx
# NÃO contém import HelpCenterExecutive
# NÃO contém <HelpCenterExecutive />
# subtitle = "FAQ operacional, guias rápidos, passos iniciais e documentação para piloto V1."
```

```bash
git diff HEAD -- src/routes/ajuda.tsx
# M src/routes/ajuda.tsx  (modificado, não commitado)
```

---

## FASE 2 — Auditoria dos componentes

### Componentes solicitados vs. existentes

| Componente solicitado | Existe? | Equivalente real |
|----------------------|---------|------------------|
| `WorkflowViewer` | **Não** | `ImagePreviewCard` + `ImageLightbox` em `image-lightbox.tsx` |
| `WorkflowCard` | **Não** | Seção `HelpSection` id=`workflow` em `help-center-executive.tsx` |
| `PresentationCard` | **Não** | Seção `HelpSection` id=`apresentacao` em `help-center-executive.tsx` |
| `PPTViewer` | **Não** | Links `<a href={pdfPath}>` e `<a download={pptxPath}>` |

### Arquivos reais

| Arquivo | Status git | Importado na rota? |
|---------|------------|-------------------|
| `src/components/help-center/help-center-executive.tsx` | `??` untracked | Sim (`ajuda.tsx:4`) |
| `src/components/help-center/image-lightbox.tsx` | `??` untracked | Sim (via `help-center-executive.tsx`) |
| `src/lib/assets/help-center.ts` | `??` untracked | Sim (constantes `HELP_CENTER_ASSETS`) |
| `public/help/workflow-operacional-executivo.png` | `??` untracked | Referenciado em runtime |
| `public/help/medicflow-ai-corporativo-premium.{pdf,pptx}` | `??` untracked | Referenciado em runtime |

```bash
git log --oneline --all -- "src/components/help-center/*" "src/lib/assets/help-center.ts"
# (vazio — nunca commitado)
```

**Conclusão Fase 2:** componentes existem e estão conectados **apenas no disco local**. Não há histórico git; nomes do relatório (`WorkflowViewer`, etc.) não correspondem ao código.

---

## FASE 3 — Auditoria do build

### Qual commit gerou os screenshots?

**Nenhum commit.** Arquivos em `docs/screenshots/help-center/` são untracked.

| Arquivo | Gerado em (filesystem) |
|---------|------------------------|
| `01-ajuda-overview.png` | 12/06/2026 09:26:15 |
| `02-ajuda-workflow.png` | 12/06/2026 09:26:16 |
| `03-ajuda-ppt-card.png` | 12/06/2026 09:26:17 |
| `04-ajuda-ia.png` | 12/06/2026 09:26:18 |

**Método de captura:** `scripts/capture-help-center-screenshots.mjs` serve um **fixture estático** (`scripts/fixtures/help-center-preview.html`), não a rota `/ajuda` autenticada:

```javascript
// scripts/capture-help-center-screenshots.mjs:42
if (rel === "/" || rel === "/ajuda") rel = "/help-center-preview.html";
```

Isso explica por que os screenshots mostram as seções mesmo sem deploy — são HTML hardcoded, não evidência de produção/staging.

### Qual commit está publicado em staging?

| Item | Valor |
|------|-------|
| Último commit git | `319fde9` (sem HELP-CENTER-01) |
| Último deploy Cloudflare Worker | `893e1fb6-78e9-4afe-bf99-ebb047f1d1ab` em **2026-06-12T00:28:26Z** |
| Build local staging (não deployado) | `dist/.staging-build-marker.json` → `2026-06-12T11:59:31Z` |

O deploy de staging (**00:28 UTC**) é **anterior** ao build local com HELP-CENTER (**11:59 UTC**) e **anterior** à geração dos screenshots (**~12:26 UTC**).

### O staging contém a implementação?

**Não.**

| Verificação | Resultado |
|-------------|-----------|
| Bundle local `dist/client/assets/ajuda-CdUbVSyo.js` | **24.434 bytes** — contém `HELP_CENTER_ASSETS`, seções workflow/PPT |
| Staging `/assets/ajuda-*.js` | Retorna **HTML SPA fallback** (~9.971 bytes, `Content-Type: text/html`) — bundle JS real não publicado ou hash inexistente |
| `/help/workflow-operacional-executivo.png` | HEAD/GET **200**, porém `Content-Type: text/html` — **arquivo PNG ausente** |
| `/help/medicflow-ai-corporativo-premium.pdf` | Idem — **PDF ausente** |
| `/help/medicflow-ai-corporativo-premium.pptx` | Idem — **PPTX ausente** |

**Nota:** requisições HEAD retornam HTTP 200 enganoso (fallback SPA). Inspeção do corpo confirma ausência dos assets binários.

### Observação sobre autenticação

`/ajuda` **não é rota pública** (`src/lib/auth/route-guard.ts`). Acesso não autenticado redireciona para `/login`. Mesmo autenticado, o bundle servido em staging corresponde ao código de HEAD (sem `HelpCenterExecutive`).

---

## FASE 4 — Auditoria de deploy

### Último Version ID do Worker

```
Version ID: 893e1fb6-78e9-4afe-bf99-ebb047f1d1ab
Created:    2026-06-12T00:28:26.063Z
Author:     admin@iaeasy.com.br
Worker:     medflow-ia
Route:      staging.medicflow.app.br/*
```

Histórico completo via `npx wrangler deployments list` (8 deploys desde 02/06/2026).

### Comparação com HELP-CENTER-01

| Marco | Commit / artefato | Contém HELP-CENTER? |
|-------|-------------------|---------------------|
| HEAD git | `319fde9` | **Não** |
| HELP-CENTER-01 (relatório) | Arquivos untracked + `ajuda.tsx` modificado | **Sim (local)** |
| Último deploy staging | `893e1fb6…` @ 12/06 00:28 UTC | **Não** |
| Build local pós-HELP-CENTER | marker 12/06 11:59 UTC | **Sim** — **nunca deployado** |

### O deploy correto foi publicado?

## **NÃO**

Evidências:
1. Nenhum arquivo HELP-CENTER-01 foi commitado (`git status` → `??` / `M` não staged).
2. Último `wrangler deploy` (12/06 00:28 UTC) anterior ao build HELP-CENTER (12/06 11:59 UTC).
3. Assets `/help/*` ausentes no staging (HTML fallback).
4. Relatório HELP-CENTER-01 afirma `build:staging` OK, mas **não há registro de `deploy:staging` posterior** com esses arquivos.

---

## FASE 5 — Síntese de evidências

### 1. O que foi prometido (HELP-CENTER-01)

- Seções Workflow Operacional e Apresentação Corporativa em `/ajuda`
- Assets em `/help/workflow-operacional-executivo.png`, PDF e PPTX
- Screenshots de evidência visual
- Build staging OK e URL staging funcional
- Nova estrutura com 5 seções institucionais + biblioteca operacional

### 2. O que existe no código (working tree local)

| Item | Status |
|------|--------|
| UI Workflow + PPT + IA + Primeiros Passos | ✅ Implementado em `help-center-executive.tsx` |
| Integração na rota | ✅ `ajuda.tsx` modificado (não commitado) |
| Assets estáticos | ✅ `public/help/*` (não commitados) |
| Lightbox / preview | ✅ `image-lightbox.tsx` |
| Bundle local | ✅ `ajuda-CdUbVSyo.js` com `HELP_CENTER_ASSETS` |

### 3. O que existe no staging

| Item | Status |
|------|--------|
| Seções Workflow / PPT na UI | ❌ Ausentes (código de HEAD) |
| Assets `/help/*` | ❌ Ausentes (SPA fallback HTML) |
| Bundle com HELP-CENTER | ❌ Não publicado |

### 4. O que está faltando

1. **Commit git** de todos os arquivos HELP-CENTER-01  
2. **`npm run deploy:staging`** após build com código commitado  
3. **Evidências reais** capturadas em staging autenticado (não fixture offline)  
4. **Smoke test pós-deploy** de `/ajuda` e `/help/*`

### 5. Causa raiz exata

**Entrega documental sem fechamento do ciclo commit → deploy.**

O HELP-CENTER-01 foi implementado no working tree, build local e screenshots via fixture HTML estático. O relatório interpretou build local bem-sucedido como entrega concluída. Porém:

- Nenhum arquivo foi commitado ao repositório.
- Nenhum deploy staging posterior incorporou o bundle com `HelpCenterExecutive`.
- Os screenshots provam o fixture/preview, não o comportamento de `/ajuda` em staging.

---

## Classificação final

A funcionalidade está:

- [ ] Implementada e publicada
- [ ] Implementada mas não publicada
- [x] **Parcialmente implementada**
- [ ] Não implementada

**Justificativa:** código e assets existem localmente de forma funcional, mas **não estão versionados (git)** nem **publicados (staging)**. O relatório HELP-CENTER-01 antecipou a conclusão da entrega.

---

## Anexo — comandos de verificação reprodutíveis

```powershell
# Status git dos arquivos HELP-CENTER
git status --short src/routes/ajuda.tsx src/components/help-center/ public/help/

# Diff da rota vs HEAD
git diff HEAD -- src/routes/ajuda.tsx

# Último deploy Worker
npx wrangler deployments list

# Assets ausentes no staging (corpo HTML, não binário)
Invoke-WebRequest -Uri "https://staging.medicflow.app.br/help/workflow-operacional-executivo.png" -UseBasicParsing |
  Select-Object StatusCode, @{N='ContentType';E={$_.Headers['Content-Type']}}, @{N='Length';E={$_.RawContentLength}}

# Bundle local contém implementação
Select-String -Path "dist/client/assets/ajuda-CdUbVSyo.js" -Pattern "workflow-operacional"
```

---

*Auditoria HELP-CENTER-02 — somente investigação, sem alteração de código.*
