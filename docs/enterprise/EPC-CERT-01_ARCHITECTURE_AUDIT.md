# EPC-CERT-01 — Architecture Audit

**Sprint:** EPC-CERT-01 — Enterprise Platform Core Certification  
**Data:** 31/07/2026  
**Natureza:** Auditoria arquitetural exclusiva — **nenhum código de produção alterado**  
**Baseline:** `src/lib/enterprise/**` + suites `scripts/enterprise/tests/**` + docs `docs/enterprise/**`

---

## 1. Escopo da auditoria

| ID | Componente | Pasta |
|----|------------|-------|
| EPC-01 | Persistence | `src/lib/enterprise/persistence/` |
| EPC-02 | Storage | `src/lib/enterprise/storage/` |
| EPC-03 | Configuration | `src/lib/enterprise/configuration/` |
| EPC-04 | Metadata | `src/lib/enterprise/metadata/` |
| EPC-05 | Workflow | `src/lib/enterprise/workflow/` |
| EPC-06A | Rule Engine | `src/lib/enterprise/rule/` |
| EPC-06B | Expression Engine | `src/lib/enterprise/rule/expression/` |
| ECS-01 | Component Specification | `docs/enterprise/ECS-01_*.md` |

---

## 2. Inventário estrutural (Fase 1)

| Artefato | Persistence | Storage | Configuration | Metadata | Workflow | Rule | Expression |
|----------|-------------|---------|---------------|----------|----------|------|------------|
| `ports/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | (via Rule ports + AST types) |
| `adapters/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A (módulo de linguagem) |
| `providers/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `demo/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| `store/` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | N/A |
| `runtime/` | ❌ | ❌ | ❌ | ❌ | ✅ | via `expression/runtime` | ✅ |
| `factory/` (raiz) | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ **presente** | ❌ |
| Mock Adapter | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| Default Adapter | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | N/A |
| Vendor Adapter | ✅ Supabase | ✅ Supabase | ❌ | ❌ | ❌ | ❌ | N/A |
| `health()` + `capabilities()` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A (não é Port) |
| `createXxxPort()` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |
| Suite de testes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Identidade canônica `providerId` | ❌ `mechanismId` | ✅ | ✅ | ✅ | ✅ | ✅ | N/A |

### 2.1 Hierarquia observada

Todos os Engines com Port seguem:

```
Application (demo)
    ↓
Port
    ↓
Adapter
    ↓
Store / Runtime (quando aplicável)
    ↓
Factory (providers/createXxxPort)
    ↓
Infrastructure (vendor config apenas em adapters vendor)
```

Nenhuma inversão Port → Adapter foi encontrada.

---

## 3. Superfície pública por Engine

### 3.1 PersistencePort

- Identidade: `mechanismId`
- Métodos: `health()`, `capabilities()`
- Família: Vendor + Mock
- Factory: `createPersistencePort({ mechanism? })`

### 3.2 StoragePort

- Identidade: `providerId`
- Métodos: `health()`, `capabilities()`, `put`, `get`, `delete`, `signedUrl`
- Família: Vendor + Mock
- Factory: `createStoragePort({ provider? })`

### 3.3 ConfigurationPort

- Identidade: `providerId`
- Métodos: `health()`, `capabilities()`, `get`, `set`, `exists`, `remove`, `list`
- Família: Default + Store + Mock
- Factory: `createConfigurationPort({ provider? })`

### 3.4 MetadataPort

- Identidade: `providerId`
- Métodos: `health()`, `capabilities()`, schemas/entities/templates register/get/list
- Família: Default + Store + Mock
- Factory: `createMetadataPort({ provider? })`

### 3.5 WorkflowPort

- Identidade: `providerId`
- Métodos: `health()`, `capabilities()`, register/get/list, `start`, `advance`, `rollback`, `cancel`, `getState`
- Família: Default + Store + Runtime + Mock
- Factory: `createWorkflowPort({ provider? })`

### 3.6 RulePort

- Identidade: `providerId`
- Métodos: `health()`, `capabilities()`, register/get/list, `enableRule`, `disableRule`
- **Sem** `evaluate` / `parse` / `execute` no Port
- Família: Default + Store + Mock + helper `rule/factory`
- Factory Port: `createRulePort({ provider? })`

### 3.7 Expression Engine (módulo)

Componentes: Parser · AST · Evaluation Context · Evaluation Runtime · Rule Evaluator · Expression Registry  
Operadores: 13 · Funções: 7 · Sem Port próprio (consumível via API de módulo)

---

## 4. Conformidade com ECS-01 (resumo estrutural)

| Critério ECS-01 | Status global |
|-----------------|---------------|
| Pasta sob `src/lib/enterprise/{component}/` | ✅ |
| `ports/` + `adapters/` + `providers/` + `demo/` | ✅ (Expression é submódulo de Rule) |
| Port factory em `providers/` | ✅ |
| Sem pasta `factory/` | ⚠️ Rule possui `rule/factory/` |
| `providerId` canônico | ⚠️ Persistence usa `mechanismId` (exceção legada documentada) |
| Mock obrigatório | ✅ |
| Health + Capabilities | ✅ nos Ports |
| Testes enterprise | ✅ |
| Docs Gen B | ⚠️ EPC-01/02 Gen A; EPC-06B sem ARCHITECTURE/MIGRATION canônicos |

Detalhamento: [`EPC-CERT-01_ECS_CONFORMANCE.md`](./EPC-CERT-01_ECS_CONFORMANCE.md)

---

## 5. Achados arquiteturais (somente documentação — sem correção)

| ID | Severidade | Impede EPC-07? | Achado |
|----|------------|----------------|--------|
| ARCH-01 | MÉDIO | Não | `rule/factory/` viola proibição ECS-01 de pasta `factory/` (conteúdo é helper de definição, não Port DI) |
| ARCH-02 | BAIXO | Não | Persistence `mechanismId` / `mechanism` vs canônico `providerId` / `provider` |
| ARCH-03 | MÉDIO | Não | `MetadataReference` com shapes incompatíveis (Metadata vs Rule/Workflow) |
| ARCH-04 | BAIXO | Não | Docs Gen A (EPC-01/02) e nomes de teste `*-ports.test.ts` |
| ARCH-05 | MÉDIO | Não | EPC-06B sem `*_ARCHITECTURE.md` / `*_MIGRATION_PLAN.md` no padrão Gen B |
| ARCH-06 | BAIXO | Não | Action kinds do Rule (`approve`/`reject`/`manualReview`) têm flavor de domínio, mas são catálogo estrutural sem execução |
| ARCH-07 | INFO | Não | Expression aninhado em `rule/expression/` (aceitável; não é Engine Port independente) |

**Nenhum achado CRÍTICO.**  
**Nenhum achado ALTO que bloqueie AI Provider Ports.**

---

## 6. Veredito da auditoria de arquitetura

O Enterprise Platform Core apresenta DNA Ports & Adapters consistente, isolamento entre Engines, superfícies `health`/`capabilities`, factories explícitas e ausência de conhecimento clínico/produto no Core.

Desvios são cosméticos, de nomenclatura legada ou de alinhamento futuro de tipos de referência — **não comprometem a entrada da EPC-07**.
