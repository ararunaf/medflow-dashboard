# ARCHITECTURE

## Visão geral

MedFlow-IA é um dashboard de saúde com SSR (Server-Side Rendering) baseado em:

- React + TanStack Start / React Router
- Vite 7
- Supabase (auth, banco, storage, realtime)
- Cloudflare Workers (deploy padrão) ou Vercel (alternativa)
- Tailwind CSS / Radix UI / Lucide

A aplicação é multi-tenant: o usuário autentica via Supabase, carrega `profile` e `tenantId`, e o acesso às rotas é controlado por guardas.

## Principais módulos

Observados no repositório:

- `src/lib/auth/` — autenticação, guardas de rota, tipos de contexto, reset de senha
- `src/lib/capture/` — captura e processamento de documentos
- `src/lib/enterprise/` — runtime, validação XML/TISS, ports/adapters
- `src/lib/services/` — serviços de negócio (TISS, operações, conciliação, produção, etc.)
- `src/lib/supabase/` — configuração do cliente Supabase
- `src/lib/security/` — CSP, rate-limit, headers de segurança
- `src/lib/monitoring/` — logging/audit no SSR
- `src/lib/operational/` — operação central, painéis e agentes
- `src/lib/realtime/` — subscriptions realtime
- `src/modules/capture/` — páginas e componentes do módulo de captura
- `src/routes/` — definição de rotas do TanStack Router
- `src/components/` — componentes React organizados por domínio
- `supabase/migrations/` — schema do banco

## Estrutura de diretórios

```
src/
├── assets/
├── components/
├── hooks/
├── lib/
│   ├── auth/
│   ├── capture/
│   ├── commercial/
│   ├── domain/
│   ├── enterprise/
│   ├── env/
│   ├── errors/
│   ├── executive-dashboard/
│   ├── financial-closing/
│   ├── knowledge/
│   ├── medical-payout/
│   ├── monitoring/
│   ├── navigation/
│   ├── observability/
│   ├── operational/
│   ├── operational-observability/
│   ├── operational-reconciliation/
│   ├── operations/
│   ├── pilot-execution/
│   ├── production-release/
│   ├── queries/
│   ├── rag/
│   ├── realtime/
│   ├── routes/
│   ├── security/
│   ├── server/
│   ├── services/
│   ├── supabase/
│   ├── tiss/
│   └── toast/
├── modules/
│   └── capture/
├── routes/
├── router.tsx
├── routeTree.gen.ts
├── server.ts
├── start.ts
└── styles.css
```

## Fluxo da aplicação

1. Requisição chega ao Worker (`src/server.ts`) ou ao Vercel/Nitro.
2. Health checks, rate-limit na `/login` e captura de erros são aplicados.
3. TanStack Start renderiza a rota correspondente.
4. `__root.tsx` / `route-guard.ts` verifica autenticação.
5. Componentes carregam dados via `src/lib/queries/` e TanStack Query.
6. Server functions acessam Supabase e serviços de `src/lib/services/`.

**PENDENTE DE DEFINIÇÃO**: diagrama completo e fluxo de estados do lado do cliente.

## Camadas

- **Apresentação**: `src/components/`, `src/routes/`, `src/modules/`
- **Roteamento/Estado**: `src/router.tsx`, TanStack Router, `src/lib/queries/`
- **Domínio/Serviços**: `src/lib/services/`, `src/lib/domain/`
- **Adapters/Ports**: `src/lib/enterprise/` (runtime, ports, adapters, registries)
- **Infraestrutura**: `src/lib/supabase/`, `src/lib/security/`, `src/lib/monitoring/`, `src/lib/server/`

## Dependências principais

Ver `package.json`:

- React 19 + React DOM
- TanStack Query, Router, Start, Table, Virtual
- Supabase JS + SSR
- Vite 7 + plugin React + `@tailwindcss/vite` + `vite-tsconfig-paths`
- Cloudflare Vite plugin / Wrangler
- Nitro (para deploy Vercel)
- Tailwind CSS 4
- Radix UI + Lucide
- ESLint, Prettier, TypeScript 5.8

## Fluxo de autenticação

- Supabase Auth gerencia sessão/usuário.
- `AuthContext` contém `session`, `user`, `profile`, `tenantId`.
- Caminhos públicos: `/login`, `/login/*`, `/site`, `/site/*`.
- Usuário não autenticado em rota privada -> `/login`.
- Usuário autenticado sem `profile` -> `/login`.
- Usuário autenticado acessando `/login` ou `/login/esqueci-senha` -> `/`.
- **PENDENTE DE DEFINIÇÃO**: fluxo de troca de tenant e RLS detalhado.

## Fluxo de build

1. `npm run env-check:prod` (produção) ou `npm run env-check:staging` (staging).
2. `npm run build` ou `npm run build:staging` / `npm run build:vercel`.
3. Vite carrega `.env` por modo:
   - dev: `.env` → `.env.local`
   - staging: `.env` → `.env.local` → `.env.staging`
   - produção: `.env` → `.env.local` → `.env.production`
4. Em build:
   - Se `VERCEL=1` ou `MEDFLOW_DEPLOY_TARGET=vercel` -> plugin `nitro()`.
   - Caso contrário -> plugin `cloudflare()`.
5. `manualChunks` separa `@tanstack`, `@supabase`, `lucide-react` e vendor.
6. Saída SSR para `src/server.ts`.

## Fluxo de deploy

Cloudflare Workers (atual):

- `npm run build` (produção) ou `npm run build:staging` (staging).
- `npm run staging-validate` / `npm run production-validate`.
- `npm run deploy:preview` para dry-run.
- `npm run deploy` manual com wrangler autenticado.
- Domínio customizado em `wrangler.jsonc`: `staging.medicflow.app.br`.
- Variáveis configuradas no painel da Cloudflare (nunca commite secrets).

Vercel (alternativa):

- `vercel.json` usa `npm run build:vercel` e `npm ci`.
- Região `gru1`.
- Headers de cache e segurança configurados em `vercel.json`.

**PENDENTE DE DEFINIÇÃO**: pipeline automático, se houver.

## Componentes críticos

- `src/server.ts` — entry do Worker, segurança, health, rate-limit, captura de erros.
- `src/router.tsx` / `src/routes/__root.tsx` — roteamento e guardas.
- `src/lib/auth/` — sessão, guardas, reset de senha.
- `src/lib/enterprise/runtime/` — runtime enterprise (em evolução na branch atual).
- `src/lib/enterprise/xml-validation-runtime/` — validação XML/TISS.
- `src/lib/capture/` — captura e processamento de documentos.
- `src/lib/services/tiss/` — processamento de TISS e glosas.
- `src/lib/supabase/` — conexão com Supabase.
- `src/lib/security/csp.ts` — headers de segurança.
