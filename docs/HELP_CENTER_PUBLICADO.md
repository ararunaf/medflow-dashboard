# HELP-CENTER-03 — Publicação Real em Staging

**Data:** 2026-06-12  
**Ambiente:** `https://staging.medicflow.app.br`  
**Classificação final:** **[X] Implementado e publicado**

---

## Fase 1 — Arquivos HELP-CENTER

### Commitados nesta publicação

| Arquivo | Tipo |
|---------|------|
| `src/routes/ajuda.tsx` | Rota integrada com `HelpCenterExecutive` |
| `src/components/help-center/help-center-executive.tsx` | Componente principal |
| `src/components/help-center/image-lightbox.tsx` | Lightbox, preview e `HelpSection` |
| `src/lib/assets/help-center.ts` | Constantes de assets |
| `public/help/workflow-operacional-executivo.png` | Workflow operacional |
| `public/help/medicflow-ai-corporativo-premium.pptx` | Apresentação corporativa (download) |
| `public/help/medicflow-ai-corporativo-premium.pdf` | Apresentação corporativa (visualizar) |

### Locais (não commitados nesta etapa)

| Arquivo | Status |
|---------|--------|
| `docs/HELP_CENTER_EXECUTIVO.md` | Documentação local |
| `docs/AUDITORIA_HELP_CENTER_DIVERGENCIA.md` | Auditoria local |
| `docs/screenshots/help-center/` | Screenshots locais (preview) |
| `scripts/capture-help-center-screenshots.mjs` | Script preview local |
| `scripts/fixtures/help-center-preview.html` | **Não utilizado** (proibido) |

---

## Fase 2 — Commit

```
feat(help): publicar centro executivo de treinamento
```

**Hash:** `951775b`  
**Arquivos:** 7 changed, 424 insertions(+), 2 deletions(-)

---

## Fase 3 — Push

| Campo | Valor |
|-------|-------|
| Branch | `main` |
| Remote | `origin` |
| Range | `319fde9..951775b` |
| **Push realizado?** | **Sim** |

---

## Fase 4 — Deploy Staging

| Campo | Valor |
|-------|-------|
| Comando | `npm run deploy:staging` |
| **Version ID** | `bc800410-2ea4-44ca-a98c-2452a56a5f7a` |
| Worker | `https://medflow-ia.calm-waterfall-a03d.workers.dev` |
| Domínio | `https://staging.medicflow.app.br` |

---

## Fase 5 — Validação URL Real

**URL:** [https://staging.medicflow.app.br/ajuda](https://staging.medicflow.app.br/ajuda)  
**Autenticação:** `admin.teste@medicflow.app.br` · tenant `medflow-v1-demo` (sessão Supabase SSR)

| Verificação | Resultado |
|-------------|-----------|
| Workflow Operacional aparece | ✓ `#workflow` visível |
| Apresentação Corporativa aparece | ✓ `#apresentacao` visível |
| Botão **Visualizar** funciona | ✓ link PDF `200 OK` |
| Botão **Download** funciona | ✓ link PPTX `200 OK` |
| Central de IA aparece | ✓ `#ia` visível |
| Primeiros Passos aparece | ✓ `#primeiros-passos` visível |
| Asset workflow PNG | ✓ `200 OK` |

---

## Fase 6 — Screenshots Reais (staging autenticado)

Capturados em `docs/screenshots/help-center-staging/` — **sem fixture offline**.

| Arquivo | Conteúdo |
|---------|----------|
| `01-ajuda-real.png` | Visão geral da Central de Ajuda |
| `02-workflow-real.png` | Seção Workflow Operacional |
| `03-ppt-real.png` | Card Apresentação Corporativa |
| `04-ia-real.png` | Seção Central de IA |

Script de captura: `scripts/capture-help-center-staging-screenshots.mjs`

---

## Resumo Executivo

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Commit hash | `951775b` |
| 2 | Push realizado? | **Sim** (`main` → `origin/main`) |
| 3 | Version ID deploy | `bc800410-2ea4-44ca-a98c-2452a56a5f7a` |
| 4 | URL validada | `https://staging.medicflow.app.br/ajuda` |
| 5 | Screenshots reais | `docs/screenshots/help-center-staging/*.png` (4 arquivos) |
| 6 | Resultado final | **Implementado e publicado** |

---

## Classificação Final

- [ ] Implementado mas não publicado
- [ ] Parcialmente implementado
- [X] **Implementado e publicado**
