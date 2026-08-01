# ECS-01 — Naming Conventions

**Sprint:** ECS-01 — Enterprise Component Specification  
**Data:** 31/07/2026  
**Natureza:** Padrão oficial de nomenclatura — **sem alteração de código**  
**Documento pai:** [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)

---

## 1. Objetivo

Congelar a nomenclatura oficial de todos os componentes Enterprise.  
Nenhum novo Engine poderá fugir deste padrão.

---

## 2. Token `{Xxx}` / `{component}`

| Forma | Uso | Exemplo (Workflow) |
|-------|-----|--------------------|
| `{Xxx}` | PascalCase do componente | `Workflow` |
| `{xxx}` | camelCase | `workflow` |
| `{component}` | kebab-case em arquivos/pastas | `workflow` |
| `{COMPONENT}` | SCREAMING_SNAKE em docs/constantes de sprint | `WORKFLOW` |

Nomes de componente são **substantivos no singular** em inglês: `Persistence`, `Storage`, `Configuration`, `Metadata`, `Workflow`, `Rule`, `Tenant`, `Notification`, `Search`, `Ai` (ou `AiProvider` quando composto).

---

## 3. Símbolos obrigatórios

### 3.1 Port e tipos de contrato

| Papel | Padrão | Exemplo |
|-------|--------|---------|
| Port interface | `{Xxx}Port` | `WorkflowPort` |
| Health | `{Xxx}Health` | `WorkflowHealth` |
| Capabilities | `{Xxx}Capabilities` | `WorkflowCapabilities` |
| Provider id union | `{Xxx}ProviderId` | `WorkflowProviderId` |
| Provider options | `{Xxx}ProviderOptions` | `WorkflowProviderOptions` |
| Health summary (demo) | `{Xxx}HealthSummary` | `WorkflowHealthSummary` |

### 3.2 Adapters

| Papel | Padrão | Exemplo |
|-------|--------|---------|
| Mock | `Mock{Xxx}Adapter` | `MockWorkflowAdapter` |
| Default (in-process) | `Default{Xxx}Adapter` | `DefaultWorkflowAdapter` |
| Vendor | `{Vendor}{Xxx}Adapter` | `SupabasePersistenceAdapter` |
| Adapter id constant (default) | `DEFAULT_{XXX}_ADAPTER_ID` | `DEFAULT_WORKFLOW_ADAPTER_ID` |
| Adapter id constant (vendor) | `{VENDOR}_{XXX}_ADAPTER_ID` | `SUPABASE_PERSISTENCE_ADAPTER_ID` |
| Mock options | `Mock{Xxx}AdapterOptions` | `MockWorkflowAdapterOptions` |
| Runtime inject type (default) | `Default{Xxx}Runtime` | `DefaultWorkflowRuntime` |
| Runtime inject type (vendor) | `{Vendor}{Xxx}Runtime` | `SupabaseStorageRuntime` |

### 3.3 Store

| Papel | Padrão | Exemplo |
|-------|--------|---------|
| Store interface | `{Xxx}Store` | `WorkflowStore` |
| Default store | `Default{Xxx}Store` | `DefaultWorkflowStore` |
| Store id constant | `DEFAULT_{XXX}_STORE_ID` | `DEFAULT_WORKFLOW_STORE_ID` |
| Stored entity types | `Stored{Concept}` | `StoredWorkflowDefinition` |

### 3.4 Factory / Provider / Demo

| Papel | Padrão | Exemplo |
|-------|--------|---------|
| Factory function | `create{Xxx}Port` | `createWorkflowPort` |
| Demo health query | `get{Xxx}HealthSummary` | `getWorkflowHealthSummary` |

### 3.5 Campo de identidade no Port (canônico)

| Papel | Padrão canônico | Exemplo |
|-------|-----------------|---------|
| Campo no Port | `readonly providerId: {Xxx}ProviderId` | `providerId: WorkflowProviderId` |
| Opção da factory | `provider?: {Xxx}ProviderId` | `options.provider` |
| Campo em Health | `provider: {Xxx}ProviderId` (ou equivalente documentado) | — |

**Exceção legada (não replicar):** Persistence usa `mechanismId` / `options.mechanism` / `PersistenceMechanismId`. Novos Engines **não** devem introduzir `mechanism`; devem usar `provider`.

---

## 4. Arquivos e pastas

### 4.1 Pastas

```
src/lib/enterprise/{component}/
scripts/enterprise/tests/
docs/enterprise/
```

### 4.2 Arquivos de código (kebab-case)

| Artefato | Arquivo |
|----------|---------|
| Port | `ports/{component}-port.ts` |
| Types | `ports/types.ts` |
| Módulo auxiliar do Port | `ports/{concern}.ts` (ex.: `hierarchy.ts`, `conditions.ts`) |
| Mock adapter | `adapters/mock-{component}-adapter.ts` |
| Default adapter | `adapters/default-{component}-adapter.ts` |
| Vendor adapter | `adapters/{vendor}-{component}-adapter.ts` |
| Store interface | `store/{component}-store.ts` |
| Default store | `store/default-{component}-store.ts` |
| Runtime | `runtime/{component}-runtime.ts` |
| Factory | `providers/create-{component}-port.ts` |
| Demo | `demo/{component}-health-query.ts` |
| Barrels | `index.ts` em cada pasta pública |

### 4.3 Testes

| Artefato | Nome canônico |
|----------|---------------|
| Suite | `scripts/enterprise/tests/{component}-engine.test.ts` |
| npm script | `enterprise:{component}:test` |
| `describe` | `"EPC-XX {Xxx}Port contract"` |

**Exceção legada (não replicar):** `persistence-ports.test.ts`, `storage-ports.test.ts`.

### 4.4 Documentação de sprint do Engine

| Artefato | Nome canônico |
|----------|---------------|
| Engine | `EPC-XX_{COMPONENT}_ENGINE.md` |
| Architecture | `EPC-XX_{COMPONENT}_ARCHITECTURE.md` |
| Migration | `EPC-XX_{COMPONENT}_MIGRATION_PLAN.md` |
| Certification | `EPC-XX_{COMPONENT}_CERTIFICATION.md` |

Opcional (quando houver ADRs relevantes):

| Artefato | Nome |
|----------|------|
| Architecture Decisions | `EPC-XX_{COMPONENT}_ARCHITECTURE_DECISIONS.md` |

**Exceção legada (não replicar):** `EPC-01_PERSISTENCE_PORTS.md`, `EPC-02_STORAGE_PORTS.md`, docs sem prefixo de domínio (`EPC-01_CERTIFICATION.md`).

---

## 5. Provider ids

### 5.1 Convenções

- Ids são **string literals** em kebab-case ou token simples: `"default"`, `"mock"`, `"test"`, `"supabase"`, `"database"`, `"remote"`.
- Sempre incluir `"mock"` e `"test"` no union type.
- Ids reservados para o futuro devem constar no union **mesmo antes da implementação**.
- Factory: ids não implementados → `throw new Error(...)` explícito.

### 5.2 Defaults oficiais por família

| Família | Default típico da factory |
|---------|---------------------------|
| In-process Default | `"default"` |
| Vendor-backed | id do vendor principal documentado (ex.: `"supabase"`) |

O default **deve** ser declarado no ENGINE.md e na ARCHITECTURE.md do componente.

### 5.3 Adapter ids (string)

| Família | Valor típico |
|---------|--------------|
| Default in-process | `"default-in-process"` |
| Vendor | `"{vendor}-default"` (ex.: `"supabase-default"`) |
| Mock | `` `${providerId}-in-memory` `` |

---

## 6. Constantes de domínio do mecanismo

Constantes estruturais do mecanismo (não clínicas) usam:

```
{COMPONENT}_{CONCEPT}
```

Exemplos válidos:

- `CONFIGURATION_HIERARCHY`
- `METADATA_CONSTRAINT_KINDS`
- `WORKFLOW_STATUSES`
- `WORKFLOW_CONDITION_KINDS`

Proibido: constantes com nomes clínicos (`PATIENT_*`, `GUIDE_*`, `TISS_*`, etc.) dentro do Core.

---

## 7. Exports públicos

O root `src/lib/enterprise/{component}/index.ts` deve reexportar, no mínimo:

- `{Xxx}Port` e tipos de contrato relevantes
- `create{Xxx}Port`
- Adapters públicos necessários à composição
- Store (se existir e for parte do contrato de injeção)
- Demo `get{Xxx}HealthSummary` (fundação)

`runtime/` puro **pode** permanecer interno (não exportado no root) salvo decisão documentada no ARCHITECTURE.md.

---

## 8. O que é proibido

1. Sinônimos paralelos (`Service` / `Manager` / `Client` no lugar de `Port` / `Adapter`).
2. Novo campo de identidade diferente de `providerId` em Engines novos.
3. Pasta `factory/` ou `types/` na raiz do componente.
4. Nomes de arquivo em PascalCase ou camelCase.
5. Misturar português em identificadores de código.
6. Prefixar símbolos com `Enterprise` (`EnterpriseWorkflowPort` — **não**).
7. Expor tipos de vendor no nome do Port (`SupabasePort` — **não**; o Port é `PersistencePort`).

---

## 9. Tabela de conformidade dos Engines existentes

| Símbolo / padrão | Persistence | Storage | Configuration | Metadata | Workflow | Canônico novo |
|------------------|-------------|---------|---------------|----------|----------|---------------|
| `{Xxx}Port` | ✅ | ✅ | ✅ | ✅ | ✅ | Obrigatório |
| `{Xxx}Health` / `Capabilities` | ✅ | ✅ | ✅ | ✅ | ✅ | Obrigatório |
| `create{Xxx}Port` | ✅ | ✅ | ✅ | ✅ | ✅ | Obrigatório |
| `Mock{Xxx}Adapter` | ✅ | ✅ | ✅ | ✅ | ✅ | Obrigatório |
| `Default{Xxx}Adapter` | — | — | ✅ | ✅ | ✅ | Se família Default |
| `{Vendor}{Xxx}Adapter` | ✅ | ✅ | — | — | — | Se família Vendor |
| `providerId` | ❌ (`mechanismId`) | ✅ | ✅ | ✅ | ✅ | Obrigatório em novos |
| Teste `*-engine.test.ts` | ❌ | ❌ | ✅ | ✅ | ✅ | Obrigatório em novos |
| Doc `*_ENGINE.md` | ❌ (`*_PORTS`) | ❌ | ✅ | ✅ | ✅ | Obrigatório em novos |

---

## 10. Declaração

Este Naming Standard é **vinculante** para todos os novos componentes Enterprise a partir da aprovação de ECS-01.
