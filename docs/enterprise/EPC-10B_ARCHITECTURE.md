# EPC-10B — Tenant Assignment Architecture

**Sprint:** EPC-10B — Tenant Assignment Objects  
**Data:** 31/07/2026  
**Natureza:** Arquitetura de Assignment Objects — **sem implementação** de ligações operacionais  
**Documento pai:** [`EPC-10B_TENANT_ASSIGNMENTS.md`](./EPC-10B_TENANT_ASSIGNMENTS.md)  
**Padrão:** ECS-01

---

## 1. Fluxo oficial (ECS-01)

```
Application
    ↓
TenantAssignmentPort
    ↓
TenantAssignmentAdapter   (Default | Mock | futuros)
    ↓
TenantAssignmentStore     (in-process nesta sprint)
    ↓
TenantAssignmentFactory
    ↓
TenantAssignmentProvider  (createTenantAssignmentPort)
```

### Árvore do componente

```
src/lib/enterprise/tenant-assignment/
├── index.ts
├── ports/
│   ├── tenant-assignment-port.ts
│   ├── types.ts
│   ├── assignment.ts
│   └── index.ts
├── adapters/
│   ├── default-tenant-assignment-adapter.ts
│   ├── mock-tenant-assignment-adapter.ts
│   └── index.ts
├── store/
│   ├── tenant-assignment-store.ts
│   ├── default-tenant-assignment-store.ts
│   └── index.ts
├── factory/
│   ├── tenant-assignment-factory.ts
│   └── index.ts
├── providers/
│   ├── create-tenant-assignment-port.ts
│   └── index.ts
└── demo/
    ├── tenant-assignment-health-query.ts
    └── index.ts
```

---

## 2. Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Família de adapter | Default + Store + Mock | Estado in-process; sem vendor nesta sprint |
| Persistência | Memória de processo | Sem banco / migrations |
| Cinco objetos | Discriminador `assignmentKind` | Tipagem canônica sem lógica |
| Alvos | `TargetReference` opaca | Desacoplamento total dos Engines |
| Tenant | `TenantReference` opaca | Sem carregar EPC-10A em runtime |
| Ciclo de vida | Status estruturais | Sem regras operacionais |
| Factory + Provider | Ambos | Factory instancia; Provider é API Application |
| Providers futuros | Erro explícito | Sem fallback silencioso (ECS-01) |
| Ligações operacionais | Não implementadas | Fora do objetivo da sprint |

---

## 3. Integração futura (FASE 9) — somente documentação

Nenhum dos módulos abaixo foi acoplado ou carregado nesta sprint.  
Os Assignment Objects apenas **representam** associações futuras via referências opacas.

### 3.1 Rule Packs

- Futuro: `TenantRulePackAssignment` associa `TenantId` ↔ PackId opaco.
- Assignment **nunca** avalia regras nem conhece conteúdo de Rule Packs.
- EPC-10B: modelo + store in-process; sem `loadPack` / `evaluate`.

### 3.2 Storage

- Futuro: `TenantStorageAssignment` associa Tenant ↔ container/scope opaco do Storage Port.
- Assignment **nunca** faz upload/download.
- EPC-10B: sem I/O de storage.

### 3.3 Configuration

- Futuro: `TenantConfigurationAssignment` associa Tenant ↔ artefato/escopo do Configuration Engine.
- Assignment **nunca** resolve hierarquia, feature flags ou valores.
- EPC-10B: apenas referência opaca.

### 3.4 AI Providers

- Futuro: `TenantAIProviderAssignment` associa Tenant ↔ providerId / quota opaca.
- Assignment **nunca** invoca modelos.
- EPC-10B: sem chamada a AI Provider Port.

### 3.5 Document Identity

- Futuro: `TenantDocumentAssignment` associa Tenant ↔ DocumentId / escopo documental opaco.
- Assignment **nunca** modela páginas, OCR ou conteúdo.
- EPC-10B: sem acoplamento ao Document Identity Engine.

### 3.6 Workflow

- Futuro: Workflow Engine pode referenciar `AssignmentId` e/ou `TenantId` como contexto opaco de processo.
- Estados de processo permanecem no Workflow Engine.
- EPC-10B: sem Assignment de Workflow dedicado e sem integração.

---

## 4. Fronteira de responsabilidade

| Camada | Responsabilidade |
|--------|------------------|
| EPC-10A Tenant | Identidade organizacional |
| EPC-10B Assignment | Associação canônica Tenant ↔ componente |
| Engines alvo (02–09) | Comportamento do próprio componente |
| Produto MedicFlow | Domínio clínico / TISS / contratos (fora do Assignment) |

```
Tenant (10A) ──assignment──► TargetReference (opaca)
                                  │
                                  ▼ (futuro, não nesta sprint)
                         RulePack | Storage | Config | AI | Document
```

---

## 5. Garantias de isolamento

1. Nenhuma rota / Server Function / UI importa o Port nesta sprint.
2. Nenhuma API pública muda.
3. Nenhum adapter carrega o componente alvo.
4. Nenhum teste de produto é redirecionado ao Assignment Port.
5. Providers futuros (`database` / `remote` / `registry`) falham explicitamente.
