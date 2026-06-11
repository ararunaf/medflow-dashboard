# Staging Deploy Hardening — Evidências e Auditoria

**Data:** 11/06/2026  
**Escopo:** infraestrutura e segurança operacional de deploy (sem alteração de regras de negócio, banco, Supabase ou UX)  
**Ambiente alvo:** `https://staging.medicflow.app.br`  
**Projeto Supabase staging:** `utodixhxrvegzafcldpu`

---

## FASE 1 — Auditoria

### 1.1 Como o Vite escolhe os envs?

O Vite usa o **modo** passado na CLI (`--mode`) para carregar arquivos `.env.*` e embutir variáveis `VITE_*` no bundle via `define`.

| Modo | Comando | Arquivos carregados (último vence) |
|------|---------|-------------------------------------|
| `development` | `npm run dev` | `.env` → `.env.local` |
| `staging` | `npm run build:staging` | `.env` → `.env.local` → `.env.staging` → `.env.staging.local` |
| `production` | `npm run build` | `.env` → `.env.local` → `.env.production` → `.env.production.local` |

**Implementação:** `vite.config.ts` chama `loadEnv(mode, process.cwd(), "VITE_")` e injeta cada chave em `import.meta.env.*` no momento do build. Valores compilados **não** são substituídos depois pelo painel Cloudflare.

```133:137:MedFlow-IA/vite.config.ts
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine: Record<string, string> = {};
  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }
```

**Wrangler:** `wrangler.jsonc` define rota `staging.medicflow.app.br/*` e entry `src/server.ts`. O deploy publica o conteúdo de `dist/` gerado pelo build Vite — **sem recompilar envs**.

### 1.2 Quais scripts usam production?

| Script | Modo Vite | Env efetivo |
|--------|-----------|-------------|
| `npm run build` | `production` (default) | `.env.production` |
| `npm run deploy` | `production` | `.env.production` |
| `npm run deploy:preview` | `production` | `.env.production` |
| `npm run env-check:prod` | — | `.env.production` |
| `npm run production-validate` | `production` | build + validação prod |
| `npm run smoke-check:prod` | — | URL produção |

O script `build` agora **remove** `dist/.staging-build-marker.json` para evitar marcador obsoleto após build production.

### 1.3 Quais scripts usam staging?

| Script | Modo Vite | Env efetivo |
|--------|-----------|-------------|
| `npm run build:staging` | `staging` | `.env.staging` + marcador |
| `npm run env-check:staging` | — | `.env.staging` |
| `npm run validate-staging-build` | — | valida `dist/` |
| `npm run staging-validate` | `staging` | env + build + artefatos + PWA + SSR |
| `npm run deploy:staging` | `staging` | pipeline completo hardened |
| `npm run deploy:staging:preview` | `staging` | pipeline + `wrangler deploy --dry-run` |

---

## FASE 2 — Proteção de build

Implementado em `scripts/lib/validate-staging-build.mjs` + CLI `npm run validate-staging-build`.

### Verificações obrigatórias (falham com exit 1)

| Check | Detalhe |
|-------|---------|
| Supabase staging no bundle | `utodixhxrvegzafcldpu.supabase.co` em client **e** SSR |
| Domínio staging no bundle | `staging.medicflow.app.br` em client **e** SSR |
| Marcador de build | `dist/.staging-build-marker.json` com `mode: staging` e `supabaseHost` correto |
| Placeholders bloqueados | `YOUR_PRODUCTION_PROJECT_REF`, `your_production_anon_key`, `YOUR_*_PROJECT_REF`, `your_*_anon_key`, `app.seudominio.com.br`, etc. |
| Env vazio no bundle | `url:""`, `anonKey:""` |
| localhost no bundle | `localhost:8080` em chunks de app |

Chunks vendor (`supabase-*`, `tanstack-*`, etc.) são ignorados na varredura de placeholders para evitar falsos positivos de JSDoc.

---

## FASE 3 — Proteção de deploy

`scripts/deploy-staging.mjs` orquestra o pipeline e **aborta** (`process.exit(1)`) se qualquer etapa falhar:

```
env-check:staging → build:staging → validate-staging-build → wrangler deploy
```

Não há caminho dentro de `deploy:staging` que publique sem passar pela validação.

---

## FASE 4 — Comando único

```bash
npm run deploy:staging
```

**Este é o único comando permitido para staging.**

Alternativa segura para simular deploy:

```bash
npm run deploy:staging:preview
```

**Proibido para staging:** `npm run deploy`, `npm run build && wrangler deploy`, `wrangler deploy` isolado.

---

## FASE 5 — Checklist

Ver `docs/STAGING_DEPLOY_CHECKLIST.md`.

---

## FASE 6 — Evidências (execução 11/06/2026)

### 6.1 env-check:staging

```
[medflow] env-check (staging)
  ✓ Variáveis obrigatórias presentes.
Exit code: 0
```

### 6.2 build:staging

```
vite v7.3.3 building client environment for staging...
✓ built in ~36s
vite v7.3.3 building ssr environment for staging...
✓ built in ~88s
[medflow] staging build marker → dist/.staging-build-marker.json
Exit code: 0
```

Marcador gerado:

```json
{
  "mode": "staging",
  "builtAt": "2026-06-11T23:46:03.143Z",
  "supabaseHost": "utodixhxrvegzafcldpu.supabase.co",
  "viteMode": "staging"
}
```

Bundle client (`index-Bimcytc3.js`) contém `utodixhxrvegzafcldpu.supabase.co` — **sem** `YOUR_PRODUCTION_PROJECT_REF`.

### 6.3 validate-staging-build

```
✓ Supabase staging (https://utodixhxrvegzafcldpu.supabase.co) presente no bundle client
✓ Supabase staging (https://utodixhxrvegzafcldpu.supabase.co) presente no bundle SSR
✓ Marcador dist/.staging-build-marker.json confirma build --mode staging
✓ validate-staging-build OK — bundle apto para deploy staging
Exit code: 0
```

### 6.4 deploy:staging:preview (dry-run)

```
[deploy:staging] 1/4 env-check:staging        → OK
[deploy:staging] 2/4 build:staging           → OK
[deploy:staging] 3/4 validate-staging-build  → OK
[deploy:staging] 4/4 wrangler deploy --dry-run → OK
--dry-run: exiting now.
✓ deploy:staging:preview concluído (dry-run — nada publicado)
Exit code: 0
```

Upload simulado: **3774 KiB** (120 módulos) — Worker `medflow-ia`, rota `staging.medicflow.app.br/*`.

### 6.5 Teste negativo — build production bloqueado

Comando: `npm run build` seguido de `npm run validate-staging-build`.

```
✗ dist/client/assets: YOUR_PRODUCTION_PROJECT_REF detectado em index-BOZ9W7Vf.js
✗ dist/client/assets: your_production_anon_key detectado em index-BOZ9W7Vf.js
✗ Supabase staging (utodixhxrvegzafcldpu.supabase.co) ausente em dist/client/assets
✗ validate-staging-build FALHOU — deploy staging deve ser abortado
Exit code: 1
```

**Conclusão do teste negativo:** o mesmo cenário do incidente de login (11/06/2026) é **bloqueado** antes de qualquer `wrangler deploy` via `deploy:staging`.

---

## Perguntas finais

### 1. O staging pode ser publicado com env errado?

**Via `npm run deploy:staging`:** **Não.** O pipeline exige `.env.staging` válido, bundle com Supabase staging e ausência de placeholders. Build production com `.env.production` falha em `validate-staging-build`.

**Bypass manual ainda possível:** alguém com credenciais Cloudflare poderia rodar `wrangler deploy` diretamente sobre um `dist/` incorreto **sem** passar pelo script. Esse risco é operacional/humano, não técnico do fluxo documentado.

### 2. O deploy aborta automaticamente?

**Sim**, dentro do fluxo `deploy:staging` / `deploy:staging:preview`. Qualquer falha em env-check, build ou validate-staging-build interrompe o processo com mensagem `deploy:staging ABORTADO` e exit code ≠ 0. O Wrangler só é invocado após as três primeiras etapas passarem.

### 3. O risco foi eliminado ou apenas reduzido?

**Reduzido de forma substancial — próximo de eliminado para o fluxo normal.**

| Antes | Depois |
|-------|--------|
| `npm run deploy` publicava production env em staging | `deploy:staging` bloqueia placeholders e exige Supabase staging |
| Nenhum gate pré-wrangler | 3 gates automáticos antes do deploy |
| Marcador inexistente | Marcador + scan de bundle + env-check |

**Risco residual (baixo):** deploy manual via `wrangler deploy` sem o script, ou alteração deliberada dos scripts de validação. Mitigação: documentação, checklist e disciplina operacional.

**Veredito:** para operadores que usam **somente** `npm run deploy:staging`, o risco de publicar staging com variáveis de produção está **efetivamente eliminado**.

---

## Arquivos alterados / criados

| Arquivo | Função |
|---------|--------|
| `scripts/lib/staging-supabase.mjs` | Constantes Supabase staging + padrões proibidos |
| `scripts/lib/validate-staging-build.mjs` | Guard rails endurecidos |
| `scripts/validate-staging-build.mjs` | CLI standalone |
| `scripts/write-staging-build-marker.mjs` | Marcador pós build staging |
| `scripts/clear-staging-build-marker.mjs` | Limpa marcador no build production |
| `scripts/deploy-staging.mjs` | Pipeline único com abort automático |
| `docs/STAGING_DEPLOY_CHECKLIST.md` | Checklist operacional |
| `docs/staging-deploy.md` | Atualizado com fluxo único |
| `package.json` | Scripts `deploy:staging`, `validate-staging-build`, `build` hardened |

---

## Referências

- `docs/INCIDENTE_LOGIN_TENANTS_STAGING.md` — causa raiz original
- `docs/STAGING_DEPLOY_CHECKLIST.md` — checklist automático
- `docs/staging-deploy.md` — guia operacional
