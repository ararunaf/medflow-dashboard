# EPC-24 — Canonical Execution Orchestrator Architecture

**Sprint:** EPC-24 Sprint 01 — Canonical Execution Orchestrator  
**Padrão:** ECS-01  
**Documento pai:** [`EPC-24_CANONICAL_EXECUTION_ORCHESTRATOR.md`](./EPC-24_CANONICAL_EXECUTION_ORCHESTRATOR.md)

---

## 1. Hierarquia de dependências

```
Application
  ↓
CanonicalExecutionOrchestratorPort
  ↓
Adapter (Default | Mock)
  ↓
Store (in-memory)
  ↓
Factory
  ↓
Provider (createCanonicalExecutionOrchestratorPort)
```

Nenhuma dependência direta Application → Adapter.  
Nenhuma dependência direta Adapter → Engine concreto.

---

## 2. Mapa de pastas

```
src/lib/enterprise/canonical-execution-orchestrator/
├── index.ts
├── ports/
│   ├── canonical-execution-orchestrator-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── pipeline.ts
│   ├── identity.ts
│   ├── foundation-ports.ts
│   └── index.ts
├── adapters/
│   ├── default-canonical-execution-orchestrator-adapter.ts
│   ├── mock-canonical-execution-orchestrator-adapter.ts
│   ├── orchestrator-helpers.ts
│   └── index.ts
├── store/
│   ├── canonical-execution-orchestrator-store.ts
│   ├── default-canonical-execution-orchestrator-store.ts
│   └── index.ts
├── factory/
│   ├── canonical-execution-orchestrator-factory.ts
│   └── index.ts
├── providers/
│   ├── create-canonical-execution-orchestrator-port.ts
│   └── index.ts
└── demo/
    ├── canonical-execution-orchestrator-health-query.ts
    └── index.ts
```

---

## 3. Contratos

### Port

`CanonicalExecutionOrchestratorPort`

- `startExecution`
- `getExecution`
- `listExecutions`
- `health`
- `capabilities`

### Modelos canônicos (sem lógica)

1. `CanonicalExecutionRequest`
2. `CanonicalExecutionContext`
3. `CanonicalExecutionStep`
4. `CanonicalExecutionResult`
5. `CanonicalExecutionTrace`
6. `CanonicalExecutionStatus`

### Health / Capabilities / Options

- `CanonicalExecutionOrchestratorHealth`
- `CanonicalExecutionOrchestratorCapabilities`
- `CanonicalExecutionOrchestratorProviderOptions`

---

## 4. Adapters

| Adapter | Id | Papel |
|---------|----|-------|
| `DefaultCanonicalExecutionOrchestratorAdapter` | `default-in-process` | Produção da fundação (in-memory) |
| `MockCanonicalExecutionOrchestratorAdapter` | `mock-in-memory` | Testes / homologação |

Responsabilidades:

- Orquestrar steps estruturais
- Registrar referências aos Ports Foundation
- Persistir contexto/result/trace no Store
- **Não** invocar OCR / IA / Mapping / Rule Runtime reais

---

## 5. Store / Runtime

- `CanonicalExecutionOrchestratorStore` (contrato)
- `DefaultCanonicalExecutionOrchestratorStore` (Map in-process)

Sem banco. Sem migrations. Sem I/O externo.

Runtime injetável (`DefaultCanonicalExecutionOrchestratorRuntime`) permite:

- Store compartilhado
- `FoundationPortRegistry` (DI tipada — sem invocação de negócio na Sprint 01)
- Relógio / ids determinísticos (testes)

---

## 6. Factory

`CanonicalExecutionOrchestratorFactory` / `createCanonicalExecutionOrchestratorFactory`

- Resolve `default` | `mock` | `test`
- Falha explícita para provider desconhecido
- Sem fallback silencioso

Provider fino: `createCanonicalExecutionOrchestratorPort`.

---

## 7. Isolamento

| Proibido | Status |
|----------|--------|
| Importar Engines por valor | ✅ não ocorre (type-only Ports) |
| Acoplar Engines entre si | ✅ não ocorre |
| Executar OCR / IA / Mapping / regras | ✅ não ocorre |
| Criar banco / HTTP / Workers / filas | ✅ não ocorre |
| Alterar Foundation existente | ✅ não ocorre |

---

## 8. Relação com outros Engines

O Orquestrador **referencia** (type-only / registry opcional) os Ports:

| Sprint | Port |
|--------|------|
| EPC-12 | `DocumentIntakePort` |
| EPC-13 | `DocumentProcessorPort` |
| EPC-14 | `ProcessingProviderPort` |
| EPC-15 | `OCRProviderPort` |
| EPC-21 | `TISSMappingPort` |
| EPC-20 | `TISSVocabularyPort` |
| EPC-22 | `TISSProfilePort` |
| EPC-19 | `HealthcareModelPort` |
| EPC-17 | `ContractRuleBindingPort` |
| EPC-23 | `TISSRuleRuntimePort` |
| EPC-18 | `AIAuditorPort` |

Nenhum desses módulos é alterado nesta sprint.

---

## 9. Conformidade ECS-01

| Critério | Status |
|----------|--------|
| Hierarquia Application → Port → Adapter → Store → Factory → Provider | ✅ |
| Naming kebab-case / PascalCase conforme padrão | ✅ |
| Default + Mock adapters | ✅ |
| Store in-memory | ✅ |
| Factory com erros explícitos | ✅ |
| Provider `create*Port` | ✅ |
| Demo Application depende só do Port | ✅ |
| Testes contract / mock / health / capabilities / factory / smoke | ✅ |
| Documentação ENGINE / ARCHITECTURE / PIPELINE / CERTIFICATION | ✅ |
