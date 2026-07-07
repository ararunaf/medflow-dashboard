# MedicFlow Deploy Staging v1.0.0

**Sprint:** MEDICFLOW-RELEASE-STAGING-01  
**Tag:** `medicflow-staging-v1.0.0`  
**URL:** https://staging.medicflow.app.br  
**Worker:** `medflow-ia` (Cloudflare)  
**Data:** 07/07/2026

---

## Fluxo de deploy

```bash
npm run deploy:staging
```

Sequência interna (`scripts/deploy-staging.mjs`):

1. `env-check:staging`
2. `build:staging` (+ marcador de build)
3. `validate-staging-build`
4. `wrangler deploy`

---

## Pré-deploy

| Check | Comando | Status |
|-------|---------|--------|
| Env staging | `npm run env-check:staging` | ✅ |
| Build staging | `npm run build:staging` | Executado no deploy |
| Validação bundle | `npm run validate-staging-build` | Executado no deploy |

---

## Pós-deploy — Smoke test

| Cenário | Rota / API | Esperado |
|---------|------------|----------|
| Login | `/login` | HTTP 200, auth Supabase |
| Captura | `/captura` | UI carrega |
| OCR | `/capture/ocr` | API responde |
| Parser | `/capture/parse` | API responde |
| Auditoria | Pipeline capture | Testes unitários OK |
| Contract Intelligence | Pipeline capture | Testes unitários OK |
| Risk Engine | Pipeline capture | Testes unitários OK |
| Correction Assistant | Pipeline capture | Testes unitários OK |
| Learning Loop | Pipeline capture | Testes unitários OK |
| Review Workspace | `/captura/revisao/:id` | Rota registrada |
| Processing Center | `/processamento` | UI carrega |
| Analytics | `/analytics` | UI carrega |
| Logout | Auth signOut | Sessão limpa |

Script de homologação completa:

```bash
node scripts/homologacao-completa-staging.mjs --base-url=https://staging.medicflow.app.br
```

---

## Rollback

```bash
git checkout medicflow-staging-v1.0.0~1
npm run deploy:staging
```

Ou via Cloudflare Dashboard → Workers → `medflow-ia` → Deployments → Rollback.

---

## Ação pós-deploy DevOps

```bash
# Após configurar SUPABASE_DB_PASSWORD
npx supabase db push --linked --yes
npx supabase db query --linked -f supabase/scripts/capture_healthcheck.sql
```

---

## Notas

- Deploy afeta **somente staging** — produção não publicada.
- Project Ref oficial: `vbfulflzekrnejwetcyr`.
- Repositório: `ararunaf/medflow-dashboard`.
