# Staging — `staging.medicflow.app.br`

Ambiente de pré-produção separado de dev local e de produção. Nenhum deploy automático.

## Domínio canônico

| Item | Valor |
|------|--------|
| Host | `staging.medicflow.app.br` |
| URL pública | `https://staging.medicflow.app.br` |
| Variável | `VITE_MEDFLOW_APP_URL=https://staging.medicflow.app.br` |

## DNS (Cloudflare)

Zona: `medicflow.app.br` (proxy Cloudflare recomendado).

1. **Workers → Custom Domain** (preferencial): adicione `staging.medicflow.app.br` ao worker `medflow-ia`.
2. **Ou CNAME manual** (se o painel indicar):
   - Nome: `staging`
   - Destino: hostname do Worker (ex.: `medflow-ia.<account>.workers.dev`) ou registro indicado pelo assistente de Custom Domains.
3. Aguarde propagação e TLS ativo (HTTPS).

## Variáveis de ambiente

Copie e preencha localmente (não commitar secrets):

```bash
cp .env.staging.example .env.staging
```

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | Sim | Projeto Supabase **staging** dedicado |
| `VITE_SUPABASE_ANON_KEY` | Sim | Anon key do projeto staging |
| `VITE_MEDFLOW_APP_URL` | Sim | Exatamente `https://staging.medicflow.app.br` |
| `VITE_MEDFLOW_DEBUG` | Não | **Não** definir em staging com usuários |
| `MEDFLOW_OPENAI_API_KEY` | Opcional | Secret no servidor (sem prefixo `VITE_`) |

No **Cloudflare Workers → Settings → Variables**, replique as mesmas `VITE_*` **antes** do build de staging.

## Supabase Auth (projeto staging)

Authentication → URL Configuration:

- **Site URL:** `https://staging.medicflow.app.br`
- **Redirect URLs:**
  - `https://staging.medicflow.app.br/**`
  - `http://localhost:8080/**` (somente desenvolvimento local)

Não use `localhost` em `VITE_MEDFLOW_APP_URL` do build staging.

## Build e validação

```bash
cd MedFlow-IA
npm ci
npm run env-check:staging
npm run staging-validate
# ou CI com placeholders: npm run staging-validate:ci
```

`staging-validate` verifica:

- `.env.staging` sem placeholders e com domínio staging correto
- `npm run build:staging` (client + SSR)
- Ausência de `localhost` / `127.0.0.1` nos bundles JS
- Presença de `staging.medicflow.app.br` no bundle client

## Deploy manual (Cloudflare Workers)

**Este é o único comando permitido para staging:**

```bash
npm run deploy:staging
```

O script `deploy:staging` executa automaticamente, nesta ordem, e **aborta** se qualquer etapa falhar:

1. `env-check:staging` — `.env.staging` sem placeholders
2. `build:staging` — `vite build --mode staging` + marcador de build
3. `validate-staging-build` — bundle deve conter `utodixhxrvegzafcldpu.supabase.co` e **não** placeholders
4. `wrangler deploy`

Dry-run (sem publicar):

```bash
npm run deploy:staging:preview
```

**Nunca** use `npm run deploy`, `npm run build` ou `wrangler deploy` isolado para publicar em `staging.medicflow.app.br`.

## Smoke pós-deploy

```bash
npm run smoke-check -- --url=https://staging.medicflow.app.br
```

Rotas mínimas: `/site`, `/login`.

## Checklist rápido

- [ ] DNS `staging.medicflow.app.br` ativo com HTTPS
- [ ] Supabase staging com Site URL e Redirect URLs corretos
- [ ] `VITE_MEDFLOW_APP_URL` = `https://staging.medicflow.app.br` no painel **e** em `.env.staging` antes do build
- [ ] `npm run staging-validate` OK
- [ ] `VITE_MEDFLOW_DEBUG` ausente ou ≠ `1`
- [ ] Migrations testadas em staging antes de produção

## Referências

- `docs/cloudflare-pages.md` — Workers e variáveis
- `docs/deploy-checklist.md` — checklist geral
- `LOCAL_SETUP.md` — desenvolvimento local (localhost apenas em dev)
