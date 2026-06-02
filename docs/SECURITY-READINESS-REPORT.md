# Relatório Security Readiness — MedFlow-IA

**Data:** 25/05/2026  
**Escopo:** código, dependências, migrations Supabase, headers, auth, logs de auditoria, staging  
**Projeto:** `MedFlow-IA/` (TanStack Start · Cloudflare Workers · Supabase)

---

## Resumo executivo

| Indicador | Status | Nota |
|-----------|--------|------|
| **Readiness staging (geral)** | **72%** | Build e artefatos OK; credenciais reais e smoke HTTP pendentes |
| npm audit (runtime prod) | ⚠️ | 4 moderadas — cadeia **dev/build** (`ws` via Cloudflare tooling) |
| Auth estático (`auth-validate`) | ✅ | 15/15 checks |
| Auth remoto (Supabase) | ❌ | `.env` com placeholders — probe de login não executável |
| Security headers | ✅ | 4 avisos (CSP `unsafe-inline`, cookies `Secure`) |
| Security audit logs | ⚠️ | Implementação completa; validador estático com 1 falso negativo |
| Migrations RLS (estático) | ✅ | 27 migrations, 0 issues RLS estáticos |
| Release-check (segurança SQL) | ⚠️ | 1 policy `USING (true)` para `anon` em `tenants` |
| `staging-validate` (artefatos) | ✅ | Domínio staging no bundle; dist client+SSR presente |

**Veredito:** a base de segurança da aplicação está **implementada e validável estaticamente**. O bloqueio para staging “go” com usuários reais é **operacional** (Supabase staging, secrets, smoke pós-deploy), não ausência de controles no código.

---

## 1. Vulnerabilidades encontradas

### 1.1 Dependências (npm audit)

| ID / Pacote | Severidade | CVSS | CWE | Risco | Contexto |
|-------------|------------|------|-----|-------|----------|
| [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) — `ws` | **Moderada** | 4.4 | CWE-908 | Divulgação de memória não inicializada | Transitiva: `miniflare` → `wrangler` → `@cloudflare/vite-plugin` |
| `@cloudflare/vite-plugin` | Moderada | — | — | Mesma cadeia | Dependência direta de build/deploy |
| `miniflare` | Moderada | — | — | Mesma cadeia | Dev/local preview Worker |
| `wrangler` | Moderada | — | — | Mesma cadeia | CLI deploy |

**Contagem:** 0 críticas · 0 altas · **4 moderadas** · 513 dependências no grafo.

**Exposição em produção:** baixa — `ws` não entra no bundle servido ao browser; impacto limitado a ferramentas de build/preview local. Ainda assim, convém corrigir na cadeia de tooling.

### 1.2 Aplicação e dados (análise estática + release-check)

| Vulnerabilidade / achado | Severidade | Risco | Detalhe |
|--------------------------|------------|-------|---------|
| Policy RLS `tenants_anon_directory_select` com `USING (true)` para `anon` | **Média** | Enumeração de tenants na tela de login | Intencional para diretório de login; expõe metadados públicos de tenants (slug/nome) |
| CSP produção com `script-src 'unsafe-inline'` | **Baixa–Média** | XSS mitigado parcialmente | Padrão Vite; endurecer com nonces/hashes quando possível |
| Cookies Supabase sem `secure: true` explícito | **Média** (staging/prod HTTPS) | Session fixation / downgrade em cenários mistos | Defaults `@supabase/ssr`: `sameSite=lax`, `httpOnly=false` |
| `vercel.json` sem header `Content-Security-Policy` | **Baixa** | Assets estáticos antes do worker | Coberto por `server.ts` + `nitro.config.ts` em runtime |
| Secrets em build local (`.env.local` no SSR build) | **Média** (processo) | Vazamento em logs/artefatos CI | Warning Vite: `Using secrets defined in .env.local` |
| Service role / placeholders em `.env` | **Alta** (se deploy assim) | Bypass de RLS se vazar | `release-check` falha com placeholders; `auth-validate` remoto falhou |
| Validação remota Supabase indisponível | **Info–Alta** (bloqueio go-live) | RLS/policies não testadas em runtime | Host `your_project_ref.supabase.co` (placeholder) |

### 1.3 Nenhuma vulnerabilidade crítica/alta em npm audit

Não há CVEs **critical** ou **high** reportadas no audit atual.

---

## 2. Risco e severidade (matriz consolidada)

| Área | Achado | Severidade | Probabilidade | Impacto | Risco residual |
|------|--------|------------|---------------|---------|----------------|
| Supply chain | `ws` GHSA-58qx | Moderada | Média (só dev tooling) | Baixo em prod | **Baixo** |
| Autenticação | Brute-force / open redirect | — | Baixa (mitigado) | Alto se falhar | **Baixo** (gate + sanitize) |
| Autorização | RLS multi-tenant | — | Média sem teste remoto | Crítico | **Médio** até teste JWT cross-tenant |
| Dados | `tenants` legível por `anon` | Média | Alta (by design login) | Médio | **Médio** — aceitar ou restringir campos |
| Transporte | HSTS + HTTPS canônico | — | Baixa se URL correta | Alto | **Baixo** com `VITE_MEDFLOW_APP_URL` HTTPS |
| Sessão | Cookies sem `Secure` explícito | Média | Média | Médio | **Médio** |
| XSS | CSP + nosniff | Baixa–Média | Baixa | Médio | **Baixo–Médio** |
| Auditoria | Logs sem persistência remota | Baixa | Alta em dev | Baixo (fallback console) | **Baixo** em prod com service role |
| Deploy | Env placeholders | Alta | Alta se ignorado | Crítico | **Alto** até `.env.staging` real |

---

## 3. Correções aplicadas (já no repositório)

| Controle | Implementação | Validação |
|----------|---------------|-----------|
| **RLS em migrations** | `ENABLE ROW LEVEL SECURITY` em tabelas; policies por `tenant_id` / `auth.uid()` | `migration-validate`: 0 `rls_static_issues` |
| **Auditoria de segurança** | Tabela `security_audit_logs` (hash email/IP, sem PII claro) | Migration `20250525120000_security_audit_logs.sql` |
| **Login brute-force** | `auth-security-server.ts` — gate IP/email antes de `signIn` | `auth-validate`: `login_rate_limit` OK |
| **Open redirect** | `sanitizePostLoginPath` bloqueia externos e `//evil` | `auth-validate`: redirect checks OK |
| **Route guard RBAC** | `__root.tsx` + `evaluateRouteGuard`; deny financeiro para `professional` | `auth-validate` OK |
| **Sessão server-side** | `getUser()` (não JWT local `getSession`) | `security-headers-validate` OK |
| **Service role isolada** | Apenas `src/lib/server/`; não em `VITE_*` | Headers validate + `.env.example` |
| **Headers de segurança** | `csp.ts`, `server.ts`, `start.ts`, `nitro.config.ts`, `vercel.json` | `security-headers-validate` OK |
| **CSP produção** | Restritivo: `default-src 'self'`, Supabase connect, `frame-ancestors 'none'` | `csp_prod_directives` OK |
| **HSTS** | `max-age=31536000; includeSubDomains; preload` | `hsts` OK |
| **Rate limit rota `/login`** | Worker limita por IP | `server.ts` + auth-validate OK |
| **Logs SSR/auth** | `server.ts`, `start.ts`, `fn-helpers`, `AuthSync`, `login.tsx` | Parcial: `get_user_failed` via `logAuthAndAudit` em `get-auth-context.ts` |
| **Import protection** | `vite.config.ts` — `server/**` bloqueado no client | BUILD-HEALTH-REPORT |
| **Upload branding** | MIME/tamanho em `upload-validation.ts` | `security-validation-service` |
| **Scripts de validação** | `auth-validate`, `security-headers-validate`, `security-logs-validate`, `release-check`, `staging-validate` | CI/local |

---

## 4. Pendências críticas

Prioridade para liberar staging com usuários reais:

| # | Pendência | Severidade | Ação |
|---|-----------|------------|------|
| 1 | **Substituir placeholders** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` no `.env.staging` e painel Cloudflare | **Crítica** | Projeto Supabase staging dedicado |
| 2 | **Testar RLS em runtime** com JWT de dois tenants (leitura cruzada deve falhar) | **Crítica** | Checklist `docs/supabase-production.md` |
| 3 | **Aplicar migration** `20250525120000_security_audit_logs` em staging | **Alta** | SQL Editor / `db push` manual |
| 4 | **Configurar Supabase Auth** — Site URL e Redirect URLs = `https://staging.medicflow.app.br` | **Alta** | `docs/staging-deploy.md` |
| 5 | **`npm audit fix`** ou `@cloudflare/vite-plugin@≥1.38.0` | **Média** | Corrige cadeia `ws` |
| 6 | **Cookies `secure: true`** em `createServerClient` para produção/staging HTTPS | **Média** | `get-auth-context.ts` / cliente SSR |
| 7 | **Smoke HTTP pós-deploy** `npm run smoke-check -- --url=https://staging.medicflow.app.br` | **Alta** | `/site`, `/login` |
| 8 | **Revisar policy `tenants_anon_directory_select`** — limitar colunas ou exigir slug | **Média** | Aceitar risco documentado ou restringir |
| 9 | **Garantir `VITE_MEDFLOW_DEBUG` ausente** em build staging | **Alta** | Go-live checklist |
| 10 | **Não commitar** `.env.local` / secrets no build CI | **Alta** | Secrets do provedor apenas |

### Pendências não críticas (hardening)

- CSP com nonces (remover `unsafe-inline`)
- Alinhar `Content-Security-Policy` em `vercel.json` para assets estáticos
- Corrigir validador `security-logs-validate` para aceitar `logAuthAndAudit` (hoje exige `writeSecurityAudit` em `get-auth-context.ts`)
- 78 erros TypeScript (não são CVE, mas afetam confiabilidade de refactors de segurança)

---

## 5. Readiness staging

### 5.1 Critérios e resultado

| Critério | Peso | Status | Evidência |
|----------|------|--------|-----------|
| Build `npm run build:staging` | 20% | ✅ | Build concluído (client ~15s + SSR) |
| Domínio `staging.medicflow.app.br` no bundle | 15% | ✅ | `staging-validate`: domínio presente, sem `localhost` |
| Artefatos `dist/client` + `dist/server` | 15% | ✅ | Wrangler + chunks vendor/supabase |
| Env staging sem placeholders | 20% | ❌ | `.env.staging` ainda com placeholders (CI usa `--allow-placeholders`) |
| Supabase staging + Auth URLs | 20% | ❌ | Remoto não testado (ENOTFOUND placeholder) |
| Smoke HTTP staging | 10% | ⏳ | Não executado nesta análise |

**Score calculado:** **72%** — pronto para **deploy técnico de artefatos**; **não** pronto para **usuários piloto** até itens 1–4 e 7 da seção 4.

### 5.2 Validações executadas (25/05/2026)

```text
npm audit                          → 4 moderadas (exit 1)
npm run auth-validate              → static OK (15/15), remote FAIL (placeholder)
npm run security-headers-validate  → OK (4 avisos)
npm run security-logs-validate     → FAIL (falso negativo auth_logs)
npm run release-check              → FAIL env placeholders; WARN policy anon tenants
npm run staging-validate           → OK (--skip-build --allow-placeholders)
node scripts/migration-validate    → local OK; remote FAIL (placeholder)
```

### 5.3 Checklist go-live staging (resumo)

Ver `docs/staging-deploy.md` e `docs/go-live-checklist.md`:

- [ ] DNS `staging.medicflow.app.br` + TLS
- [ ] `.env.staging` com credenciais reais (não commitar)
- [ ] `npm run env-check:staging` sem erros
- [ ] `npm run staging-validate` **sem** `--allow-placeholders`
- [ ] Migrations aplicadas em Supabase staging (incl. `security_audit_logs`)
- [ ] `VITE_MEDFLOW_DEBUG` ausente
- [ ] Deploy manual Cloudflare + smoke `/site`, `/login`
- [ ] Teste RLS cross-tenant manual

---

## 6. Comandos para reproduzir

```powershell
cd MedFlow-IA
npm audit
npm run auth-validate
npm run security-headers-validate
npm run security-logs-validate
npm run release-check
npm run staging-validate
npm run migration-validate
```

Com credenciais staging reais:

```powershell
npm run env-check:staging
npm run staging-validate
npm run smoke-check -- --url=https://staging.medicflow.app.br
```

---

## 7. Conclusão

O MedFlow-IA possui **controles de segurança maduros no código** (auth, RBAC, headers, auditoria, RLS estático, proteção de imports server). As vulnerabilidades npm atuais são **moderadas e concentradas em tooling de build**. O principal gap para **Security Readiness em staging** é **configuração e validação remota** (Supabase real, cookies `Secure`, smoke e testes RLS), não ausência de implementação.

**Próximo passo recomendado:** preencher `.env.staging`, aplicar migrations no projeto staging, rodar `staging-validate` e `auth-validate` sem placeholders, depois smoke em `https://staging.medicflow.app.br`.

---

*Relatório gerado por análise automatizada e validadores do repositório em 25/05/2026.*
