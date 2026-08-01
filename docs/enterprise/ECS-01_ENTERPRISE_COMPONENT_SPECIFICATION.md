# ECS-01 — Enterprise Component Specification

**Sprint:** ECS-01 — Enterprise Component Specification  
**Data:** 31/07/2026  
**Natureza:** Especificação documental oficial — **sem alteração de código, banco, APIs, UI, testes ou Engines existentes**  
**Baseline auditada:** Persistence (EPC-01) · Storage (EPC-02) · Configuration (EPC-03) · Metadata (EPC-04) · Workflow (EPC-05)  
**Escopo:** Padronizar oficialmente todos os componentes do Enterprise Platform Core

---

## 0. Declaração de autoridade

Este documento é a **especificação oficial** de componentes Enterprise do MedicFlow.

A partir da aprovação desta sprint:

1. Todo novo Engine / componente Enterprise **deverá** obedecer este padrão.
2. Nenhuma sprint futura poderá inventar estrutura, nomenclatura, testes ou documentação fora deste padrão sem revisão explícita de arquitetura.
3. Engines já existentes **não são refatorados nesta sprint**; adequações futuras, se necessárias, serão sprints dedicadas e não bloqueiam o roadmap.

Documentos satélite obrigatórios desta sprint:

| Documento | Função |
|-----------|--------|
| [`ECS-01_NAMING_CONVENTIONS.md`](./ECS-01_NAMING_CONVENTIONS.md) | Nomenclatura oficial |
| [`ECS-01_TEST_STANDARD.md`](./ECS-01_TEST_STANDARD.md) | Padrão de testes |
| [`ECS-01_DOCUMENTATION_STANDARD.md`](./ECS-01_DOCUMENTATION_STANDARD.md) | Padrão de documentação |
| [`ECS-01_CERTIFICATION_STANDARD.md`](./ECS-01_CERTIFICATION_STANDARD.md) | Padrão de certificação |

---

## 1. Inventário dos Engines existentes (Fase 1)

### 1.1 Engines auditados

| # | Componente | Sprint de origem | Pasta |
|---|------------|------------------|-------|
| 1 | Persistence | EPC-01 | `src/lib/enterprise/persistence/` |
| 2 | Storage | EPC-02 | `src/lib/enterprise/storage/` |
| 3 | Configuration | EPC-03 | `src/lib/enterprise/configuration/` |
| 4 | Metadata | EPC-04 | `src/lib/enterprise/metadata/` |
| 5 | Workflow | EPC-05 | `src/lib/enterprise/workflow/` |

**Total auditado: 5 Engines.**

### 1.2 Estruturas observadas

| Pasta / artefato | Persistence | Storage | Configuration | Metadata | Workflow |
|------------------|-------------|---------|---------------|----------|----------|
| `ports/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `adapters/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `providers/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `demo/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `store/` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `runtime/` | ❌ | ❌ | ❌ | ❌ | ✅ |
| `services/` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `factory/` (pasta) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Root `index.ts` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mock Adapter | ✅ | ✅ | ✅ | ✅ | ✅ |
| Default Adapter | ❌ | ❌ | ✅ | ✅ | ✅ |
| Supabase Adapter | ✅ | ✅ | ❌ | ❌ | ❌ |
| `health()` + `capabilities()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `createXxxPort()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Health demo PoC | ✅ | ✅ | ✅ | ✅ | ✅ |
| Suite de testes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documentação de sprint | ✅ | ✅ | ✅ | ✅ | ✅ |

### 1.3 Pontos comuns (padrão emergente)

Todos os cinco Engines compartilham:

1. **Ports & Adapters** com `XxxPort` como contrato estável.
2. **`health()` e `capabilities()`** como superfície mínima obrigatória.
3. **Factory** `createXxxPort(options?)` em `providers/`.
4. **Mock Adapter** para testes e ids `mock` / `test`.
5. **Demo Application PoC** (`getXxxHealthSummary`) sem ligação a UI/API.
6. **Barrel exports** (`index.ts`) por pasta.
7. **Provider desconhecido** → erro explícito (sem fallback silencioso).
8. **Isolamento de domínio clínico/negócio** no Core.
9. Script npm `enterprise:{name}:test` via `tsx --test`.
10. Certificação documental por sprint.

### 1.4 Divergências identificadas

| Divergência | Detalhe | Tratamento nesta especificação |
|-------------|---------|--------------------------------|
| `mechanism` vs `provider` | Persistence usa `mechanismId` / `options.mechanism`; os demais usam `providerId` / `options.provider` | **Canônico futuro:** `providerId` / `options.provider`. Persistence permanece como está até sprint de adequação opcional. |
| Famílias de adapter | Persistence/Storage = Vendor (Supabase) + Mock; Configuration/Metadata/Workflow = Default+Store + Mock | Ambas as famílias são oficiais (ver §2.3). |
| `store/` | Ausente em Persistence/Storage; presente nos Engines in-process | Obrigatório quando o componente possui estado in-process. |
| `runtime/` | Presente apenas em Workflow | Opcional — apenas quando há lógica pura de execução reutilizável. |
| Docs Gen A vs Gen B | EPC-01/02 usam `*_PORTS` + `ARCHITECTURE_DECISIONS`; EPC-03+ usam `*_ENGINE` + `*_ARCHITECTURE` | **Canônico futuro:** Gen B (ver Documentation Standard). |
| Testes `*-ports` vs `*-engine` | EPC-01/02 vs EPC-03+ | **Canônico futuro:** `{component}-engine.test.ts`. |
| Pasta `factory/` / `services/` | Inexistentes em todos | Papéis definidos; pastas só quando aplicáveis (ver §2). |
| Identidade de campo no Port | Persistence: `mechanismId`; demais: `providerId` | Documentado; adequação futura opcional. |

### 1.5 Conclusão do inventário

Os Engines **não seguem 100% o mesmo padrão superficial**, mas compartilham o **mesmo DNA arquitetural**.  
Esta especificação consolida o DNA comum e congela o padrão oficial para novos componentes. Adequações cosméticas dos Engines existentes são **opcionais e futuras**, não bloqueantes.

---

## 2. Estrutura oficial de um Enterprise Component (Fase 2)

### 2.1 Árvore canônica

```
src/lib/enterprise/{component}/
├── index.ts                 # Barrel público do componente
├── ports/                   # OBRIGATÓRIO
│   ├── index.ts
│   ├── types.ts             # Health, Capabilities, ProviderId, Options, tipos de domínio do Port
│   ├── {component}-port.ts  # Interface XxxPort
│   └── *.ts                 # Módulos auxiliares do contrato (quando necessário)
├── adapters/                # OBRIGATÓRIO
│   ├── index.ts
│   ├── mock-{component}-adapter.ts          # OBRIGATÓRIO
│   ├── default-{component}-adapter.ts       # Quando família in-process
│   └── {vendor}-{component}-adapter.ts      # Quando família vendor
├── store/                   # Quando há estado in-process
│   ├── index.ts
│   ├── {component}-store.ts                 # Interface do store
│   └── default-{component}-store.ts         # Implementação default
├── runtime/                 # Quando há lógica pura de execução
│   └── {component}-runtime.ts
├── providers/               # OBRIGATÓRIO (factory)
│   ├── index.ts
│   └── create-{component}-port.ts
├── services/                # Opcional — orquestração sem regra de negócio clínica
│   └── *.ts
└── demo/                    # OBRIGATÓRIO na fundação (PoC Application)
    ├── index.ts
    └── {component}-health-query.ts
```

Testes e documentação vivem **fora** da árvore do componente:

```
scripts/enterprise/tests/{component}-engine.test.ts
docs/enterprise/EPC-XX_{COMPONENT}_ENGINE.md
docs/enterprise/EPC-XX_{COMPONENT}_ARCHITECTURE.md
docs/enterprise/EPC-XX_{COMPONENT}_MIGRATION_PLAN.md
docs/enterprise/EPC-XX_{COMPONENT}_CERTIFICATION.md
```

### 2.2 Quando cada pasta deve existir

| Pasta / artefato | Obrigatoriedade | Quando criar |
|------------------|-----------------|--------------|
| `ports/` | **Obrigatória** | Sempre |
| `adapters/` | **Obrigatória** | Sempre (mínimo: Mock) |
| `providers/` | **Obrigatória** | Sempre (`createXxxPort`) |
| `demo/` | **Obrigatória** na fundação | Sempre na sprint de criação do Engine; PoC Application sem UI/API |
| `index.ts` (root) | **Obrigatório** | Sempre |
| `store/` | Condicional | Quando o componente mantém estado in-process (Default family) |
| `runtime/` | Condicional | Quando há funções puras de execução/orquestração reutilizáveis pelos adapters |
| `services/` | Condicional | Quando há orquestração multi-passo **sem** regra clínica/negócio; não substituir Port |
| pasta `factory/` | **Não usar** | A factory vive em `providers/create-{component}-port.ts` |
| `types/` (pasta raiz) | **Não usar** | Tipos do contrato ficam em `ports/types.ts` (e módulos auxiliares em `ports/`) |

### 2.3 Famílias oficiais de Adapter

Todo componente pertence a **uma ou mais** famílias:

| Família | Adapters típicos | Store | Uso típico |
|---------|------------------|-------|------------|
| **In-process Default** | `DefaultXxxAdapter` + `MockXxxAdapter` | Sim (`DefaultXxxStore`) | Configuration, Metadata, Workflow, futuros engines sem vendor lock-in imediato |
| **Vendor-backed** | `{Vendor}XxxAdapter` + `MockXxxAdapter` | Não obrigatório (estado no vendor) | Persistence, Storage, futuros AI/Search com provider externo |

Regras:

1. **Mock é sempre obrigatório.**
2. Default e Vendor podem coexistir no mesmo componente (evolução multi-provider).
3. Factory resolve o provider por id e **falha explicitamente** para ids reservados ainda não implementados.

### 2.4 Superfície mínima do Port

Todo `XxxPort` **deve** expor:

```ts
interface XxxPort {
  readonly providerId: XxxProviderId; // canônico; ver Naming Conventions
  health(): Promise<XxxHealth>;
  capabilities(): Promise<XxxCapabilities>;
  // + operações de domínio do componente (sem vazamento clínico)
}
```

Operações além de health/capabilities são específicas do componente, mas **nunca** podem importar conceitos clínicos, de produto ou de vendor no contrato público.

---

## 3. Hierarquia arquitetural oficial (Fase 7)

### 3.1 Cadeia obrigatória

```
Application
    ↓
Port
    ↓
Adapter
    ↓
Store          (quando aplicável)
    ↓
Factory        (providers/createXxxPort)
    ↓
Provider       (seleção de implementação)
    ↓
Infrastructure (vendor / runtime / I/O)
```

### 3.2 Regras de dependência

| Camada | Pode depender de | Não pode depender de |
|--------|------------------|----------------------|
| Application (demo / futuros consumers) | Port | Adapter concreto, Store, Vendor SDK |
| Port | Tipos próprios do contrato | Adapter, Store, Vendor, UI, API routes |
| Adapter | Port, Store (opcional), Runtime puro, Infrastructure | Application, UI, regras clínicas |
| Store | Tipos do componente | Port consumers, UI, Vendor (salvo store vendor-específico futuro documentado) |
| Factory / Provider | Port + Adapters | Application, UI |
| Infrastructure | SDKs externos | Port consumers, domínio clínico |

### 3.3 Proibições absolutas

1. **Inverter a hierarquia** (ex.: Port importar Adapter).
2. Application importar Adapter concreto em código de produto (demo PoC pode injetar Port já criado).
3. Colocar regra de negócio clínica dentro de Adapter/Store/Runtime do Core.
4. Vazamento de tipos de vendor (Supabase, OpenAI, etc.) na superfície do Port.
5. Criar pasta `factory/` paralela — factory = `providers/`.

---

## 4. Princípios oficiais (Fase 8)

Todo componente Enterprise **deve** respeitar:

| Princípio | Significado operacional |
|-----------|-------------------------|
| **Dependency Inversion** | Application depende de abstração (`XxxPort`), não de implementação. |
| **Ports & Adapters** | Contrato estável no Port; infra pluggable via Adapters. |
| **Open/Closed** | Novos providers via novos Adapters + ids na factory — sem reescrever o Core. |
| **Single Responsibility** | Um componente = um mecanismo (persistência, storage, workflow…), não um módulo clínico. |
| **Composition over Inheritance** | Preferir composição de stores/runtimes/helpers a hierarquias de classes. |
| **No Business Rules inside Core** | Regras de negócio ficam em Business Modules / Rule Engine futuros. |
| **No Clinical Knowledge inside Core** | Sem paciente, guia, CID, procedimento, operadora, TISS, etc. no Core. |
| **No Provider Lock-in** | Nenhum vendor é o contrato; vendor é Adapter. |

### 4.1 O que o Core jamais conhece

- Paciente, guia, atendimento, autorização clínica  
- Operadora, cooperativa, contrato comercial  
- Financeiro, TISS, faturamento  
- OCR, IA clínica, embeddings de domínio  
- Telas, rotas, Server Functions de produto  
- Seeds/regras hardcoded de negócio  

### 4.2 O que o Core pode conhecer

- Contratos genéricos (health, capabilities, CRUD genérico, schema genérico, estado/transição genérica)
- Ids de provider / adapter
- Contexto estrutural opaco (`tenantId`, `orgId`, refs opacas) quando necessário para multi-tenant futuro
- Helpers puros de infraestrutura do próprio mecanismo

---

## 5. Checklist oficial de sprint Enterprise (Fase 9)

Toda futura sprint que criar ou evoluir um Enterprise Component **deve** validar:

### 5.1 Estrutura

- [ ] Pasta sob `src/lib/enterprise/{component}/`
- [ ] `ports/`, `adapters/`, `providers/`, `demo/`, root `index.ts`
- [ ] `store/` presente se e somente se houver estado in-process
- [ ] `runtime/` apenas se houver lógica pura de execução
- [ ] Sem pasta `factory/` ou `types/` na raiz do componente

### 5.2 Nomenclatura

- [ ] `XxxPort`, `XxxHealth`, `XxxCapabilities`, `XxxProviderId`
- [ ] `MockXxxAdapter` obrigatório
- [ ] `DefaultXxxAdapter` e/ou `{Vendor}XxxAdapter` conforme família
- [ ] `DefaultXxxStore` quando houver store
- [ ] `createXxxPort()` como factory única
- [ ] Arquivos kebab-case alinhados ao Naming Standard

### 5.3 Testes

- [ ] Unit / contract tests
- [ ] Mock tests
- [ ] Health tests
- [ ] Capabilities tests
- [ ] Factory tests
- [ ] Smoke / surface tests (sem vazamento de vendor/domínio)
- [ ] Arquivo `scripts/enterprise/tests/{component}-engine.test.ts`
- [ ] Script npm `enterprise:{component}:test`

### 5.4 Documentação

- [ ] `EPC-XX_{COMPONENT}_ENGINE.md`
- [ ] `EPC-XX_{COMPONENT}_ARCHITECTURE.md`
- [ ] `EPC-XX_{COMPONENT}_MIGRATION_PLAN.md`
- [ ] `EPC-XX_{COMPONENT}_CERTIFICATION.md`

### 5.5 Health & Capabilities

- [ ] `health()` implementado em todos os adapters
- [ ] `capabilities()` implementado em todos os adapters
- [ ] Demo `getXxxHealthSummary(port)` na camada Application

### 5.6 Factory & Mock

- [ ] Factory resolve default documentado
- [ ] `mock` e `test` → Mock Adapter
- [ ] Providers futuros reservados falham explicitamente
- [ ] Nenhum fallback silencioso

### 5.7 Compatibilidade

- [ ] Nenhuma funcionalidade de produto alterada (salvo sprint que declare o contrário)
- [ ] Nenhuma UI/API/migration indevida
- [ ] Suites Enterprise anteriores executadas como regressão
- [ ] Questionário de certificação completo

---

## 6. Componentes futuros cobertos por esta especificação

Qualquer novo componente Enterprise deverá obedecer ECS-01, incluindo (não exaustivo):

| Componente futuro | Observação |
|-------------------|------------|
| Rule Engine | Sem regras clínicas no Core; packs externos |
| AI Provider | Família vendor-backed típica |
| Tenant | Contexto estrutural; sem UI de tenant nesta fundação |
| Notification | Multi-provider |
| Search | Port + adapters (vendor/local) |
| Document Identity | Prep já referenciada em Storage |
| Qualquer outro Engine EPC/EF/DIP/KP/… | Mesmo template |

---

## 7. Adequações futuras dos Engines existentes (não bloqueantes)

| Engine | Adequação opcional futura | Bloqueia EPC-06? |
|--------|---------------------------|------------------|
| Persistence | Alinhar `mechanism` → `provider` (breaking interno controlado) | **Não** |
| Persistence / Storage | Renomear docs Gen A → Gen B (só docs) | **Não** |
| Persistence / Storage | Renomear testes `*-ports` → `*-engine` | **Não** |
| Todos | Extrair `services/` se orquestração crescer | **Não** |
| Workflow | Decidir se `runtime/` é export público | **Não** |

**Nenhuma adequação é exigida para aprovar ECS-01 nem para prosseguir o roadmap.**

---

## 8. Relação com o roadmap

- **EPC-01 … EPC-05:** Engines já implementados e certificados (baseline desta especificação).
- **ECS-01:** Congela o padrão oficial (esta sprint).
- **Próximos Engines (ex.: EPC-06 e além):** Devem nascer conformes a ECS-01.

> Nota: a árvore em `EPC-00_ROADMAP.md` reflete o baseline documental inicial e pode divergir da numeração efetivamente certificada (EPC-01 Persistence … EPC-05 Workflow). A numeração **certificada** prevalece para Engines já entregues. Atualização do roadmap, se necessária, é sprint documental separada.

---

## 9. Critérios de aprovação desta sprint (ECS-01)

| Critério | Status esperado |
|----------|-----------------|
| Nenhum código alterado | Obrigatório |
| Nenhuma funcionalidade modificada | Obrigatório |
| Especificação oficial dos componentes criada | Obrigatório |
| Padrão único para novos Engines definido | Obrigatório |
| Documentação ECS-01 concluída (5 arquivos) | Obrigatório |

---

## 10. Declaração final

A especificação Enterprise Component (ECS-01) está **completa** para governar a criação de novos componentes do Enterprise Platform Core.

Todos os próximos Engines deverão seguir obrigatoriamente:

- Estrutura (§2)
- Hierarquia (§3)
- Princípios (§4)
- Checklist (§5)
- Naming / Test / Documentation / Certification Standards (documentos satélite)

**Estado da sprint ECS-01:** pronta para certificação documental e continuidade do roadmap.
