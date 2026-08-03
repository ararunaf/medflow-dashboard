# TISS-07 — XML Schema Architecture

**Sprint:** TISS-07 — Enterprise XML Schema Runtime  
**Data:** 03/08/2026  
**Camada:** Enterprise Foundation — Ports & Adapters

---

## 1. Visão

O XML Schema Runtime é a infraestrutura única de gerenciamento de XML Schemas canônicos da Enterprise Foundation.

Ele **não** valida XML, **não** lê XSD oficial e **não** conhece ANS/TISS/operadoras.  
Seu papel nesta fundação é registrar, armazenar e consultar referências/estruturas canônicas de schema.

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
DefaultXMLSchemaAdapter → InMemoryXMLSchemaRuntimeStore
```

---

## 3. Camadas do módulo

```
src/lib/enterprise/xml-schema-runtime/
  ports/        Port + types + canonical models + capabilities + identity
  adapters/     Default + Mock (+ Enterprise alias)
  factory/      XMLSchemaRuntimeFactory
  registry/     XMLSchemaRuntimeRegistry
  providers/    createXMLSchemaRuntimePort / Provider
  store/        Store contract + InMemory store
  demo/         Health summary via Port
  index.ts      Barrel público
```

---

## 4. Contratos principais

### Port

`XMLSchemaRuntimePort`

- `register(input)` — registra schema canônico estrutural
- `getResult(input)` / `listResults(input?)`
- `health()` / `capabilities()` / `providerInfo()`

### Modelos canônicos

- `CanonicalXMLSchema`
- `CanonicalXMLSchemaVersion`
- `CanonicalXMLSchemaMetadata`
- `CanonicalXMLSchemaProfile`
- `CanonicalXMLSchemaReference`
- `CanonicalXMLSchemaStatistics`
- `CanonicalXMLSchemaResult`
- `CanonicalXMLSchemaOperation`
- `CanonicalXMLSchemaCapabilities`
- `CanonicalXMLSchemaHealth`

Todos desacoplados de XSD oficial, ANS, TISS, operadora, contrato e tenant.

---

## 5. Providers

| ProviderId | Adapter | Status |
|------------|---------|--------|
| `mock` | `MockXMLSchemaAdapter` | ready |
| `test` | `MockXMLSchemaAdapter` | ready |
| `default` | `DefaultXMLSchemaAdapter` | ready |
| `enterprise` | `DefaultXMLSchemaAdapter` | ready (default oficial) |

Providers desconhecidos falham explicitamente (ECS-01 — sem fallback silencioso).

---

## 6. Desacoplamento

- Schema Runtime **não** importa XML Runtime / Generation / Serializer
- Integração ocorre no composition root (`Enterprise Runtime`) e no `TISS Runtime`
- Flags negativas hardcoded: sem XSD oficial, sem validação, sem XML TISS/ANS
- Store in-process exclusivo do Adapter — produto não acessa diretamente

---

## 7. Health / Capabilities

- Health: `canonical-xml-schema-health` + status do store
- Capabilities: `supportsRegister/Get/List/Health/CanonicalSchema = true`
- Negativas obrigatórias: `implementsOfficialXsd`, `implementsXsdValidation`, `implementsRealTissXml`, `implementsRealAnsXml`, `knowsOperatorOrCooperative`, `knowsContract`, `knowsTenant`, `knowsTissPattern` = `false`
