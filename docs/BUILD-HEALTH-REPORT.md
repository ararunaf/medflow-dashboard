# Relatório Build Health — MedFlow-IA

**Data:** 25/05/2026  
**Ambiente:** Windows · Node/npm · `npm run build` (Cloudflare SSR)  
**Projeto:** `MedFlow-IA/` (Vite 7.3 · TanStack Start · React 19)

---

## Resumo executivo

| Indicador | Status |
|-----------|--------|
| Build produção (`vite build`) | ✅ Sucesso |
| TypeScript (`tsc --noEmit`) | ❌ 78 erros |
| ESLint (`src` + configs) | ⚠️ 11 erros · 5 warnings |
| npm audit | ⚠️ 4 moderadas |
| Bundle client (crítico) | ⚠️ ~1,0 MB JS gzip principal |
| Tempo total de build | ~77 s |

O build **compila e empacota** corretamente, mas a saúde de tipos e lint indica **dívida técnica** que não bloqueia o Vite hoje, porém pode bloquear CI estrito ou refactors.

---

## 1. Erros encontrados

### 1.1 Build (Vite / Rollup)

Nenhum erro fatal. Build concluído com sucesso para client e SSR.

### 1.2 TypeScript — 78 erros (`npx tsc --noEmit`)

Agrupados por categoria:

| Categoria | Qtd. aprox. | Exemplos |
|-----------|-------------|----------|
| **Serialização TanStack ServerFn** (`Record<string, unknown>` / `unknown` não serializável) | ~35 | `operational-mutation-execution.ts`, `operational-timeline.ts`, `tiss-server.ts`, `command-center.ts` |
| **Retornos `unknown` de server functions nos hooks** | ~18 | `use-tiss-foundation.ts`, `use-operational-mutation-execution.ts`, `use-operational-timeline.ts` |
| **API / tipos de domínio** | ~12 | `auth-sync.tsx` (eventos Supabase), `lancamento.tsx` (erro como objeto vs string), `perfil.tsx` / `site.tsx` (`search` obrigatório em `/login`) |
| **Componentes operacionais** | ~10 | `operational-supervised-execution-panel.tsx`, `operational-memory-panel.tsx`, `operational-policy-intelligence-panel.tsx` |
| **Supabase Json vs Record** | ~5 | `security-audit-writer.ts`, `insurance-service.ts`, `incident-tracking-service.ts` |
| **vite.config.ts** | 4 | `Plugin[]` vs `Plugin` ao fazer `push` de plugins TanStack/Cloudflare |

**Arquivos com maior concentração de erros:**

- `src/lib/tiss/api/tiss-server.ts` — mutations com `MutationResult<unknown>`
- `src/hooks/use-tiss-foundation.ts` — encadeamento de `unknown`
- `src/lib/operations/api/operational-mutation-execution.ts` — `explainabilityJson`
- `src/components/operational/operational-supervised-execution-panel.tsx` — tipagem de resposta de execução

### 1.3 ESLint — 11 erros

Todos na regra **`prettier/prettier`** (formatação), corrigíveis com `npx eslint src --fix`:

| Arquivo |
|---------|
| `src/lib/env/public-env-validation.ts` |
| `src/lib/env/startup-checks.ts` |
| `src/lib/env/startup-diagnostics.ts` |
| `src/lib/monitoring/channels/auth.ts` |
| `src/lib/monitoring/channels/ssr.ts` |
| `src/lib/security/auth-security-server.ts` |
| `src/lib/security/security-audit-types.ts` |
| `src/lib/security/session-audit-server.ts` |
| `src/lib/server/health-checks.ts` |
| `src/lib/server/security-audit-writer.ts` |
| `src/lib/server/supabase-admin.ts` |

> **Nota:** `npm run lint` no projeto inteiro pode demorar vários minutos (possível varredura fora de `src/`). Recomenda-se restringir `files` no ESLint ou adicionar `node_modules.bak/**` em `ignores` se existir backup local.

---

## 2. Warnings

### 2.1 Build (Vite)

```
Using secrets defined in .env.local
```

Indica que variáveis sensíveis foram carregadas no build SSR (esperado em dev/local; em CI usar secrets do provedor, não commitar `.env.local`).

### 2.2 ESLint — 5 warnings

| Regra | Arquivos |
|-------|----------|
| `react-refresh/only-export-components` | `financial-closing-workbench.tsx`, `reconciliation-workbench.tsx`, `tenant-branding-provider.tsx`, `ui/button.tsx` |
| `react-hooks/exhaustive-deps` | `use-pilot-manual-flags.ts` (`refreshKey` desnecessário em `useMemo`) |

### 2.3 Bundles (tamanho)

| Asset | Tamanho | Observação |
|-------|---------|------------|
| `logo-medflow-*.png` | **929 KB** | Asset estático muito grande; impacta LCP |
| `central-*.js` | 171 KB (37 KB gzip) | Rota/feature pesada |
| `index-*.js` (entry) | 344 KB (103 KB gzip) | Chunk principal |
| `vendor-*.js` | 266 KB (83 KB gzip) | React + libs gerais |
| `supabase-*.js` | 207 KB (55 KB gzip) | Client Supabase |

---

## 3. Dependências problemáticas

### 3.1 npm audit — 4 vulnerabilidades moderadas

| Pacote | Severidade | Via | CVE / advisory |
|--------|------------|-----|----------------|
| `ws` | moderate | `miniflare` → `@cloudflare/vite-plugin` | [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) (memória não inicializada) |
| `miniflare` | moderate | transitiva | — |
| `wrangler` | moderate | transitiva | — |
| `@cloudflare/vite-plugin` | moderate | direta | `fixAvailable: true` |

**Ação sugerida:** `npm audit fix` ou atualizar `@cloudflare/vite-plugin` para **1.38.0** (já disponível em `npm outdated`).

### 3.2 Pacotes desatualizados (relevantes)

| Pacote | Atual | Latest | Risco |
|--------|-------|--------|-------|
| `@cloudflare/vite-plugin` | 1.36.3 | 1.38.0 | Baixo — patch segurança |
| `@tanstack/*` | 1.167–1.169 | 1.168–1.170 | Baixo — alinhar stack |
| `vite` | 7.3.3 | 8.0.14 | Médio — major |
| `eslint` / `@eslint/js` | 9.39 | 10.x | Médio — major |
| `lucide-react` | 0.575 | 1.16 | Médio — breaking icons |
| `typescript` | 5.9.3 | 6.0.3 | Médio — major |
| `nitro` | 3.0.260522-beta | — | Beta em produção Vercel |

### 3.3 Observações de stack

- **513 dependências** totais no grafo npm (233 prod + 146 dev + optional).
- **`nitro` beta** usado apenas no target Vercel (`build:vercel`); Cloudflare usa `@cloudflare/vite-plugin`.
- Pasta **`node_modules.bak.*`** no repositório (backup) — não afeta build ativo, mas ocupa disco e pode confundir ferramentas se não ignorada.

---

## 4. Imports problemáticos

### 4.1 Proteção TanStack (`importProtection`)

Configurado em `vite.config.ts`:

- Comportamento: **`error`**
- Cliente bloqueia: `**/server/**` e specifier `server-only`

### 4.2 Padrão atual (aceitável)

| Padrão | Onde | Risco |
|--------|------|-------|
| `import type { QueryResult, MutationResult } from "@/lib/server/fn-helpers"` | hooks, alguns components | ✅ Apenas tipos — não entra no bundle client |
| `import { runQuery, runMutation, ... } from "@/lib/server/fn-helpers"` | `*-server.ts`, `api/*.ts` | ✅ Server-only |
| `await import("@/lib/server/security-audit-writer")` | monitoring, auth-security | ✅ Dynamic — só em runtime server |

**Nenhum import de valor** de `@/lib/server/*` encontrado em `src/routes/` ou `src/components/` (exceto tipos).

### 4.3 Problemas reais de import/API (TypeScript)

| Problema | Arquivo | Detalhe |
|----------|---------|---------|
| Uso incorreto de `useToast()` | `operational-memory-panel.tsx`, `operational-policy-intelligence-panel.tsx` | Desestrutura `{ toast }` mas `useToast()` retorna o objeto `toast` com `.show()`, `.success()` — propriedade `toast` não existe |
| `server-only` package | ESLint `no-restricted-imports` | Bloqueado por regra — usar `*.server.ts` ou `@tanstack/react-start/server-only` |
| Tipos não serializáveis em ServerFn | Vários `*-server.ts` | `Record<string, unknown>` em payloads/respostas |

### 4.4 Chunks manuais (`manualChunks`)

```
tanstack | supabase | icons (lucide) | vendor
```

Separação adequada; entry `index` ainda concentra ~344 KB por rotas compartilhadas.

---

## 5. Performance do build

| Fase | Módulos | Tempo |
|------|---------|-------|
| Client (produção) | 2 309 | **25,23 s** |
| SSR (produção) | 2 520 | **43,00 s** |
| **Total wall clock** | — | **~77 s** |

**Fatores de custo:**

- Duplo build (client + SSR) — esperado em TanStack Start + Cloudflare.
- SSR gera **dezenas de chunks** server-side (rotas e server functions por arquivo).
- Leitura de `.env.local` no passo SSR.

**Metas sugeridas (referência):**

| Métrica | Atual | Meta |
|---------|-------|------|
| Build total | ~77 s | < 60 s (CI com cache) |
| Client transform | 2,3k módulos | monitorar crescimento |

---

## 6. Tamanho dos bundles

### 6.1 Client (`dist/client/assets`)

| Métrica | Valor |
|---------|-------|
| **Total assets** | ~2,13 MB |
| **JS (sem PNG)** | ~1,18 MB raw |
| **Maior PNG** | logo 908 KB |

**Top chunks JS (raw → gzip reportado pelo Vite):**

| Chunk | Raw | Gzip |
|-------|-----|------|
| `index-*.js` | 344 KB | 103 KB |
| `vendor-*.js` | 266 KB | 83 KB |
| `supabase-*.js` | 207 KB | 55 KB |
| `central-*.js` | 171 KB | 37 KB |
| `tiss-*.js` | 46 KB | 9 KB |
| `icons-*.js` | 26 KB | 9 KB |
| `styles-*.css` | 77 KB | 12 KB |

**First-load crítico estimado (rotas pesadas):** ~450–550 KB gzip (index + vendor + supabase + route chunk).

### 6.2 SSR (`dist/server/assets`)

| Chunk | Raw |
|-------|-----|
| `vendor-*.js` | 768 KB |
| `supabase-*.js` | 713 KB |
| `tanstack-*.js` | 521 KB |
| `central-*.js` | 296 KB |
| `router-*.js` | 234 KB |

SSR total JS server assets: ordem de **~3+ MB** (normal para worker com todas as server functions materializadas).

---

## 7. Pendências

### Prioridade alta

- [ ] Corrigir **78 erros TypeScript** — começar por serialização (`Json` / tipos concretos em DTOs) e `use-tiss-foundation` / `tiss-server` (`unknown` → tipos explícitos).
- [ ] Corrigir **`useToast()`** em painéis operacionais (`toast.show(...)` ou `success(...)`).
- [ ] Rodar **`npx eslint src --fix`** para os 11 erros Prettier.
- [ ] **`npm audit fix`** ou bump `@cloudflare/vite-plugin@1.38.0`.

### Prioridade média

- [ ] Otimizar **`logo-medflow.png`** (WebP/AVIF, dimensões menores, lazy) — ~929 KB.
- [ ] Revisar chunk **`central-*.js`** (171 KB client) — code-split ou lazy routes.
- [ ] Adicionar **`tsc --noEmit`** e **`eslint`** ao pipeline CI antes de release.
- [ ] Alinhar eventos **`auth-sync.tsx`** com tipos atuais do `@supabase/supabase-js` (`USER_DELETED`, `TOKEN_REFRESH_FAILED`).
- [ ] Corrigir navegação **`/login`** — incluir `search` params exigidos pelo router (`perfil.tsx`, `site.tsx`).

### Prioridade baixa / processo

- [ ] Completar itens em `docs/go-live-checklist.md` (smoke, RLS, staging URL, etc.).
- [ ] Atualizar stack TanStack patch (`npm update @tanstack/*`).
- [ ] Avaliar upgrade **Vite 8** / **TypeScript 6** em branch dedicada.
- [ ] Ignorar ou remover **`node_modules.bak.*`** do workspace.
- [ ] Configurar ESLint `files: ["src/**", ...]` para evitar lint lento no monorepo pai.

### Checklist go-live (referência)

Ver `docs/go-live-checklist.md`, `docs/deploy-checklist.md`, `docs/smoke-test-checklist.md`.

---

## Comandos para reproduzir

```powershell
cd MedFlow-IA
npm run build
npx tsc --noEmit
npx eslint src vite.config.ts eslint.config.js
npm audit
npm outdated
```

---

## Conclusão

O **pipeline de build está funcional** e gera artefatos client + SSR para Cloudflare. Os principais riscos de saúde são **tipagem estrita (78 erros TS)**, **formatação ESLint**, **vulnerabilidade moderada em `ws` via Cloudflare tooling**, e **assets/chunks grandes** (`logo` + `central` + `index`). Resolver TS + lint + audit eleva a confiabilidade para CI e go-live sem alterar a arquitetura atual.

*Relatório gerado automaticamente por análise local em 25/05/2026.*
