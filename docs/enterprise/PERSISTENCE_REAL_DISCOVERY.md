# Persistence Real Discovery

|| Campo       | Valor                                                         |
|| ----------- | ------------------------------------------------------------- |
|| Sprint      | A8-01 — Persistence Real Discovery                            |
|| Projeto     | MedicFlow-AI                                                  |
|| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
|| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
|| Registro    | `docs/enterprise/REAL_PROVIDER_REGISTRY.md`                   |
|| Status      | Discovery                                                     |

---

## 1. Objetivo

Realizar a auditoria completa da arquitetura de Persistência (TISS) sem
implementar nenhuma funcionalidade, sem alterar qualquer arquivo em `src/` e
sem modificar a arquitetura Enterprise congelada.

A capability TISS de Persistence é implementada pelo
`PersistentQueueRuntimePort` (INF-08), reutilizado via `getEnterpriseRuntime()`.
Existe também o `PersistencePort` genérico (EPC-01) para aplicação, mas ele **não**
é consumido pelo pipeline TISS.

## 2. Escopo

- Nenhum arquivo em `src/` foi modificado.
- Nenhum `Runtime`, `Port`, `Gateway`, `Pipeline`, `Composition Root`, `Queue`,
  `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Foundation`
  ou `EnterpriseRuntime` foi alterado.
- Único artefato gerado: `docs/enterprise/PERSISTENCE_REAL_DISCOVERY.md`.
- Audit e Completed **não** foram executados; permanecem apenas documentalmente
  registrados.

## 3. PersistentQueueRuntimePort auditado

### 3.1 Localização

`src/lib/enterprise/persistent-queue-runtime/ports/persistent-queue-runtime-port.ts`

### 3.2 Contrato

|| Método            | Operação                                                            |
|| ----------------- | ------------------------------------------------------------------- |
|| `providerId`      | Identificador do provedor (`mock`, `test`, `default`, `enterprise`) |
|| `register`        | Registra estruturalmente um `CanonicalPersistentQueue`              |
|| `unregister`      | Remove um `CanonicalPersistentQueue` do store                       |
|| `persist`         | Marca uma mensagem canônica como persistida (store in-memory)       |
|| `release`         | Libera uma fila/mensagem estruturalmente                            |
|| `list`            | Lista `PersistentQueue`s e `PersistentMessage`s do store            |
|| `stats`           | Estatísticas do store in-memory                                     |
|| `health`          | Shape-check dos Ports Enterprise disponíveis                        |
|| `capabilities`    | Capacidades declarativas do adapter                                 |
|| `providerInfo`    | Metadados agregados do provedor                                     |

### 3.3 Modelos canônicos

- `CanonicalPersistentQueue` — fila persistente canônica (`queueId`, `queueName`,
  `status`, `active`, ...).
- `CanonicalPersistentMessage` — mensagem marcada como `persisted`.
- `CanonicalPersistentEnvelope` — envelope de operação de persistência.
- `CanonicalPersistentQueueIdentity` — identidade opaca.
- `CanonicalPersistentQueueMetadata` — metadados estruturais.
- `CanonicalPersistentQueueResult` / `CanonicalPersistentQueueStatistics` /
  `CanonicalPersistentQueueHealth`.

### 3.4 Capacidades atuais (INF-08)

Todas as flags de backend persistente real são `false`:

- `realPersistentBackend: false`
- `rabbitMqImplemented: false`
- `kafkaImplemented: false`
- `azureServiceBusImplemented: false`
- `azureQueueImplemented: false`
- `redisStreamsImplemented: false`
- `bullMqImplemented: false`
- `deadLetterImplemented: false`
- `retryQueueImplemented: false`
- `delayQueueImplemented: false`
- `messagePersistenceImplemented: false`
- `implementsMessagePersistence: false`
- `implementsRealPersistentBackend: false`
- `implementsWorkers: false`

Suporta:

- `register`, `unregister`, `persist`, `release`, `list`, `stats`, `health`, `capabilities`.
- Peer Ports: `Queue`, `Worker`, `Scheduler`, `Observability`, `Scalability`
  (shape-check em `health` sem consumo).

## 4. PersistencePort genérico auditado (EPC-01)

### 4.1 Localização

`src/lib/enterprise/persistence/ports/persistence-port.ts`

### 4.2 Contrato

|| Método            | Operação                                                  |
|| ----------------- | --------------------------------------------------------- |
|| `mechanismId`     | `supabase` / `postgres` / `sqlserver` / `oracle` / `mock` / `test` |
|| `health`          | Verificação leve de prontidão do mecanismo                |
|| `capabilities`    | `supportsTransactions`, `supportsRowLevelSecurity`, ...   |

### 4.3 Providers e adapters

|| Mechanism ID | Adapter                         | Arquivo                                          |
|| ------------ | ------------------------------- | ------------------------------------------------ |
|| `mock`       | `MockPersistenceAdapter`        | `adapters/mock-persistence-adapter.ts`           |
|| `test`       | `MockPersistenceAdapter`        | `adapters/mock-persistence-adapter.ts`           |
|| `supabase`   | `SupabasePersistenceAdapter`    | `adapters/supabase-persistence-adapter.ts`       |
|| `postgres`   | — (não implementado)            | —                                                |
|| `sqlserver`  | — (não implementado)            | —                                                |
|| `oracle`     | — (não implementado)            | —                                                |

### 4.4 Uso no pipeline TISS

O pipeline TISS **não** importa de `src/lib/enterprise/persistence`. Ele utiliza
`PersistentQueueRuntimePort.persist()` da capability INF-08. Futuramente, o
`RealTissPersistenceRuntimeAdapter` pode consumir `PersistencePort` internamente
como backend real, mas sempre expondo `PersistentQueueRuntimePort` para o restante
do sistema.

## 5. Providers encontrados

### 5.1 PersistentQueue Runtime Registry

`src/lib/enterprise/persistent-queue-runtime/registry/persistent-queue-runtime-registry.ts`

|| Provider ID | Adapter                                  | Nome                            | Versão | Status |
|| ----------- | ---------------------------------------- | ------------------------------- | ------ | ------ |
|| `mock`      | `MockPersistentQueueRuntimeAdapter`      | Mock Persistent Queue Runtime   | `1.0.0`| ready  |
|| `test`      | `MockPersistentQueueRuntimeAdapter`      | Test Persistent Queue Runtime   | `1.0.0`| ready  |
|| `default`   | `DefaultPersistentQueueRuntimeAdapter`   | Default Persistent Queue Runtime| `1.0.0`| ready  |
|| `enterprise`| `DefaultPersistentQueueRuntimeAdapter`   | Enterprise Persistent Queue Runtime| `1.0.0`| ready  |

### 5.2 Factory

`src/lib/enterprise/persistent-queue-runtime/factory/persistent-queue-runtime-factory.ts`

- `mock` e `test` instanciam `MockPersistentQueueRuntimeAdapter`.
- `default` e `enterprise` instanciam `DefaultPersistentQueueRuntimeAdapter`.
- Provider default é `enterprise`.

### 5.3 Provider público

`src/lib/enterprise/persistent-queue-runtime/providers/create-persistent-queue-runtime-port.ts`

- `createPersistentQueueRuntimePort(options?)`
- `getPersistentQueueRuntimeFactory()`
- `PersistentQueueRuntimeProvider`

## 6. Provider recomendado

### 6.1 Proposta

`RealTissPersistenceRuntimeAdapter` (adapter real da TISS capability Persistence)
com `providerId: "real-tiss"` implementando `PersistentQueueRuntimePort`.

### 6.2 Localização futura

`src/lib/enterprise/persistent-queue-runtime/adapters/real-tiss-persistent-queue-runtime-adapter.ts`

### 6.3 Padrão a seguir

Seguir exatamente o mesmo padrão dos adapters reais anteriores:

- `RealTissDocumentExtractionRuntimeAdapter`
- `RealTissValidationRuntimeAdapter`
- `RealTissAutoFillRuntimeAdapter`
- `RealTissXMLTISSRuntimeAdapter`
- `RealTissBatchRuntimeAdapter`
- `RealTissProtocolRuntimeAdapter`

## 7. Estratégia futura de ativação

1. Estender `PersistentQueueRuntimeProviderId` para incluir `"real-tiss"`.
2. Criar `RealTissPersistenceRuntimeAdapter` implementando `PersistentQueueRuntimePort`.
3. Reutilizar `DefaultPersistentQueueRuntimeAdapter` para ciclo de vida, retry,
   telemetry, health, observability, capabilities e store.
4. Registrar `real-tiss` em:
   - `PersistentQueueRuntimeFactory`
   - `PersistentQueueRuntimeRegistry`
   - `adapters/index.ts`
   - `src/lib/enterprise/persistent-queue-runtime/index.ts`
5. Não alterar `EnterpriseRuntime`, `Runtime`, `Queue`, `Worker`, `Scheduler`,
   `Retry`, `Dead Letter`, `Observability`, `Pipeline`, `Foundations` nem
   `Composition Root`.
6. A lógica real de persistência (PostgreSQL/Supabase/S3/Blob) deverá residir
   em um `PersistencePort` mecanismo real consumido internamente pelo adapter,
   sem expor detalhes de vendor para fora do `PersistentQueueRuntimePort`.

## 8. Fluxo `processTissProtocolSentPersisted`

`src/lib/enterprise/runtime/process-tiss-protocol-sent-persisted.ts`

```
getEnterpriseRuntime()
  → WorkerRuntimePort (tiss-persistence-04b)
    → WorkerQueueConsumer (claim via QueueRuntimePort)
      → processTissPersistenceJob({
          getQueueRuntimePort: () => runtime.getQueueRuntimePort(),
          getPersistentQueueRuntimePort: () => runtime.getPersistentQueueRuntimePort(),
        })
        → PersistentQueueRuntimePort.persist(...)
        → QueueRuntimePort.enqueue({ status: PERSISTED })
```

### 8.1 Reutilizado sem alteração

- `Queue`
- `Worker`
- `Scheduler`
- `Retry`
- `Dead Letter`
- `Observability`
- `Enterprise Runtime`
- `PersistentQueueRuntimePort`

## 9. `processTissPersistenceJob` detalhado

`src/lib/enterprise/queue-runtime/operational/process-tiss-persistence-job.ts`

1. Valida `getQueueRuntimePort` e `getPersistentQueueRuntimePort`.
2. Ignora mensagens fora de `ENTERPRISE_TISS_QUEUE_NAME`.
3. Consome apenas jobs com `tissJobStatus === PROTOCOL_SENT`.
4. Extrai `documentId`, `sessionId`, `correlationId`, `batchId`, `xmlDocumentId`, `profileId`.
5. Chama `persistentQueueRuntimePort.persist({ queueName, messageId, metadata })`.
6. Reenfileira mensagem com `status: PERSISTED`.
7. Em **todos** os caminhos: `auditExecuted: false` e `completedExecuted: false`.

## 10. Evidência de que Audit NÃO executa

`processTissPersistenceJob` retorna `auditExecuted: false` e `completedExecuted: false`
em todos os caminhos:

- Faltando `getQueueRuntimePort` → `auditExecuted: false`, `completedExecuted: false`
- Faltando `getPersistentQueueRuntimePort` → `auditExecuted: false`, `completedExecuted: false`
- Fila diferente de `ENTERPRISE_TISS_QUEUE_NAME` → `auditExecuted: false`, `completedExecuted: false`
- Status diferente de `PROTOCOL_SENT` → `auditExecuted: false`, `completedExecuted: false`
- `persist` falha ou lança → `auditExecuted: false`, `completedExecuted: false`
- Sucesso (reenfileira `PERSISTED`) → `auditExecuted: false`, `completedExecuted: false`

A mensagem `PERSISTED` contém:

- `persistenceExecuted: true`
- `auditExecuted: false`
- `completedExecuted: false`

`processTissProtocolSentPersisted` também retorna `auditExecuted: false` e `completedExecuted: false`.

Os entrypoints `processTissPersistedAudited` (TISS-RUNTIME-05A) e `processTissAuditedCompleted`
(TISS-RUNTIME-05B) existem em `src/lib/enterprise/runtime/index.ts`, mas **não são
invocados** na A8-01.

## 11. Architectural Dependency Matrix

| Componente | Depende de | Utilizado por | Criticidade | Substituição futura |
|| ---------- | ---------- | ------------- | ----------- | ------------------- |
| `PersistentQueueRuntimePort` | `PersistentQueueRuntimeProviderId`, tipos de `persistent-queue-runtime/ports/types` | `EnterpriseRuntime`, `processTissPersistenceJob`, `processTissProtocolSentPersisted` | Alta (contrato único) | NÃO |
| `DefaultPersistentQueueRuntimeAdapter` | `PersistentQueueRuntimePort`, `InMemoryPersistentQueueRuntimeStore`, `PersistentQueueRuntimeEnterpriseDeps` | `PersistentQueueRuntimeFactory`, `MockPersistentQueueRuntimeAdapter` | Alta (adapter oficial INF-08) | NÃO (será reutilizado pelo `real-tiss`) |
| `MockPersistentQueueRuntimeAdapter` | `DefaultPersistentQueueRuntimeAdapter` | Testes | Baixa/Média | NÃO |
| `PersistentQueueRuntimeFactory` | `PersistentQueueRuntimeRegistry`, `DefaultPersistentQueueRuntimeAdapter`, `MockPersistentQueueRuntimeAdapter` | `createPersistentQueueRuntimePort` | Alta | NÃO |
| `PersistentQueueRuntimeRegistry` | `PersistentQueueRuntimeRegistration`, `DEFAULT_PERSISTENT_QUEUE_RUNTIME_CAPABILITIES` | `PersistentQueueRuntimeFactory` | Alta | NÃO |
| `InMemoryPersistentQueueRuntimeStore` | `CanonicalPersistentQueue`, `CanonicalPersistentMessage`, `CanonicalPersistentEnvelope` | `DefaultPersistentQueueRuntimeAdapter` | Média | SIM (por backend real PostgreSQL/S3/etc, sem alterar o Port) |
| `processTissPersistenceJob` | `QueueRuntimePort`, `PersistentQueueRuntimePort`, `ENTERPRISE_TISS_QUEUE_NAME` | `WorkerQueueConsumer` (via `processTissProtocolSentPersisted`) | Alta | NÃO |
| `processTissProtocolSentPersisted` | `getEnterpriseRuntime`, `WorkerRuntimePort`, `QueueRuntimePort`, `PersistentQueueRuntimePort` | `runtime/index.ts` (entrypoint) | Alta | NÃO |
| `EnterpriseRuntime` | `PersistentQueueRuntimePort` via `createPersistentQueueRuntimePort` | `getEnterpriseRuntime()` | Alta | NÃO |
| `getEnterpriseRuntime` | `createEnterpriseRuntime` | Todo o pipeline TISS | Alta | NÃO |
| `PersistencePort` (genérico) | `PersistenceMechanismId` (supabase/postgres/sqlserver/oracle/mock) | `RealTissPersistenceRuntimeAdapter` (futuro, opcional) | Média | SIM (novo mecanismo) |
| `SupabasePersistenceAdapter` | `getSupabasePublicConfig` | `createPersistencePort` quando `mechanism === "supabase"` | Baixa (não usado em TISS hoje) | SIM |

## 12. Persistence Data Lifecycle

```
PROTOCOL_SENT
  │
  │  processTissProtocolSentPersisted
  │    → WorkerQueueConsumer
  │    → processTissPersistenceJob
  │    → PersistentQueueRuntimePort.persist(...)
  │    → QueueRuntimePort.enqueue({ status: PERSISTED })
  ▼
PERSISTED
  │
  │  (não executado na A8-01)
  │  processTissPersistedAudited (A8-02/A9)
  │    → QueueRuntimePort.enqueue({ status: AUDITED })
  ▼
AUDITED
  │
  │  (não executado na A8-01)
  │  processTissAuditedCompleted (A9)
  │    → QueueRuntimePort.enqueue({ status: COMPLETED })
  ▼
COMPLETED
```

Cada transição ocorre exclusivamente via `getEnterpriseRuntime() → WorkerRuntimePort →
QueueRuntimePort → capability Port`.

## 13. Storage Evolution Strategy

A arquitetura INF-08 permite evoluir para múltiplos backends reais sem alterar
`PersistentQueueRuntimePort`:

| Backend | Mecanismo futuro | Adapter interno | Mapeamento canônico |
|| ------- | ---------------- | --------------- | ------------------- |
| PostgreSQL | `postgres` | `PostgresPersistenceRuntimeAdapter` | `CanonicalPersistentQueue` ↔ tabela `tiss_persistence_queue` |
| Supabase | `supabase` | `SupabasePersistenceRuntimeAdapter` | reutiliza `PersistencePort` Supabase existente |
| SQL Server | `sqlserver` | `SqlServerPersistenceRuntimeAdapter` | tabelas com rowversion / temporal |
| Oracle | `oracle` | `OraclePersistenceRuntimeAdapter` | tabelas com flashback / audit |
| MongoDB | `mongodb` (extensão futura) | `MongoPersistenceRuntimeAdapter` | coleções `tiss_persistence_queue` / `tiss_persistence_message` |
| S3 | `s3` | `S3PersistenceRuntimeAdapter` | prefixo `tiss/{tenant}/{correlationId}/{messageId}` |
| Blob Storage (Azure) | `azure-blob` | `AzureBlobPersistenceRuntimeAdapter` | container `tiss-persistence` |
| In-Memory | `mock` / `test` | `MockPersistenceAdapter` | desenvolvimento/testes |

Troca de mecanismo ocorre via `createPersistentQueueRuntimePort({ provider: "<mechanismo>" })`,
sem mudar `processTissPersistenceJob`, `processTissProtocolSentPersisted`, `EnterpriseRuntime`
nem `getEnterpriseRuntime()`.

## 14. Security Readiness

Requisitos de segurança futuros para a camada de persistência:

- **Criptografia em repouso (encryption at rest):** TDE / AES-256 em PostgreSQL/SQL Server/Oracle;
  SSE-S3 / SSE-KMS no S3 / Azure Blob.
- **Criptografia em trânsito (TLS/mTLS):** TLS 1.3 entre aplicação e banco; mTLS com certificados
  digitais ANS quando for comunicação TISS.
- **Gerenciamento de chaves:** Azure Key Vault / AWS KMS / HashiCorp Vault; nenhuma chave em `src/`.
- **Controle de acesso por tenant:** RLS (PostgreSQL) / row filter (SQL Server) / FGAC (Oracle)
  isolando dados por `tenantId` / `operatorId`.
- **Trilhas de auditoria (audit trail):** tabela/coleção `tiss_audit_log` registrando `who`,
  `what`, `when`, `where`, `correlationId`.
- **Integridade dos dados (hash/checksum):** checksum SHA-256 do payload armazenado; validação
  ao recuperar.
- **Políticas de retenção e descarte:** retenção de 10 anos para TISS (conforme ANS), purge
  automatizado após prazo legal.
- **Conformidade com LGPD:** anonimização / pseudonimização de dados sensíveis; consentimento
  rastreável; Right to be Forgotten via ações em `AuditRuntimePort`.

Nenhum item acima foi implementado; registrado apenas como requisitos arquiteturais futuros.

## 15. Provider Readiness Matrix

| Provider    | Situação    | Produção |
|| ----------- | ----------- | -------- |
|| `mock`      | Pronto      | Não      |
|| `test`      | Pronto      | Não      |
|| `default`   | Pronto      | Não      |
|| `enterprise`| Pronto      | Não      |
|| `real-tiss` | Planejado   | Não      |
|| `supabase`  | Pronto (apenas health/capabilities) | Não (não usado em TISS ainda) |

## 16. Production Readiness Checklist

- [x] arquitetura preservada
- [x] `PersistentQueueRuntimePort` auditado
- [x] provider `real-tiss` identificado
- [x] riscos conhecidos (sem backend persistente real)
- [x] integrações futuras documentadas (PostgreSQL, Supabase, S3, Azure Blob)
- [x] limitações atuais (apenas estrutural, sem I/O)
- [x] dependências externas (ANS, operadoras, certificados, OAuth2)
- [x] critérios para ativação (seguir padrão RealTiss, estender `PersistentQueueRuntimeProviderId`)
- [x] critérios para certificação futura (válido/inválido/retry/dead letter/observability/performance/pipeline)
- [x] Audit e Completed explicitamente não executados

## 17. Riscos e mitigações

| Risco | Impacto | Mitigação | Prioridade |
|| ----- | ------- | --------- | ---------- |
| `RealTissPersistenceRuntimeAdapter` ainda não existe | Alto | Criar adapter na A8-02/A9 seguindo padrão RealTiss | Alta |
| Backend persistente real ainda não está ativado | Alto | Manter `CanonicalPersistentQueue`/`CanonicalPersistentMessage` como contratos; trocar `InMemoryPersistentQueueRuntimeStore` por adapter real sem alterar o Port | Alta |
| Dependência de credenciais/certs de operadora e do banco | Alto | Iniciar provisionamento de credenciais e certificados digitais em paralelo | Média |
| Criptografia/RLS/LGPD ainda não implementados | Médio | Seguir checklist da seção 14 durante a sprint de ativação do backend real | Alta |
| `PersistencePort` genérico não está conectado ao pipeline TISS | Médio | Documentar que TISS usa `PersistentQueueRuntimePort`; `PersistencePort` poderá ser backend interno sem mudar o Port TISS | Média |

## 18. Integrações futuras

- `PostgreSQL` / `Supabase` — persistência real de filas e mensagens.
- `S3` / `Azure Blob` — armazenamento de XML e payloads de lote.
- `AuditRuntimePort` — trilha de auditoria após `PERSISTED`.
- `CompletedRuntimePort` — estado terminal após `AUDITED`.
- `AuthorizationRuntimePort` — controle de acesso por tenant.
- `TISSIntegrationPort` (Bloco H) — comunicação com operadoras após persistência.

## 19. Resultado completo dos greps (sobre `src/`)

|| #  | Padrão                               | Ocorrências | Comentário |
|| -- | ------------------------------------ | ----------- | ---------- |
|| 1  | `getEnterpriseRuntime`               | 174         | Entrypoint principal. |
|| 2  | `PersistentQueueRuntimePort`         | 20+         | Port oficial TISS de Persistence. |
|| 3  | `processTissPersistenceJob`          | 6           | Definição, re-exports e uso. |
|| 4  | `processTissProtocolSentPersisted`   | 2           | Definição + re-export. |
|| 5  | `createPersistentQueueRuntimePort`   | 7           | Factory pública do Port. |
|| 6  | `DefaultPersistentQueueRuntimeAdapter` | 10+       | Adapter oficial INF-08. |
|| 7  | `MockPersistentQueueRuntimeAdapter`  | 4           | Adapter mock/test. |
|| 8  | `PersistencePort`                    | 20+         | Port genérico (não usado no pipeline TISS). |

## 20. Validações executadas

- `npm run build` — sucesso.
- `npx tsc --noEmit` — sucesso.
- `npm run lint` — 0 erros (7 warnings preexistentes).
- `npm run smoke-check` — sucesso.

## 21. Conclusão

A Persistence Runtime (TISS) foi completamente mapeada. Nenhuma alteração
arquitetural foi realizada. `RealTissPersistenceRuntimeAdapter` foi proposto
como provider `real-tiss` do `PersistentQueueRuntimePort`, seguindo o padrão dos
adapters reais anteriores. A ativação futura deverá reutilizar
`DefaultPersistentQueueRuntimeAdapter` e nunca alterar `PersistentQueueRuntimePort`,
`EnterpriseRuntime` ou a arquitetura congelada.

---

## 22. Refinamento 1 — Persistence State Machine

Estados válidos no ciclo TISS:

- `PROTOCOL_SENT` — protocolo selecionado/enviado, aguardando persistência.
- `PERSISTED` — confirmação estrutural de persistência concluída.
- `AUDITED` — trilha de auditoria concluída.
- `COMPLETED` — estado terminal, sem reenfileiramento.

Transições válidas:

```
PROTOCOL_SENT → PERSISTED
PERSISTED → AUDITED
AUDITED → COMPLETED
PERSISTED → PERSISTED (idempotência por correlationId)
```

Transições proibidas:

- `PROTOCOL_SENT` → `AUDITED` sem passar por `PERSISTED`.
- `PERSISTED` → `COMPLETED` sem `AUDITED`.
- Qualquer estado → `PROTOCOL_SENT` (não há rollback para trás).

Rollback permitido:

- `PERSISTED → released` (liberação estrutural do `PersistentQueueRuntimePort`) — **não** desfaz a fila TISS; é uma operação interna de infraestrutura.

Estado terminal: `COMPLETED`.

## 23. Refinamento 2 — Storage Abstraction Matrix

A troca de backend futura ocorrerá via `createPersistentQueueRuntimePort({ provider: "<mechanismo>" })`, sem alterar `PersistentQueueRuntimePort`.

| Mecanismo | Adapter futuro | Tabela/Coleção/Prefixo |
|| --------- | -------------- | ---------------------- |
| PostgreSQL | `PostgresPersistenceRuntimeAdapter` | `tiss_persistence_queue` / `tiss_persistence_message` |
| Supabase | `SupabasePersistenceRuntimeAdapter` | reutiliza `PersistencePort` Supabase | `tiss_persistence_queue` |
| SQL Server | `SqlServerPersistenceRuntimeAdapter` | `TissPersistence.Queue` / `TissPersistence.Message` |
| Oracle | `OraclePersistenceRuntimeAdapter` | `TissPersistenceQueue` / `TissPersistenceMessage` |
| MySQL | `MySqlPersistenceRuntimeAdapter` | `tiss_persistence_queue` / `tiss_persistence_message` |
| MongoDB | `MongoPersistenceRuntimeAdapter` | `tiss_persistence_queue` / `tiss_persistence_message` |
| Azure Blob Storage | `AzureBlobPersistenceRuntimeAdapter` | container `tiss-persistence/{tenant}/{correlationId}/` |
| AWS S3 | `S3PersistenceRuntimeAdapter` | prefixo `tiss/{tenant}/{correlationId}/{messageId}` |
| Google Cloud Storage | `GcsPersistenceRuntimeAdapter` | prefixo `tiss/{tenant}/{correlationId}/{messageId}` |
| MinIO | `MinioPersistenceRuntimeAdapter` | bucket `tiss-persistence`, prefixo `tiss/...` |

## 24. Refinamento 3 — Data Integrity Strategy

Futura estratégia de integridade (não implementada):

- **SHA-256** do payload canônico armazenado junto à mensagem.
- **Hash do XML** TISS gerado, registrado em `CanonicalPersistentMessage.customAttributes.xmlSha256`.
- **Hash do Batch** (conteúdo do manifesto) em `CanonicalPersistentMessage.customAttributes.batchSha256`.
- **Hash do Protocol** (perfil e contexto) em `CanonicalPersistentMessage.customAttributes.protocolSha256`.
- **Checksum** de envelope para detecção de corrupção em trânsito.
- **Verificação pós-recuperação**: após `persist`, recalcular o SHA-256 e comparar com o valor armazenado.
- **Detecção de corrupção**: diferença de checksum gera evento `PERSISTENT_QUEUE_INTEGRITY_FAILURE` para `ObservabilityRuntimePort`.

## 25. Refinamento 4 — Persistence Recovery Strategy

Futura estratégia de recuperação (não implementada):

- **Restart do Worker**: após `release`, reutilizar `previousJobId`/`correlationId` para recomeçar do estado `PROTOCOL_SENT`.
- **Queda do servidor**: store real (PostgreSQL/S3) garante durabilidade; ao subir, `health()` valida consistência.
- **Interrupção da rede**: retry com backoff exponencial via `DefaultPersistentQueueRuntimeAdapter`; DLQ após esgotar.
- **Timeout da operadora**: operação `persist` é idempotente por `messageId`/`correlationId`; reprocessamento seguro.
- **Retomada automática**: Worker consome `PROTOCOL_SENT` ainda não `PERSISTED` e reexecuta `processTissPersistenceJob`.
- **Recuperação do último estado persistido**: `list({ activeOnly: true })` permite identificar mensagens em voo.
- **Idempotência da recuperação**: `messageId` único evita duplicidade; `persisted` flag no atributo canônico.

---

**Conclusão obrigatória:** O Persistence Real Discovery foi concluído sem alterar
qualquer arquivo em `src/`, preservando o Baseline Enterprise congelado. Audit e
Completed permanecem não executados. O Enterprise Runtime Baseline v1.0 permanece
integralmente preservado.
