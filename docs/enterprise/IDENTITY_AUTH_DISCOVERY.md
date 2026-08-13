# Identity & Authentication Discovery — S2-01

| Campo      | Valor             |
| ---------- | ----------------- |
| Atualizado | Sprint S2-01      |

## Resumo

A Sprint **S2-01** mapeia a arquitetura de **identidade e autenticação** existente no MedicFlow-AI. O objetivo é identificar mecanismos atuais, componentes reutilizáveis, contratos, pontos de extensão, integrações, limitações e a estratégia oficial para evolução futura, **sem implementar qualquer capability**.

A autenticação atual é inteiramente baseada em **Supabase Auth** (email/senha, com recuperação de senha), complementada por validação de sessão, RBAC em duas camadas (aplicação + Postgres RLS), multi-tenancy via `profiles.tenant_id` e auditoria de segurança. Mecanismos avançados como MFA, OAuth, SSO e Magic Link ainda não estão implementados.

## Mecanismos Atuais

### 1. Supabase Auth

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| Configuração pública | `src/lib/supabase/config.ts` | `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |
| Cliente browser | `src/lib/supabase/browser.ts` | `createBrowserClient<Database>` singleton |
| Cliente SSR | `src/lib/server/supabase.ts` | `createServerClient<Database>` com cookies |
| Cliente admin | `src/lib/server/supabase-admin.ts` | `createClient` com `SUPABASE_SERVICE_ROLE_KEY` (estado, bypassa RLS) |

### 2. Login e Logout

| Fluxo | Local | Detalhe |
|-------|-------|---------|
| Login | `src/routes/login.tsx` | Seleção de tenant, rate limit `checkLoginGateFn`, `supabase.auth.signInWithPassword`, validação de `profiles`, redirecionamento |
| Logout | `src/routes/perfil.tsx` e `src/lib/errors/auth-actions.ts` | `supabase.auth.signOut({ scope: "local" })` e redirecionamento para `/login` |
| Recuperação de senha | `src/lib/auth/password-reset.ts` e `src/routes/login.esqueci-senha.tsx` | `supabase.auth.resetPasswordForEmail` com `redirectTo` customizado |

### 3. Sessão, JWT e Claims

| Mecanismo | Arquivo | Descrição |
|-----------|---------|-----------|
| Sincronização de sessão | `src/components/auth-sync.tsx` | `onAuthStateChange` escuta `SIGNED_OUT`, `TOKEN_REFRESHED`, `TOKEN_REFRESH_FAILED`, `USER_DELETED`; invalida rotas e reporta auditoria |
| Validação de sessão | `src/lib/security/session-validation.ts` | Verifica `userId`, `profile.tenant_id` e `profile.role` |
| JWT/claims | `src/lib/server/operational-auth.ts` | `client.auth.getUser()` retorna usuário; `auth.uid()` em Postgres extrai id do JWT; RLS usa `auth.uid()` e `current_user_role()` |
| Refresh/rotation | Gerenciado pelo Supabase | Sem lógica customizada; tokens em cookies SSR |

### 4. AuthContext e Perfil

| Componente | Arquivo | Contrato |
|------------|---------|----------|
| Tipo `AuthContext` | `src/lib/auth/types.ts` | `{ session, user, profile, tenantId }` |
| `getAuthContext` | `src/lib/auth/get-auth-context.ts` | `createIsomorphicFn()` com implementação SSR e browser; `loadProfile` de `public.profiles` |
| `__root.tsx` | `src/routes/__root.tsx` | `beforeLoad` obtém `getAuthContext` e aplica `evaluateRouteGuard`; injeta `auth` no contexto das rotas |

### 5. Perfil, Tenant e Multi-tenancy

| Aspecto | Local | Detalhe |
|---------|-------|---------|
| Tabela `profiles` | `src/lib/database.types.ts` | `id`, `tenant_id`, `full_name`, `role`, `avatar_url`, `created_at` |
| Tabela `tenants` | `src/lib/database.types.ts` | `id`, `name`, `slug`, `created_at` |
| Resolução de tenant | `src/lib/auth/get-auth-context.ts` e `src/lib/server/operational-auth.ts` | `tenantId = profile.tenant_id` |
| `ServiceCtx` | `src/lib/services/operations/types.ts` | `{ client, tenantId, role, userId, actorProfileId, professionalId }` |

### 6. RBAC e Permissões

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| Tipos de papel | `src/lib/database.types.ts` | `super_admin`, `tenant_admin`, `coordinator`, `professional`, `financial` |
| Matriz de capacidades | `src/lib/auth/rbac.ts` | `Capability` e `roleCapabilities` estáticas; `can()`, `assertCan()`, `isOperationalManager()`, `isTenantAdmin()` |
| RBAC no banco | `supabase/migrations/20250512000002_operational_rbac_state.sql` | `current_user_role()`, `current_professional_id()`, `is_operational_manager()`, `is_tenant_admin()` e políticas RLS |
| Uso | Serviços em `src/lib/services/operations/` | `assertCan(ctx.role, "...")` antes de executar operação |

### 7. Route Guards

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `isPublicPath` | `src/lib/auth/route-guard.ts` | `/login`, `/login/*`, `/site`, `/site/*` |
| `evaluateRouteGuard` | `src/lib/auth/route-guard.ts` | Redireciona não autenticados para `/login`; autenticados longe do login para `/` |
| Guard em server functions | `src/lib/server/fn-helpers.ts` | `runMutation`/`runQuery` constroem `ServiceCtx` e validam sessão |

### 8. Auditoria de Segurança

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| `reportSessionAuditFn` | `src/lib/security/session-audit-server.ts` | Envia eventos `session_expired`, `token_refresh_failed`, `sign_out` com rate limit |
| `writeSecurityAudit` | `src/lib/server/security-audit-writer.ts` | Persiste auditoria no Supabase (via admin client quando necessário) |
| `logAuthAndAudit` | `src/lib/monitoring/channels/auth` | Canal de auditoria de autenticação |

## Componentes Reutilizáveis

- `getAuthContext` — isomórfico (SSR + cliente).
- `requireOperationalAuth` — validação de servidor com `ServiceCtx`.
- `validateSessionState` / `assertValidSessionState` — validação mínima de sessão.
- `can` / `assertCan` — verificação de permissões.
- `ServiceCtx` — contexto padrão para serviços.
- `evaluateRouteGuard` — guarda de rotas testável.
- `AuthSync` — componente React para eventos de autenticação.
- `AuthFallback` — UI de erro de autenticação.
- `getBrowserSupabase` / `getServerSupabase` / `getAdminSupabase` — clientes Supabase.
- `writeSecurityAudit` e `logAuthAndAudit` — auditoria de segurança.

## Contratos Existentes

### `AuthContext`

```typescript
type AuthContext = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  tenantId: string | null;
};
```

### `ServiceCtx`

```typescript
type ServiceCtx = {
  client: OperationalClient;
  tenantId: string;
  role: UserRole;
  userId: string;
  actorProfileId: string;
  professionalId: string | null;
};
```

### `RouteGuardResult`

```typescript
type RouteGuardResult =
  | { allowed: true }
  | { allowed: false; redirectTo: "/login" | "/" };
```

### `SessionValidationResult`

```typescript
type SessionValidationResult = { ok: boolean; issues: string[] };
```

## RuntimePorts Relacionados

| Port | Módulo | Estado | Relação com Identity/Auth |
|------|--------|--------|----------------------------|
| `SecurityRuntimePort` | `src/lib/enterprise/security-runtime/` | Structural (S1-03) | Scaffolding para futuras operações de segurança; **não** integrado à autenticação de usuários |
| `AuthorizationRuntimePort` | `src/lib/enterprise/authorization-runtime/` | Structural | Scaffolding para autorização de operadoras/TISS; **não** integrado ao RBAC atual |
| `TenantPort` | `src/lib/enterprise/tenant/` | Structural | Scaffolding para gestão de tenants; **não** integrado ao `profiles.tenant_id` do Supabase |

## Extension Points

1. **Novos métodos de autenticação:** novas rotas (`/login/oauth`) + integração com `supabase.auth.signInWithOAuth`.
2. **Novos papéis:** adicionar a `UserRole` em `database.types.ts`, capacidades em `src/lib/auth/rbac.ts` e funções Postgres.
3. **Novas capacidades RBAC:** adicionar a `Capability`, mapear em `roleCapabilities` e usar `assertCan()`.
4. **Extensão de perfil:** adicionar colunas em `public.profiles` e atualizar `loadProfile()`.
5. **Integração futura com SecurityRuntimePort:** orquestrar jobs de auditoria de segurança sem afetar Supabase Auth.
6. **Integração futura com TenantPort:** criar adapter entre `profiles.tenant_id` e modelo canônico.
7. **Integração futura com AuthorizationRuntimePort:** conectar autenticação TISS de operadoras.

## Dependency Matrix

```
getAuthContext
├── getSupabasePublicConfig
├── createServerClient (SSR) / getBrowserSupabase (client)
├── loadProfile
│   └── supabase.from("profiles")
└── logAuthAndAudit
    └── writeSecurityAudit
        └── getAdminSupabase

requireOperationalAuth
├── getServerSupabase
├── supabase.auth.getUser()
├── loadProfile
├── assertValidSessionState
└── writeSecurityAudit

evaluateRouteGuard
└── AuthContext

runMutation / runQuery
├── requireOperationalAuth
├── validateSessionState
└── writeSecurityAudit

ServiceCtx
├── client (SupabaseClient)
├── tenantId (profile.tenant_id)
├── role (profile.role)
├── userId (user.id)
└── professionalId

All Services
├── ServiceCtx
└── assertCan (RBAC)

RLS Policies
├── current_tenant_ids()
├── current_user_role()
├── current_professional_id()
├── is_operational_manager()
└── is_tenant_admin()
```

## Identity Capability Matrix

| Capability | Status | Notas |
|------------|--------|-------|
| Email/Password Auth | Implementado | `src/routes/login.tsx` |
| Password Recovery | Implementado | `src/lib/auth/password-reset.ts` |
| Session Management | Implementado | `src/components/auth-sync.tsx` |
| JWT Claims | Implementado (Supabase) | `auth.uid()` no Postgres |
| Multi-Tenancy | Implementado | `profiles.tenant_id` + RLS |
| RBAC | Implementado | App + Postgres |
| RLS Policies | Implementado | `supabase/migrations/..._operational_rbac_state.sql` |
| Security Audit | Implementado | `writeSecurityAudit` / `reportSessionAuditFn` |
| Rate Limiting | Implementado (in-memory) | `src/lib/security/rate-limit.ts` |
| Brute Force Protection | Implementado (in-memory) | `src/lib/security/brute-force.ts` |
| MFA | Não implementado | Supabase suporta, mas não configurado |
| OAuth | Não implementado | Sem providers configurados |
| SSO/SAML | Não implementado | Sem integração |
| Magic Link | Não implementado | Supabase suporta, mas não habilitado |
| Session Revocation | Limitado | Sem UI de gestão de sessões |
| Device Management | Não implementado | Sem fingerprinting |
| Identity Provider Federation | Não implementado | Supabase único IdP |
| Enterprise Security Runtime | Structural | `SecurityRuntimePort` certificado, mas sem consumo funcional |
| Enterprise Authorization Runtime | Structural | `AuthorizationRuntimePort` sem consumo |
| Enterprise Tenant Foundation | Structural | `TenantPort` sem consumo |

## Authentication Capability Matrix

| Feature | Implementação | Local |
|---------|---------------|-------|
| Login | Email/Password | `src/routes/login.tsx` |
| Logout | `signOut` | `src/routes/perfil.tsx` |
| Password Reset | `resetPasswordForEmail` | `src/routes/login.esqueci-senha.tsx` |
| Session Sync | `onAuthStateChange` | `src/components/auth-sync.tsx` |
| Route Guard | `evaluateRouteGuard` | `src/lib/auth/route-guard.ts` |
| Server Auth | `requireOperationalAuth` | `src/lib/server/operational-auth.ts` |
| RBAC | `roleCapabilities` | `src/lib/auth/rbac.ts` |
| RLS | Postgres policies | `supabase/migrations/..._operational_rbac_state.sql` |
| Security Audit | `writeSecurityAudit` | `src/lib/server/security-audit-writer.ts` |
| Rate Limit | In-memory | `src/lib/security/rate-limit.ts` |
| Brute Force | In-memory | `src/lib/security/brute-force.ts` |
| Session Validation | `validateSessionState` | `src/lib/security/session-validation.ts` |

## Gap Analysis

### Gaps Críticos

1. **MFA:** não implementado. Risco de takeover com senha vazada.
2. **OAuth/SSO:** não implementado. Impede integração com IdPs corporativos.
3. **Rate limiting persistente:** in-memory; reinicializa com o servidor.
4. **Brute force persistente:** in-memory; mesma limitação.

### Gaps Importantes

5. **Session Management UI:** sem listar/revogar sessões ativas.
6. **Audit queue:** auditoria é best-effort; falha de banco pode perder logs.
7. **Enterprise Runtime Integration:** auth/identity não consome `SecurityRuntimePort`, `AuthorizationRuntimePort` nem `TenantPort`.
8. **Tenant Foundation Integration:** modelo Supabase de tenants e modelo Enterprise estão paralelos.

### Gaps de UX / Developer Experience

9. **useAuth Hook:** inexistente; rotas usam `useRouteContext({ from: "__root__" })`.
10. **LoginForm Component:** formulário inline em `src/routes/login.tsx`.
11. **AuthGuard Component:** não há componente declarativo de proteção de rotas.

## Estratégia Oficial para Ativações Futuras

### Fase 1 — Hardening (S2-02)

- Implementar MFA via Supabase (TOTP/SMS).
- Adicionar OAuth (Google/Microsoft) via `supabase.auth.signInWithOAuth`.
- Migrar rate limiting e brute force para armazenamento persistente (Redis/Postgres).

### Fase 2 — Integração Enterprise (S2-03)

- Conectar logs de auditoria de autenticação ao `SecurityRuntimePort` (jobs/finding estruturais).
- Criar adapter entre `profiles.tenant_id` e `TenantPort`.
- Integrar credenciais TISS com `AuthorizationRuntimePort`.

### Fase 3 — UX (S2-04)

- Criar `useAuth()` hook.
- Extrair `LoginForm` como componente reutilizável.
- Criar tela de gestão de sessões ativas (revogação).

### Fase 4 — Avançado (S2-05)

- SSO/SAML.
- Magic Link.
- Device fingerprinting.

## Confirmações da Sprint

- Nenhuma capability de autenticação/identidade foi implementada nesta sprint.
- Nenhum `Runtime`, `RuntimePort`, `Factory`, `Registry`, `Adapter`, `Pipeline`, `Composition Root` ou `Middleware` foi criado.
- Nenhum arquivo em `src/` foi modificado.
- A arquitetura de autenticação existente foi mapeada, documentada e preservada.
- A **Enterprise Runtime Baseline v1.1** permanece congelada e preservada integralmente.
