# Validation Real Discovery

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A3-01 — Validation Real Discovery                             |
| Projeto     | MedicFlow-AI                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Status      | **Mapeado — sem alteração arquitetural**                      |

---

## 1. Resumo executivo

A `ValidationRuntimePort` (F3-CAP-08) já existe como porta canônica do Enterprise Runtime. Ela fornece infraestrutura estrutural para `openJob/closeJob/submitRequest/registerDocument/getResult/stats`, mas **não executa validação real** no estado atual.

Nenhuma alteração foi feita em `src`, `Runtime`, `Ports`, `Gateways`, `Pipeline` ou `Foundations`. Este documento mapeia como a Validation real pode ser ativada no futuro seguindo o mesmo padrão do `RealTissDocumentExtractionRuntimeAdapter` (A2-02).

---

## 2. ValidationRuntimePort auditado

**Arquivo:** `src/lib/enterprise/validation-runtime/ports/validation-runtime-port.ts`

### Operações oficiais (F3-CAP-08)

| Operação           | Finalidade                      | Executa validação real hoje? |
| ------------------ | ------------------------------- | ---------------------------- |
| `openJob`          | Abre job canônico de validação  | Não                          |
| `closeJob`         | Fecha job canônico              | Não                          |
| `submitRequest`    | Cria request dentro de um job   | Não                          |
| `registerDocument` | Registra documento canônico     | Não                          |
| `getResult`        | Obtém resultado canônico        | Não                          |
| `stats`            | Estatísticas in-memory          | Não                          |
| `health`           | Health com shape-check de peers | Não                          |
| `capabilities`     | Declaração de capacidades       | Não                          |
| `providerInfo`     | Metadados do provider           | Não                          |

Todas as operações retornam `ok: true` e `VALIDATION_RUNTIME_OK` sem nunca ler bytes, campos, regras TISS, operadoras, XSD ou documentos reais.

---

## 3. Adapters existentes

**Pasta:** `src/lib/enterprise/validation-runtime/adapters/`

### 3.1 `DefaultValidationRuntimeAdapter`

- **Provider id:** `default` / `enterprise`
- **Adapter id:** `default-enterprise-validation-runtime`
- **Comportamento:** infraestrutura canônica, in-memory, sem validação real.
- **Retry:** `defaultRetryCount = 1`, `defaultRetryBackoffMs = 50`, `defaultTimeoutMs = 5.000`.
- **Store:** `InMemoryValidationRuntimeStore`.
- **Health:** shape-check dos peers (DocumentExtraction, DocumentClassification, OCR, Worker, Queue, etc.).

### 3.2 `MockValidationRuntimeAdapter`

- **Provider id:** `mock` / `test`
- **Adapter id:** `mock-deterministic-validation-runtime`
- **Comportamento:** delega para `DefaultValidationRuntimeAdapter` com `provider: "default"` e `healthy: true`.
- **Uso:** testes determinísticos.

### 3.3 `EnterpriseValidationRuntimeAdapter`

- Alias exportado para `DefaultValidationRuntimeAdapter`.
- Mantido por convenção de nomenclatura no `index.ts`.

---

## 4. Providers existentes

**Arquivo:** `src/lib/enterprise/validation-runtime/registry/validation-runtime-registry.ts`

| Provider     | Status  | Capacidades                                                                       |
| ------------ | ------- | --------------------------------------------------------------------------------- |
| `mock`       | `ready` | `fieldValidationImplemented: false`, `documentValidationImplemented: false`, etc. |
| `test`       | `ready` | Alias do `mock`                                                                   |
| `default`    | `ready` | Alias do `enterprise`                                                             |
| `enterprise` | `ready` | Default foundation F3-CAP-08                                                      |

`ValidationRuntimeProviderId = "mock" | "test" | "default" | "enterprise"`.

**Provider recomendado para ativação real:** `real-tiss` (novo), seguindo o mesmo padrão do `RealTissDocumentExtractionRuntimeAdapter` (A2-02). A ativação envolveria:

1. Criar `RealTissValidationRuntimeAdapter` em `src/lib/enterprise/validation-runtime/adapters/`.
2. Adicionar `"real-tiss"` ao `ValidationRuntimeProviderId`.
3. Registrar no `ValidationRuntimeRegistry`.
4. Fazer o `ValidationRuntimeFactory` instanciar `new RealTissValidationRuntimeAdapter(...)`.
5. O fluxo `processTissValidationJob` continua inalterado, chamando `getValidationRuntimePort().submitRequest/getResult`.

---

## 5. Factory

**Arquivo:** `src/lib/enterprise/validation-runtime/factory/validation-runtime-factory.ts`

- `ValidationRuntimeFactory.create(options)` resolve por `provider` via registry.
- `createValidationRuntimePort(options)` é o entrypoint público.
- `getValidationRuntimePort` alias.
- Nenhuma lógica de negócio; apenas instanciação.

**Factory a alterar futuramente:** adicionar `case "real-tiss":` no `switch` do método `instantiate`.

---

## 6. Registry

**Arquivo:** `src/lib/enterprise/validation-runtime/registry/validation-runtime-registry.ts`

- Catálogo de providers com `providerId`, `name`, `version`, `status`, `adapterId`, `capabilities`, `description`.
- Registros built-in: `mock`, `test`, `default`, `enterprise`.
- O `real-tiss` deverá ser adicionado em `BUILTIN_REGISTRATIONS`.

---

## 7. Runtime atual

**Arquivo:** `src/lib/enterprise/runtime/enterprise-runtime.ts`

- `getValidationRuntimePort()` é exposto pelo `DefaultEnterpriseRuntime`.
- A factory do runtime chama `createValidationRuntimePort({ provider: "enterprise", ... })`.
- `validationRuntimePort` pode ser injetado via `EnterpriseRuntimeOptions` para testes.
- `ValidationRuntimePort` é passado como peer estrutural em `AIOrchestration`, `Audit`, `TISSMapping`, `AutoFill`, `Quality`, `XMLTISS`, `XMLValidation`, etc. (lazy shape-check).

---

## 8. Fluxo VALIDATED

**Entrypoint:** `src/lib/enterprise/runtime/process-tiss-parsed-validated.ts`  
**Worker handler:** `src/lib/enterprise/queue-runtime/operational/process-tiss-validation-job.ts`

### 8.1 Sequência canônica

```
PARSED (queue enterprise-tiss)
  → WorkerQueueConsumer.claim
  → processTissValidationJob
    → getValidationRuntimePort().submitRequest(...)
    → getValidationRuntimePort().getResult({ requestId })
    → getQueueRuntimePort().enqueue(VALIDATED)
  → Worker release
```

### 8.2 Transições de status

- Consome somente mensagens `tissJobStatus === "PARSED"`.
- Reenfileira `VALIDATED` com `messageId: ${messageId}:validated`.
- Preserva `correlationId`, `previousJobId`, `documentId`, `sessionId`.
- Marcadores da mensagem resultante:
  - `validationExecuted: true`
  - `enrichmentExecuted: false`
  - `parserExecuted: true`
  - `xmlExecuted: false`
  - `batchExecuted: false`
  - `protocolExecuted: false`
  - `auditExecuted: false`

### 8.3 Saída de `processTissValidationJob`

| `settle`     | Significado                               |
| ------------ | ----------------------------------------- |
| `ack`        | VALIDATED reenfileirado com sucesso       |
| `nack`       | Falha recuperável; retry via Worker/Queue |
| `nack-error` | Erro irrecuperável; encaminhado para DLQ  |

---

## 9. Retry

- `DefaultValidationRuntimeAdapter` herda a mesma `runOperation` do parser/extraction, com `defaultRetryCount = 1` e `defaultRetryBackoffMs = 50`.
- `submitRequest` e `getResult` podem ser invocados com `retryCount` e `timeoutMs` no input.
- O Worker reutiliza `DefaultWorkerRuntimeAdapter` e a infra de retry da `QueueRuntimePort`.
- O Dead Letter é acionado quando `settle === "nack-error"`.

---

## 10. Dead Letter

- `processTissValidationJob` retorna `nack` / `nack-error` em falhas.
- `processTissParsedValidated` lê `queuePort.getDeadLetterRuntimePort()` como shape-check.
- A DLQ é a mesma fila dead-letter do `DefaultQueueRuntimeAdapter`, sem gateway separado.
- Cenários de DLQ:
  - `submitRequest` falha (`nack`)
  - `getResult` falha (`nack`)
  - Reenfileirar `VALIDATED` falha (`nack-error`)
  - Status da mensagem não é `PARSED` (`nack`)

---

## 11. Observability

- `health()` retorna `ok`, `provider`, `latencyMs`, `runtimeReady`, shape-check de todos os peers e flags `*Implemented: false`.
- `capabilities()` declara `supports* = true` e `*Implemented = false`.
- Cada operação retorna `ValidationRuntimeOperationEnvelope` com `telemetry: { latencyMs, attempts, cancelled }`.
- `providerInfo()` expõe metadados do adapter ativo.

---

## 12. Composition Root

- **Único entrypoint do produto:** `getEnterpriseRuntime()`.
- O Enterprise Runtime é o composition root que cria e injeta `ValidationRuntimePort`.
- `createEnterpriseRuntime` aceita `validationRuntimePort` para testes (não para produto).
- `createValidationRuntimePort({ provider: "real-tiss" })` deverá resolver no futuro, mas hoje não existe.
- Nenhum outro lugar da aplicação deve instanciar adapters de Validation diretamente.

---

## 13. Dependências externas

### 13.1 Atuais (F3-CAP-08)

Nenhuma. O `DefaultValidationRuntimeAdapter` é 100% in-memory e não faz chamadas HTTP, banco, IA, ML, LLM ou APIs.

### 13.2 Futuras para Validation real

| Dependência                     | Motivo                                  | Complexidade                       |
| ------------------------------- | --------------------------------------- | ---------------------------------- |
| `DocumentExtractionResult`      | Validar os campos extraídos pelo Parser | Já presente no `ValidationContext` |
| `DocumentClassificationContext` | Saber `guideType` e confiança           | Já presente no `ValidationContext` |
| `TISSCatalogPort`               | Consultar templates e regras TISS       | Requer integração futura           |
| `RulePackEnginePort`            | Aplicar regras de negócio/operadora     | Requer integração futura           |
| `AIOrchestrationRuntimePort`    | Correção/risco sugerido por IA          | Opcional, futura                   |
| `XMLValidationRuntimePort`      | Validação XSD do XML TISS               | Etapa C-02 separada, não F3-CAP-08 |
| Banco / cache de operadoras     | Templates por operadora                 | Dependência infraestrutural futura |

### 13.3 Secrets

Nenhum secret é necessário para a foundation F3-CAP-08. A Validation real, quando implementada, pode precisar de credenciais se consultar APIs externas de operadoras ou TISS (mas isso é fora do escopo de ativação arquitetural).

---

## 14. Estratégia de ativação recomendada

### 14.1 Fase 1 — Extensão do Port sem quebrar contrato

1. Criar `RealTissValidationRuntimeAdapter` que implementa `ValidationRuntimePort`.
2. No `getResult`, receber `requestId`, ler o `ValidationRequest` do store e:
   - Obter `extractionResult` e `classificationContext` do `ValidationContext`.
   - Executar validadores reais (campos obrigatórios, regras TISS, operadora, etc.).
   - Retornar `ValidationResult` com `issues`, `warnings`, `summary` e `status: "validated" | "rejected" | "pending-review"`.
3. Adicionar provider `real-tiss` à factory e registry.
4. Manter `processTissValidationJob` e `processTissParsedValidated` inalterados.

### 14.2 Fase 2 — Enriquecimento da mensagem PARSED

O `processTissValidationJob` hoje não passa `extractionResult` / `classificationContext` no `submitRequest`. Para a Validation real usar os dados do Parser, a mensagem `PARSED` (ou o `ValidationRequest`) deverá carregar:

- `extractionResult: DocumentExtractionResult` com `fields` e `summary`.
- `classificationContext: DocumentClassificationContext` com `guideType` e confiança.

Isso é uma mudança de **conteúdo da mensagem**, não de arquitetura.

### 14.3 Fase 3 — Certificação

Repetir o padrão de A2-03:

- Documento válido → `VALIDATED`.
- Documento com campos ausentes → `VALIDATED` com issues/warnings.
- Documento inválido → `REJECTED` ou `PENDING_REVIEW`.
- Timeout / cancelamento → `ok: false`, `telemetry.cancelled: true`.
- Erro interno → `nack` → DLQ.
- Carga / latência / throughput.
- Observability (`health`, `telemetry`, `validationExecuted`).
- Confirmação de `getEnterpriseRuntime` único e `ValidationRuntimePort` único.

---

## 15. Riscos

| Risco                                 | Impacto                                          | Mitigação                                                             |
| ------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| Regras TISS em constante mudança      | Atualizações frequentes do validador             | Versionar regras e catalogar por `guideType`/`versão TISS`            |
| Dados do Parser incompletos/erros     | Falso positivo/negativo na validação             | Validação nunca rejeita automaticamente sem revisão humana (regra)    |
| Dependência de catálogo de operadoras | Sem dados, a validação de operadora falha        | Iniciar com validações locais (campos obrigatórios, tipos) e evoluir  |
| Alto custo de IA/ML                   | Latência e custo                                 | IA fica em `AIOrchestration`, nunca dentro de `ValidationRuntimePort` |
| Ciclos de validação infinitos         | Health com shape-check evita chamadas recursivas |
| Bypass de `getEnterpriseRuntime`      | Quebra arquitetura                               | Proibir importação direta de adapters fora do composition root        |

---

## 16. Critérios de ativação

Para considerar a Validation real "ativada", devem ser observados:

- [ ] `RealTissValidationRuntimeAdapter` implementa `ValidationRuntimePort` sem alterar a interface.
- [ ] Provider `real-tiss` registrado em `ValidationRuntimeProviderId`, factory e registry.
- [ ] `processTissValidationJob` e `processTissParsedValidated` não são alterados.
- [ ] `getEnterpriseRuntime()` continua sendo o único entrypoint.
- [ ] `ValidationContext` recebe `extractionResult` e `classificationContext` reais.
- [ ] Nenhum `Runtime`, `Gateway`, `Pipeline` ou `Port` novo é criado.
- [ ] A Validation desacopla as próximas capabilities (`Enrichment`, `XML`, `Lote`, `Protocolo`, `Auditoria`).

---

## 17. Critérios de certificação

Antes de produção, a Validation real deverá passar por:

- [ ] **Documentos válidos:** `status === "VALIDATED"`, `validationExecuted === true`.
- [ ] **Documentos inválidos:** `ok: false` ou status `REJECTED`/`PENDING_REVIEW`.
- [ ] **Campos ausentes:** issues com `severity: "error"` ou `"warning"`.
- [ ] **Timeout/cancelamento:** `telemetry.cancelled === true`.
- [ ] **Retry:** `telemetry.attempts >= 1` e recuperação de falha transitória.
- [ ] **Dead Letter:** `nack-error` quando a validação falha irrecuperavelmente.
- [ ] **Observability:** `health.ok === true`, `provider === "real-tiss"`, `runtimeReady === true`.
- [ ] **Carga:** latência e throughput documentados.
- [ ] **Desacoplamento:** `enrichmentExecuted === false`, `xmlExecuted === false`, `parserExecuted === true`.
- [ ] **Greps:** nenhum bypass, `getEnterpriseRuntime` único, `ValidationRuntimePort` único.

---

## 18. Conclusão

A `ValidationRuntimePort` (F3-CAP-08) está madura para ativação real seguindo o padrão do Parser (A2-02). A arquitetura não precisa ser alterada: basta criar um novo adapter `real-tiss` e registrá-lo na factory e no registry. O fluxo `PARSED → VALIDATED` já existe e reutiliza `getEnterpriseRuntime`, `ValidationRuntimePort`, `WorkerRuntimePort`, `QueueRuntimePort` e Dead Letter.

**A Validation Runtime foi completamente mapeada. Nenhuma alteração arquitetural foi realizada. O Baseline Enterprise permanece preservado.**
