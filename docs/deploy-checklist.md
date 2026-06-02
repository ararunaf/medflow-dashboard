# Deploy checklist — MedFlow-IA V1

Use antes de **qualquer** publicação em produção. Nenhum item executa deploy automaticamente.

## Pré-deploy (local / CI)

- [ ] Branch revisada e PR aprovado
- [ ] `npm run lint` sem erros
- [ ] `npm run env-check:prod` com variáveis reais (local, não commitar)
- [ ] `npm run release-check` OK
- [ ] `npm run production-validate` OK (ou workflow manual Release validation)
- [ ] Migrations Supabase aplicadas em **staging** primeiro

## Configuração Vercel (alternativa)

- [ ] Root Directory: `MedFlow-IA`
- [ ] Variáveis conforme `.env.vercel.example` / `docs/vercel-deploy.md`
- [ ] `npm run build:vercel` + `npm run vercel-validate` OK localmente
- [ ] Domínio customizado + `VITE_MEDFLOW_APP_URL` alinhados

## Configuração staging

- [ ] DNS `staging.medicflow.app.br` ativo (ver `docs/staging-deploy.md`)
- [ ] `npm run env-check:staging` e `npm run staging-validate` OK
- [ ] `VITE_MEDFLOW_APP_URL=https://staging.medicflow.app.br` (painel + `.env.staging` antes do build)
- [ ] Supabase staging: Site URL e Redirect URLs com domínio staging
- [ ] Sem `localhost` em variáveis do build staging

## Configuração Cloudflare

- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no painel
- [ ] `VITE_MEDFLOW_APP_URL` = domínio final HTTPS
- [ ] `MEDFLOW_OPENAI_API_KEY` como **secret** (se copiloto ativo)
- [ ] `VITE_MEDFLOW_DEBUG` **não** definido ou ≠ 1

## Build e publicação (manual)

- [ ] `npm run build` local com mesmas variáveis do painel
- [ ] `npm run deploy:preview` (dry-run) revisado
- [ ] Deploy explícito (`wrangler deploy` ou painel) **após confirmação**
- [ ] Versão / tag Git anotada (opcional)

## Pós-deploy imediato

- [ ] `/site` e `/login` respondem (HTTP < 500)
- [ ] Login com usuário piloto
- [ ] Smoke tests em `/lancamento`
- [ ] Ver `docs/go-live-checklist.md`

## Referências

- `docs/staging-deploy.md`
- `docs/cloudflare-pages.md`
- `docs/supabase-production.md`
- `docs/smoke-test-checklist.md`
- `docs/rollback-checklist.md`
