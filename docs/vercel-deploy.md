# Vercel — deploy MedFlow-IA (TanStack Start + SSR)

> **Stack:** TanStack Start + Vite + **Nitro** (preset `vercel`).  
> O deploy **Cloudflare Workers** (`npm run build` + `wrangler deploy`) continua disponível; use **um** destino por ambiente.

## Pré-requisitos

1. Conta [Vercel](https://vercel.com) e projeto ligado ao repositório.
2. **Root Directory** no painel: `MedFlow-IA` (se o monorepo estiver na raiz do Git).
3. Framework: detecção automática **TanStack Start** (ou deixe em branco — `vercel.json` define o build).

## Build local (validação)

```bash
cd MedFlow-IA
npm ci
cp .env.vercel.example .env.production   # só local; não commitar
npm run env-check:vercel
npm run build:vercel
npm run vercel-validate
```

Saída esperada: `.vercel/output/` (Build Output API gerada pelo Nitro).

## Variáveis de ambiente (painel Vercel)

| Variável | Ambiente | Sensitive | Obrigatória |
| -------- | -------- | --------- | ----------- |
| `VITE_SUPABASE_URL` | Production, Preview | Não | Sim |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview | Não | Sim |
| `VITE_MEDFLOW_APP_URL` | Production | Não | Recomendado |
| `VITE_MEDFLOW_CONTACT_EMAIL` | Production | Não | Opcional |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **Sim** | Para auditoria/admin |
| `MEDFLOW_AUDIT_HASH_SALT` | Production | **Sim** | Recomendado |
| `MEDFLOW_OPENAI_API_KEY` | Production | **Sim** | Opcional (copiloto) |
| `MEDFLOW_OPENAI_MODEL` | Production | Não | Opcional |

**Regras:**

- Prefixo `VITE_` → embutido no build; alterar exige **redeploy**.
- Secrets **sem** `VITE_` → só servidor (SSR / server functions).
- **Nunca** `VITE_MEDFLOW_DEBUG=1` em produção.

Referência: `.env.vercel.example` e `.env.production.example`.

## SSR e compatibilidade

| Item | Implementação |
| ---- | ------------- |
| SSR | TanStack Start + Nitro preset `vercel` → Vercel Functions (Fluid Compute) |
| Entry | `src/server.ts` (rate limit `/login`, headers, fallback de erro SSR) |
| Middleware | `src/start.ts` (erros SSR + headers em páginas de erro) |
| Cookies/auth | `@supabase/ssr` — mesma lógica que Cloudflare |
| Build | `MEDFLOW_DEPLOY_TARGET=vercel` ou `VERCEL=1` no CI ativa Nitro em vez de Cloudflare |

## `vercel.json`

| Seção | Função |
| ----- | ------ |
| `buildCommand` | `npm run build:vercel` |
| `regions` | `gru1` (São Paulo) |
| `redirects` | Normalização de trailing slash |
| `headers` | Cache em estáticos + headers de segurança (complemento ao Nitro) |

**Rewrites:** não são necessários — o Nitro registra o handler SSR e rotas da aplicação automaticamente.

Headers dinâmicos (CSP completo) também vêm de `nitro.config.ts` + `src/server.ts` / `src/start.ts`.

## Cache

| Recurso | Política |
| ------- | -------- |
| `/assets/*` (hash Vite) | `max-age=31536000, immutable` |
| Fontes | 1 ano, immutable |
| Imagens | 30 dias |
| HTML / rotas SSR | `private, no-store` |

Definido em `nitro.config.ts` (`routeRules`) e reforçado em `vercel.json` para assets estáticos na edge.

## Redirects adicionais (domínio customizado)

Após apontar DNS para a Vercel, configure no painel **Domains** ou acrescente em `vercel.json`:

```json
{
  "source": "/:path*",
  "has": [{ "type": "host", "value": "www.seudominio.com.br" }],
  "destination": "https://app.seudominio.com.br/:path*",
  "permanent": true
}
```

Atualize `VITE_MEDFLOW_APP_URL` para o domínio final **antes** do build de produção.

## Supabase Auth

Authentication → URL Configuration:

- **Site URL:** valor de `VITE_MEDFLOW_APP_URL`
- **Redirect URLs:** `https://seu-dominio/**`, `http://localhost:8080/**`

## Deploy

```bash
# CLI (após vercel link)
vercel --prod
```

Ou push na branch conectada ao projeto (Production / Preview).

## Checklist pós-deploy

- [ ] `/site` e `/login` respondem (HTTP &lt; 500)
- [ ] `npm run smoke-check:prod` com `SMOKE_BASE_URL` = URL Vercel
- [ ] Headers de segurança visíveis (`curl -I https://...`)
- [ ] Login piloto + logout
- [ ] `docs/go-live-checklist.md`

## Referências

- [TanStack Start on Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- `docs/cloudflare-pages.md` — deploy alternativo Workers
- `docs/deploy-checklist.md`
