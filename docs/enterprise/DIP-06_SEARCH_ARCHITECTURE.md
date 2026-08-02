# DIP-06 — Search Architecture

**Sprint:** DIP-06 — Document Search Runtime  
**Padrão:** ECS-01

---

## 1. Camadas

```
Application / Produto
        ↓ (somente Enterprise Runtime)
Enterprise Runtime (composition root)
        ↓
Capture Engine Runtime
        ↓
OCR Runtime → Document Classification Runtime → Storage Manager Runtime
        ↓
Document Search Runtime Port
        ↓
Default / Mock Adapter
        ↓
InMemory Store (estado estrutural)
        +
Canonical Execution Orchestrator.startExecution
        +
Storage Manager Runtime.health/capabilities (hop anterior)
        +
Search Provider Adapter (referência estrutural — sem I/O)
```

---

## 2. Regras de acoplamento

1. O produto **nunca** importa adapters de Search nem SDKs de Search Providers.
2. O produto chama apenas `getEnterpriseRuntime().registerCaptureDocumentIntake(...)`.
3. Capture Engine Runtime é o orquestrador da cadeia DIP; chama `coordinateSearch` após `coordinateStorage`.
4. Document Search Runtime depende apenas de:
   - `CanonicalExecutionOrchestratorPort`
   - `StorageManagerRuntimePort` (hop anterior — health/capabilities)
5. Search Providers existem apenas como catálogo estrutural (`STRUCTURAL_SEARCH_PROVIDER_REFERENCES`).

---

## 3. Providers estruturais (não conectados)

| Id | Display Name | Status |
|----|--------------|--------|
| `elasticsearch` | Elasticsearch | structural-reference-only |
| `opensearch` | OpenSearch | structural-reference-only |
| `postgresql-fts` | PostgreSQL Full Text Search | structural-reference-only |
| `vector-database` | Vector Database | structural-reference-only |
| `azure-ai-search` | Azure AI Search | structural-reference-only |
| `mock-search` | Mock Search | structural-reference-only |

Todos: `connected: false`, `implementsRealSearch: false`, `implementsIndexing: false`.

---

## 4. Operação principal

`DocumentSearchRuntimePort.coordinateSearch(CanonicalSearchRequest)`:

1. Valida identidade/metadata
2. Persiste sessão `pending` → `coordinating`
3. `orchestrator.startExecution` com tags `dip-06`
4. Consulta Storage Manager Runtime (`health` / `capabilities`) — sem storage real
5. Carimba `structural-search-provider-adapter`
6. Persiste sessão `coordinated` com `realSearchExecuted: false` e `realIndexingExecuted: false`

Nenhuma query, índice, vetor, embedding, RAG ou HTTP é executado.
