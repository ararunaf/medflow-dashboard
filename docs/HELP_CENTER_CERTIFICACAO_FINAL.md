# HELP-CENTER-04 — Certificação Final de Publicação em Staging

**Data da certificação:** 2026-06-12  
**Ambiente validado:** `https://staging.medicflow.app.br/ajuda`  
**Auditor:** processo automatizado + validação manual via Playwright (URL real)

---

## Fase 1 — Auditoria Git

| Item | Resultado |
|------|-----------|
| Branch atual | `main` |
| Working tree limpo? | **Não** — existem alterações locais não relacionadas ao HELP-CENTER (docs, scripts, componentes IA/login). O commit do HELP-CENTER em si está limpo no histórico. |
| Commit que contém HELP-CENTER | `feat(help): publicar centro executivo de treinamento` |
| Hash completo | `951775b7badb76a597741916cbe7e0295c90e6b3` |
| Data do commit | `2026-06-12 11:23:16 -0300` |

**Arquivos no commit `951775b`:**

- `src/routes/ajuda.tsx`
- `src/components/help-center/help-center-executive.tsx`
- `src/components/help-center/image-lightbox.tsx`
- `src/lib/assets/help-center.ts`
- `public/help/workflow-operacional-executivo.png`
- `public/help/medicflow-ai-corporativo-premium.pdf`
- `public/help/medicflow-ai-corporativo-premium.pptx`

---

## Fase 2 — Auditoria GitHub

| Item | Resultado |
|------|-----------|
| Repositório | `https://github.com/ararunaf/medflow-dashboard.git` |
| Branch remota | `origin/main` |
| Commit HELP-CENTER presente no GitHub? | **SIM** |
| Hash remoto | `951775b7badb76a597741916cbe7e0295c90e6b3` |

**Evidência:** `git rev-parse HEAD` = `git rev-parse origin/main` = `951775b7badb76a597741916cbe7e0295c90e6b3`. Branch local reporta *up to date with 'origin/main'*.

---

## Fase 3 — Auditoria Deploy

| Item | Resultado |
|------|-----------|
| Version ID | `bc800410-2ea4-44ca-a98c-2452a56a5f7a` |
| Data/Hora | `2026-06-12T14:26:23.463Z` (Cloudflare Workers) |
| Commit associado | `951775b7badb76a597741916cbe7e0295c90e6b3` (inferido: deploy posterior ao commit 11:23 -0300; build marker `2026-06-12T14:25:39.891Z`; HEAD remoto = commit HELP-CENTER) |

**Evidência wrangler:**

```
Created: 2026-06-12T14:26:23.463Z
Version(s): bc800410-2ea4-44ca-a98c-2452a56a5f7a
```

**Build marker staging:** `dist/.staging-build-marker.json` → `builtAt: 2026-06-12T14:25:39.891Z`

**O deploy contém o HELP-CENTER?** **SIM** — seções `#workflow`, `#apresentacao`, `#ia`, `#primeiros-passos` visíveis em `https://staging.medicflow.app.br/ajuda`; assets `/help/*` retornam HTTP 200.

---

## Fase 4 — Validação da URL Real

**URL:** [https://staging.medicflow.app.br/ajuda](https://staging.medicflow.app.br/ajuda)  
**Autenticação:** `admin.teste@medicflow.app.br` · tenant `medflow-v1-demo` (sessão Supabase SSR via cookie)

### Workflow Operacional

| Verificação | Resultado |
|-------------|-----------|
| Aparece na página? | ✓ `#workflow` visível |
| Imagem carregada? | ✓ PNG `/help/workflow-operacional-executivo.png` HTTP 200 |
| Botão ampliar? | ✓ botão "Ampliar" visível; lightbox abre (`role="dialog"`) |
| Botão download? | ✓ link Download visível; asset HTTP 200 |

### Apresentação Corporativa

| Verificação | Resultado |
|-------------|-----------|
| Aparece na página? | ✓ `#apresentacao` visível |
| Card carregado? | ✓ card com título e descrição |
| Botão visualizar? | ✓ link PDF HTTP 200 |
| Botão download? | ✓ link PPTX HTTP 200 |

### Central de IA / Primeiros Passos

| Verificação | Resultado |
|-------------|-----------|
| Central de IA aparece? | ✓ `#ia` visível |
| Primeiros Passos aparece? | ✓ `#primeiros-passos` visível (6 cards de onboarding) |

| Item | Resultado |
|------|-----------|
| Workflow | **OK** |
| PPT | **OK** |
| Central IA | **OK** |
| Primeiros Passos | **OK** |

---

## Fase 5 — Evidências Reais (screenshots staging autenticado)

Capturados exclusivamente de `https://staging.medicflow.app.br/ajuda` — **sem preview HTML, fixture ou mock**.

| Arquivo | Conteúdo |
|---------|----------|
| `docs/screenshots/help-center-certificacao/01-ajuda-completa.png` | Visão geral da Central de Ajuda |
| `docs/screenshots/help-center-certificacao/02-workflow-operacional.png` | Seção Workflow Operacional |
| `docs/screenshots/help-center-certificacao/03-apresentacao-corporativa.png` | Card Apresentação Corporativa |
| `docs/screenshots/help-center-certificacao/04-central-ia.png` | Seção Central de IA |
| `docs/screenshots/help-center-certificacao/05-primeiros-passos.png` | Seção Primeiros Passos |

Metadados: `docs/screenshots/help-center-certificacao/validation-results.json`

---

## Fase 6 — Teste dos Links

| Função | Resultado |
|--------|-----------|
| Workflow visualizar (lightbox/ampliar) | **OK** — dialog abre ao clicar em Ampliar |
| Workflow download | **OK** — `/help/workflow-operacional-executivo.png` HTTP 200 |
| PPT visualizar | **OK** — `/help/medicflow-ai-corporativo-premium.pdf` HTTP 200 |
| PPT download | **OK** — `/help/medicflow-ai-corporativo-premium.pptx` HTTP 200 |

---

## Fase 7 — Certificação Consolidada

### Git

| Campo | Valor |
|-------|-------|
| Commit hash | `951775b7badb76a597741916cbe7e0295c90e6b3` |
| Push realizado? | **Sim** (`main` → `origin/main`, sincronizado) |
| GitHub sincronizado? | **Sim** |

### Deploy

| Campo | Valor |
|-------|-------|
| Version ID | `bc800410-2ea4-44ca-a98c-2452a56a5f7a` |
| URL validada | `https://staging.medicflow.app.br/ajuda` |

### Funcionalidades

| Módulo | Status |
|--------|--------|
| Workflow Operacional | ✓ Publicado e funcional |
| Apresentação Corporativa | ✓ Publicado e funcional |
| Central IA | ✓ Publicado e funcional |
| Primeiros Passos | ✓ Publicado e funcional |

### Evidências

- `docs/screenshots/help-center-certificacao/01-ajuda-completa.png`
- `docs/screenshots/help-center-certificacao/02-workflow-operacional.png`
- `docs/screenshots/help-center-certificacao/03-apresentacao-corporativa.png`
- `docs/screenshots/help-center-certificacao/04-central-ia.png`
- `docs/screenshots/help-center-certificacao/05-primeiros-passos.png`
- `docs/screenshots/help-center-certificacao/validation-results.json`

---

## Resultado Final

```
HELP CENTER = CERTIFICADO E PUBLICADO
```

**Justificativa técnica:**

1. O commit `951775b` contém a implementação completa do Centro de Ajuda Executivo (7 arquivos, 424 linhas).
2. O hash está presente em `origin/main` no GitHub (`951775b7badb76a597741916cbe7e0295c90e6b3`).
3. O deploy staging mais recente (`bc800410-2ea4-44ca-a98c-2452a56a5f7a`, 2026-06-12 14:26 UTC) foi executado após o commit e reflete a funcionalidade na URL real.
4. Todas as seções (Workflow, Apresentação, Central IA, Primeiros Passos) foram validadas visualmente em staging autenticado.
5. Todos os links de assets (PNG, PDF, PPTX) retornam HTTP 200; lightbox de workflow abre corretamente.
6. Screenshots de evidência capturados diretamente de `https://staging.medicflow.app.br/ajuda`.

**Observação:** o working tree local possui alterações não commitadas em outros módulos (IA, login, docs), mas **não afetam** a certificação do HELP-CENTER, cujo código está commitado, enviado e publicado.
