# TISS-09 — XSD Runtime Architecture

**Sprint:** TISS-09 — Enterprise XSD Runtime Foundation  
**Data:** 03/08/2026  
**Padrão:** ECS-01 Ports & Adapters

---

## 1. Visão

O Enterprise XSD Runtime é a fundação canônica responsável por gerenciar, no futuro, XSDs da plataforma. Em TISS-09 ele é exclusivamente estrutural: não carrega XSD oficial, não valida, não conhece ANS/TISS/operadora/contrato/tenant.

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
  → DefaultXSDRuntimeAdapter / MockXSDRuntimeAdapter
  → InMemoryXSDRuntimeStore
  → CanonicalXSDRuntimeResult
```

Não existem caminhos paralelos. Composition root: Enterprise Runtime + TISS Runtime.

---

## 3. Camadas do módulo

```
src/lib/enterprise/xsd-runtime/
  ports/        Port, types, canonical, capabilities, identity
  adapters/     Default + Mock
  factory/      XSDRuntimeFactory
  registry/     XSDRuntimeRegistry (enterprise|default|mock|test)
  providers/    createXSDRuntimePort
  store/        InMemoryXSDRuntimeStore (estrutural)
  demo/         getXSDRuntimeHealthSummary
  index.ts      barrel
```

---

## 4. Contratos

### XSDRuntimePort

- `prepare()` — operação estrutural (sem carregar XSD)
- `getResult()` / `listResults()`
- `health()` / `capabilities()` / `providerInfo()`

### Modelos canônicos

- `CanonicalXSDRuntimeRequest`
- `CanonicalXSDRuntimeResult`
- `CanonicalXSDVersion`
- `CanonicalXSDSchema`
- `CanonicalXSDProfile`
- `CanonicalXSDReference`
- `CanonicalXSDMetadata`
- `CanonicalXSDCapabilities`

### Capabilities (estruturais)

| Flag | Valor |
|------|------:|
| `runtimeReady` | `true` |
| `officialXsdLoaded` | `false` |
| `realXsdLoaded` | `false` |
| `realValidationAvailable` | `false` |
| `officialNamespacesLoaded` | `false` |
| `officialSchemasLoaded` | `false` |
| `schemaParsingEnabled` | `false` |
| `schemaValidationEnabled` | `false` |

---

## 5. Desacoplamento

1. Produto/Capture nunca importa adapters/store.
2. Módulos XML Runtime / Generation / Serializer / Schema / Validation **não** importam `xsd-runtime`.
3. Composition apenas em Enterprise Runtime + TISS Runtime.
4. Sem arquivos `.xsd`, SOAP, Reader/Parser/Validator, namespaces oficiais.

---

## 6. Health / Capabilities

- Enterprise: `getXSDRuntimePort()` + `xsdRuntimeOk`
- TISS: `usesXSDRuntimePort = true` + `xsdRuntimeOk` no health agregado
- Demo: `getXSDRuntimeHealthSummary(port)` — camada application PoC
