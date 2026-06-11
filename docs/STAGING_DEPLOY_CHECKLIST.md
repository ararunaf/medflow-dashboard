# Checklist automático — Deploy Staging

Checklist operacional para publicar em `https://staging.medicflow.app.br`.  
Execute via **`npm run deploy:staging`** — o script valida cada item antes de chamar o Wrangler.

---

## 1. Build correto

| # | Verificação | Como validar | Bloqueia deploy? |
|---|-------------|--------------|:----------------:|
| 1.1 | Modo Vite = `staging` | `dist/.staging-build-marker.json` com `"mode": "staging"` | ✅ |
| 1.2 | Comando de build | Apenas `npm run build:staging` (nunca `npm run build`) | ✅ |
| 1.3 | Artefatos presentes | `dist/client`, `dist/server`, `dist/server/index.js` | ✅ |
| 1.4 | Sem URL de dev local | Nenhum `localhost:8080` em bundles JS (exceto vendor) | ✅ |

**Script:** `npm run validate-staging-build`

---

## 2. Env correto

| # | Verificação | Valor esperado | Bloqueia deploy? |
|---|-------------|----------------|:----------------:|
| 2.1 | Arquivo carregado | `.env.staging` (cadeia: `.env` → `.env.local` → `.env.staging`) | ✅ |
| 2.2 | `VITE_MEDFLOW_APP_URL` | `https://staging.medicflow.app.br` | ✅ |
| 2.3 | Sem placeholders | Ausência de `YOUR_*`, `your_*`, `example.com`, `app.seudominio.com.br` | ✅ |
| 2.4 | Variáveis obrigatórias | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` preenchidas | ✅ |
| 2.5 | Debug desligado | `VITE_MEDFLOW_DEBUG` ≠ `1` (aviso se ativo) | ⚠️ |

**Script:** `npm run env-check:staging`

---

## 3. Supabase correto

| # | Verificação | Valor esperado | Bloqueia deploy? |
|---|-------------|----------------|:----------------:|
| 3.1 | Projeto staging no bundle | `utodixhxrvegzafcldpu.supabase.co` em client **e** SSR | ✅ |
| 3.2 | Sem credenciais de produção | Ausência de `YOUR_PRODUCTION_PROJECT_REF`, `your_production_anon_key` | ✅ |
| 3.3 | Sem env vazio no bundle | Ausência de `url:""` / `anonKey:""` | ✅ |
| 3.4 | Auth (painel Supabase) | Site URL = `https://staging.medicflow.app.br` | Manual |
| 3.5 | Redirect URLs | `https://staging.medicflow.app.br/**` | Manual |

**Script:** `npm run validate-staging-build` (itens 3.1–3.3)

---

## 4. Cloudflare correto

| # | Verificação | Como validar | Bloqueia deploy? |
|---|-------------|--------------|:----------------:|
| 4.1 | Worker | `wrangler.jsonc` → `name: medflow-ia` | Manual |
| 4.2 | Rota staging | `staging.medicflow.app.br/*` em `wrangler.jsonc` | Manual |
| 4.3 | Wrangler autenticado | `npx wrangler whoami` | ✅ (no deploy) |
| 4.4 | Fluxo único | Somente `npm run deploy:staging` | ✅ |

**Dry-run:** `npm run deploy:staging:preview`

---

## 5. Smoke correto

| # | Verificação | Como validar | Bloqueia deploy? |
|---|-------------|--------------|:----------------:|
| 5.1 | `/site` HTTP 200 | `npm run smoke-check -- --url=https://staging.medicflow.app.br` | Pós-deploy |
| 5.2 | `/login` HTTP 200 | Idem | Pós-deploy |
| 5.3 | Combo instituições | Login carrega tenants (probe manual ou homologação) | Pós-deploy |

**Script:** `npm run smoke-check -- --url=https://staging.medicflow.app.br`

---

## Comando único

```bash
npm run deploy:staging
```

**Este é o único comando permitido para staging.**

Sequência interna (aborta automaticamente em falha):

```
env-check:staging → build:staging → validate-staging-build → wrangler deploy
```

---

## Referências

- `docs/staging-deploy.md` — guia completo
- `docs/STAGING_DEPLOY_HARDENING.md` — auditoria e evidências
- `docs/INCIDENTE_LOGIN_TENANTS_STAGING.md` — incidente que motivou o hardening
