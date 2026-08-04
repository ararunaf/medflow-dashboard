# C-01 — XML TISS Runtime Architecture

## Visão

```
Produto
  → Enterprise Runtime
    → XMLTISSRuntimePort
      → DefaultXMLTISSRuntimeAdapter / EnterpriseXMLTISSRuntimeAdapter / MockXMLTISSRuntimeAdapter
        ← XMLTISSRuntimeFactory ← XMLTISSRuntimeRegistry
        → InMemoryXMLTISSRuntimeStore
          → XMLResult (estrutural)
```

## ECS-01

```
src/lib/enterprise/xml-tiss-runtime/
  ports/
  providers/
  factory/
  registry/
  adapters/
  store/
  demo/
  index.ts
```

## Camadas

| Camada | Responsabilidade |
|--------|------------------|
| Port | Contrato único `XMLTISSRuntimePort` |
| Provider | `createXMLTISSRuntimePort()` |
| Factory | Materializa adapters por provider id |
| Registry | Catálogo `mock` / `test` / `default` / `enterprise` |
| Adapters | Implementações estruturais do Port |
| Store | Estado in-process (sem persistência) |
| Demo | `getXMLTISSRuntimeHealthSummary()` |

## Contratos canônicos

`XMLTISSContext` · `XMLDocument` · `XMLHeader` · `XMLBody` · `XMLGuide` · `XMLBatch` · `XMLMetadata` · `XMLCapabilities` · `XMLStatus` · `XMLHealth`

## Operações estruturais

- `prepareXMLDocument` — prepara sessão canônica; **não** gera XML
- `getResult` — obtém resultado estrutural; **não** serializa
- `stats` — estatísticas in-memory
- `health` / `capabilities` / `providerInfo`

## Integração Enterprise

- `getXMLTISSRuntimePort()`
- `xmlTissRuntimeOk` em `EnterpriseRuntimeHealth`
- Peers via `enterpriseDeps` com shape-check apenas em `health()`

## Limites explícitos

Esta arquitetura é **exclusivamente estrutural**:

- não existe geração de XML
- não existe serialização
- não existe parser
- não existe XSD
- não existe SOAP
- não existe comunicação de rede
- não existe banco / APIs
