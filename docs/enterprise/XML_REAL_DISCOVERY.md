# XML Real Discovery

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A5-01 — XML Real Discovery                                    |
| Projeto     | MedicFlow-AI                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Registro    | `docs/enterprise/REAL_PROVIDER_REGISTRY.md`                   |
| Status      | Discovery                                                     |

---

## 1. Resumo

A presente sprint mapeia **completa e exclusivamente** a implementação REAL da geração XML TISS existente no projeto. Nenhum arquivo em `src/` foi alterado. Nenhuma funcionalidade foi implementada, refatorada ou removida.

O objetivo é documentar o ponto de partida exato para uma futura ativação do provedor `real-tiss` de XML TISS, preservando o `Baseline Enterprise v1.0` e a arquitetura oficial.

---

## 2. Arquitetura do XML TISS Runtime

### 2.1 Entrypoint único

```
Produto
  └── getEnterpriseRuntime()
        └── DefaultEnterpriseRuntime
              └── getXMLTISSRuntimePort()
                    └── XMLTISSRuntimePort
                          └── DefaultXMLTISSRuntimeAdapter
                                └── InMemoryXMLTISSRuntimeStore
```

- `getEnterpriseRuntime()` continua sendo o único ponto de entrada do produto.
- `EnterpriseRuntime.getXMLTISSRuntimePort()` retorna o `XMLTISSRuntimePort` oficial.
- `createXMLTISSRuntimePort(options)` materializa o adapter via `XMLTISSRuntimeFactory` + `XMLTISSRuntimeRegistry`.
- O `DefaultEnterpriseRuntime` injeta `xmlTissRuntimePort` e disponibiliza peer Enterprise (`Quality`, `AutoFill`, `TISSMapping`, `Audit`, `Validation`, etc.) para `health()` sem consumo funcional.

### 2.2 Fluxo operacional TISS-RUNTIME-03A

```
Job ENRICHED (enterprise-tiss queue)
  └── WorkerQueueConsumer
        └── processTissEnrichedXmlGenerated()
              └── processTissXmlJob()
                    └── getXMLTISSRuntimePort()
                          └── prepareXMLDocument()
                          └── getResult()
                    └── QueueRuntimePort.enqueue() → Job XML_GENERATED
```

- `processTissEnrichedXmlGenerated()` é o entrypoint de orquestração C-01/ECS-01.
- `processTissXmlJob()` é o handler executado pelo Worker.
- Reutiliza `QueueRuntimePort`, `WorkerRuntimePort`, `SchedulerRuntimePort`, `ObservabilityRuntimePort`, `XMLTISSRuntimePort`, `Retry` e `Dead Letter`.
- **Gera a transição `ENRICHED → XML_GENERATED`.**
- **NÃO executa Batch / Protocolo / Persistência / Auditoria / Completed.**
- O job resultante contém `xmlExecuted: true`, `xmlGenerated: true`, `batchExecuted: false`, `protocolExecuted: false`, `persistenceExecuted: false`, `auditExecuted: false`, `completedExecuted: false`.

### 2.3 Mapeamento do Port

| Método               | Local                          | Função atual (Discovery)                                                               |
| -------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| `prepareXMLDocument` | `DefaultXMLTISSRuntimeAdapter` | Cria `XMLDocument` canônico com `status: "prepared"` e retorna `XMLResult` estrutural. |
| `getResult`          | `DefaultXMLTISSRuntimeAdapter` | Recupera o `XMLResult` do store.                                                       |
| `stats`              | `DefaultXMLTISSRuntimeAdapter` | Estatísticas in-memory (contagem de documentos/resultados).                            |
| `health`             | `DefaultXMLTISSRuntimeAdapter` | Shape-check de todos os Ports Enterprise; todas as flags `*Implemented` são `false`.   |
| `capabilities`       | `DefaultXMLTISSRuntimeAdapter` | Declara capacidades estruturais; `xmlGenerationImplemented: false`.                    |
| `providerInfo`       | `DefaultXMLTISSRuntimeAdapter` | Metadados do provider.                                                                 |

### 2.4 Capacidades atuais

- `xmlGenerationImplemented: false`
- `xmlSerializationImplemented: false`
- `xmlParsingImplemented: false`
- `xmlValidationImplemented: false`
- `xmlSigningImplemented: false`
- `xmlCompressionImplemented: false`
- `batchXmlGenerationImplemented: false`
- `soapIntegrationImplemented: false`
- `operatorIntegrationImplemented: false`
- `schemaValidationImplemented: false`

A fundação C-01/ECS-01 é **intencionalmente estrutural**. A geração real de XML TISS/ANS ainda não existe.

---

## 3. XMLTISSRuntimePort auditado

### 3.1 Port

- Arquivo: `src/lib/enterprise/xml-tiss-runtime/ports/xml-tiss-runtime-port.ts`
- Contrato: `prepareXMLDocument`, `getResult`, `stats`, `health`, `capabilities`, `providerInfo`.
- `providerId: XMLTISSRuntimeProviderId`.
- Comentários explícitos: sem geração, serialização, parser, XSD, SOAP, operadoras, banco, persistência.

### 3.2 Tipos canônicos

- Arquivo: `src/lib/enterprise/xml-tiss-runtime/ports/types.ts`
- Define `XMLTISSRuntimeProviderId`, `XMLTISSRuntimeHealth`, `XMLTISSRuntimeCapabilities`, `XMLTISSRuntimeEnterpriseDeps`, `PrepareXMLDocumentInput`, `GetXMLResultInput`, `XMLStatsInput`, etc.
- `XMLTISSRuntimeProviderId = "mock" | "test" | "default" | "enterprise"`.
- `XMLTISSContext` aceita `CanonicalGuide`, `AutoFillResult`, `ValidationResult`, `AuditResult`, etc.

### 3.3 Adapters

| Adapter                           | Provider ID             | Arquivo                                        | Observação                                                        |
| --------------------------------- | ----------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| `MockXMLTISSRuntimeAdapter`       | `mock`, `test`          | `adapters/mock-xml-tiss-runtime-adapter.ts`    | Delega para `DefaultXMLTISSRuntimeAdapter` com `simulated: true`. |
| `DefaultXMLTISSRuntimeAdapter`    | `default`, `enterprise` | `adapters/default-xml-tiss-runtime-adapter.ts` | Adapter oficial C-01/ECS-01; estrutural.                          |
| `EnterpriseXMLTISSRuntimeAdapter` | `enterprise`            | `adapters/default-xml-tiss-runtime-adapter.ts` | Alias de `DefaultXMLTISSRuntimeAdapter`.                          |

### 3.4 Factory

- Arquivo: `src/lib/enterprise/xml-tiss-runtime/factory/xml-tiss-runtime-factory.ts`
- `XMLTISSRuntimeFactory` instancia `mock`, `test`, `default`, `enterprise`.
- Providers desconhecidos falham explicitamente.
- `createXMLTISSRuntimeFactory()` cria a factory compartilhada.

### 3.5 Registry

- Arquivo: `src/lib/enterprise/xml-tiss-runtime/registry/xml-tiss-runtime-registry.ts`
- `BUILTIN_REGISTRATIONS` contém 4 providers: `mock`, `test`, `default`, `enterprise`.
- `XMLTISSRuntimeRegistry` expõe `register`, `get`, `has`, `list`, `snapshot`.

### 3.6 Provider

- Arquivo: `src/lib/enterprise/xml-tiss-runtime/providers/create-xml-tiss-runtime-port.ts`
- `createXMLTISSRuntimePort(options)` respeita o registry.
- `getXMLTISSRuntimePort()` e `getXMLTISSRuntimeFactory()` são helpers de composition root.
- `XMLTISSRuntimeProvider` agrega `create`, `get`, `getFactory`.

### 3.7 Store

- Arquivo: `src/lib/enterprise/xml-tiss-runtime/store/in-memory-xml-tiss-runtime-store.ts`
- `InMemoryXMLTISSRuntimeStore` — armazenamento in-process, sem banco.
- Expõe `setDocument`, `getDocument`, `getResult`, `setResult`, `documentCount`, `resultCount`.

---

## 4. Outros módulos XML identificados (futura pipeline real)

### 4.1 XML Runtime genérico (D-01)

- Local: `src/lib/enterprise/xml-runtime/`
- Contém `XMLRuntimePort`, `DefaultXMLRuntimeAdapter`, `MockXMLRuntimeAdapter`, `XMLParser`, `InMemoryXMLRuntimeStore`.
- `XMLParser` implementa parser XML real: recebe string, valida sintaxe, constrói árvore DOM canônica, identifica Header/Body/Nodes/Attributes/Namespace.
- Comentários explícitos: sem TISS, sem operadoras, sem XSD, sem SOAP, sem XPath, sem Schema.

### 4.2 XML Generation Runtime (TISS-05)

- Local: `src/lib/enterprise/xml-generation-runtime/`
- Infraestrutura canônica de geração XML.
- Ainda sem XML TISS/ANS real, sem regras de negócio específicas, sem namespaces ANS.

### 4.3 XML Serializer Runtime (TISS-06)

- Local: `src/lib/enterprise/xml-serializer-runtime/`
- Infraestrutura canônica de serialização XML.
- Ainda sem XML TISS/ANS real, sem XSD, sem envelope de webservice.

### 4.4 XML Schema / Validation / XSD Runtimes

- `src/lib/enterprise/xml-schema-runtime/`
- `src/lib/enterprise/xml-validation-runtime/`
- `src/lib/enterprise/xsd-runtime/`
- Runtimes estruturais para schema, validação e XSD.
- Nenhum XSD oficial nem validação real conectada ao `xml-tiss-runtime` hoje.

### 4.5 TissCommunicationEngine (H-01)

- Arquivo: `src/lib/enterprise/tiss-integration-engine/communication/tiss-communication-engine.ts`
- Catálogo de canais de comunicação TISS com operadoras.
- Não abre conexões, não envia, não autentica e não processa SOAP.
- Futura conexão com o `real-tiss` XML TISS para envio será via `IntegrationConnectorEngine` do Bloco F.

---

## 5. Providers encontrados

| Provider ID  | Tipo       | Status | Geração XML real |
| ------------ | ---------- | ------ | ---------------- |
| `mock`       | Mock       | Ready  | Não              |
| `test`       | Mock       | Ready  | Não              |
| `default`    | Foundation | Ready  | Não              |
| `enterprise` | Foundation | Ready  | Não              |

**Provider real ainda não existe.** O catálogo `docs/enterprise/REAL_PROVIDER_REGISTRY.md` marca **XML Generation** como `Discovery`.

---

## 6. Provider recomendado

A implementação a ser ativada futuramente deverá usar o **provider `real-tiss`**.

Estratégia provável:

1. Estender `XMLTISSRuntimeProviderId` para incluir `"real-tiss"`.
2. Criar `RealTissXMLTISSRuntimeAdapter` em `src/lib/enterprise/xml-tiss-runtime/adapters/`.
3. Registrar `real-tiss` em `XMLTISSRuntimeFactory` e `XMLTISSRuntimeRegistry`.
4. O `RealTissXMLTISSRuntimeAdapter` orquestrará os runtimes genéricos (`xml-runtime`, `xml-generation-runtime`, `xml-serializer-runtime`, `xml-schema-runtime`, `xsd-runtime`) com mapeamento TISS (`tiss-mapping-runtime`) e canais de operadora (`tiss-integration-engine/communication`).
5. Manter `XMLTISSRuntimePort` como único contrato; manter `getEnterpriseRuntime()` como único entrypoint.

---

## 7. Evidência de preservação arquitetural

- `XMLTISSRuntimePort` é o único contrato de acesso.
- `createXMLTISSRuntimePort()` resolve via factory e registry.
- `processTissEnrichedXmlGenerated()` entra por `getEnterpriseRuntime()`.
- `processTissXmlJob()` reutiliza `getXMLTISSRuntimePort()` e `getQueueRuntimePort()`.
- Nenhum Port, Gateway, Runtime, Pipeline, Factory, Registry ou Composition Root foi alterado nesta sprint.

---

## 8. Evidência de Batch NÃO executado

No retorno de `processTissXmlJob` e no metadados do job `XML_GENERATED`:

- `xmlGenerated: true`
- `xmlExecuted: true`
- `batchExecuted: false`
- `protocolExecuted: false`
- `persistenceExecuted: false`
- `auditExecuted: false`
- `completedExecuted: false`

Isso comprova que a transição `ENRICHED → XML_GENERATED` ocorre sem ativar etapas posteriores.

---

## 9. Arquivos temporários identificados

| Arquivo                                           | Tipo       | Rastreável no Git | Observação                                                                  |
| ------------------------------------------------- | ---------- | ----------------- | --------------------------------------------------------------------------- |
| `cert-output.txt`                                 | Temporário | Não               | Artefato de redirecionamento de teste anterior; preso por processo local.   |
| `scripts/enterprise/tests/parser-cert-output.txt` | Temporário | Não               | Artefato pré-existente de certificação de parser; fora do escopo de commit. |

Conforme regras da sprint A5-01, não foram removidos. Ambos estão fora de `src/` e não interferem no Baseline Enterprise.

---

## 10. Resultado completo dos greps (sobre `src/`)

| #   | Padrão                             | Ocorrências em `src/` | Comentário                                                          |
| --- | ---------------------------------- | --------------------- | ------------------------------------------------------------------- |
| 1   | `getEnterpriseRuntime`             | 174                   | Entrypoint principal; amplamente usado na base.                     |
| 2   | `XMLTISSRuntimePort`               | 84                    | Port oficial do XML TISS.                                           |
| 3   | `DefaultXMLTISSRuntimeAdapter`     | 16                    | Adapter oficial (C-01).                                             |
| 4   | `MockXMLTISSRuntimeAdapter`        | 12                    | Adapter mock/test.                                                  |
| 5   | `createXMLTISSRuntimePort`         | 7                     | Provider público.                                                   |
| 6   | `new DefaultXMLTISSRuntimeAdapter` | 3                     | Factory (default/enterprise) + mock adapter delegate.               |
| 7   | `new MockXMLTISSRuntimeAdapter`    | 2                     | Apenas na `XMLTISSRuntimeFactory` para `mock` e `test`.             |
| 8   | `XMLRuntime`                       | 496                   | Runtime XML genérico (D-01) + múltiplos referenciadores.            |
| 9   | `XMLTISS`                          | 471                   | Domínio TISS XML + xml-tiss-runtime.                                |
| 10  | `processTissEnrichedXmlGenerated`  | 2                     | Definição + re-export em `src/lib/enterprise/runtime/index.ts`.     |
| 11  | `processTissXmlJob`                | 6                     | Definição, re-exports e uso em `processTissEnrichedXmlGenerated`.   |
| 12  | `XMLProvider`                      | 23                    | Canônico `CanonicalXMLProvider*` + tipos do `xml-runtime` genérico. |
| 13  | `createEnterpriseRuntime`          | 9                     | Factory/Runtime entrypoint.                                         |

---

## 11. Conclusão

O XML Runtime foi completamente mapeado. Nenhuma alteração arquitetural foi realizada. O Baseline Enterprise permanece preservado.
