# Enterprise Tenant Runtime Discovery — S4-01

| Campo      | Valor             |
| ---------- | ----------------- |
| Atualizado | Sprint S4-01      |

## 1. Arquivos alterados

Nenhum arquivo em `src/` foi alterado. Apenas documentação foi criada/atualizada.

- `docs/enterprise/TENANT_RUNTIME_DISCOVERY.md` (este documento)
- `docs/enterprise/OPER_INF_ROADMAP.md` (S4-01)
- `docs/enterprise/PRODUCTION_GAP_TRACKER.md` (S4-01)
- `docs/enterprise/REAL_PROVIDER_CERTIFICATION_MATRIX.md` (S4-01)

## 2. Evidência de ZERO alteração em src/

```
git diff -- src/      → nenhuma saída
git diff --stat      → docs/enterprise/* e somente novos arquivos markdown
git status           → modificações estritamente em docs/
```

## 3. Arquitetura Tenant encontrada

### 3.1 Enterprise Tenant Foundation (EPC-10A)

O repositório já possui um módulo canônico de tenant em `src/lib/enterprise/tenant/`, com Ports & Adapters:

| # | Arquivo | Papel |
|---|---------|-------|
| 1 | `src/lib/enterprise/tenant/ports/tenant-port.ts` | `TenantPort` com `health`, `capabilities`, `createTenant`, `getTenant`, `listTenants` |
| 2 | `src/lib/enterprise/tenant/ports/types.ts` | Tipos canônicos: `Tenant`, `TenantId`, `OrganizationType`, `TenantCapabilities`, etc. |
| 3 | `src/lib/enterprise/tenant/ports/organization.ts` | Gerador `createTenantUuid` e constantes `ORGANIZATION_TYPES` |
| 4 | `src/lib/enterprise/tenant/adapters/default-tenant-adapter.ts` | `DefaultTenantAdapter` (in-process) |
| 5 | `src/lib/enterprise/tenant/adapters/mock-tenant-adapter.ts` | `MockTenantAdapter` para testes |
| 6 | `src/lib/enterprise/tenant/adapters/index.ts` | Barreira de exportação dos adapters |
| 7 | `src/lib/enterprise/tenant/store/default-tenant-store.ts` | `DefaultTenantStore` em memória |
| 8 | `src/lib/enterprise/tenant/store/tenant-store.ts` | Interface `TenantStore` |
| 9 | `src/lib/enterprise/tenant/factory/tenant-factory.ts` | `TenantFactory` / `createTenantFactory` |
| 10 | `src/lib/enterprise/tenant/providers/create-tenant-port.ts` | `createTenantPort` |
| 11 | `src/lib/enterprise/tenant/index.ts` | Barreira de exportação do módulo |

### 3.2 Enterprise Tenant Assignment (EPC-10B)

Associações canônicas entre Tenant e outros componentes Enterprise:

- `src/lib/enterprise/tenant-assignment/ports/tenant-assignment-port.ts`
- `src/lib/enterprise/tenant-assignment/ports/types.ts`
- `src/lib/enterprise/tenant-assignment/adapters/default-tenant-assignment-adapter.ts`
- `src/lib/enterprise/tenant-assignment/adapters/mock-tenant-assignment-adapter.ts`
- `src/lib/enterprise/tenant-assignment/store/default-tenant-assignment-store.ts`
- `src/lib/enterprise/tenant-assignment/factory/tenant-assignment-factory.ts`
- `src/lib/enterprise/tenant-assignment/providers/create-tenant-assignment-port.ts`
- `src/lib/enterprise/tenant-assignment/index.ts`

Tipos de assignment: `RULE_PACK`, `STORAGE`, `CONFIGURATION`, `AI_PROVIDER`, `DOCUMENT`.

### 3.3 Resolução de Tenant Ativo

A resolução ativa segue o caminho:

```
usuário logado → Supabase Auth → profile.tenant_id → AuthContext.tenantId
                                              → OperationalAuthContext.tenantId
                                              → ServiceCtx.tenantId
```

Pontos de resolução:

- `src/lib/auth/get-auth-context.ts` — `AuthContext.tenantId = profile?.tenant_id ?? null`
- `src/lib/server/operational-auth.ts` — `requireOperationalAuth()` retorna `tenantId` do `profiles.tenant_id`
- `src/lib/services/operations/types.ts` — `ServiceCtx.tenantId: string`

### 3.4 Contextos de Tenant

| Contexto | Localização | Campos |
|----------|-------------|--------|
| `AuthContext` | `src/lib/auth/types.ts` | `tenantId: string \| null` |
| `OperationalAuthContext` | `src/lib/server/operational-auth.ts` | `tenantId: string` |
| `ServiceCtx` | `src/lib/services/operations/types.ts` | `tenantId: string` |
| `TenantBrandingContext` | `src/components/tenant-branding-provider.tsx` | `settings: TenantSettingsRow \| null` |

### 3.5 Isolamento de Tenant

- Coluna padrão `tenant_id` em todas as tabelas de negócio (`src/lib/domain/multi-tenant.ts` — `TENANT_ID_COLUMN`).
- Postgres RLS com `public.current_tenant_ids()` e `public.is_tenant_admin()`.
- `tenant_id` resolvido a partir do `profile` do usuário autenticado.
- Não há schema/database por tenant; isolamento é lógico via RLS + `tenant_id`.

### 3.6 Configuração, Branding e Settings

- `src/lib/services/tenant-settings/tenant-settings-service.ts` — leitura/escrita de `tenant_settings` (cores, logo, timezone, moeda, e-mail etc.)
- `src/lib/services/tenant-branding/tenant-branding-service.ts` — aplicação de CSS variables e favicon via `applyTenantBrandingToDocument`
- `src/components/tenant-branding-provider.tsx` — provider React que carrega settings e aplica branding
- Tabela `tenant_settings` vinculada a `tenant_id`.

### 3.7 Migrations de Banco

- `supabase/migrations/20250512000000_init_enterprise.sql` — tabelas `tenants`, `profiles`, RLS base
- `supabase/migrations/20250512000002_operational_rbac_state.sql` — helpers `current_tenant_ids()`, `is_tenant_admin()`
- `supabase/migrations/20250514120000_tenant_settings_branding_readiness.sql` — tabela `tenant_settings`, storage bucket

## 4. Componentes reutilizáveis

- `TenantPort` + `DefaultTenantAdapter` + `DefaultTenantStore` — scaffolding EPC-10A.
- `TenantAssignmentPort` + `DefaultTenantAssignmentAdapter` — scaffolding EPC-10B.
- `tenant-settings-service.ts` — CRUD de settings (reutilizável para futura `TenantRuntime` config).
- `tenant-branding-service.ts` — aplicação de branding (reutilizável para futura tenant UI).
- `requireOperationalAuth()` — provider de `ServiceCtx` com `tenantId`.
- `TENANT_ID_COLUMN` — convenção centralizada de coluna.

## 5. RuntimePorts relacionados

| Capability | Port | Factory / Adapter | `real-tiss` certificado? |
|------------|------|-------------------|--------------------------|
| Security | `SecurityRuntimePort` | `SecurityRuntimeFactory` / `RealTissSecurityRuntimeAdapter` | ✅ S1-03 |
| Identity | `IdentityRuntimePort` | `IdentityRuntimeFactory` / `RealTissIdentityRuntimeAdapter` | ✅ S2-03 |
| Authorization | `AuthorizationRuntimePort` | `AuthorizationRuntimeFactory` / `RealTissAuthorizationRuntimeAdapter` | ✅ S3-03 |
| Queue | `QueueRuntimePort` | `QueueRuntimeFactory` | ✅ |
| Worker | `WorkerRuntimePort` | `WorkerRuntimeFactory` | ✅ |
| Scheduler | `SchedulerRuntimePort` | `SchedulerRuntimeFactory` | ✅ |
| Observability | `ObservabilityRuntimePort` | `ObservabilityRuntimeFactory` | ✅ |
| Tenant (EPC-10A) | `TenantPort` | `TenantFactory` / `DefaultTenantAdapter` | ❌ — não possui provider real |
| Tenant Assignment (EPC-10B) | `TenantAssignmentPort` | `TenantAssignmentFactory` / `DefaultTenantAssignmentAdapter` | ❌ — não possui provider real |

`EnterpriseRuntime.getEnterpriseRuntime()` **não expõe** `getTenantPort()` nem `getTenantAssignmentPort()`.

## 6. Extension Points

- `TenantPort` pode ser expandido para 9 métodos canônicos (mirror `IdentityRuntimePort` / `AuthorizationRuntimePort`).
- `TenantAssignmentPort` pode associar tenant a `RulePack`, `Storage`, `Configuration`, `AIProvider`, `Document`.
- `tenant-settings-service` pode migrar para `TenantRuntimeStore` in-memory + adapter estrutural.
- `tenant-branding-service` pode ser normalizado como `TenantRuntimeBrandingCapability`.
- `getAuthContext().tenantId` e `ServiceCtx.tenantId` podem ser consumidos por um futuro `TenantRuntimePort` sem alterar Auth/RBAC.

## 7. Dependency Matrix

| Componente | Depende de | Observação |
|------------|------------|------------|
| `TenantPort` / `TenantAssignmentPort` | `src/lib/enterprise/tenant/*` | Nenhuma dependência de autenticação, RBAC, Supabase, HTTP |
| `getAuthContext` | `@supabase/ssr`, `profiles` | resolve `tenantId` |
| `requireOperationalAuth` | `supabase`, `profiles`, `professionals` | resolve `tenantId`, `professionalId` |
| `tenant-settings-service` | `ServiceCtx`, `tenant_settings` (Supabase) | usa `assertCan` para RBAC |
| `tenant-branding-service` | `TenantSettingsRow` | aplica CSS no cliente |
| Isolamento de dados | Postgres RLS + `tenant_id` | funcional e ativo |

## 8. Tenant Capability Matrix

| Capability | Status | Onde está | Gap |
|------------|--------|-----------|-----|
| Resolução de tenant | ✅ Funcional | `getAuthContext`, `requireOperationalAuth` | — |
| Tenant context | ✅ Funcional | `AuthContext`, `ServiceCtx`, `OperationalAuthContext` | — |
| Tenant isolation | ✅ Funcional | RLS + `tenant_id` em tabelas | — |
| Tenant lifecycle | ⚠️ Parcial | `TenantPort.createTenant` (estrutural) | Sem ativação real, sem `real-tiss` |
| Tenant provisioning | ❌ Ausente | — | Não implementado |
| Tenant onboarding | ⚠️ Parcial | `src/routes/piloto.tsx`, `tenant-validation.ts` | Não normalizado como Runtime |
| Tenant branding | ✅ Funcional | `tenant-branding-service.ts` + provider | — |
| Tenant configuration | ✅ Funcional | `tenant_settings` + `tenant-settings-service.ts` | — |
| Tenant routing | ❌ Ausente | — | Não há route guards/middleware por tenant |
| Tenant settings | ✅ Funcional | `tenant-settings-service.ts` | — |
| Tenant metadata | ⚠️ Parcial | `Tenant` types, `tenant_settings` | Não centralizado em Tenant Runtime |
| Tenant cache | ❌ Ausente | — | Não implementado |
| Tenant middleware | ❌ Ausente | — | Não implementado |
| Tenant services | ✅ Funcional | `tenant-settings`, `tenant-branding` | Poderiam ser ports canônicos |
| Tenant persistence | ⚠️ Parcial | `DefaultTenantStore` in-memory | Store real via Supabase `tenants` table |
| Tenant policies | ⚠️ Parcial | `tenant_id` + RLS + RBAC `tenant_settings` | Não normalizado como `TenantPolicy` |
| Tenant validation | ⚠️ Parcial | `tenant-validation.ts` (onboarding) | Não exposto como Port |
| Tenant ownership | ⚠️ Parcial | `tenants` + `profiles.tenant_id` | — |
| Tenant hierarchy | ❌ Ausente | — | Não implementado |
| Tenant dependencies | ⚠️ Parcial | `tenant-assignment` (EPC-10B) | Não certificado para produção |

## 9. Tenant Gap Analysis

| # | Gap | Risco | Oportunidade |
|---|-----|-------|--------------|
| 1 | `TenantPort` possui apenas 5 métodos; sem `real-tiss` adapter | Não certificado para produção | Criar `TenantRuntimePort` canônico com 9 métodos na S4-02 |
| 2 | `TenantFactory` sem registry de providers múltiplos | Pouca flexibilidade | Adicionar `TenantRuntimeRegistry` na ativação |
| 3 | `TenantAssignmentPort` não vinculado a `EnterpriseRuntime` | Desacoplado demais da orquestração | Futuro `getEnterpriseRuntime().getTenantRuntimePort()` |
| 4 | Tenant routing / middleware ausente | UX/Segurança | Implementar route guards / host-based routing em sprints futuras |
| 5 | Tenant cache ausente | Performance | Introduzir `TenantCache` sem quebrar RLS |
| 6 | Tenant hierarchy / ownership ausente | Limitação multi-cliente | Planejar como ativação futura |
| 7 | Nenhum provider `real-tiss` para tenant | Falta certificação TISS/operadora | Criar `RealTissTenantRuntimeAdapter` na S4-03 |

## 10. Estratégia oficial para futuras ativações

1. **S4-02 — Tenant Runtime Activation:** reestruturar `src/lib/enterprise/tenant/` para seguir o padrão `security/identity/authorization-runtime`, com `TenantRuntimePort` de 9 métodos canônicos (`openJob`, `closeJob`, `submitRequest`, `registerFinding`, `getResult`, `stats`, `health`, `capabilities`, `providerInfo`), `TenantRuntimeFactory`, `TenantRuntimeRegistry`, `InMemoryTenantRuntimeStore` e adapters `mock`, `test`, `default`, `enterprise`, `real-tiss`.
2. **S4-03 — Tenant Runtime Production Certification:** certificar `RealTissTenantRuntimeAdapter` sem implementar provisão/branding real, apenas scaffolding.
3. **S4+ — Capabilities operacionais:** migrar `tenant-settings-service` e `tenant-branding-service` para capability ports futuros, sem modificar Auth/RBAC/RLS.
4. **Regras congeladas:** não alterar `EnterpriseRuntime`, `QueueRuntime`, `WorkerRuntime`, `SchedulerRuntime`, `SecurityRuntime`, `IdentityRuntime`, `AuthorizationRuntime`, `AuditRuntime`, `CompletedRuntime`.

## 11. Build

```
npm run build  → ✅ concluído
```

## 12. TypeScript

```
npx tsc --noEmit  → ✅ concluído (0 erros)
```

## 13. ESLint

```
npm run lint  → ✅ 0 erros (apenas warnings pré-existentes fora do escopo)
```

## 14. Smoke

```
npm run smoke-check  → ✅ concluído
```

## 15. Working Tree

Apenas arquivos de documentação (`docs/enterprise/*.md`) foram adicionados/modificados. Nenhum arquivo de `src/` foi tocado.

## 16. Ahead

`0`

## 17. Behind

`0`

## 18. Commit

A ser realizado ao final da Sprint com o hash documentado abaixo.

## 19. Confirmação explícita de que nenhuma capability foi implementada

- Nenhum Runtime, Port, Adapter, Factory, Registry, Store, Pipeline, Composition Root ou teste foi criado.
- Nenhuma lógica de resolução, contexto, isolamento, branding, settings, routing ou cache foi adicionada ou alterada.
- A Discovery foi exclusivamente documental e baseada em arquivos existentes.

## 20. Confirmação explícita de preservação integral da Enterprise Runtime Baseline v1.1

- Nenhum arquivo em `src/` foi modificado.
- `EnterpriseRuntime`, `QueueRuntime`, `WorkerRuntime`, `SchedulerRuntime`, `ObservabilityRuntime`, `SecurityRuntime`, `IdentityRuntime`, `AuthorizationRuntime`, `AuditRuntime`, `CompletedRuntime` permanecem inalterados.
- As regras permanentes de congelamento (`A8-FREEZE-01`) e o `Roadmap vigente` continuam válidos sem novas exceções.
