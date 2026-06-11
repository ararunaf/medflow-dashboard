# Certificação — Staging Deploy Hardening

**Data:** 11/06/2026  
**Ambiente:** `https://staging.medicflow.app.br`  
**Projeto Supabase staging:** `utodixhxrvegzafcldpu`  
**Escopo:** infraestrutura e guard rails de deploy (sem alteração de regras de negócio, banco, Supabase, IA ou UX)

---

## Objetivo da mudança

Persistir e operacionalizar guard rails que impeçam publicação de staging com variáveis de produção ou placeholders, centralizando o deploy em um único pipeline (`npm run deploy:staging`) com abort automático em falhas.

---

## Problema original encontrado

Em 11/06/2026, staging foi publicado via fluxo genérico (`npm run build` + `wrangler deploy`), que compila com modo **production** e embute credenciais de `.env.production` (placeholders como `YOUR_PRODUCTION_PROJECT_REF`). Resultado: login em staging falhou por apontar para Supabase incorreto.

Documentação do incidente: `docs/INCIDENTE_LOGIN_TENANTS_STAGING.md`.

---

## Solução implementada

| Camada | Implementação |
|--------|---------------|
| Build staging | `build:staging` gera marcador `dist/.staging-build-marker.json` |
| Build production | `build` remove marcador staging para evitar falso positivo |
| Validação pré-deploy | `validate-staging-build` exige Supabase staging, domínio staging, marcador válido e ausência de placeholders |
| Pipeline único | `deploy-staging.mjs` orquestra env-check → build → validate → wrangler (aborta em qualquer falha) |
| Documentação | Checklist, guia operacional e evidências de auditoria |

---

## Scripts criados / alterados

| Arquivo | Função |
|---------|--------|
| `scripts/lib/staging-supabase.mjs` | Constantes Supabase staging + padrões proibidos no bundle |
| `scripts/lib/validate-staging-build.mjs` | Guard rails endurecidos (Supabase, marcador, placeholders) |
| `scripts/validate-staging-build.mjs` | CLI standalone (`npm run validate-staging-build`) |
| `scripts/write-staging-build-marker.mjs` | Marcador pós `build:staging` |
| `scripts/clear-staging-build-marker.mjs` | Limpa marcador no `build` production |
| `scripts/deploy-staging.mjs` | Pipeline único com abort automático |
| `package.json` | Scripts `deploy:staging`, `deploy:staging:preview`, `validate-staging-build` |
| `docs/staging-deploy.md` | Fluxo único documentado |
| `docs/STAGING_DEPLOY_CHECKLIST.md` | Checklist operacional |
| `docs/STAGING_DEPLOY_HARDENING.md` | Auditoria e evidências técnicas |

---

## Validações executadas (certificação 11/06/2026)

| Comando | Resultado | Evidência |
|---------|-----------|-----------|
| `npm run env-check:staging` | ✅ exit 0 | Variáveis obrigatórias presentes |
| `npm run build:staging` | ✅ exit 0 | Client ~24s + SSR ~29s; marcador gerado |
| `npm run validate-staging-build` | ✅ exit 0 | Supabase staging em client e SSR; placeholders ausentes |
| `npm run deploy:staging:preview` | ✅ exit 0 | 4/4 etapas OK; dry-run 3774 KiB / 120 módulos |

### Marcador de build

```json
{
  "mode": "staging",
  "builtAt": "2026-06-11T23:59:19.648Z",
  "supabaseHost": "utodixhxrvegzafcldpu.supabase.co",
  "viteMode": "staging"
}
```

### Checks críticos confirmados

- ✅ Bundle aponta para `utodixhxrvegzafcldpu.supabase.co` (client **e** SSR)
- ✅ Domínio `staging.medicflow.app.br` presente no bundle
- ✅ Placeholders de produção bloqueados (`YOUR_PRODUCTION_PROJECT_REF`, `your_production_anon_key`, etc.)
- ✅ Pipeline `deploy:staging` aborta antes do Wrangler se validação falhar
- ✅ Teste negativo documentado: `npm run build` + `validate-staging-build` → exit 1

---

## Evidências adicionais

- Auditoria completa: `docs/STAGING_DEPLOY_HARDENING.md` (Fases 1–6, incluindo teste negativo)
- Checklist operacional: `docs/STAGING_DEPLOY_CHECKLIST.md`
- Incidente raiz: `docs/INCIDENTE_LOGIN_TENANTS_STAGING.md`

---

## Riscos remanescentes

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Deploy manual via `wrangler deploy` sem passar pelo script | Baixa | Documentação + checklist; disciplina operacional |
| Alteração deliberada dos scripts de validação | Baixa | Code review; este commit no GitHub |
| Configuração Auth no painel Supabase (Site URL / Redirect) | Média | Checklist manual (itens 3.4–3.5) |
| Smoke pós-deploy não automatizado no pipeline | Baixa | `smoke-check` manual após deploy real |

**Veredito:** para operadores que usam **somente** `npm run deploy:staging`, o risco de publicar staging com env de produção está **efetivamente eliminado**.

---

## Status

```text
STAGING HARDENING = CERTIFICADO
```

Certificado em: 11/06/2026  
Commit de referência: ver hash em `git log` após push de `chore(staging): hardening deploy pipeline and validation guards`
