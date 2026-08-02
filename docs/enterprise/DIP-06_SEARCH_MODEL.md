# DIP-06 — Search Model

**Sprint:** DIP-06 — Document Search Runtime

---

## 1. Modelos canônicos

| Tipo | Discriminante `kind` |
|------|----------------------|
| `CanonicalSearchIdentity` | `canonical-search-identity` |
| `CanonicalSearchMetadata` | `canonical-search-metadata` |
| `CanonicalSearchReference` | `canonical-search-reference` |
| `CanonicalSearchCapabilities` | `canonical-search-capabilities` |
| `CanonicalSearchConfiguration` | `canonical-search-configuration` |
| `CanonicalSearchProviderReference` | `canonical-search-provider-reference` |
| `CanonicalSearchRequest` | `canonical-search-request` |
| `CanonicalSearchSession` | `canonical-search-session` |
| `CanonicalSearchResult` | `canonical-search-result` |

---

## 2. Status de sessão

`pending` | `coordinating` | `coordinated` | `deferred` | `failed`

IDs: `dip-search-session-N` (sequência in-process determinística).

---

## 3. Capabilities (estruturais / FALSE)

Registradas no Port e no modelo canônico — nenhuma é executada:

- `supportsKeywordSearch`
- `supportsMetadataSearch`
- `supportsFullTextSearch`
- `supportsSemanticSearch`
- `supportsVectorSearch`
- `supportsBatchSearch`
- `supportsRanking`
- `supportsFacetedSearch`

Flags de implementação (sempre false):

- `implementsRealSearch`
- `implementsIndexing`
- `implementsVectorSearch`
- `implementsEmbeddings`
- `implementsRAG`
- `implementsAI`
- `implementsExternalProviderCall`

---

## 4. Referências de cadeia

`CanonicalSearchReference` pode carregar ids opacos dos hops anteriores:

- `captureRuntimeSessionId` / `captureExecutionId`
- `ocrRuntimeSessionId` / `ocrExecutionId`
- `classificationRuntimeSessionId` / `classificationExecutionId`
- `storageManagerRuntimeSessionId` / `storageExecutionId`
- `providerReferenceId` (Search Provider estrutural)

Sem payloads de busca, hits, scores, embeddings ou índices.
