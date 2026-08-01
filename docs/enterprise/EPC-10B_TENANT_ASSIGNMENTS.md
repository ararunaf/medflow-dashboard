# EPC-10B — Tenant Assignment Objects

**Sprint:** EPC-10B — Tenant Assignment Objects  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..10A) + ECS-01  
**Continuidade:** Continua EPC-10A (Tenant Foundation)  
**Padrão:** ECS-01

---

## 1. Objetivo

Construir a camada de **Assignment Objects** do Enterprise Platform — associações canônicas entre um Tenant e outros componentes Enterprise.

```
Application
    ↓
TenantAssignmentPort
    ↓
TenantAssignmentAdapter
    ↓
TenantAssignmentStore
    ↓
TenantAssignmentFactory
    ↓
TenantAssignmentProvider
```

Esta sprint **não** implementa autenticação, usuários, RBAC, permissões, banco, migrations, UI, APIs, ligações operacionais nem consultas entre componentes.

---

## 2. Princípio arquitetural

**Um Assignment representa um relacionamento entre um Tenant e outro componente Enterprise.**

Ele **não** representa:

| Conceito | Nesta sprint |
|----------|--------------|
| Configuração | ❌ |
| Regra | ❌ |
| Vínculo operacional | ❌ |
| Usuário / login | ❌ fora de escopo |
| RBAC / permissões | ❌ fora de escopo |
| Contratos / operadoras | ❌ fora de escopo |
| Conhecimento clínico / TISS | ❌ proibido |

O Assignment deve ser **totalmente desacoplado** dos componentes de destino (apenas `TargetReference` opaca).

---

## 3. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `TenantAssignmentPort` | `src/lib/enterprise/tenant-assignment/ports/tenant-assignment-port.ts` |
| Modelos canônicos (5) + kinds/status | `ports/types.ts` |
| Helpers AssignmentKind / UUID | `ports/assignment.ts` |
| `DefaultTenantAssignmentAdapter` | `adapters/default-tenant-assignment-adapter.ts` |
| `MockTenantAssignmentAdapter` | `adapters/mock-tenant-assignment-adapter.ts` |
| `TenantAssignmentStore` + Default | `store/` |
| `TenantAssignmentFactory` | `factory/tenant-assignment-factory.ts` |
| `createTenantAssignmentPort` | `providers/create-tenant-assignment-port.ts` |
| PoC Application | `demo/tenant-assignment-health-query.ts` |
| Testes | `scripts/enterprise/tests/tenant-assignment-engine.test.ts` |
| Script npm | `npm run enterprise:tenant-assignment:test` |

Documentação satélite:

| Documento | Função |
|-----------|--------|
| [`EPC-10B_ASSIGNMENT_MODEL.md`](./EPC-10B_ASSIGNMENT_MODEL.md) | Modelos canônicos, campos, ciclo de vida |
| [`EPC-10B_ARCHITECTURE.md`](./EPC-10B_ARCHITECTURE.md) | Arquitetura, integrações futuras |
| [`EPC-10B_CERTIFICATION.md`](./EPC-10B_CERTIFICATION.md) | Certificação da sprint |

---

## 4. Cinco Assignment Objects canônicos

| Objeto | `assignmentKind` | Alvo conceitual (apenas referência) |
|--------|------------------|-------------------------------------|
| `TenantRulePackAssignment` | `RULE_PACK` | Rule Pack Engine (EPC-09) |
| `TenantStorageAssignment` | `STORAGE` | Storage Port (EPC-02) |
| `TenantConfigurationAssignment` | `CONFIGURATION` | Configuration Engine (EPC-03) |
| `TenantAIProviderAssignment` | `AI_PROVIDER` | AI Provider Port (EPC-07) |
| `TenantDocumentAssignment` | `DOCUMENT` | Document Identity (EPC-08) |

Nenhum desses objetos carrega, valida ou invoca o componente alvo.

---

## 5. Operações mínimas do Port

| Operação | Papel |
|----------|-------|
| `createAssignment()` | Cria / atualiza association canônica in-process |
| `getAssignment()` | Obtém por `AssignmentId` |
| `listAssignments()` | Lista com filtros estruturais opcionais |
| `health()` | Prontidão do adapter/store |
| `capabilities()` | Capacidades estáticas do adapter |

---

## 6. O que NÃO foi feito

- Banco / migrations
- UI / APIs / rotas
- Autenticação / usuários / RBAC
- Ligações operacionais entre componentes
- Carregamento de Rule Packs, AI Providers, Storage, Configuration, Documents
- Validações de negócio
- Alteração de comportamento do MedicFlow

---

## 7. Fronteira com EPC-10A

| Responsabilidade | EPC-10A | EPC-10B |
|------------------|---------|---------|
| Identidade organizacional (Tenant) | ✅ | — |
| OrganizationType | ✅ | — |
| Assignment Objects | — | ✅ |
| Referências opacas Tenant ↔ Engines | prep documental | ✅ modelos canônicos |
| Auth / usuários / RBAC | ❌ | ❌ |
| Ligações operacionais | ❌ | ❌ |

---

## 8. Como validar

```bash
npm run enterprise:tenant-assignment:test
```

Gates adicionais (sprint): Build, TypeScript, ESLint, Smoke — ver [`EPC-10B_CERTIFICATION.md`](./EPC-10B_CERTIFICATION.md).
