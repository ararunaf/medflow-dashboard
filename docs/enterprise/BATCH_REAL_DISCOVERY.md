# Batch Real Discovery

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A6-01 — Batch Real Discovery                                  |
| Projeto     | MedicFlow-AI                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Registro    | `docs/enterprise/REAL_PROVIDER_REGISTRY.md`                   |
| Status      | Discovery                                                     |

---

## 1. Objetivo

Realizar exclusivamente o Discovery completo da infraestrutura Batch Real,
sem implementar nenhuma funcionalidade, sem alterar qualquer arquivo em `src/`
e sem modificar a arquitetura Enterprise congelada.

## 2. Escopo

- Nenhum arquivo em `src/` foi modificado.
- Nenhum `Runtime`, `Port`, `Gateway`, `Pipeline`, `Composition Root`, `Queue`,
  `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability` ou `Foundation`
  foi alterado.
- Único artefato gerado: `docs/enterprise/BATCH_REAL_DISCOVERY.md`.

## 3. BatchRuntimePort auditado

### 3.1 Localização

`src/lib/enterprise/batch-runtime/ports/batch-runtime-port.ts`

### 3.2 Contrato

| Método         | Operação                                                            |
| -------------- | ------------------------------------------------------------------- |
| `providerId`   | Identificador do provedor (`mock`, `test`, `default`, `enterprise`) |
| `prepareBatch` | Prepara `BatchManifest` estruturalmente (não processa o lote)       |
| `getBatch`     | Obtém manifesto/contexto por `batchId` ou `contextId`               |
| `listBatches`  | Lista manifestos do store in-memory                                 |
| `stats`        | Estatísticas do store in-memory                                     |
| `health`       | Shape-check dos Ports Enterprise disponíveis                        |
| `capabilities` | Capacidades declarativas do adapter                                 |
| `providerInfo` | Metadados agregados do provedor                                     |

### 3.3 Modelos canônicos

- `BatchStateMachine` — estados `CREATED`, `VALIDATED`, `QUEUED`, `READY_TO_SEND`,
  `SENT`, `ACKNOWLEDGED`, `PROCESSING`, `PARTIALLY_COMPLETED`, `COMPLETED`,
  `FAILED`, `TIMEOUT`, `CANCELLED` (sem transições).
- `BatchManifest` — contrato do lote com `batchId`, `documents`, `operatorProfile`,
  `state`, `stateMachine`, `statistics`, `dependencies`, `retryPolicy`,
  `xmlDocument`, `xmlValidationResult`, `qualityAssessment`, `auditResult`.
- `BatchContext` — envelope de observabilidade + manifesto por contexto.
- `BatchDocument` — referência estrutural a documento no lote.
- `BatchPolicy` / `BatchDependencies` / `BatchCapabilities` — contratos futuros.

### 3.4 Capacidades atuais (C-06)

Todas as flags `*Implemented` são `false`:

- `batchProcessingImplemented: false`
- `parallelExecutionImplemented: false`
- `retryImplemented: false`
- `schedulerImplemented: false`
- `workerImplemented: false`
- `queueImplemented: false`
- `soapFunctionalImplemented: false`
- `xmlFunctionalImplemented: false`
- `operatorCommunicationImplemented: false`

Suporta:

- `prepareBatch`, `getBatch`, `listBatches`, `stats`, `health`, `capabilities`.
- Peer Ports: `Authorization`, `Operator`, `SOAP`, `XML`, `XMLValidation`,
  `Quality`, `Audit` (shape-check em `health`).

## 4. Providers encontrados

### 4.1 Registry

`src/lib/enterprise/batch-runtime/registry/batch-runtime-registry.ts`

| Provider ID  | Adapter                      | Nome                     | Versão      | Status |
| ------------ | ---------------------------- | ------------------------ | ----------- | ------ |
| `mock`       | `MockBatchRuntimeAdapter`    | Mock Batch Runtime       | `1.0.0`     | ready  |
| `test`       | `MockBatchRuntimeAdapter`    | Test Batch Runtime       | `1.0.0`     | ready  |
| `default`    | `DefaultBatchRuntimeAdapter` | Default Batch Runtime    | `3.0.0+ecs` | ready  |
| `enterprise` | `DefaultBatchRuntimeAdapter` | Enterprise Batch Runtime | `3.0.0+ecs` | ready  |

### 4.2 Factory

`src/lib/enterprise/batch-runtime/factory/batch-runtime-factory.ts`

- `mock` e `test` instanciam `MockBatchRuntimeAdapter`.
- `default` e `enterprise` instanciam `DefaultBatchRuntimeAdapter`.
- Provider default é `enterprise`.

### 4.3 Adapters

| Adapter                         | Arquivo                                     | Provider ID             | Observação                                                           |
| ------------------------------- | ------------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| `DefaultBatchRuntimeAdapter`    | `adapters/default-batch-runtime-adapter.ts` | `default`, `enterprise` | Adapter oficial C-06; estrutural (não processa lote).                |
| `EnterpriseBatchRuntimeAdapter` | alias de `DefaultBatchRuntimeAdapter`       | `enterprise`            | Alias exportado.                                                     |
| `MockBatchRuntimeAdapter`       | `adapters/mock-batch-runtime-adapter.ts`    | `mock`, `test`          | Mock determinístico; delega para `Default...` com `simulated: true`. |

### 4.4 Providers públicos

`src/lib/enterprise/batch-runtime/providers/create-batch-runtime-port.ts`

- `createBatchRuntimePort(options?)`
- `getBatchRuntimePort(options?)`
- `getBatchRuntimeFactory()`
- `BatchRuntimeProvider` (objeto com `create`, `get`, `getFactory`)

### 4.5 Enterprise Runtime wiring

`src/lib/enterprise/runtime/enterprise-runtime.ts`

- `batchRuntimePort` é criado via `createBatchRuntimePort({ provider: "enterprise" })`.
- `getBatchRuntimePort()` expõe o Port.
- `batchRuntimePort` é injetado como `enterpriseDeps` em `ProtocolRuntimePort`,
  `ReturnRuntimePort`, `ReconciliationRuntimePort` e `WorkflowRuntimePort`.

## 5. Provider recomendado para produção

### 5.1 Proposta

`RealTissBatchRuntimeAdapter` com provider ID `real-tiss`.

### 5.2 Localização futura

`src/lib/enterprise/batch-runtime/adapters/real-tiss-batch-runtime-adapter.ts`

### 5.3 Padrão a seguir

Seguir exatamente o mesmo padrão já utilizado nos adapters reais existentes:

- `RealTissDocumentExtractionRuntimeAdapter`
- `RealTissValidationRuntimeAdapter`
- `RealTissAutoFillRuntimeAdapter`
- `RealTissXMLTISSRuntimeAdapter`

### 5.4 Estratégia de ativação futura

1. Estender `BatchRuntimeProviderId` para incluir `"real-tiss"`.
2. Criar `RealTissBatchRuntimeAdapter` implementando `BatchRuntimePort`.
3. O adapter deve delegar ciclo de vida/retry/observability para
   `DefaultBatchRuntimeAdapter` (igual aos adapters reais anteriores).
4. Registrar `real-tiss` em:
   - `BatchRuntimeFactory`
   - `BatchRuntimeRegistry`
5. Não alterar `EnterpriseRuntime`, `Runtime`, `Queue`, `Worker`, `Scheduler`,
   `Retry`, `Dead Letter`, `Observability`, `Pipeline`, `Foundations` nem
   `Composition Root`.
6. A lógica de processamento real de lote TISS (agrupamento de guias,
   controle de operadora, preparação de envio) deve residir no adapter,
   reutilizando o `BatchRuntimePort` e os stores oficiais.

## 6. Fluxo XML_GENERATED → BATCH_CREATED

### 6.1 Entrypoint

`getEnterpriseRuntime()` → `processTissXmlGeneratedBatchCreated(...)`

### 6.2 Caminho

```
getEnterpriseRuntime()
  → WorkerRuntimePort (tiss-batch-03b)
    → WorkerQueueConsumer (claim via QueueRuntimePort)
      → processTissBatchJob({
          getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
          getBatchRuntimePort: () => runtime.getBatchRuntimePort(),
        })
        → BatchRuntimePort.prepareBatch(...)
        → BatchRuntimePort.getBatch(...)
        → QueueRuntimePort.enqueue({ status: BATCH_CREATED })
```

### 6.3 Reutilizado sem alteração

- `Queue`
- `Worker`
- `Scheduler`
- `Retry`
- `Dead Letter`
- `Observability`
- `Enterprise Runtime`

## 7. Evidência de preservação arquitetural

- `processTissXmlJob` não foi alterado (mesmo número de ocorrências e linhas).
- `processTissXmlGeneratedBatchCreated` continua usando exclusivamente
  `getEnterpriseRuntime()`.
- `BatchRuntimePort` é o único contrato.
- `getEnterpriseRuntime()` é o único entrypoint.
- Nenhum novo `Port`, `Gateway`, `Runtime`, `Pipeline`, `Composition Root`,
  `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter` ou `Observability`
  foi criado ou alterado.

## 8. Evidência de que Protocol NÃO é executado

`processTissBatchJob` retorna `protocolExecuted: false` em todos os caminhos:

- Faltando `getQueueRuntimePort` → `protocolExecuted: false`
- Faltando `getBatchRuntimePort` → `protocolExecuted: false`
- Fila diferente de `ENTERPRISE_TISS_QUEUE_NAME` → `protocolExecuted: false`
- Status diferente de `XML_GENERATED` → `protocolExecuted: false`
- `prepareBatch` falha → `protocolExecuted: false`
- `getBatch` falha → `protocolExecuted: false`
- Sucesso (reenfileira `BATCH_CREATED`) → `protocolExecuted: false`

O próximo job `BATCH_CREATED` tem `protocolExecuted: false` e
`persistenceExecuted: false` nos atributos da mensagem.

## 9. Artefatos temporários

| Arquivo                                                    | Tipo       | Rastreável no Git | Origem                                                    | Motivo                                                 | Impacto                                               | Estratégia de remoção                                                                                              |
| ---------------------------------------------------------- | ---------- | ----------------- | --------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `cert-output.txt`                                          | Temporário | Não               | Redirecionamento de saída de teste executado manualmente. | Arquivo de saída de certificação gerado e não apagado. | Não afeta `src/`; presença fora do escopo do produto. | Remover em sprint de cleanup de artefatos (`rm cert-output.txt`) após validar que nenhum processo o mantém aberto. |
| `scripts/enterprise/tests/parser-cert-output.txt`          | Temporário | Não               | Certificação do Parser (A4-01).                           | Artefato de redirecionamento de teste.                 | Fora de `src/`; não interfere no Baseline.            | Remover em sprint de cleanup de artefatos (`rm scripts/enterprise/tests/parser-cert-output.txt`).                  |
| `docs/enterprise/ENTERPRISE_PRODUCTION_READINESS_AUDIT.md` | Documento  | Não               | Auditoria prévia de readiness.                            | Documento auxiliar criado antes do congelamento.       | Fora de `src/`; contém informações de auditoria.      | Avaliar conteúdo: se desnecessário, remover; se útil, renomear/revisar e rastrear no Git.                          |

**Nota:** conforme regras da Sprint A6-01, nenhum artefato temporário foi removido.

## 10. Futura validação XSD ANS

Para futura certificação do Batch Real, o adapter `real-tiss` deverá suportar
validação completa dos documentos XML contra os XSDs oficiais da ANS.

Estrutura proposta:

- Receber `xmlDocument` e `xmlValidationResult` via `BatchContext`.
- Validar o XML gerado (`RealTissXMLTISSRuntimeAdapter`) com
  `XMLValidationRuntimePort`/`XSDRuntimePort` (sem acessar implementações
  concretas — apenas Ports oficiais).
- Armazenar o resultado da validação no `BatchManifest`.
- Só permitir transição de estado `CREATED → VALIDATED → READY_TO_SEND` quando
  a validação estiver `ok`.

**Importante:** trata-se apenas de registro no Discovery. Não foi implementado.

## 11. Preparação para futura certificação End-to-End

Pipeline futuro a ser certificado após ativação de todos os estágios:

```
OCR
  ↓
Parser
  ↓
Validation
  ↓
Enrichment
  ↓
XML
  ↓
Batch
  ↓
Protocol
  ↓
Persistence
  ↓
Audit
  ↓
Completed
```

O Batch é o estágio imediatamente posterior ao XML. Cada estágio deverá
produzir um job na fila `enterprise-tiss` com as flags correspondentes
(`batchCreated`, `protocolExecuted`, `persistenceExecuted`, `auditExecuted`,
`completedExecuted`) e o `previousJobId` encadeado.

## 12. Resultado completo dos greps (sobre `src/`)

| #   | Padrão                                | Ocorrências em `src/` | Comentário                                                                  |
| --- | ------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| 1   | `BatchRuntimePort`                    | 118                   | Port oficial do Batch TISS.                                                 |
| 2   | `createBatchRuntimePort`              | 7                     | Factory pública do Port.                                                    |
| 3   | `DefaultBatchRuntimeAdapter`          | 16                    | Adapter oficial (C-06).                                                     |
| 4   | `MockBatchRuntimeAdapter`             | 12                    | Adapter mock/test.                                                          |
| 5   | `createEnterpriseRuntime`             | 9                     | Factory/Runtime entrypoint.                                                 |
| 6   | `getEnterpriseRuntime`                | 174                   | Entrypoint principal; amplamente usado na base.                             |
| 7   | `processTissXmlGeneratedBatchCreated` | 2                     | Definição + re-export em `src/lib/enterprise/runtime/index.ts`.             |
| 8   | `processTissBatchJob`                 | 6                     | Definição, re-exports e uso em `processTissXmlGeneratedBatchCreated`.       |
| 9   | `BatchProvider`                       | 0                     | Não existe nome `BatchProvider`; o objeto oficial é `BatchRuntimeProvider`. |

## 13. Validações executadas

- `npm run build` — sucesso.
- `npx tsc --noEmit` — sucesso.
- `npm run lint` — 0 erros (7 warnings preexistentes).
- `npm run smoke-check` — sucesso.

## 14. Conclusão

O Batch Real foi mapeado integralmente. Nenhuma alteração arquitetural ou em
`src` foi realizada. A proposta de `RealTissBatchRuntimeAdapter` está documentada
como direção futura, seguindo o padrão dos adapters reais já homologados.

---

**Conclusão obrigatória:** O Discovery do Batch Real foi concluído sem alterar
qualquer arquivo em `src`, preservando o Baseline Enterprise congelado. A
ativação do `RealTissBatchRuntimeAdapter` deverá seguir o mesmo padrão dos
adapters reais anteriores, sem criar Ports, Runtimes, Gateways, Pipelines ou
Composition Roots paralelos.
