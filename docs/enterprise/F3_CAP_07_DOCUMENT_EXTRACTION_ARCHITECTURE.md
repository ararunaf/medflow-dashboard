# F3-CAP-07 — Document Extraction Architecture

**Sprint:** F3-CAP-07 — Enterprise Document Extraction Runtime Foundation
**Padrão:** ECS-01
**Data:** 2026-08-04

---

## Fluxo estrutural oficial

```
Produto
  → Enterprise Runtime
    → DocumentExtractionRuntimePort
      → DefaultDocumentExtractionRuntimeAdapter
         / EnterpriseDocumentExtractionRuntimeAdapter (alias)
         / MockDocumentExtractionRuntimeAdapter
      → InMemoryDocumentExtractionRuntimeStore
      → DocumentExtractionResult (estrutural)
```

---

## Camadas ECS-01

| Camada | Responsabilidade |
|--------|------------------|
| `ports/` | Contratos canônicos, Port, capabilities, identity, types |
| `providers/` | `createDocumentExtractionRuntimePort()` |
| `factory/` | `DocumentExtractionRuntimeFactory` |
| `registry/` | Catálogo `mock` / `test` / `default` / `enterprise` |
| `adapters/` | Default (= Enterprise alias) + Mock |
| `store/` | Store in-memory (sem persistência) |
| `demo/` | `getDocumentExtractionRuntimeHealthSummary()` |

---

## Ponte Classification → Extraction

```
Document Classification Runtime
  → DocumentClassificationContext (metadados estruturais)
    → Document Extraction Runtime
```

O contexto carrega apenas shape de metadados. Não há classificação real, não há
extração real, não há pipeline funcional.

---

## Operações estruturais

| Operação | Comportamento nesta sprint |
|----------|----------------------------|
| `openJob` | Registra job in-memory |
| `closeJob` | Fecha job in-memory |
| `submitRequest` | Registra request canônico |
| `registerDocument` | Registra referência de documento |
| `getResult` | Retorna envelope estrutural (fields/tables vazios) |
| `stats` | Contagens in-memory |
| `health` | Prontidão + shape-check de peers |
| `capabilities` | Declaração estática (`*Implemented = false`) |
| `providerInfo` | Metadados do provedor |

---

## Integração Enterprise Runtime

- Getter: `getDocumentExtractionRuntimePort()`
- Health: `documentExtractionRuntimeOk`
- Provider default: `"enterprise"`
- `enterpriseDeps` com getters lazy para peers (shape-check apenas)

---

## Garantias arquiteturais

1. Nenhum campo possui implementação funcional.
2. Todos os metadados servirão para futuras integrações.
3. O Runtime apenas define a arquitetura.
4. Enterprise Foundation e Centro Operacional permanecem preservados.
