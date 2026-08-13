# Enterprise Runtime Baseline v1.1 — A8-FREEZE-01

| Campo      | Valor                       |
| ---------- | --------------------------- |
| Projeto    | MedicFlow-AI                |
| Baseline   | Enterprise Runtime v1.1     |
| Sprint     | A8-FREEZE-01                |
| Status     | Congelada                   |
| Atualizado | Sprint A8-ADL-01            |

---

## 1. Objetivo da Baseline

Congelar oficialmente a arquitetura Enterprise Runtime certificada após a conclusão da **A8-E2E-01**. A partir deste documento, toda evolução funcional deverá partir da `Enterprise Runtime Baseline v1.1` e respeitar as regras de congelamento aqui estabelecidas.

## 2. Arquitetura Congelada

A arquitetura é composta exclusivamente por:

- `DefaultEnterpriseRuntime` como ponto de acesso único via `getEnterpriseRuntime()`.
- Ports existentes resolvidos por `Factory`/`Registry` oficiais.
- Worker operacional `DefaultWorkerRuntimeAdapter` consumindo via `QueueRuntimePort`.
- `Retry`, `Dead Letter` e `Observability` reutilizados.
- Nenhum `Runtime`, `Port`, `Gateway`, `Pipeline` ou `Composition Root` adicional.

## 3. Lista Completa dos RuntimePorts Certificados

| RuntimePort | Capability | Provider | Adapter | Status |
| --- | --- | --- | --- | --- |
| `OCRRuntimePort` | OCR | `mock` / `azure` | `DefaultOCRRuntimeAdapter` / Azure | Production Certified |
| `DocumentExtractionRuntimePort` | Parser | `real-tiss` | `RealTissDocumentExtractionRuntimeAdapter` | Production Certified |
| `ValidationRuntimePort` | Validation | `real-tiss` | `RealTissValidationRuntimeAdapter` | Production Certified |
| `AutoFillRuntimePort` | Enrichment | `real-tiss` | `RealTissAutoFillRuntimeAdapter` | Production Certified |
| `XMLTISSRuntimePort` | XML | `real-tiss` | `RealTissXMLTISSRuntimeAdapter` | Production Certified |
| `BatchRuntimePort` | Batch | `real-tiss` | `RealTissBatchRuntimeAdapter` | Production Certified |
| `ProtocolRuntimePort` | Protocol | `real-tiss` | `RealTissProtocolRuntimeAdapter` | Production Certified |
| `PersistentQueueRuntimePort` | Persistence | `real-tiss` | `RealTissPersistenceRuntimeAdapter` | Production Certified |

Infraestrutura congelada (reutilizada em toda a cadeia):

- `QueueRuntimePort`
- `WorkerRuntimePort`
- `SchedulerRuntimePort`
- `ObservabilityRuntimePort`
- `Retry` / `Dead Letter`

## 4. Providers Production

| Capability | Provider ID | Adapter | Versão |
| --- | --- | --- | --- |
| OCR | `azure` | Azure Document Intelligence | 1.0.0 |
| Document Extraction | `real-tiss` | `RealTissDocumentExtractionRuntimeAdapter` | 1.0.0 |
| Validation | `real-tiss` | `RealTissValidationRuntimeAdapter` | 1.0.0 |
| Enrichment | `real-tiss` | `RealTissAutoFillRuntimeAdapter` | 1.0.0 |
| XML Generation | `real-tiss` | `RealTissXMLTISSRuntimeAdapter` | 1.0.0 |
| Batch | `real-tiss` | `RealTissBatchRuntimeAdapter` | 1.0.0 |
| Protocol | `real-tiss` | `RealTissProtocolRuntimeAdapter` | 1.0.0 |
| Persistence | `real-tiss` | `RealTissPersistenceRuntimeAdapter` | 1.0.0 |

## 5. Pipeline Oficial

```
RECEIVED
  → OCR_COMPLETED
  → PARSED
  → VALIDATED
  → ENRICHED
  → XML_GENERATED
  → BATCH_CREATED
  → PROTOCOL_SENT
  → PERSISTED
```

O pipeline só pode ser executado via `getEnterpriseRuntime()`. Nenhum adapter concreto pode ser chamado diretamente.

## 6. State Machine Oficial

```
RECEIVED
  ↓
OCR_COMPLETED
  ↓
PARSED
  ↓
VALIDATED
  ↓
ENRICHED
  ↓
XML_GENERATED
  ↓
BATCH_CREATED
  ↓
PROTOCOL_SENT
  ↓
PERSISTED
```

Transições fora deste grafo não fazem parte da `Baseline v1.1`.

## 7. Componentes Congelados

- `DefaultEnterpriseRuntime`
- `EnterpriseRuntimeOptions` / `EnterpriseRuntime`
- `QueueRuntimePort` e `DefaultQueueRuntimeAdapter`
- `WorkerRuntimePort` e `DefaultWorkerRuntimeAdapter`
- `SchedulerRuntimePort` e `DefaultSchedulerRuntimeAdapter`
- `ObservabilityRuntimePort` e `DefaultObservabilityRuntimeAdapter`
- `Retry` e `Dead Letter` via `QueueRuntimePort`
- `OCRRuntimePort`, `DocumentExtractionRuntimePort`, `ValidationRuntimePort`, `AutoFillRuntimePort`, `XMLTISSRuntimePort`, `BatchRuntimePort`, `ProtocolRuntimePort`, `PersistentQueueRuntimePort`
- Factories e Registries oficiais de cada RuntimePort
- Todos os `processTiss*` entrypoints (`processTissReceivedOcr`, `processTissOcrParsed`, `processTissParsedValidated`, `processTissValidatedEnriched`, `processTissEnrichedXmlGenerated`, `processTissXmlGeneratedBatchCreated`, `processTissBatchCreatedProtocolSent`, `processTissProtocolSentPersisted`)

## 8. Componentes Pendentes

- `AuditRuntimePort` — permanece em Discovery.
- `CompletedRuntimePort` — permanece em Discovery.
- `XMLValidationRuntimePort` — permanece em Discovery.
- `SOAPRuntimePort` — permanece em Discovery.
- `OperatorRuntimePort` — permanece em Discovery.
- `ReturnRuntimePort` — permanece em Discovery.
- Backend persistente real (PostgreSQL/Supabase/S3) — previsto para fase A9/Enterprise Security.

## 9. Baseline Freeze Matrix

| Capability | Status | Baseline |
| --- | --- | --- |
| OCR | Production Certified | Frozen |
| Parser | Production Certified | Frozen |
| Validation | Production Certified | Frozen |
| Enrichment | Production Certified | Frozen |
| XML | Production Certified | Frozen |
| Batch | Production Certified | Frozen |
| Protocol | Production Certified | Frozen |
| Persistence | Production Certified | Frozen |
| Audit | Pending | — |
| Completed | Pending | — |

## 10. Known Canonical Gaps

Os campos abaixo ainda **não** são propagados integralmente pelo `CanonicalQueueMessage` / `customAttributes` do pipeline TISS. São limitações conhecidas do contrato canônico atual e **não** são regressões.

- `tenantId` — não integrado ao `customAttributes` canônico.
- `runtimeId` — presente apenas como identidade do `EnterpriseRuntime`, não em cada job.
- `traceId` — não integrado ao `customAttributes` canônico.
- `payload` completo — o pipeline preserva `payloadRef`, não o conteúdo binário.
- `telemetry` — disponível em cada `RuntimePort`, não no `CanonicalQueueMessage`.

Estes gaps serão tratados nas futuras fases de `Audit` e `Enterprise Security`.

## 11. Enterprise Freeze Rules

1. **Nenhum Runtime paralelo poderá ser criado.**
2. **Nenhum Port paralelo poderá ser criado.**
3. **Nenhum Gateway paralelo poderá ser criado.**
4. **Nenhum Pipeline paralelo poderá ser criado.**
5. **Nenhum Composition Root paralelo poderá ser criado.**
6. **Nenhum bypass de `getEnterpriseRuntime()` será permitido.**
7. **Toda nova capability deverá reutilizar `Factory`, `Registry` e `Runtime` existentes.**
8. **Toda nova função `processTiss*` deverá ser adicionada sem alterar os entrypoints congelados.**
9. **Audit e Completed só poderão ser ativados após aprovação explícita da Sprint seguinte.**
10. **A `Enterprise Runtime Baseline v1.1` só poderá ser alterada por uma nova versão de baseline formalmente aprovada.**

## 12. Regras para Futuras Evoluções

- Toda nova Sprint deverá apresentar a diferença (`git diff`) em relação a este baseline.
- Mudanças em `src/` devem ser justificadas e aprovadas.
- Testes de certificação (`enterprise-end-to-end-certification.test.ts`) devem continuar passando.
- `getEnterpriseRuntime()` deve permanecer como único entrypoint.
- Nenhum bypass arquitetural será aceito.

## 13. Confirmações

- ✅ Zero alterações em `src/`.
- ✅ `Audit` permanece pendente.
- ✅ `Completed` permanece pendente.
- ✅ `Enterprise Runtime Baseline v1.1` oficialmente congelada.
- ✅ Toda evolução futura deverá partir desta baseline.

## 14. Architectural Decision Log

- As decisões arquitetônicas oficiais da `Enterprise Runtime Baseline v1.1` estão registradas em `docs/enterprise/ARCHITECTURAL_DECISION_LOG.md`.
- O ADL estabelece ADL-001 a ADL-009, Architectural Principles, Decision Dependency Matrix, Violation Examples e Future Evolution Rules.
- Nenhuma decisão do ADL pode ser alterada sem aprovação formal de uma nova baseline.

---

## A10 Supplement — Certified Capabilities Addendum to Baseline v1.1

Este suplemento registra que as capabilities `Audit` (Sprint A9-03) e `Completed` (Sprint A10-03) foram certificadas como **addendum** à `Enterprise Runtime Baseline v1.1`, sem alterar as seções congeladas, State Machine, Freeze Rules ou componentes arquiteturais originais.

### Pipeline completo certificado

```
RECEIVED
  → OCR_COMPLETED
  → PARSED
  → VALIDATED
  → ENRICHED
  → XML_GENERATED
  → BATCH_CREATED
  → PROTOCOL_SENT
  → PERSISTED
  → AUDITED
  → COMPLETED
```

### RuntimePorts certificados (Baseline v1.1 + addendum)

| RuntimePort | Capability | Provider | Adapter | Status |
| --- | --- | --- | --- | --- |
| `OCRRuntimePort` | OCR | `mock` / `azure` | `DefaultOCRRuntimeAdapter` / Azure | Production Certified |
| `DocumentExtractionRuntimePort` | Parser | `real-tiss` | `RealTissDocumentExtractionRuntimeAdapter` | Production Certified |
| `ValidationRuntimePort` | Validation | `real-tiss` | `RealTissValidationRuntimeAdapter` | Production Certified |
| `AutoFillRuntimePort` | Enrichment | `real-tiss` | `RealTissAutoFillRuntimeAdapter` | Production Certified |
| `XMLTISSRuntimePort` | XML | `real-tiss` | `RealTissXMLTISSRuntimeAdapter` | Production Certified |
| `BatchRuntimePort` | Batch | `real-tiss` | `RealTissBatchRuntimeAdapter` | Production Certified |
| `ProtocolRuntimePort` | Protocol | `real-tiss` | `RealTissProtocolRuntimeAdapter` | Production Certified |
| `PersistentQueueRuntimePort` | Persistence | `real-tiss` | `RealTissPersistenceRuntimeAdapter` | Production Certified |
| `AuditRuntimePort` | Audit | `real-tiss` | `RealTissAuditRuntimeAdapter` | Production Certified |
| `CompletedRuntimePort` | Completed | `real-tiss` | `RealTissCompletedRuntimeAdapter` | Production Certified |

### Confirmação de congelamento

- Nenhum `Runtime`, `Port`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Pipeline`, `Composition Root` ou `Foundation` foi modificado.
- Nenhum adapter concreto é chamado fora das factories/registries oficiais.
- `getEnterpriseRuntime()` permanece o único ponto de entrada.
- Toda a certificação de `Audit` e `Completed` ocorreu reutilizando exclusivamente a arquitetura, ports e infraestrutura congelados da `Baseline v1.1`.

### Nova baseline

Uma futura `Enterprise Runtime Baseline v1.2` requer aprovação formal no `Architectural Decision Log` e novo registro de baseline, conforme regras de evolução congeladas.
