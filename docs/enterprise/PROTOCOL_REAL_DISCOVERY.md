# Protocol Real Discovery

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A7-01 — Protocol Real Discovery                               |
| Projeto     | MedicFlow-AI                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Registro    | `docs/enterprise/REAL_PROVIDER_REGISTRY.md`                   |
| Status      | Discovery                                                     |

---

## 1. Objetivo

Realizar a auditoria completa do Protocol Runtime Enterprise, mapeando todos os
componentes, contratos, adapters, providers e fluxos sem implementar nenhuma
funcionalidade e sem alterar qualquer arquivo em `src/`.

## 2. Escopo

- Nenhum arquivo em `src/` foi modificado.
- Nenhum `Runtime`, `Port`, `Gateway`, `Pipeline`, `Composition Root`, `Queue`,
  `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Foundation`
  ou `EnterpriseRuntime` foi alterado.
- Único artefato gerado: `docs/enterprise/PROTOCOL_REAL_DISCOVERY.md`.

## 3. ProtocolRuntimePort auditado

### 3.1 Localização

`src/lib/enterprise/protocol-runtime/ports/protocol-runtime-port.ts`

### 3.2 Contrato

| Método            | Operação                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `providerId`      | Identificador do provedor (`mock`, `test`, `default`, `enterprise`) |
| `prepareProfile`  | Prepara `ProtocolProfile` estruturalmente (não resolve protocolo)   |
| `getProfile`      | Obtém perfil/contexto por `profileId` ou `contextId`                |
| `listProfiles`    | Lista perfis estruturais do store in-memory                         |
| `resolveProtocol` | Resolução estrutural (não seleciona SOAP/REST/gRPC/mensageria)      |
| `stats`           | Estatísticas do store in-memory                                     |
| `health`          | Shape-check dos Ports Enterprise disponíveis                        |
| `capabilities`    | Capacidades declarativas do adapter                                 |
| `providerInfo`    | Metadados agregados do provedor                                     |

### 3.3 Modelos canônicos

- `ProtocolState` — `DECLARED`, `PROFILED`, `CAPABLE`, `PENDING_RESOLUTION`,
  `RESOLVED`, `ACTIVE`, `FAILED`, `DISABLED` (sem transições).
- `ProtocolProfile` — contrato de perfil com `profileId`, `state`, `operatorCapabilityProfile`,
  `requiredCapabilities`, `authorizationStrategy`, `authorizationPolicy`,
  `batchManifest`, `xmlDocument`, `xmlValidationResult`.
- `ProtocolContext` — envelope de observabilidade + manifesto por contexto.
- `ProtocolResolver` — contrato de resolução sem implementação funcional.
- `ProtocolCapabilities` / `ProtocolMetadata` / `ProtocolStatistics` — contratos futuros.

### 3.4 Capacidades atuais (C-07)

Todas as flags de protocolo concreto são `false`:

- `soapImplemented: false`
- `restImplemented: false`
- `grpcImplemented: false`
- `messagingImplemented: false`
- `protocolResolutionImplemented: false`
- `httpImplemented: false`
- `tlsImplemented: false`
- `authenticationImplemented: false`

Suporta:

- `prepareProfile`, `getProfile`, `listProfiles`, `resolveProtocol`, `stats`, `health`.
- Peer Ports: `Batch`, `Authorization`, `Operator`, `SOAP`, `XML`, `XMLValidation`
  (shape-check em `health`).

## 4. Providers encontrados

### 4.1 Registry

`src/lib/enterprise/protocol-runtime/registry/protocol-runtime-registry.ts`

| Provider ID  | Adapter                           | Nome                       | Versão      | Status |
| ------------ | --------------------------------- | -------------------------- | ----------- | ------ |
| `mock`       | `MockProtocolRuntimeAdapter`      | Mock Protocol Runtime      | `1.0.0`     | ready  |
| `test`       | `MockProtocolRuntimeAdapter`      | Test Protocol Runtime      | `1.0.0`     | ready  |
| `default`    | `DefaultProtocolRuntimeAdapter`   | Default Protocol Runtime   | `3.0.0+ecs` | ready  |
| `enterprise` | `DefaultProtocolRuntimeAdapter`   | Enterprise Protocol Runtime| `3.0.0+ecs` | ready  |

### 4.2 Factory

`src/lib/enterprise/protocol-runtime/factory/protocol-runtime-factory.ts`

- `mock` e `test` instanciam `MockProtocolRuntimeAdapter`.
- `default` e `enterprise` instanciam `DefaultProtocolRuntimeAdapter`.
- Provider default é `enterprise`.

### 4.3 Adapters

| Adapter                           | Arquivo                                                | Provider ID             | Observação                                                       |
| --------------------------------- | ------------------------------------------------------ | ----------------------- | ---------------------------------------------------------------- |
| `DefaultProtocolRuntimeAdapter`   | `adapters/default-protocol-runtime-adapter.ts`         | `default`, `enterprise` | Adapter oficial C-07; estrutural (não seleciona protocolo).      |
| `EnterpriseProtocolRuntimeAdapter`| alias de `DefaultProtocolRuntimeAdapter`               | `enterprise`            | Alias exportado.                                                 |
| `MockProtocolRuntimeAdapter`      | `adapters/mock-protocol-runtime-adapter.ts`            | `mock`, `test`          | Mock determinístico; delega para `Default...` com `simulated: true`. |

### 4.4 Providers públicos

`src/lib/enterprise/protocol-runtime/providers/create-protocol-runtime-port.ts`

- `createProtocolRuntimePort(options?)`
- `getProtocolRuntimePort(options?)`
- `getProtocolRuntimeFactory()`
- `ProtocolRuntimeProvider` (objeto com `create`, `get`, `getFactory`)

### 4.5 Enterprise Runtime wiring

`src/lib/enterprise/runtime/enterprise-runtime.ts`

- `protocolRuntimePort` é criado via `createProtocolRuntimePort({ provider: "enterprise" })`.
- `getProtocolRuntimePort()` expõe o Port.
- `protocolRuntimePort` é injetado como `enterpriseDeps` em `ReturnRuntimePort`,
  `ReconciliationRuntimePort` e `WorkflowRuntimePort`.

## 5. Ciclo de vida

### 5.1 `prepareProfile(input)`

1. Valida `AbortSignal` e timeout.
2. Executa retry se `failAttempts` configurado.
3. Cria `ProtocolProfile` via `resolveProfile(input, stamp)`.
4. Armazena o `profile` e o `protocolContext` no `InMemoryProtocolRuntimeStore`.
5. Retorna `PrepareProtocolProfileResult` com `protocolResolved: false`.

### 5.2 `getProfile(input)`

1. Lê `profileId` ou `contextId`.
2. Consulta o `ProtocolRuntimeStore`.
3. Retorna o `ProtocolProfile` encontrado.

### 5.3 `listProfiles(input)`

1. Lista todos os perfis do store.
2. Aplica filtro por `state` se fornecido.
3. Retorna perfis + contextos + estatísticas.

### 5.4 `resolveProtocol(input)`

1. Cria `ProtocolResolver` estrutural vazio.
2. Não seleciona SOAP/REST/gRPC/mensageria.
3. Sempre retorna `protocolResolutionImplemented: false`.

## 6. Fluxo `processTissBatchCreatedProtocolSent`

`src/lib/enterprise/runtime/process-tiss-batch-created-protocol-sent.ts`

```
getEnterpriseRuntime()
  → WorkerRuntimePort (tiss-protocol-04a)
    → WorkerQueueConsumer (claim via QueueRuntimePort)
      → processTissProtocolJob({
          getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
          getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
        })
        → ProtocolRuntimePort.prepareProfile(...)
        → ProtocolRuntimePort.getProfile(...)
        → QueueRuntimePort.enqueue({ status: PROTOCOL_SENT })
```

## 7. `processTissProtocolJob` detalhado

`src/lib/enterprise/queue-runtime/operational/process-tiss-protocol-job.ts`

1. Valida `getQueueRuntimePort` e `getProtocolRuntimePort`.
2. Ignora mensagens fora de `ENTERPRISE_TISS_QUEUE_NAME`.
3. Consome apenas jobs com `tissJobStatus === BATCH_CREATED`.
4. Extrai `documentId`, `sessionId`, `correlationId`, `batchId`, `xmlDocumentId`.
5. Chama `protocolPort.prepareProfile({ profileName, protocolContext })`.
6. Chama `protocolPort.getProfile({ profileId: createdProfileId })`.
7. Reenfileira mensagem com `status: PROTOCOL_SENT`.
8. Em **todos** os caminhos: `persistenceExecuted: false` e `auditExecuted: false`.

## 8. Evidência de que Persistence NÃO foi executada

`processTissProtocolJob` retorna `persistenceExecuted: false` em todos os caminhos:

- Faltando `getQueueRuntimePort` → `persistenceExecuted: false`
- Faltando `getProtocolRuntimePort` → `persistenceExecuted: false`
- Fila diferente de `ENTERPRISE_TISS_QUEUE_NAME` → `persistenceExecuted: false`
- Status diferente de `BATCH_CREATED` → `persistenceExecuted: false`
- `prepareProfile` falha → `persistenceExecuted: false`
- `getProfile` falha → `persistenceExecuted: false`
- Sucesso (reenfileira `PROTOCOL_SENT`) → `persistenceExecuted: false`, `auditExecuted: false`

A mensagem `PROTOCOL_SENT` contém `persistenceExecuted: false` e `auditExecuted: false`.

`processTissBatchCreatedProtocolSent` também retorna `persistenceExecuted: false` e `auditExecuted: false`.

## 9. Provider recomendado para produção

### 9.1 Proposta

`RealTissProtocolRuntimeAdapter` com provider ID `real-tiss`.

### 9.2 Localização futura

`src/lib/enterprise/protocol-runtime/adapters/real-tiss-protocol-runtime-adapter.ts`

### 9.3 Padrão a seguir

Seguir exatamente o mesmo padrão já utilizado nos adapters reais existentes:

- `RealTissDocumentExtractionRuntimeAdapter`
- `RealTissValidationRuntimeAdapter`
- `RealTissAutoFillRuntimeAdapter`
- `RealTissXMLTISSRuntimeAdapter`
- `RealTissBatchRuntimeAdapter`

### 9.4 Estratégia de ativação futura

1. Estender `ProtocolRuntimeProviderId` para incluir `"real-tiss"`.
2. Criar `RealTissProtocolRuntimeAdapter` implementando `ProtocolRuntimePort`.
3. Reutilizar `DefaultProtocolRuntimeAdapter` para ciclo de vida, retry, telemetry,
   health, observability e store.
4. Registrar `real-tiss` em:
   - `ProtocolRuntimeFactory`
   - `ProtocolRuntimeRegistry`
5. Não alterar `EnterpriseRuntime`, `Runtime`, `Queue`, `Worker`, `Scheduler`,
   `Retry`, `Dead Letter`, `Observability`, `Pipeline`, `Foundations` nem
   `Composition Root`.
6. A lógica futura de resolução de protocolo (SOAP/REST/gRPC/mensageria) deverá
   residir em adapters específicos (`SOAPRuntimePort`, `OperatorRuntimePort`)
   e ser consumida via `ProtocolResolver`, sem que `DefaultProtocolRuntimeAdapter`
   conheça protocolos concretos.

## 10. Evidência de preservação arquitetural

- `processTissBatchCreatedProtocolCreated` continua usando exclusivamente
  `getEnterpriseRuntime()`.
- `processTissProtocolJob` continua recebendo `getQueueRuntimePort` e
  `getProtocolRuntimePort` via `getEnterpriseRuntime()`.
- `ProtocolRuntimePort` é o único contrato.
- `getEnterpriseRuntime()` é o único entrypoint.
- Nenhum `Port`, `Gateway`, `Runtime`, `Pipeline`, `Composition Root`, `Queue`,
  `Worker`, `Scheduler`, `Retry`, `Dead Letter` ou `Observability` foi criado
  ou alterado.

## 11. Architectural Dependency Map

| Componente                    | Depende de                                                                                                                | Responsabilidade                                             | Pode ser alterado? |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------ |
| `ProtocolRuntimePort`         | `ProtocolRuntimeProviderId`, tipos de `protocol-runtime/ports/types`                                                     | Contrato único de Protocol Abstraction                       | NÃO                |
| `DefaultProtocolRuntimeAdapter` | `ProtocolRuntimePort`, `ProtocolRuntimeStore`, `InMemoryProtocolRuntimeStore`, `ProtocolRuntimeEnterpriseDeps`            | Adapter oficial C-07; operações estruturais                  | NÃO                |
| `MockProtocolRuntimeAdapter`  | `DefaultProtocolRuntimeAdapter`                                                                                           | Mock/test determinístico                                     | NÃO                |
| `ProtocolRuntimeFactory`      | `ProtocolRuntimeRegistry`, `DefaultProtocolRuntimeAdapter`, `MockProtocolRuntimeAdapter`                                   | Instancia o adapter correto pelo provider                    | NÃO                |
| `ProtocolRuntimeRegistry`     | `ProtocolRuntimeRegistration`, `DEFAULT_PROTOCOL_RUNTIME_ENGINE_CAPABILITIES`                                             | Catálogo de mecanismos                                       | NÃO                |
| `ProtocolRuntimeStore`        | `ProtocolProfile`, `ProtocolContext`, `ProtocolResolver`                                                                  | Armazenamento in-process                                     | NÃO                |
| `processTissProtocolJob`      | `QueueRuntimePort`, `ProtocolRuntimePort`, `ENTERPRISE_TISS_QUEUE_NAME`                                                   | Worker handler para BATCH_CREATED → PROTOCOL_SENT            | NÃO                |
| `processTissBatchCreatedProtocolSent` | `getEnterpriseRuntime`, `WorkerRuntimePort`, `QueueRuntimePort`, `ProtocolRuntimePort`                            | Entrypoint ofixial da capability Protocol                    | NÃO                |
| `EnterpriseRuntime`           | `ProtocolRuntimePort` via `createProtocolRuntimePort`                                                                     | Expõe `getProtocolRuntimePort()`                             | NÃO                |
| `getEnterpriseRuntime`        | `createEnterpriseRuntime`                                                                                                  | Entrypoint único do Runtime                                  | NÃO                |

## 12. Enterprise Sequence Diagram

```
OCR
  ↓ (processTissReceivedOcr)
Parser
  ↓ (processTissOcrParsed)
Validation
  ↓ (processTissParsedValidated)
Enrichment
  ↓ (processTissValidatedEnriched)
XML
  ↓ (processTissEnrichedXmlGenerated)
Batch
  ↓ (processTissXmlGeneratedBatchCreated)
BATCH_CREATED
  ↓
getEnterpriseRuntime()
  ↓
WorkerRuntimePort (tiss-protocol-04a)
  ↓
WorkerQueueConsumer (claim via QueueRuntimePort)
  ↓
processTissProtocolJob({
    getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
    getProtocolRuntimePort: () => runtime.getProtocolRuntimePort(),
  })
  ↓
ProtocolRuntimePort.prepareProfile({ profileName, protocolContext })
  ↓
ProtocolRuntimePort.getProfile({ profileId })
  ↓
QueueRuntimePort.enqueue({ status: PROTOCOL_SENT })
  ↓
PROTOCOL_SENT
  ↓
Persistence (não executado — persistenceExecuted: false)
  ↓
Audit (não executado — auditExecuted: false)
  ↓
Completed (não executado)
```

O Protocol atua **exclusivamente** entre `BATCH_CREATED` e `PROTOCOL_SENT`.

## 13. Provider Readiness Matrix

| Provider    | Situação    | Produção |
| ----------- | ----------- | -------- |
| `mock`      | Pronto      | Não      |
| `test`      | Pronto      | Não      |
| `default`   | Pronto      | Não      |
| `enterprise`| Pronto      | Não      |
| `real-tiss` | Planned     | Não      |

## 14. Production Readiness Checklist

- [x] arquitetura preservada
- [x] provider identificado (`real-tiss`)
- [x] riscos conhecidos (sem resolução funcional de protocolo, sem SOAP/REST/gRPC/mensageria)
- [x] integrações futuras (SOAPRuntimePort, OperatorRuntimePort, XMLValidationRuntimePort)
- [x] limitações atuais (apenas estrutural, sem I/O, sem envio para operadora)
- [x] dependências externas (contratos WSDL/SOAP, credenciais, certificados digitais, homologação)
- [x] critérios para ativação (seguir padrão RealTiss, estender `ProtocolRuntimeProviderId`, factory, registry)
- [x] critérios para certificação (cobrir válido/inválido/retry/dead letter/observability/performance/pipeline)

## 15. Riscos e mitigações

| Risco | Impacto | Mitigação | Prioridade |
| ----- | ------- | --------- | ---------- |
| Protocolo concreto ainda não selecionável | Alto | Manter `ProtocolResolver` e `ProtocolCapabilities` como contratos; implementar adapters futuros sem alterar `ProtocolRuntimePort` | Alta |
| `RealTissProtocolRuntimeAdapter` não existe | Alto | Criar adapter na A7-02 seguindo padrão RealTiss | Alta |
| Dependência de `SOAPRuntimePort`/`OperatorRuntimePort` | Alto | Ativar `SOAPRuntimePort` e `OperatorRuntimePort` antes de A8-A9 | Alta |
| Credenciais/certs não disponíveis | Alto | Iniciar provisionamento com operadoras em paralelo | Média |

## 16. Integrações futuras

- `SOAPRuntimePort` — envio real para webservices ANS/operadoras.
- `OperatorRuntimePort` — seleção de endpoint/credenciais por operadora.
- `AuthorizationRuntimePort` — tokens de envio.
- `XMLValidationRuntimePort` — validação XSD antes do envio.
- `BatchRuntimePort` — consumo do `BatchManifest` no `prepareProfile`.

## 17. Resultado completo dos greps (sobre `src/`)

| #  | Padrão                              | Ocorrências | Comentário |
| -- | ----------------------------------- | ----------- | ---------- |
| 1  | `getEnterpriseRuntime`              | 174         | Entrypoint principal. |
| 2  | `ProtocolRuntimePort`               | 107         | Port oficial do Protocol. |
| 3  | `createProtocolRuntimePort`         | 7           | Factory pública. |
| 4  | `DefaultProtocolRuntimeAdapter`     | 16          | Adapter oficial C-07. |
| 5  | `MockProtocolRuntimeAdapter`        | 12          | Adapter mock/test. |
| 6  | `EnterpriseProtocolRuntimeAdapter`  | 4           | Alias do adapter oficial. |
| 7  | `processTissBatchCreatedProtocolSent`| 2          | Definição + re-export. |
| 8  | `processTissProtocolJob`            | 6           | Definição, re-exports e uso. |

## 18. Validações executadas

- `npm run build` — sucesso.
- `npx tsc --noEmit` — sucesso.
- `npm run lint` — 0 erros (7 warnings preexistentes).
- `npm run smoke-check` — sucesso.

## 19. Conclusão

O Protocol Runtime foi completamente mapeado. Nenhuma alteração arquitetural foi
realizada. `RealTissProtocolRuntimeAdapter` foi proposto como provider `real-tiss`
seguindo o padrão dos adapters reais anteriores. A ativação futura deverá
reutilizar `DefaultProtocolRuntimeAdapter` e nunca alterar `ProtocolRuntimePort`,
`EnterpriseRuntime` ou a arquitetura congelada.

---

**Conclusão obrigatória:** O Protocol Runtime foi completamente mapeado.
Nenhuma alteração arquitetural foi realizada. O Enterprise Runtime Baseline v1.0
permanece integralmente preservado.
