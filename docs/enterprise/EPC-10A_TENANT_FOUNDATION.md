# EPC-10A — Tenant Foundation

**Sprint:** EPC-10A — Tenant Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..09) + ECS-01  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — camada organizacional (fundação)  
**Próxima sprint relacionada:** EPC-10B — Tenant Assignments

---

## 1. Objetivo

Construir o modelo Enterprise de **identidade organizacional canônica (Tenant)**, reutilizável por qualquer produto da IAeasy.

```
Application
    ↓
TenantPort
    ↓
TenantAdapter
    ↓
TenantStore
    ↓
TenantFactory
    ↓
TenantProvider
```

Esta sprint **não** implementa autenticação, usuários, RBAC, permissões, Rule Packs, contratos, operadoras, banco ou UI.

---

## 2. Princípio arquitetural

**Tenant representa uma ORGANIZAÇÃO.**

Ele **não** representa, por si só:

| Conceito | Nesta sprint |
|----------|--------------|
| Cooperativa | ❌ apenas valor de `OrganizationType` |
| Operadora | ❌ apenas valor de `OrganizationType` |
| Hospital | ❌ apenas valor de `OrganizationType` |
| Clínica | ❌ apenas valor de `OrganizationType` |
| Usuário / login | ❌ fora de escopo |
| RBAC / permissões | ❌ fora de escopo |
| Contratos | ❌ fora de escopo |
| Rule Packs / Storage / AI / Workflow | ❌ associações → EPC-10B |

O Tenant deve ser **completamente genérico**.

---

## 3. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `TenantPort` | `src/lib/enterprise/tenant/ports/tenant-port.ts` |
| Modelo canônico + OrganizationType | `src/lib/enterprise/tenant/ports/types.ts` |
| Helpers OrganizationType / UUID | `ports/organization.ts` |
| `DefaultTenantAdapter` | `adapters/default-tenant-adapter.ts` |
| `MockTenantAdapter` | `adapters/mock-tenant-adapter.ts` |
| `TenantStore` + Default | `store/` |
| `TenantFactory` | `factory/tenant-factory.ts` |
| `createTenantPort` | `providers/create-tenant-port.ts` |
| PoC Application | `demo/tenant-health-query.ts` |
| Testes | `scripts/enterprise/tests/tenant-engine.test.ts` |
| Script npm | `npm run enterprise:tenant:test` |

Documentação satélite:

| Documento | Função |
|-----------|--------|
| [`EPC-10A_TENANT_MODEL.md`](./EPC-10A_TENANT_MODEL.md) | Modelo canônico, OrganizationType |
| [`EPC-10A_ARCHITECTURE.md`](./EPC-10A_ARCHITECTURE.md) | Arquitetura, integrações futuras |
| [`EPC-10A_CERTIFICATION.md`](./EPC-10A_CERTIFICATION.md) | Certificação da sprint |

---

## 4. Superfície do Port

```ts
interface TenantPort {
  readonly providerId: TenantProviderId;
  createTenant(input: CreateTenantInput): Promise<CreateTenantResult>;
  getTenant(input: GetTenantInput): Promise<GetTenantResult>;
  listTenants(input?: ListTenantsInput): Promise<ListTenantsResult>;
  health(): Promise<TenantHealth>;
  capabilities(): TenantCapabilities;
}
```

### Providers

| Id | Adapter | Status EPC-10A |
|----|---------|----------------|
| `default` | `DefaultTenantAdapter` | ✅ in-process |
| `mock` / `test` | `MockTenantAdapter` | ✅ testes / offline |
| `database` / `remote` / `registry` | — | ❌ erro explícito (prep) |

---

## 5. O que o componente **jamais** conhece

- Usuários / login / autenticação / sessões
- RBAC / papéis / permissões
- Contratos / operadoras / cooperativas como entidades de negócio
- Rule Packs / Rules / AI Providers / Storage / Document Identity / Workflow (associações)
- TISS / pacientes / profissionais / domínio clínico
- Banco / migrations / UI / APIs

Seu único objetivo é **representar a identidade organizacional** de forma canônica.

---

## 6. Integração futura (somente documentação)

Tenant poderá futuramente **referenciar** (não implementar nesta sprint):

- Rule Packs
- Storage
- AI Providers
- Document Identity
- Workflow
- Configuration

Associações operacionais pertencem **exclusivamente** à EPC-10B.  
Ver [`EPC-10A_ARCHITECTURE.md`](./EPC-10A_ARCHITECTURE.md).

---

## 7. Como usar (fundação)

```ts
import { createTenantPort, getTenantHealthSummary } from "@/lib/enterprise/tenant";

const port = createTenantPort({ provider: "mock" });
const summary = await getTenantHealthSummary(port);

const created = await port.createTenant({
  tenant: {
    organizationName: "Acme Health",
    organizationType: "COMPANY",
    displayName: "Acme",
    code: "ACME",
  },
});
```

**Nenhuma rota, Server Function ou tela do MedicFlow consome este Port nesta sprint.**

---

## 8. Critério de compatibilidade

| Superfície | Alterada? |
|------------|-----------|
| Funcionalidade MedicFlow | Não |
| UI / telas | Não |
| APIs / Server Functions | Não |
| Migrations / banco | Não |
| Auth / usuários / RBAC | Não |

**EPC-10A adiciona apenas infraestrutura isolada sob `src/lib/enterprise/tenant/`.**
