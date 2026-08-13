# Authorization & Access Control Discovery — S3-01

| Campo      | Valor             |
| ---------- | ----------------- |
| Atualizado | Sprint S3-01      |

## Resumo

A Sprint **S3-01** executa uma auditoria completa e exclusivamente **read-only** da arquitetura de **Authorization & Access Control** existente no MedicFlow-AI. O objetivo é documentar mecanismos, componentes reutilizáveis, pontos de extensão, dependências, integração futura com a Enterprise Runtime e os gaps atuais, **sem implementar qualquer capability e sem alterar qualquer arquivo em `src/`**.

A arquitetura atual é baseada em **RBAC estático** com reforço de **Row-Level Security (RLS)** no PostgreSQL e validações de sessão no servidor. É funcional para as operações atuais, mas carece de motor de políticas, ABAC, autorização por recurso, papéis por tenant e integração funcional com os Enterprise RuntimePorts.

## Arquitetura Atual

### RBAC

Arquivo central: `src/lib/auth/rbac.ts`.

| Elemento | Descrição |
|----------|-----------|
| `UserRole` | `super_admin`, `tenant_admin`, `coordinator`, `professional`, `financial` |
| `Capability` | Lista de capabilities em domínio (schedules, shifts, assignments, swaps, availability, tiss, payouts, financial_closing, tenant_settings, demo_seed) |
| `roleCapabilities` | Mapeamento estático `UserRole -> readonly Capability[]` |
| `can(role, capability)` | Verificação booleana |
| `assertCan(role, capability, message?)` | Lança `PermissionError` se negado |
| `isOperationalManager(role)` | `super_admin` / `tenant_admin` / `coordinator` |
| `isTenantAdmin(role)` | `super_admin` / `tenant_admin` |

Capabilities estruturais (exemplos): `schedules:read`, `schedules:create`, `assignments:assign:any`, `assignments:assign:self`, `swaps:approve`, `financial_closing:reopen`, `tenant_settings:write`, `demo_seed:apply`.

### Permission Resolution

- As services usam `assertCan(ctx.role, "<capability>")` antes das operações.
- Exemplos: `src/lib/services/operations/schedules.ts`, `assignments.ts`, `financial-closing/financial-closing-service.ts`, `tenant-settings/tenant-settings-service.ts`.
- A camada de banco reforça o acesso via RLS: `current_user_role()`, `is_operational_manager()`, `is_tenant_admin()`.

### AuthContext e ServiceCtx

```typescript
// src/lib/auth/types.ts
type AuthContext = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  tenantId: string | null;
};

// src/lib/services/operations/types.ts
type ServiceCtx = {
  client: OperationalClient;
  tenantId: string;
  role: UserRole;
  userId: string;
  actorProfileId: string;
  professionalId: string | null;
};
```

`requireOperationalAuth()` em `src/lib/server/operational-auth.ts` resolve usuário, perfil, tenant e, para `professional`, o `professional_id`.

### Route Guards

Arquivo: `src/lib/auth/route-guard.ts`.

- `isPublicPath(pathname)`: `/login`, `/login/*`, `/site`, `/site/*`.
- `evaluateRouteGuard(pathname, auth)`: redireciona não autenticados para `/login`, autenticados sem `profile` para `/login`, e autenticados a partir de `/login` para `/`.
- Integrado em `src/routes/__root.tsx` `beforeLoad`.

### Server Authorization

- `requireOperationalAuth()`: resolve `OperationalAuthContext` e valida sessão.
- `validateSessionState()`: verifica `userId`, `profile.tenant_id`, `profile.role`.
- `runMutation()` / `runQuery()` em `src/lib/server/fn-helpers.ts`: montam `ServiceCtx`, validam sessão e executam serviço.
- `writeSecurityAudit()`: log de falhas de autenticação/autorização.

### Client Authorization

- `AuthSync` (`src/components/auth-sync.tsx`): escuta `onAuthStateChange`, invalida rotas e reporta auditoria.
- `AuthFallback` (`src/components/auth-fallback.tsx`): apresenta mensagens de erro de acesso.
- Cliente `can()` em rotas/componentes: `src/routes/index.tsx`, `instituicao.tsx`, `lancamento.tsx`; `financial-closing-workbench.tsx`.

### Database Policies / RLS

Arquivo: `supabase/migrations/20250512000002_operational_rbac_state.sql`.

```sql
-- Isolamento por tenant
CREATE OR REPLACE FUNCTION public.current_tenant_ids() RETURNS SETOF uuid ...

-- Resolução de papel
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS public.user_role ...

-- Helpers
CREATE OR REPLACE FUNCTION public.is_operational_manager() RETURNS boolean ...
CREATE OR REPLACE FUNCTION public.is_tenant_admin() RETURNS boolean ...
CREATE OR REPLACE FUNCTION public.current_professional_id() RETURNS uuid ...
```

Padrões de políticas:
- `SELECT`: `tenant_id IN (SELECT public.current_tenant_ids())`.
- `INSERT`/`UPDATE`: tenant + `public.is_operational_manager()`.
- Self-service: `public.current_user_role() = 'professional' AND professional_id = public.current_professional_id()`.

### Claims, Roles e Tenant Roles

- `profiles.id` referencia `auth.users`.
- `profiles.tenant_id` referencia `public.tenants`.
- `profiles.role` enum `public.user_role`.
- Modelo atual: **um tenant por usuário**.
- `current_tenant_ids()` retorna conjunto, mas, hoje, é sempre um único id.

### Feature Flags

- Existe apenas sistema piloto: `src/lib/services/pilot-execution/feature-flag-service.ts`.
- Tabela `pilot_feature_flags`.
- Escritas exigem `tenant_settings:write`.
- Não há sistema geral de feature flags vinculado a RBAC.

### Context Resolution

- `getAuthContext()` em `src/lib/auth/get-auth-context.ts` é isomórfico (SSR + cliente) e resolve `AuthContext`.
- `requireOperationalAuth()` resolve `OperationalAuthContext` no servidor.
- `professionalId` é resolvido a partir de `professionals.profile_id`.

## Componentes Reutilizáveis

| Componente | Arquivo | Propósito |
|------------|---------|-----------|
| `can()` | `src/lib/auth/rbac.ts` | Verificação booleana de capability |
| `assertCan()` | `src/lib/auth/rbac.ts` | Lança `PermissionError` |
| `isOperationalManager()` | `src/lib/auth/rbac.ts` | Checa papel gerencial |
| `isTenantAdmin()` | `src/lib/auth/rbac.ts` | Checa papel admin |
| `getAuthContext()` | `src/lib/auth/get-auth-context.ts` | Resolução isomórfica de contexto |
| `requireOperationalAuth()` | `src/lib/server/operational-auth.ts` | Requisição de autenticação servidor |
| `validateSessionState()` | `src/lib/security/session-validation.ts` | Validação de sessão |
| `assertValidSessionState()` | `src/lib/security/session-validation.ts` | Lança em sessão inválida |
| `runMutation()` / `runQuery()` | `src/lib/server/fn-helpers.ts` | Wrappers autorizados de server fn |
| `AuthSync` | `src/components/auth-sync.tsx` | Monitor de estado de autenticação |
| `AuthFallback` | `src/components/auth-fallback.tsx` | UI de erro de autenticação |
| `evaluateRouteGuard()` | `src/lib/auth/route-guard.ts` | Proteção de rotas |
| `writeSecurityAudit()` | `src/lib/server/security-audit-writer.ts` | Auditoria de segurança |

## RuntimePorts Relacionados

| Port | Módulo | Estado | Relação com Authorization/Access Control |
|------|--------|--------|------------------------------------------|
| `AuthorizationRuntimePort` | `src/lib/enterprise/authorization-runtime/` | Structural | Scaffolding canônico para autorização futura; não integrado ao RBAC atual |
| `SecurityRuntimePort` | `src/lib/enterprise/security-runtime/` | Production Certified (S1-03) | Scaffolding para jobs de segurança; pode vir a receber eventos de auditoria de autorização |
| `IdentityRuntimePort` | `src/lib/enterprise/identity-runtime/` | Production Certified (S2-03) | Scaffolding para identidade; pode fornecer claims/perfil futuramente |
| `AuditRuntimePort` | `src/lib/enterprise/audit-runtime/` | Production Certified (A9-03) | Pode ser ponto para auditoria de decisões de autorização |
| `CompletedRuntimePort` | `src/lib/enterprise/completed-runtime/` | Production Certified (A10-02) | Não relacionado diretamente |
| `QueueRuntimePort` | `src/lib/enterprise/queue-runtime/` | Operational | Pode enfileirar jobs de autorização futuros |
| `WorkerRuntimePort` | `src/lib/enterprise/worker-runtime/` | Operational | Pode processar jobs de autorização futuros |
| `SchedulerRuntimePort` | `src/lib/enterprise/scheduler-runtime/` | Operational | Pode agendar jobs de autorização futuros |
| `ObservabilityRuntimePort` | `src/lib/enterprise/observability-runtime/` | Structural/Operational | Pode emitir telemetria de autorização |

## Matrizes

### Authorization Capability Matrix

| Capability Area | Status |
|-----------------|--------|
| RBAC estático | Implementado |
| Mapeamento role -> capability | Implementado |
| `can()` / `assertCan()` | Implementado |
| Helpers `isOperationalManager()` / `isTenantAdmin()` | Implementado |
| Isolamento por tenant via RLS | Implementado |
| Capabilities `:self` (self-service) | Implementado |
| RLS abrangente | Implementado |
| State Machine via triggers | Implementado |
| Feature flags por tenant | Implementado (piloto apenas) |
| Auditoria de segurança | Implementado |
| Motor de políticas (policy engine) | Não implementado |
| ABAC | Não implementado |
| Autorização por recurso | Não implementado |
| Papéis específicos por tenant | Não implementado |
| Sobreposições de capability por tenant | Não implementado |
| Delegação de permissões | Não implementado |
| Grupos de permissões / templates | Não implementado |
| Integração funcional com `AuthorizationRuntimePort` | Não implementado |

### Access Control Matrix

| Componente | Onde Usado | Mecanismo |
|------------|------------|-----------|
| `can()` | Rotas cliente, componentes de UI | Verificação booleana de capability |
| `assertCan()` | Todas as services | Lança `PermissionError` |
| `isOperationalManager()` | Services, políticas RLS | Checagem de categoria de papel |
| `isTenantAdmin()` | Services, políticas RLS | Checagem de papel admin |
| `requireOperationalAuth()` | Server functions | Resolução de sessão + perfil |
| `validateSessionState()` | `runMutation()` / `runQuery()` | Validação de sessão |
| `evaluateRouteGuard()` | `__root.tsx` `beforeLoad` | Proteção de rotas |
| `isPublicPath()` | `evaluateRouteGuard()` | Detecção de caminho público |
| `current_user_role()` | Políticas RLS | Resolução de papel no banco |
| `current_tenant_ids()` | Políticas RLS | Resolução de tenant no banco |
| `current_professional_id()` | Políticas RLS, services | Resolução de profissional no banco |
| `AuthSync` | Componente raiz | Monitor de estado de autenticação |
| `AuthFallback` | Página de login | Apresentação de erro de acesso |
| `writeSecurityAudit()` | Falhas de auth | Auditoria de segurança |

### Dependency Matrix

```
Capability
└── UserRole
    └── roleCapabilities
        ├── can()
        ├── assertCan()
        └── role checks

getAuthContext()
├── getServerSupabase() / getBrowserSupabase()
├── supabase.auth.getUser()
└── loadProfile()
    └── profiles (Supabase)

requireOperationalAuth()
├── getServerSupabase()
├── supabase.auth.getUser()
├── loadProfile()
├── assertValidSessionState()
│   └── profile.tenant_id, profile.role
└── professional resolution
    └── professionals (Supabase)

runMutation() / runQuery()
├── requireOperationalAuth()
├── validateSessionState()
├── build ServiceCtx
│   ├── client
│   ├── tenantId
│   ├── role
│   ├── userId
│   ├── actorProfileId
│   └── professionalId
└── service function
    └── assertCan(ctx.role, capability)

RLS policies
├── current_tenant_ids()
├── current_user_role()
├── current_professional_id()
├── is_operational_manager()
└── is_tenant_admin()
    └── profiles (Supabase)
```

### Extension Points

| Ponto de Extensão | Local | Propósito |
|-------------------|-------|-----------|
| Novo `UserRole` | `src/lib/database.types.ts` + `src/lib/auth/rbac.ts` | Adicionar enum e mapeamento |
| Nova `Capability` | `src/lib/auth/rbac.ts` | Adicionar capability ao tipo e às constantes |
| RLS functions | `supabase/migrations/*.sql` | Novos helpers de autorização no banco |
| RLS policies | `supabase/migrations/*.sql` | Políticas por tabela |
| Service checks | Arquivos de service | Novas chamadas `assertCan()` |
| Route guards | `src/lib/auth/route-guard.ts` | Estender `evaluateRouteGuard()` |
| Session validation | `src/lib/security/session-validation.ts` | Novas regras de sessão |
| Security audit | `src/lib/server/security-audit-writer.ts` | Novos tipos de evento |
| Feature flags | `src/lib/services/pilot-execution/feature-flag-service.ts` | Expandir sistema de flags |
| Policy engine | `src/lib/auth/policy-engine/` (futuro) | Motor de políticas |
| `AuthorizationRuntimePort` | `src/lib/enterprise/authorization-runtime/` | Integração Enterprise de autorização |

### Integration Readiness Matrix

| Runtime Enterprise | Integração Atual | Integração Futura | Alteração Necessária | Reutilização Prevista | Ponto Oficial de Integração | Necessidade de Novo Adapter | Necessidade de Novo Provider | Impacto Arquitetural |
|--------------------|------------------|-------------------|----------------------|----------------------|-----------------------------|----------------------------|-----------------------------|----------------------|
| `SecurityRuntimePort` | Nenhuma | Recebimento de eventos de acesso negado / suspeito | Média | Alta | `writeSecurityAudit()` → `SecurityRuntimePort` | Sim | Não | Médio |
| `IdentityRuntimePort` | Nenhuma | Resolução de claims / perfil em `requireOperationalAuth()` | Baixa | Alta | `requireOperationalAuth()` → `IdentityRuntimePort` | Sim | Não | Baixo |
| `AuthorizationRuntimePort` | Nenhuma | Substituição / complemento de `assertCan()` por motor de políticas | Alta | Alta | `assertCan()` → `AuthorizationRuntimePort` | Sim | Sim | Alto |
| `AuditRuntimePort` | Parcial (auditoria de segurança) | Auditoria de decisões de autorização | Média | Alta | `writeSecurityAudit()` → `AuditRuntimePort` | Sim | Não | Médio |
| `CompletedRuntimePort` | Nenhuma | Autorização de fechamento TISS futura | Baixa | Baixa | N/A | Sim | Não | Baixo |
| `QueueRuntimePort` | Parcial (backend operacional) | Enfileiramento de jobs de autorização | Baixa | Alta | Backend de fila existente | Não | Não | Baixo |
| `WorkerRuntimePort` | Parcial (processamento operacional) | Processamento de jobs de autorização | Baixa | Alta | Worker existente | Não | Não | Baixo |
| `SchedulerRuntimePort` | Parcial (agendamento operacional) | Agendamento de jobs de autorização | Baixa | Alta | Scheduler existente | Não | Não | Baixo |
| `ObservabilityRuntimePort` | Parcial (coletor existente) | Telemetria de decisões de autorização | Baixa | Alta | Coletor existente | Não | Não | Baixo |

### Gap Analysis

| Gap | Severidade | Esforço | Prioridade |
|-----|------------|---------|------------|
| Ausência de motor de políticas | Alta | Alto | P1 |
| Ausência de ABAC | Média | Alto | P2 |
| Ausência de autorização por recurso | Média | Alto | P2 |
| Ausência de papéis específicos por tenant | Baixa | Médio | P3 |
| Ausência de capability overrides por tenant | Baixa | Médio | P3 |
| Ausência de sistema geral de feature flags | Baixa | Baixo | P3 |
| Ausência de integração com `AuthorizationRuntimePort` | Baixa | Médio | P3 |
| Ausência de delegação de permissões | Baixa | Alto | P4 |
| Ausência de versionamento de políticas | Baixa | Médio | P4 |
| Ausência de audit trail de decisões de autorização | Baixa | Baixo | P4 |

## Estratégia Oficial para Ativações Futuras

### Fase 1 — Motor de Políticas (S3-02)

- Criar `PolicyEngine` canônico sem substituir `assertCan()` imediatamente.
- Definir interface `PolicyRequest` / `PolicyDecision`.
- Adicionar testes estruturais.

### Fase 2 — Integração com `AuthorizationRuntimePort` (S3-03)

- Conectar `assertCan()` ao `AuthorizationRuntimePort` via adapter.
- Criar `DefaultAuthorizationRuntimeAdapter` e `RealTissAuthorizationRuntimeAdapter`.
- Manter RBAC atual como fallback.

### Fase 3 — ABAC e Autorização por Recurso (S3-04)

- Estender `PolicyRequest` com atributos de recurso e contexto.
- Adicionar políticas por recurso no RLS.
- Adicionar capabilities por instância.

### Fase 4 — Enterprise Integration (S3-05)

- Integrar `SecurityRuntimePort` para eventos de acesso negado.
- Integrar `AuditRuntimePort` para audit trail de autorização.
- Integrar `ObservabilityRuntimePort` para métricas de autorização.

## Confirmações da Sprint

- Nenhum arquivo em `src/` foi modificado.
- Nenhum `Runtime`, `RuntimePort`, `Adapter`, `Factory`, `Registry`, `Pipeline`, `Queue`, `Worker`, `Scheduler` ou `Composition Root` foi criado.
- Nenhuma capability de autorização foi implementada.
- Apenas o documento `AUTHORIZATION_DISCOVERY.md` e as matrizes oficiais foram criados/atualizados.
- A **Enterprise Runtime Baseline v1.1** permanece congelada e preservada integralmente.
