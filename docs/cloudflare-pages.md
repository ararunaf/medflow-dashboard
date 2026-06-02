# Cloudflare — deploy MedFlow-IA V1

> **Importante:** este repositório usa **Cloudflare Workers** (TanStack Start + SSR via `wrangler deploy`).  
> **Não há deploy automático** no CI. Siga os passos manualmente após validação.

## Opção A — Cloudflare Workers (atual)

### Build

```bash
cd MedFlow-IA
npm ci
npm run env-check:prod    # ou env-check:staging antes de build staging
npm run build             # produção — usa .env.production
npm run build:staging     # staging — usa .env.staging
npm run staging-validate  # env + build:staging + client/SSR/rotas/assets/chunks
```

- Saída: bundle SSR gerado pelo Vite + plugin `@cloudflare/vite-plugin`.
- Entry do Worker: `src/server.ts` (ver `wrangler.jsonc`).

### Deploy manual

```bash
npm run deploy:preview   # dry-run — não publica
# Após revisão:
npm run deploy           # requer wrangler autenticado — APENAS com confirmação explícita
```

### Variáveis de ambiente (Dashboard → Workers → Settings → Variables)

| Variável                     | Tipo       | Obrigatória         |
| ---------------------------- | ---------- | ------------------- |
| `VITE_SUPABASE_URL`          | Plain      | Sim                 |
| `VITE_SUPABASE_ANON_KEY`     | Plain      | Sim                 |
| `VITE_MEDFLOW_APP_URL`       | Plain      | Recomendado         |
| `VITE_MEDFLOW_CONTACT_EMAIL` | Plain      | Opcional            |
| `MEDFLOW_OPENAI_API_KEY`     | **Secret** | Opcional (copiloto) |
| `MEDFLOW_OPENAI_MODEL`       | Plain      | Opcional            |

**Nunca** commite `.env` com valores reais. Use `.env.production.example` como referência.

### Domínio customizado

**Staging:** `https://staging.medicflow.app.br` — ver `docs/staging-deploy.md`.

**Produção** (exemplo):

1. Cloudflare Dashboard → Workers → `medflow-ia` → Triggers → Custom Domains.
2. Adicione o domínio de produção.
3. Ajuste DNS (CNAME ou proxy Cloudflare) — **manual**, sem automação.
4. Defina `VITE_MEDFLOW_APP_URL` com o domínio final HTTPS **antes** do próximo build.

### Auth callback (Supabase)

No Supabase → Authentication → URL Configuration:

- **Staging Site URL:** `https://staging.medicflow.app.br`
- **Staging Redirect URLs:** `https://staging.medicflow.app.br/**`, `http://localhost:8080/**` (dev local)
- **Produção:** use o domínio final de produção em Site URL e Redirect URLs (sem localhost no build de prod/staging)

---

## Opção B — Cloudflare Pages (preparação futura)

Se migrar para Pages com funções:

| Campo                  | Valor sugerido                                       |
| ---------------------- | ---------------------------------------------------- |
| Build command          | `npm run build`                                      |
| Build output directory | Consulte saída do TanStack Start / plugin Cloudflare |
| Root directory         | `MedFlow-IA`                                         |
| Node version           | 22                                                   |

Variáveis `VITE_*` devem ser configuradas no painel **antes** do build (Vite inline no bundle).

**Não** habilite deploy automático em branch `main` sem revisão de secrets e migrations.

---

## Checklist rápido pós-configuração

- [ ] `npm run production-validate` passou localmente ou no workflow manual
- [ ] Secrets `MEDFLOW_*` apenas no servidor
- [ ] Smoke tests em `/lancamento` após primeiro deploy
- [ ] `VITE_MEDFLOW_APP_URL` igual ao domínio público
