# EPC-10A — Tenant Architecture

**Sprint:** EPC-10A — Tenant Foundation  
**Data:** 31/07/2026  
**Natureza:** Arquitetura de fundação — **sem implementação** de auth, usuários, RBAC ou assignments  
**Documento pai:** [`EPC-10A_TENANT_FOUNDATION.md`](./EPC-10A_TENANT_FOUNDATION.md)  
**Padrão:** ECS-01

---

## 1. Fluxo oficial (ECS-01)

```
Application
    ↓
TenantPort
    ↓
TenantAdapter   (Default | Mock | futuros)
    ↓
TenantStore     (in-process nesta sprint)
    ↓
TenantFactory
    ↓
TenantProvider  (createTenantPort)
```

### Árvore do componente

```
src/lib/enterprise/tenant/
├── index.ts
├── ports/
│   ├── tenant-port.ts
│   ├── types.ts
│   ├── organization.ts
│   └── index.ts
├── adapters/
│   ├── default-tenant-adapter.ts
│   ├── mock-tenant-adapter.ts
│   └── index.ts
├── store/
│   ├── tenant-store.ts
│   ├── default-tenant-store.ts
│   └── index.ts
├── factory/
│   ├── tenant-factory.ts
│   └── index.ts
├── providers/
│   ├── create-tenant-port.ts
│   └── index.ts
└── demo/
    ├── tenant-health-query.ts
    └── index.ts
```

---

## 2. Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Família de adapter | Default + Store + Mock | Estado in-process; sem vendor nesta sprint |
| Persistência | Memória de processo | Sem banco / migrations |
| OrganizationType | Enumeração canônica | Tipos possíveis sem lógica de domínio |
| Referências | Opacas (`metadataReference`, `configurationReference`) | Prep sem acoplamento a Engines |
| Associações operacionais | Fora do escopo | Pertencem à EPC-10B |
| Factory + Provider | Ambos | Factory instancia; Provider é API Application |
| Providers futuros | Erro explícito | Sem fallback silencioso (ECS-01) |
| Auth / usuários / RBAC | Não implementados | Fora do objetivo da sprint |

---

## 3. Integração futura (FASE 8) — somente documentação

Nenhum dos módulos abaixo foi implementado ou acoplado nesta sprint.  
O Tenant poderá futuramente **referenciar** esses componentes; a materialização das associações é **EPC-10B**.

### 3.1 Rule Packs

- Futuro: Tenant referencia PackIds / assignments opacos.
- Tenant **nunca** avalia regras nem conhece conteúdo de Rule Packs.
- EPC-10A: apenas preparação documental.

### 3.2 Storage

- Futuro: Tenant referencia Storage Port (containers / scopes opacos).
- Tenant **nunca** faz upload/download.
- EPC-10A: sem `storageReference` operacional (associação → EPC-10B).

### 3.3 AI Providers

- Futuro: Tenant referencia providerIds / quotas opacas.
- Tenant **nunca** invoca modelos.
- EPC-10A: apenas preparação documental.

### 3.4 Document Identity

- Futuro: Tenant correlaciona DocumentIds como payload opaco.
- Tenant **nunca** modela páginas, OCR ou conteúdo documental.
- EPC-10A: sem acoplamento.

### 3.5 Workflow

- Futuro: Workflow referencia `TenantId` como contexto opaco.
- Estados de processo ficam no Workflow Engine.
- EPC-10A: sem acoplamento.

### 3.6 Configuration

- `configurationReference` aponta (opcionalmente) para artefato do Configuration Engine.
- Resolução / hierarquia / feature flags **não** são executadas pelo Tenant Port.
- Assignments de configuração por Tenant → EPC-10B.

---

## 4. Fronteira com EPC-10B (Tenant Assignments)

| Responsabilidade | EPC-10A | EPC-10B |
|------------------|---------|---------|
| Identidade organizacional | ✅ | — |
| OrganizationType | ✅ | — |
| Referências opacas Metadata/Configuration | ✅ (campos) | resolução / binding |
| Associações Rule Packs | ❌ | ✅ |
| Associações Storage | ❌ | ✅ |
| Associações AI Providers | ❌ | ✅ |
| Associações Document Identity | ❌ | ✅ |
| Associações Workflow | ❌ | ✅ |
| Associações Configuration | ❌ | ✅ |
| Usuários / RBAC | ❌ | ❌ (sprints dedicadas) |

---

## 5. Isolamento de produto

```
MedicFlow UI / APIs / Auth  ──✗──  (sem ligação nesta sprint)
                              │
Enterprise Tenant (EPC-10A) ──┘  isolado em src/lib/enterprise/tenant/
```

O PoC Application (`getTenantHealthSummary`) existe apenas para provar a inversão de dependência.  
Nenhuma rota ou Server Function do MedicFlow importa o Tenant Port nesta sprint.

---

## 6. Compatibilidade

- Zero impacto em funcionalidade, tela, API, migration ou comportamento do MedicFlow.
- Reutilizável em qualquer plataforma IAeasy que precise de identidade organizacional genérica.
