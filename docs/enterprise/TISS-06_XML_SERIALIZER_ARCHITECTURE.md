# TISS-06 — XML Serializer Architecture

**Sprint:** TISS-06  
**Data:** 03/08/2026  
**Status:** Oficial — Enterprise Foundation

---

## 1. Visão

O Enterprise XML Serializer Runtime materializa a estrutura tipada do XML Generation Runtime em uma **representação XML canônica textual**.

Não é um serializer TISS. Não é um serializer ANS. Não conhece operadoras, contratos, tenants, namespaces ANS, XSD, SOAP ou assinatura digital.

---

## 2. Diagrama da cadeia

```
Produto
  ↓
Enterprise Runtime
  ↓
TISS Runtime
  ↓
TISSCatalogPort + RulePackEnginePort
  ↓
XMLRuntimePort
  ↓
XMLGenerationRuntimePort  →  CanonicalXMLStructure (tipada)
  ↓
XMLSerializerRuntimePort  →  Canonical XML String
  ↓
DefaultXMLSerializerAdapter
  ↓
InMemoryXMLSerializerRuntimeStore
```

Nenhum outro caminho de serialização XML canônica é permitido na Enterprise Foundation.

---

## 3. Camadas do módulo

```
src/lib/enterprise/xml-serializer-runtime/
  ports/        — Port, types, canonical models, capabilities, identity
  adapters/     — DefaultXMLSerializerAdapter, MockXMLSerializerAdapter
  factory/      — XMLSerializerRuntimeFactory
  registry/     — XMLSerializerRuntimeRegistry
  providers/    — createXMLSerializerRuntimePort / XMLSerializerRuntimeProvider
  store/        — XMLSerializerRuntimeStore + InMemory implementation
  demo/         — getXMLSerializerRuntimeHealthSummary
  index.ts      — barrel
```

Aderência ECS-01: Port → Adapter ← Factory ← Registry; Provider público; Store apenas via Adapter.

---

## 4. Contratos canônicos

| Contrato | Kind / papel |
|----------|----------------|
| `CanonicalXMLSerializeRequest` | `canonical-xml-serialize-request` |
| `CanonicalXMLSerializeResult` | `canonical-xml-serialize-result` |
| `canonicalXml` | string XML canônica |
| `realTissXmlGenerated` | literal `false` |
| `realAnsXmlGenerated` | literal `false` |
| Input structure | `CanonicalXMLStructure` do XML Generation Runtime |

---

## 5. Providers

| ProviderId | Adapter |
|------------|---------|
| `enterprise` (default) | `DefaultXMLSerializerAdapter` |
| `default` | `DefaultXMLSerializerAdapter` |
| `mock` | `MockXMLSerializerAdapter` |
| `test` | `MockXMLSerializerAdapter` |

Provider desconhecido → **throw** (sem fallback silencioso).

---

## 6. Desacoplamento

- Serializer **não** conhece TISS / ANS / operadora / contrato / tenant
- Consome apenas estrutura canônica tipada do Generation Runtime
- TISS Runtime orquestra Generation → Serializer via Ports
- XML Runtime / XML Generation Runtime permanecem sem import do Serializer (evita colisão com auditorias de API DOM `XMLSerializer`)
- Produto nunca instancia Adapter/Store diretamente

---

## 7. Health / Capabilities / Demo

- `health()` — agrega store + status do provider
- `capabilities()` — declara `implementsRealTissXml: false`, `implementsRealAnsXml: false`, `knowsTissPattern: false`
- `providerInfo()` — `providerType: "XML_SERIALIZER_RUNTIME"`
- Demo: `getXMLSerializerRuntimeHealthSummary(port)` — camada `application`, sem rotas/UI
