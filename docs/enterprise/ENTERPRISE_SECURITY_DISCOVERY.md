# S1-01 — Enterprise Security Discovery

| Campo      | Valor                       |
| ---------- | --------------------------- |
| Projeto    | MedicFlow-AI                |
| Baseline   | Enterprise Runtime v1.1     |
| Sprint     | S1-01                       |
| Natureza   | Discovery                   |
| Atualizado | Sprint S1-01                |

---

## 1. Objetivo

Discovery da arquitetura de seguranca Enterprise existente. Nenhuma capability foi implementada. Nenhum arquivo em `src/` foi alterado. A Enterprise Runtime Baseline v1.1 permanece integralmente congelada.

---

## 2. Evidencia de zero alteracao em `src/`

```
git diff -- src/
(no output)
```

Nenhum `Runtime`, `RuntimePort`, `Adapter`, `Factory`, `Registry`, `Pipeline`, `Composition Root`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability` ou codigo funcional foi modificado durante esta Sprint.

---

## 3. Arquitetura de seguranca encontrada

### 3.1 Autenticacao

- `src/lib/auth/get-auth-context.ts` — `getAuthContext` isomorfico (SSR + cliente) baseado em Supabase Auth.
- `src/lib/auth/types.ts` — `AuthContext` expoe `session`, `user`, `profile` e `tenantId`.
- `src/lib/supabase/config.ts` — configuracao publica `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- `src/lib/server/supabase-admin.ts` — cliente service role `SUPABASE_SERVICE_ROLE_KEY`, server-only.

### 3.2 Autorizacao

- `src/lib/auth/rbac.ts` — matriz RBAC estatica `role -> Capability[]` com `can()` / `assertCan()`.
- `src/lib/auth/route-guard.ts` — `evaluateRouteGuard` para rotas publicas (`/login`, `/site`) e redirecionamentos.
- `src/lib/domain/operations/errors.ts` — `PermissionError`, `UnauthenticatedError`, `TenantMismatchError`.

### 3.3 Sessao

- `src/lib/security/session-validation.ts` — `validateSessionState` / `assertValidSessionState`.
- `src/lib/security/session-audit-server.ts` — `reportSessionAuditFn` para eventos `session_expired`, `token_refresh_failed`, `sign_out`.

### 3.4 Rate limit e brute-force

- `src/lib/security/rate-limit.ts` — `checkRateLimit`, `rateLimitKey`, `clearRateLimit` (memoria por Worker).
- `src/lib/security/brute-force.ts` — `evaluateLoginGate`, `recordLoginFailure`, `recordLoginSuccess`.
- `src/lib/security/auth-security-server.ts` — `checkLoginGateFn`, `recordLoginOutcomeFn` (server functions publicas).

### 3.5 Auditoria de seguranca

- `src/lib/security/security-audit-types.ts` — tipos `SecurityAuditCategory`, `SecurityAuditEventType`, `SecurityAuditOutcome`, `SecurityAuditInput`.
- `src/lib/security/security-audit-hash.ts` — `hashAuditEmail`, `hashAuditIp` com SHA-256 e pepper (`MEDFLOW_AUDIT_HASH_SALT` ou fallback).
- `src/lib/server/security-audit-writer.ts` — `writeSecurityAudit` best-effort para tabela `security_audit_logs`.
- `src/lib/monitoring/channels/auth.ts` — `logAuth` e `logAuthAndAudit`.
- `src/lib/monitoring/channels/ssr.ts` — `logSsr` e `logSsrAndAudit`.
- `src/lib/monitoring/channels/runtime.ts` — `logRuntime` para eventos do runtime.

### 3.6 Headers e CSP

- `src/lib/security/csp.ts` — `buildContentSecurityPolicy`, `securityHeaders`, `applySecurityHeadersTo`.

### 3.7 Sanitizacao e validacao

- `src/lib/security/sanitize-input.ts` — `sanitizeString`, `sanitizeEmail`, `isValidEmailFormat`, `sanitizeStringFields`.
- `src/lib/security/secure-redirects.ts` — `isSafeRedirectTarget`, `sanitizePostLoginPath`.
- `src/lib/security/safe-external-links.ts` — `isSafeExternalHref`, `externalLinkProps`.
- `src/lib/security/upload-validation.ts` — `validateBrandingUpload` (tamanho, MIME, extensao).
- `src/lib/security/request-client.ts` — `getClientIpFromRequest` (Cloudflare, X-Forwarded-For, X-Real-IP).

### 3.8 Monitoramento

- `src/lib/monitoring/emit.ts` — `emitMonitor`, `registerMonitorSink`.
- `src/lib/monitoring/types.ts` — canais `auth`, `ssr`, `runtime`, `client`.
- `src/lib/monitoring/sinks/console.ts` — `consoleMonitorSink`.
- `src/lib/monitoring/sinks/error-tracker.ts` — `createErrorTrackerSink` (Sentry/Datadog DSN via `MEDFLOW_ERROR_TRACKING_DSN`).

### 3.9 Env e checks

- `src/lib/env/startup-checks.ts` — `runStartupChecks` valida `supabase_public`, `env_warnings`, `production_domain`.
- `src/lib/server/fn-helpers.ts` — `runMutation` / `runQuery` integram `requireOperationalAuth`, `validateSessionState` e `writeSecurityAudit`.

---

## 4. Componentes reutilizaveis

| Componente | Local | Reuso no Bloco S |
|---|---|---|
| `getAuthContext` | `src/lib/auth/get-auth-context.ts` | Fornecer `tenantId` / `role` a interceptadores de runtime. |
| `can` / `assertCan` | `src/lib/auth/rbac.ts` | Autorizar operacoes enterprise por capability. |
| `validateSessionState` | `src/lib/security/session-validation.ts` | Validar sessao antes de execucao de jobs. |
| `writeSecurityAudit` | `src/lib/server/security-audit-writer.ts` | Persistir eventos de seguranca do pipeline. |
| `hashAuditEmail` / `hashAuditIp` | `src/lib/security/security-audit-hash.ts` | Pseudonimizacao de PII nos logs. |
| `logAuthAndAudit` / `logSsrAndAudit` | `src/lib/monitoring/channels/` | Emissao de logs de seguranca. |
| `checkRateLimit` | `src/lib/security/rate-limit.ts` | Rate-limit de endpoints publicos. |
| `evaluateLoginGate` | `src/lib/security/brute-force.ts` | Protecao de autenticacao. |
| `securityHeaders` / `buildContentSecurityPolicy` | `src/lib/security/csp.ts` | Headers globais de seguranca. |
| `sanitizeString` / `sanitizeEmail` | `src/lib/security/sanitize-input.ts` | Sanitizacao de entradas. |
| `isSafeRedirectTarget` | `src/lib/security/secure-redirects.ts` | Prevencao de open redirect. |

---

## 5. RuntimePorts relacionados

| RuntimePort | Relacao com seguranca |
|---|---|
| `AuditRuntimePort` (A9-03 Production) | Ponto de extensao para auditoria criptografica e cadeia de custodia. |
| `CompletedRuntimePort` (A10-03 Production) | Ponto de extensao para finalizacao segura e assinatura digital. |
| `ObservabilityRuntimePort` | Canal de leitura para telemetry de seguranca (sem regra). |
| `QueueRuntimePort` | Transporte de mensagens de auditoria/finalizacao. |
| `WorkerRuntimePort` | Executor de jobs de seguranca (interceptadores). |

---

## 6. Extension Points (pontos de extensao oficiais)

1. **Custom attributes do pipeline TISS** — os metadados `customAttributes` dos jobs `processTiss*` ja preveem flags `auditExecuted`, `completedExecuted` e podem ser estendidos com `hash`, `signature`, `chainOfCustody`, `tenantId`, `runtimeId`, `traceId`.
2. **Security Hooks nos documentos de discovery** — `AUDIT_REAL_DISCOVERY.md` e `COMPLETED_REAL_DISCOVERY.md` ja documentam `Security Hooks` para futura integracao.
3. **Canal `auth` do monitoramento** — `logAuthAndAudit` pode receber eventos de runtime enriquecidos com `tenantId` e `profileId`.
4. **Canais `ssr` e `runtime`** — `logSsrAndAudit` e `logRuntime` podem transportar eventos de seguranca do runtime.
5. **`getEnterpriseRuntime()`** — entrypoint unico; futuros interceptadores de seguranca podem ser aplicados como policies cross-cutting sem modificar o runtime.
6. **`writeSecurityAudit`** — tabela `security_audit_logs` ja estruturada para receber eventos de seguranca enterprise.
7. **Supabase RLS / policies** — RBAC mapeado para triggers/policies Postgres (migration citada em `rbac.ts`); pode ser reforcado para o Enterprise Runtime.

---

## 7. Dependency Matrix

| Capacidade de seguranca | Depende de | Nome do contrato / arquivo |
|---|---|---|
| Autenticacao | Supabase Auth | `getAuthContext`, `getSupabasePublicConfig` |
| Autorizacao | `AuthContext` | `can`, `assertCan`, `rbac.ts` |
| Validacao de sessao | `AuthContext` / `ProfileRow` | `validateSessionState` |
| Auditoria de login | IP do request, e-mail | `auth-security-server.ts`, `brute-force.ts` |
| Auditoria persistente | `getAdminSupabase` | `security-audit-writer.ts` |
| Hash de auditoria | `MEDFLOW_AUDIT_HASH_SALT` | `security-audit-hash.ts` |
| Rate limit | Memoria local do Worker | `rate-limit.ts` |
| Monitoramento | Sinks registrados | `monitoring/emit.ts`, `sinks/error-tracker.ts` |
| Tenant isolation | `profiles.tenant_id` | `getAuthContext`, `rbac.ts` |

---

## 8. Security Capability Matrix

| Capacidade | Estado | Componente existente | Nota |
|---|---|---|---|
| Autenticacao | Producao | Supabase Auth + `getAuthContext` | JWT/cookies. |
| Autorizacao (RBAC) | Producao | `rbac.ts` | Capabilities atômicas. |
| Validacao de sessao | Producao | `session-validation.ts` | Verifica user/tenant/role. |
| Rate limiting | Producao | `rate-limit.ts` | Por instancia de Worker. |
| Brute-force protection | Producao | `brute-force.ts` | Login. |
| CSP / security headers | Producao | `csp.ts` | Headers HTTP. |
| Sanitizacao de input | Producao | `sanitize-input.ts` | Strings, e-mails. |
| Safe redirects | Producao | `secure-redirects.ts` | Open redirect. |
| Safe external links | Producao | `safe-external-links.ts` | Schemes permitidos. |
| Upload validation | Producao | `upload-validation.ts` | Branding. |
| Client IP extraction | Producao | `request-client.ts` | Proxies/CF. |
| Auditoria de seguranca | Producao | `security-audit-writer.ts` | `security_audit_logs`. |
| Hash de auditoria | Producao | `security-audit-hash.ts` | SHA-256. |
| Tenant isolation | Parcial | `AuthContext.tenantId` + RLS | Tenant por profile. |
| Monitoramento/SIEM | Pluggável | `monitoring` + `error-tracker.ts` | DSN externo opcional. |
| Criptografia em trânsito | N/A | TLS (infra) | HSTS em `csp.ts`. |
| Criptografia em repouso | Discovery | Nenhum wrapper de cifra | Pode usar Supabase RLS/encryption. |
| Assinatura digital | Discovery | Nenhum | Futuro Bloco S. |
| Cadeia de custodia | Discovery | Nenhum | Futuro Bloco S. |
| HSM / Azure Key Vault | Discovery | Nenhum | Futuro Bloco S. |
| OpenTelemetry | Discovery | Nenhum | Futuro Bloco S. |
| Key management programatico | Discovery | Nenhum | Futuro Bloco S. |

---

## 9. Security Gap Analysis

| # | Gap | Impacto | Mitigacao sugerida |
|---|---|---|---|
| 1 | Sem interceptador oficial de seguranca no `EnterpriseRuntime` | Médio | Criar `EnterpriseSecurityPolicy` como camada cross-cutting, sem modificar ports. |
| 2 | Sem assinatura digital/hash do payload TISS | Alto | Reutilizar `security-audit-hash.ts` para hashes canônicos dos jobs. |
| 3 | Sem cadeia de custodia (previousJobId e hash) | Alto | Estender `customAttributes` com `jobHash` e `signature`. |
| 4 | Sem criptografia programática de dados sensíveis | Alto | Integrar Azure Key Vault/HSM futuramente. |
| 5 | `tenantId`, `runtimeId`, `traceId` ainda não propagados no `CanonicalQueueMessage` | Médio | Documentado como `Known Canonical Gaps` na baseline; pode ser estendido. |
| 6 | Rate limit em memória (não distribuído) | Médio | Substituir por backend Redis/banco quando necessário. |
| 7 | `SecurityAuditInput` não inclui campos TISS específicos | Baixo | Estender schema quando o Bloco S for ativado. |
| 8 | `AuditRuntimePort` e `CompletedRuntimePort` ainda estruturais | Baixo | Capacidades já certificadas; execução criptografica futura. |

---

## 10. Estratégia oficial para futuras ativações

1. **S1-02 — Security Policy Discovery**: mapear contrato `EnterpriseSecurityPolicy` e interceptor sem alterar `EnterpriseRuntime`.
2. **S1-03 — Tenant Context Propagation**: propagar `tenantId`, `runtimeId`, `traceId` via `customAttributes` canônicos (nao modificar freeze do contrato sem baseline).
3. **S1-04 — Cryptographic Audit Trail Discovery**: mapear `hash` e `signature` dos jobs TISS, reutilizando `security-audit-hash.ts`.
4. **S1-05 — Key Management Discovery**: avaliar Azure Key Vault / HSM para credenciais TISS e tokens de operadoras.
5. **S1-06 — LGPD / Compliance Discovery**: mapear retencao, anonimizacao e consentimento sobre `security_audit_logs`.
6. **S1-07 — OpenTelemetry / SIEM Discovery**: mapear exportacao de `MonitorPayload` para SIEM.

Toda ativacao futura deve:

- Respeitar `getEnterpriseRuntime()` como entrypoint unico.
- Nao criar `Runtime`, `Port`, `Gateway`, `Pipeline` ou `Composition Root` paralelos.
- Reutilizar `Factory` e `Registry` oficiais.
- Atuar como camada cross-cutting (ADL principle 7).
- Obter aprovacao formal para qualquer alteracao na Baseline v1.1.

---

## 11. Confirmacoes

- ✅ Nenhum arquivo `src/` alterado.
- ✅ Enterprise Runtime Baseline v1.1 preservada.
- ✅ Bloco A intacto.
- ✅ S1-01 encerrada como Discovery.
