# TISS-05 — XML Generation Architecture

**Sprint:** TISS-05  
**Data:** 03/08/2026  
**Aderência:** ECS-01

---

## 1. Visão

O XML Generation Runtime é a camada exclusiva de materialização da **estrutura XML canônica** na Enterprise Foundation.

Ele não conhece TISS/ANS, operadoras, contratos ou tenants. Consome apenas um `CanonicalXMLRequest` estrutural (já enriquecido pelo XML Runtime via Catalog + Rule Pack Engine) e produz um `CanonicalXMLResult` com `realXmlGenerated = false`.

---

## 2. Diagrama da cadeia

```
┌────────────┐
│  Produto   │
└─────┬──────┘
      ▼
┌────────────────────┐
│ Enterprise Runtime │
└─────┬──────────────┘
      ▼
┌──────────────┐
│ TISS Runtime │
└─────┬────────┘
      ├─► TISSCatalogPort
      ├─► RulePackEnginePort
      ├─► XMLRuntimePort ──► XMLGenerationRuntimePort
      │                         │
      │                         ├─► DefaultXMLGenerationAdapter
      │                         └─► InMemoryXMLGenerationRuntimeStore
      │                                   │
      │                                   ▼
      │                         Canonical XML Result
      │                         (realXmlGenerated = false)
      └─► TISSProviderPort
```

Não existe outro caminho oficial para geração canônica.

---

## 3. Camadas do módulo

```
src/lib/enterprise/xml-generation-runtime/
  ports/        XMLGenerationRuntimePort + models canônicos
  adapters/     DefaultXMLGenerationAdapter + MockXMLGenerationAdapter
  factory/      XMLGenerationRuntimeFactory
  registry/     XMLGenerationRuntimeRegistry
  providers/    createXMLGenerationRuntimePort / XMLGenerationRuntimeProvider
  store/        XMLGenerationRuntimeStore + InMemoryXMLGenerationRuntimeStore
  demo/         getXMLGenerationRuntimeHealthSummary
  index.ts      barrel público
```

---

## 4. Contratos canônicos

### Canonical XML Request

`kind: "canonical-xml-generation-request"`

Campos opacos estruturais: `generationId`, `documentId`, `catalogId`, flags de consumo Catalog/RulePack, metadata, notes.

### Canonical XML Structure

Árvore tipada (`CanonicalXMLNode[]`) com `root: "CanonicalXML"` e `realXmlGenerated: false`.  
Não é serialização XML real; não usa DOM/XSD/namespaces.

### Canonical XML Result

`kind: "canonical-xml-generation-result"`

Sempre `realXmlGenerated: false` nesta Sprint.

---

## 5. Providers registrados

| ProviderId | Adapter | Status |
|------------|---------|--------|
| `mock` | MockXMLGenerationAdapter | ready |
| `test` | MockXMLGenerationAdapter | ready |
| `default` | DefaultXMLGenerationAdapter | ready |
| `enterprise` | DefaultXMLGenerationAdapter | ready (default oficial) |

Providers desconhecidos falham explicitamente (sem fallback silencioso) — ECS-01.

---

## 6. Regras de desacoplamento

1. Produto não instancia adapters.
2. Produto não acessa o Generation Store.
3. TISS Runtime não chama `DefaultXMLGenerationAdapter` diretamente.
4. XML Runtime consome exclusivamente `XMLGenerationRuntimePort`.
5. Generation Runtime não importa Catalog/RulePack/operadoras/produto.
6. Nenhuma lógica de negócio no Port/Adapter/Store.

---

## 7. Health & Capabilities

- `health()` — store + provider status
- `capabilities()` — declara `implementsRealXml: false` e ausência de conhecimento operadora/contrato/tenant
- Enterprise Runtime agrega `xmlGenerationRuntimeOk`
- TISS Runtime agrega `xmlGenerationRuntimeOk` e `usesXMLGenerationRuntimePort`
