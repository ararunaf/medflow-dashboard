# PROJECT_CONTEXT

## Nome do projeto

`medflow-ia` (MedFlow-IA)

## Objetivo

Dashboard para gestão de fluxos e documentos de saúde. Oferece login multi-tenant, painéis para rotas como `/financeiro`, `/tiss`, `/piloto`, `/instituicao`, `/ajuda` e `/lancamento`, integração com Supabase e processamento de documentos/AI.

## Tecnologias utilizadas

- React 19
- TypeScript 5.8
- Vite 7
- Tailwind CSS 4
- TanStack (react-query, react-router, react-table, react-virtual, react-start, router-plugin)
- Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Cloudflare Wrangler / `@cloudflare/vite-plugin`
- Nitro (SSR, alternativa Vercel)
- ESLint + Prettier
- Node.js Test Runner + `tsx`
- Radix UI / Lucide / class-variance-authority
- Vercel e/ou Cloudflare Pages para deploy

## Estrutura principal

```
MedFlow-IA/
├── .github/
├── docs/
│   └── agent/
├── public/
├── scripts/
├── src/
│   ├── assets/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── modules/
│   ├── routes/
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── supabase/
│   ├── migrations/
│   └── scripts/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
├── vercel.json
└── nitro.config.ts
```

## Ambientes

| Ambiente | Arquivo de env | Comando principal |
| -------- | -------------- | ----------------- |
| Desenvolvimento | `.env.local` | `npm run dev` |
| Staging | `.env.staging` | `npm run build:staging` |
| Produção | `.env.production` | `npm run build` |

## Branch de desenvolvimento atual

`feat/inf-10-enterprise-scalability-runtime`

## Estratégia Git

- Repositório remoto: `https://github.com/ararunaf/medflow-dashboard.git`
- Branch ativa: `feat/inf-10-enterprise-scalability-runtime`
- **PENDENTE DE DEFINIÇÃO** — estratégia completa de branches, merges e releases.

## Componentes críticos

Mapeados no repositório:

- `src/lib/auth/` — sessão, guardas, reset de senha.
- `src/lib/enterprise/` — runtime, escalabilidade, validação XML/TISS.
- `src/lib/capture/` — captura e processamento de documentos.
- `src/lib/services/` — serviços de negócio (TISS, operações, conciliação, produção, etc.).
- `src/lib/supabase/` — conexão com Supabase.
- `src/lib/security/` — CSP, rate-limit, headers de segurança.
- `src/lib/monitoring/` — logging/audit no SSR.
- `src/lib/operational/` — operação central, painéis e agentes.
- `src/lib/realtime/` — subscriptions realtime.
- `src/modules/capture/` — páginas e componentes do módulo de captura.
- `src/routes/` — definição de rotas do TanStack Router.
- `src/server.ts` — entry do Worker SSR.
- `supabase/migrations/` — schema e migrations do banco.

## Funcionalidades congeladas

Restrições operacionais atuais (não devem ser alteradas sem aprovação):

- Código de produção
- Banco de dados
- Supabase
- Edge Functions
- Vercel
- Cloudflare
- Testes existentes
- UX existente
- Documentação existente

## Processo de homologação

**PENDENTE DE DEFINIÇÃO**

Validações disponíveis no repositório:

- `npm run local-validate`
- `npm run production-validate`
- `npm run staging-validate`
- `npm run env-check`
- `npm run smoke-check`

## Processo de deploy

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

**PENDENTE DE DEFINIÇÃO** — pipeline automático, se houver.

## Fluxo resumido de desenvolvimento

1. `npm install`
2. Configurar `.env.local` (ver `.env.example`)
3. `npm run dev`
4. `npm run local-validate`
5. `npm run production-validate` (pré-deploy)
6. `npm run deploy:preview` / `npm run deploy` quando aprovado

## Convenções utilizadas

- ESM (`"type": "module"`)
- TypeScript estrito
- Import alias `@/`
- Componentes no `src/components/`
- Lógica de negócio e ports/adapters em `src/lib/`
- Roteamento com `@tanstack/react-router`
- Validação com scripts em `scripts/`
- Testes com Node Test Runner + `tsx`
- UI baseada em Tailwind CSS, Radix UI e Lucide

## Sprint atual

### Branch em execução

- **Branch:** `feat/inf-10-enterprise-scalability-runtime`
- **Foco:** Escalabilidade do runtime enterprise (XML validation runtime e enterprise runtime).

### Contexto a preencher

```markdown
Sprint: ...
Escopo: ...
Critérios de GO: ...
Riscos: ...
Observações: ...
```
