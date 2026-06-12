# Incidente — Login não carrega instituições (Staging)

**Data do incidente:** 11/06/2026  
**Ambiente:** https://staging.medicflow.app.br/login  
**Severidade:** Crítica (bloqueio de login via UI)  
**Status:** **Resolvido**  
**Deploy corretivo:** Version ID `5329a0f0-551d-4c81-a471-3437d2e4043d`

---

## Resumo executivo

O combo **Instituição** na tela de login ficava vazio e exibia a mensagem genérica de erro. A causa raiz **não** foi RLS, ausência de tenants ou falha do Supabase staging — foi um **deploy com build de produção** (`npm run build`) que embutiu placeholders de `.env.production` no bundle JavaScript servido em `staging.medicflow.app.br`.

---

## FASE 1 — Reprodução

| Verificação | Resultado |
|-------------|-----------|
| Página `/login` acessível | ✅ HTTP 200 (redirect 307 → HTML SSR) |
| Combo Instituição | ❌ Vazio, `disabled` |
| Mensagem de erro (pós-hydration) | ❌ *"Não foi possível carregar instituições…"* |
| Request Supabase esperado | `GET /rest/v1/tenants?select=id,name,slug&order=name` |

**Evidência forense (bundle antes da correção):**

Arquivo servido: `/assets/index-BOZ9W7Vf.js`

```text
url: "https://YOUR_PRODUCTION_PROJECT_REF.supabase.co"
anonKey: "your_production_anon_key"
```

Probe direto ao host placeholder: `ENOTFOUND` (DNS inexistente).

---

## FASE 2 — Auditoria frontend

### Stack completa

| Camada | Arquivo / função | Papel |
|--------|------------------|-------|
| Rota | `src/routes/login.tsx` | Página de login |
| Config | `getSupabasePublicConfig()` → `src/lib/supabase/config.ts` | Lê `import.meta.env.VITE_SUPABASE_*` (injetado no **build**) |
| Cliente | `getBrowserSupabase()` → `src/lib/supabase/browser.ts` | `createBrowserClient(url, anonKey)` |
| Query | `supabase.from("tenants").select("id, name, slug").order("name")` | Diretório público de tenants |
| Erro | `useEffect` linhas 43–68 | Se `!cfg`, `fetchError` ou `!data?.length` → mensagem genérica |

**Não há hook React Query dedicado** — o carregamento é um `useEffect` inline na página de login.

### Tratamento de erro

```43:68:src/routes/login.tsx
  useEffect(() => {
    if (!cfg) {
      setLoadingTenants(false);
      setTenantsError(
        "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para carregar instituições.",
      );
      return;
    }

    const supabase = getBrowserSupabase();
    void supabase
      .from("tenants")
      .select("id, name, slug")
      .order("name")
      .then(({ data, error: fetchError }) => {
        setLoadingTenants(false);
        if (fetchError || !data?.length) {
          setTenants([]);
          setTenantsError(
            "Não foi possível carregar instituições. Verifique o projeto Supabase e a política de leitura pública em tenants.",
          );
          return;
        }
        setTenants(data);
        setTenantSlug(data[0]!.slug);
      });
  }, [cfg]);
```

**Observação:** A mensagem sugere RLS/Supabase, mas o erro real era **host inválido** (placeholder) — o frontend não expõe o `fetchError.message` ao usuário.

---

## FASE 3 — Auditoria Supabase

**Projeto staging:** `utodixhxrvegzafcldpu`

| Item | Resultado |
|------|-----------|
| Tabela `tenants` | ✅ Existe |
| Registros | ✅ **5 tenants** |
| `medflow-v1-demo` | ✅ Presente (`9cc7f6f1-4c34-4316-9e06-778f0cbc249e`) |
| Policy RLS `tenants_anon_directory_select` | ✅ `FOR SELECT TO anon USING (true)` |
| **Anon consegue SELECT?** | ✅ **Sim** — HTTP 200 com 5 registros |

Probe com credenciais de `.env.staging`:

```json
[
  {"slug":"cooperativa-med","name":"Cooperativa Med Brasil"},
  {"slug":"grupo-vida","name":"Grupo Vida Saúde"},
  {"slug":"hospital-saojose","name":"Hospital São José"},
  {"slug":"medflow-admin","name":"MedicFlow-AI Administração"},
  {"slug":"medflow-v1-demo","name":"MedicFlow-AI V1 Demo"}
]
```

**Conclusão Supabase:** Sem regressão de dados ou RLS.

---

## FASE 4 — Auditoria de ambiente

| Variável | Homologação (funcionou) | `.env.staging` (local) | Bundle **quebrado** (live) | Bundle **corrigido** (live) |
|----------|-------------------------|------------------------|----------------------------|-----------------------------|
| `VITE_SUPABASE_URL` | `https://utodixhxrvegzafcldpu.supabase.co` | ✅ Igual | ❌ `https://YOUR_PRODUCTION_PROJECT_REF.supabase.co` | ✅ `https://utodixhxrvegzafcldpu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` (staging) | ✅ Real | ❌ `your_production_anon_key` | ✅ `sb_publishable_…` |
| `VITE_MEDFLOW_APP_URL` | `https://staging.medicflow.app.br` | ✅ | ⚠️ `https://app.seudominio.com.br` (placeholder prod) | ✅ staging |

**Origem dos placeholders quebrados:** `.env.production` (cópia de `.env.production.example`, nunca preenchida para deploy real).

**Mecanismo Vite:** `vite.config.ts` usa `loadEnv(mode, …)` e `define` para embutir `import.meta.env.VITE_*` no bundle **no momento do build**. Variáveis do painel Cloudflare **não substituem** valores já compilados no JS client.

---

## FASE 5 — Auditoria de deploys

| Deploy / sprint | Version ID (documentado) | Impacto no login |
|-----------------|--------------------------|------------------|
| Homologação completa | — (API validada 11/06) | ✅ Tenants via API; screenshot login OK |
| Sprint IA-Visível | `9de09ca4-1482-4185-b594-d15dc4564f64` | Documentado como staging live |
| Fix Escalas mês dinâmico | `a75b621a-cf6f-425f-a990-a772fc80ae1f` | Doc registra `npm run build` **e** `build:staging` |
| Sprint IA-Identity | commits `2b53ea0`, `66e82bc` | Possível redeploy manual |
| **Bundle quebrado (detectado)** | chunks `index-BOZ9W7Vf.js`, `login-D6_X8vWm.js` | ❌ Placeholders produção |
| **Correção (este incidente)** | `5329a0f0-551d-4c81-a471-3437d2e4043d` | ✅ Credenciais staging |

**Version ID `e9b74bc3…`:** não encontrado na documentação do repositório; possivelmente ID parcial ou deploy intermediário no painel Cloudflare.

**Regressão provável:** execução de `npm run deploy` (que roda `vite build` em modo **production**) em vez de `npm run build:staging && wrangler deploy`, sobrescrevendo `dist/` com credenciais de `.env.production`.

---

## FASE 6 — Causa raiz

| Categoria | Responsável? |
|-----------|:------------:|
| Frontend (lógica login) | ❌ |
| RLS / Supabase | ❌ |
| Tenant / dados | ❌ |
| **Variáveis de ambiente (build errado)** | ✅ **Sim** |
| **Deploy (comando/mode incorreto)** | ✅ **Sim** |
| Supabase (indisponibilidade) | ❌ |

**Classificação:** **Deploy + Variáveis de ambiente** — build de produção com placeholders publicado no domínio staging.

---

## FASE 7 — Correção aplicada

1. `npm run build:staging` — bundle com `utodixhxrvegzafcldpu.supabase.co`
2. `npm run deploy:staging` — novo script adicionado ao `package.json`
3. Validação pós-deploy: bundle live contém URL staging (sem placeholders)
4. Guard rail: `validate-staging-build.mjs` agora **falha** se detectar placeholders Supabase no `dist/`

### Comandos corretos para staging

```bash
npm run env-check:staging
npm run staging-validate          # inclui build + checagem de placeholders
npm run deploy:staging            # build:staging + wrangler deploy
```

**Nunca** usar `npm run deploy` para publicar em `staging.medicflow.app.br`.

---

## FASE 8 — Evidências

### Antes (bundle quebrado — forense)

- URL embutida: `https://YOUR_PRODUCTION_PROJECT_REF.supabase.co`
- Chave: `your_production_anon_key`
- Combo vazio + mensagem de erro na UI

### Depois

| Evidência | Arquivo |
|-----------|---------|
| Login com 5 instituições | `docs/screenshots/incidente-login-tenants/02-login-tenants-ok.png` |
| Login funcional → dashboard | `docs/screenshots/incidente-login-tenants/03-login-sucesso-dashboard.png` |

**Validação Playwright pós-correção:**

```text
ERROR_VISIBLE false
OPTION_COUNT 5
OPTIONS Cooperativa Med Brasil | Grupo Vida Saúde | Hospital São José | MedicFlow-AI Administração | MedicFlow-AI V1 Demo
LOGIN_OK https://staging.medicflow.app.br/
```

---

## Perguntas finais

### 1. O que causou o problema?

Deploy de staging executado com **`npm run build`** (modo production), que leu `.env.production` com placeholders (`YOUR_PRODUCTION_PROJECT_REF`, `your_production_anon_key`) e os **compilou no bundle JS**. O browser tentava chamar um host Supabase inexistente; a query de tenants falhava e a UI mostrava erro genérico.

### 2. Quando surgiu?

Entre a **homologação de 11/06/2026** (Supabase staging OK) e a detecção deste incidente — introduzido por um deploy manual com comando/mode incorreto, provavelmente após sprints **IA-Visível**, **IA-Identity** ou **Fix Escalas**, quando `npm run deploy` ou `npm run build` foi usado no lugar de `build:staging`.

### 3. Como foi corrigido?

- Rebuild com `npm run build:staging` usando `.env.staging` real  
- Redeploy via `npm run deploy:staging` (Version `5329a0f0-…`)  
- Script `deploy:staging` adicionado ao `package.json`  
- Checagem anti-placeholder em `validate-staging-build.mjs`

### 4. Existe risco de recorrência?

**Sim, se alguém voltar a rodar `npm run deploy` ou `npm run build` antes de publicar staging.**

**Mitigações implementadas:**

- `npm run deploy:staging` como caminho canônico  
- `staging-validate` / `validate-staging-build` rejeitam placeholders no bundle  

**Mitigação recomendada (não implementada neste PR):** documentar no `deploy-checklist.md` e bloquear CI/CD staging que invoque `npm run deploy` sem `--mode staging`.

---

## Referências

- `docs/staging-deploy.md`
- `docs/HOMOLOGACAO_COMPLETA_STAGING.md`
- `docs/SECURITY-READINESS-REPORT.md` (item 1 — placeholders)
- Migration RLS: `supabase/migrations/20250512000000_init_enterprise.sql` (policy `tenants_anon_directory_select`)
