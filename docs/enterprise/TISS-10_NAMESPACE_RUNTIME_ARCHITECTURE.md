# TISS-10 — Namespace Runtime Architecture

**Sprint:** TISS-10 — Enterprise Namespace Runtime Foundation  
**Data:** 03/08/2026

---

## 1. Visão

O Enterprise Namespace Runtime é a fundação canônica para o gerenciamento estrutural futuro de namespaces XML. Nesta Sprint ele responde apenas de forma estrutural — sem namespaces oficiais, sem resolução/validação real e sem XML TISS/ANS.

---

## 2. Diagrama da cadeia oficial

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → XMLRuntimePort
  → XMLGenerationRuntimePort
  → XMLSerializerRuntimePort
  → XMLSchemaRuntimePort
  → XMLValidationRuntimePort
  → XSDRuntimePort
  → NamespaceRuntimePort
  → DefaultNamespaceRuntimeAdapter
  → InMemoryNamespaceRuntimeStore
  → Canonical Namespace Runtime Result
```

Sem caminhos paralelos. Sem bypass. Sem Provider/Adapter/Runtime paralelo.

---

## 3. Camadas do módulo

```
src/lib/enterprise/namespace-runtime/
├── ports/          # Port + types + canonical models + capabilities + identity
├── adapters/       # Default + Mock
├── factory/        # NamespaceRuntimeFactory
├── registry/       # NamespaceRuntimeRegistry (enterprise|default|mock|test)
├── providers/      # createNamespaceRuntimePort
├── store/          # InMemoryNamespaceRuntimeStore
├── demo/           # getNamespaceRuntimeHealthSummary
└── index.ts        # Barrel público
```

---

## 4. Contratos

### Port

`NamespaceRuntimePort`:

- `prepare(input)`
- `getResult(input)`
- `listResults(input?)`
- `health()`
- `capabilities()`
- `providerInfo()`

### Modelos canônicos

- `CanonicalNamespaceRuntimeRequest`
- `CanonicalNamespaceRuntimeResult`
- `CanonicalNamespaceDefinition`
- `CanonicalNamespaceProfile`
- `CanonicalNamespaceReference`
- `CanonicalNamespaceMetadata`
- `CanonicalNamespaceCapabilities`

### Capabilities (estruturais)

| Flag | Valor |
|------|-------|
| `runtimeReady` | `true` |
| `officialNamespacesLoaded` | `false` |
| `realNamespacesLoaded` | `false` |
| `namespaceResolutionEnabled` | `false` |
| `namespaceValidationEnabled` | `false` |
| `officialAnsNamespacesLoaded` | `false` |
| `officialTissNamespacesLoaded` | `false` |

---

## 5. Desacoplamento

1. Produto acessa apenas via Enterprise Runtime → TISS Runtime → Ports.
2. Nenhum módulo XML/XSD importa `namespace-runtime` diretamente.
3. Composition root (`enterprise-runtime.ts`) é o único ponto de wiring.
4. Store acessível apenas via Adapter (`getStore()` escape hatch — AER-NS-B2).
5. Models genéricos — sem ANS, TISS, operadora, contrato ou tenant.

---

## 6. Health / Capabilities

- **Enterprise Runtime:** agrega `namespaceRuntimeOk` no health.
- **TISS Runtime:** exige `getNamespaceRuntimePort`; declara `usesNamespaceRuntimePort: true`.
- **Demo:** `getNamespaceRuntimeHealthSummary(port)` depende exclusivamente do Port.
