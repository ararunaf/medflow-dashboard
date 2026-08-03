# TISS-08 — XML Validation Architecture

**Sprint:** TISS-08 — Enterprise XML Validation Runtime  
**Data:** 03/08/2026  
**Camada:** Enterprise Foundation — Ports & Adapters

---

## 1. Visão

O XML Validation Runtime é a infraestrutura única de preparação para validação XML canônica da Enterprise Foundation.

Ele **não** executa validação real, **não** carrega XSD oficial e **não** conhece ANS/TISS/operadoras.  
Seu papel nesta fundação é responder estruturalmente, persistir resultados canônicos e expor health/capabilities.

---

## 2. Diagrama da cadeia

```
Produto
  ↓
Enterprise Runtime
  ↓
TISS Runtime
  ↓
TISSCatalogPort → RulePackEnginePort
  ↓
XMLRuntimePort → XMLGenerationRuntimePort
  ↓
XMLSerializerRuntimePort → Canonical XML String
  ↓
XMLSchemaRuntimePort → Canonical XML Schema
  ↓
XMLValidationRuntimePort → Canonical XML Validation Result
  ↓
DefaultXMLValidationAdapter → InMemoryXMLValidationRuntimeStore
```

---

## 3. Camadas do módulo

```
src/lib/enterprise/xml-validation-runtime/
  ports/        Port + types + canonical models + capabilities + identity
  adapters/     Default + Mock (+ Enterprise alias)
  factory/      XMLValidationRuntimeFactory
  registry/     XMLValidationRuntimeRegistry
  providers/    createXMLValidationRuntimePort / Provider
  store/        Store contract + InMemory store
  demo/         Health summary via Port
  index.ts      Barrel público
```

---

## 4. Contratos principais

### Port

`XMLValidationRuntimePort`

- `validate(input)`
- `getResult(input)`
- `listResults(input?)`
- `health()`
- `capabilities()`
- `providerInfo()`

### Modelos canônicos

- `CanonicalXMLValidationRequest`
- `CanonicalXMLValidationResult`
- `CanonicalXMLValidationIssue`
- `CanonicalXMLValidationProfile`
- `CanonicalXMLValidationMetadata`
- `CanonicalXMLValidationStatistics`
- `CanonicalXMLValidationCapabilities`
- `CanonicalXMLValidationHealth`
- `CanonicalXMLValidationOperation`
- `CanonicalXMLValidationSummary`

### Providers

| providerId | Adapter |
|------------|---------|
| `mock` | `MockXMLValidationAdapter` |
| `test` | `MockXMLValidationAdapter` |
| `default` | `DefaultXMLValidationAdapter` |
| `enterprise` | `DefaultXMLValidationAdapter` |

Default da factory: `enterprise`. Providers desconhecidos falham explicitamente (ECS-01 — sem fallback silencioso).

---

## 5. Regras de desacoplamento

1. Produto/Capture **não** importa adapters/store do Validation Runtime.
2. XML Runtime / Generation / Serializer / Schema **não** importam `xml-validation-runtime`.
3. Composição oficial ocorre no Enterprise Runtime e no TISS Runtime.
4. Resultado estrutural sempre com:
   - `validationExecuted = false`
   - `realValidationPerformed = false`
   - `officialXsdLoaded = false`
   - `officialAnsValidation = false`
   - `officialTissValidation = false`
   - `validationRulesLoaded = false`
   - `validationEngineReady = true`

---

## 6. Health / Capabilities

- Health canônico: `kind: "canonical-xml-validation-health"` + `validationEngineReady: true`
- Capabilities negativas para XSD/validação real/operadora/contrato/tenant/padrão TISS
- Demo: `getXMLValidationRuntimeHealthSummary(port)` — camada application, depende só do Port
