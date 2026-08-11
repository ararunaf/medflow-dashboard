# ARC-26 — Enterprise Runtime Final Architecture Certification

| Campo | Valor |
|-------|-------|
| Sprint | ARC-26 — Final Architecture Certification |
| Projeto | MedicFlow-AI |
| Data | 2026-08-11 |
| Natureza | Documentação / Certificação (sem alteração de `src/`) |
| Status | **HOMOLOGADO** |

---

## 1. Objetivo

Certificar que, após a ativação completa do pipeline funcional TISS (01D → 05B), a arquitetura Enterprise permanece íntegra, com um único pipeline oficial, um único composition root e ausência de Dual Path, pipelines paralelos, runtimes paralelos ou composition roots alternativos.

---

## 2. Arquitetura final

### 2.1 Pipeline operacional único

```text
Produto
  ↓
getEnterpriseRuntime()
  ↓
SchedulerRuntimePort
  ↓
WorkerRuntimePort
  ↓
QueueRuntimePort
  ↓
Dead Letter
  ↓
Observability
```

### 2.2 Pipeline funcional TISS único

```text
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
  ↓
AUDITED
  ↓
COMPLETED  (terminal — sem reenfileiramento)
```

### 2.3 Regra da capability única

Cada Sprint ativou **exatamente uma** capability, consumindo o status imediatamente anterior e produzindo o próximo. Nenhuma capability pula etapas, chama outras capabilities diretamente ou cria saídas múltiplas. Toda comunicação entre capabilities ocorre exclusivamente via `QueueRuntimePort`.

---

## 3. Lista completa das capabilities homologadas

| Sprint | Input | Capability | Output | Port utilizado |
|--------|-------|------------|--------|----------------|
| **01D** | Documento recebido | Entrada / enqueue | `RECEIVED` | `QueueRuntimePort` |
| **01A** | `RECEIVED` | OCR | `OCR_COMPLETED` | `OCRRuntimePort` |
| **01B** | `OCR_COMPLETED` | Parser / Extraction | `PARSED` | `DocumentExtractionRuntimePort` |
| **01C** | `PARSED` | Parser / Extraction | `PARSED` | `DocumentExtractionRuntimePort` |
| **02A** | `PARSED` | Validation | `VALIDATED` | `ValidationRuntimePort` |
| **02B** | `VALIDATED` | Enrichment | `ENRICHED` | `AutoFillRuntimePort` |
| **03A** | `ENRICHED` | XML TISS | `XML_GENERATED` | `XMLTISSRuntimePort` |
| **03B** | `XML_GENERATED` | Batch | `BATCH_CREATED` | `BatchRuntimePort` |
| **04A** | `BATCH_CREATED` | Protocol | `PROTOCOL_SENT` | `ProtocolRuntimePort` |
| **04B** | `PROTOCOL_SENT` | Persistence | `PERSISTED` | `PersistentQueueRuntimePort` |
| **05A** | `PERSISTED` | Audit | `AUDITED` | `AuditRuntimePort` |
| **05B** | `AUDITED` | Completed (terminal) | `COMPLETED` | infraestrutura oficial (sem Port novo) |

> Nota: TISS-RUNTIME-01A e 01C compartilham a mesma base de Parser / Extraction, mas cada um representa um estágio distinto na documentação de Discovery.

---

## 4. Resumo das RULES de arquitetura

| Regra | Descrição | Status |
|-------|-----------|--------|
| **Único pipeline funcional** | Apenas o pipeline `RECEIVED → COMPLETED` existe. | ✓ |
| **Único pipeline operacional** | `getEnterpriseRuntime() → Scheduler → Worker → Queue → Dead Letter → Observability`. | ✓ |
| **Único entrypoint** | `getEnterpriseRuntime()` é a única porta de entrada operacional. | ✓ |
| **Sem Dual Path** | Nenhum código ativo cria, documenta ou habilita Dual Path. | ✓ |
| **Sem pipeline paralelo** | Não há segundo pipeline de execução Enterprise. | ✓ |
| **Sem gateway paralelo** | Não há segundo gateway de runtime. | ✓ |
| **Sem runtime paralelo** | Não há segundo composition root de runtime. | ✓ |
| **Capabilties isoladas por fila** | Cada capability se comunica via `QueueRuntimePort`, sem chamadas diretas entre capabilities. | ✓ |
| **Completed é terminal** | `COMPLETED` não reenfileira e não retorna ao pipeline. | ✓ |
| **Sem novos Ports/Gateways/Runtimes** | TISS 01D–05B reutilizaram Ports existentes; nenhum novo Port foi criado. | ✓ |

---

## 5. Mapa final dos Ports

### 5.1 Ports de infraestrutura obrigatórios

| Port | Papel |
|------|-------|
| `QueueRuntimePort` | Enqueue / dequeue / peek / ack / nack / stats |
| `WorkerRuntimePort` | Consumo de mensagens via `WorkerQueueConsumer` |
| `SchedulerRuntimePort` | Decisão de quando acionar o Worker |
| `Retry` | Infraestrutura de reenvio via Ports existentes |
| `DeadLetter` | Armazenamento de falhas |
| `ObservabilityRuntimePort` | Métricas / health / diagnostics somente-leitura |

### 5.2 Ports de domínio utilizados pelo pipeline TISS

| Port | Capability |
|------|------------|
| `OCRRuntimePort` | OCR (01B) |
| `DocumentExtractionRuntimePort` | Parser (01C) |
| `ValidationRuntimePort` | Validation (02A) |
| `AutoFillRuntimePort` | Enrichment (02B) |
| `XMLTISSRuntimePort` | XML TISS (03A) |
| `BatchRuntimePort` | Batch (03B) |
| `ProtocolRuntimePort` | Protocol (04A) |
| `PersistentQueueRuntimePort` | Persistence (04B) |
| `AuditRuntimePort` | Audit (05A) |

> Não existe `CompletedRuntimePort` no repositório. A Sprint 05B encerrou o job utilizando exclusivamente a infraestrutura Enterprise homologada.

---

## 6. Mapa final dos Gateways

Nenhum novo Gateway foi criado para o pipeline TISS. Os entrypoints (`process-tiss-*.ts`) residem na camada `src/lib/enterprise/runtime/` e consomem `getEnterpriseRuntime()`. Não há:

- `TissOcrGateway`
- `TissParserGateway`
- `TissXmlGateway`
- `TissBatchGateway`
- `TissProtocolGateway`
- `TissPersistenceGateway`
- `TissAuditGateway`
- `TissCompletedGateway`

A comunicação entre capabilities é feita exclusivamente por mensagens na fila `enterprise-tiss` (`QueueRuntimePort`).

---

## 7. Mapa final dos Runtimes

Nenhum novo Runtime foi criado. O único composition root operacional continua sendo `getEnterpriseRuntime()` / `createEnterpriseRuntime()`. Não há:

- `TissOcrRuntime`
- `TissParserRuntime`
- `TissValidationRuntime`
- `TissEnrichmentRuntime`
- `TissXmlRuntime`
- `TissBatchRuntime`
- `TissProtocolRuntime`
- `TissPersistenceRuntime`
- `TissAuditRuntime`
- `TissCompletedRuntime`

---

## 8. Resultado dos greps

Auditoria executada no diretório `src/` com os termos solicitados:

| Padrão | Ocorrências em `src/` | Interpretação |
|--------|----------------------|---------------|
| `DualPath` | 0 | Nenhum artefato nomeado DualPath. |
| `Dual Path` | 10 | Ocorrências apenas em comentários negativos (`Sem Dual Path. Sem flag de fallback...`). Nenhuma implementação. |
| `createRuntime` | 14 | Uso restrito a factories oficiais (ex: `createEnterpriseRuntime`, `createOCRProviderPort`). Sem runtime paralelo. |
| `new \w+Runtime` | 339 | Construções de testes e de adapters canônicos; nenhuma indicação de `new Tiss*Runtime` ou composition root paralelo. |
| `Queue bypass` / `bypass.*Queue` | 10 | Ocorrências em comentários e testes que proíbem bypass; nenhuma implementação. |
| `getEnterpriseRuntime` | 174 | Único entrypoint operacional em toda a base. |

### 8.1 Conclusão dos greps

- `DualPath` inexistente.
- `Dual Path` referenciado apenas para reforçar que foi eliminado.
- Não existem `new Tiss*Runtime`, `new Tiss*Gateway` ou criação de pipeline paralelo.
- `getEnterpriseRuntime()` é o único padrão de entrypoint de runtime encontrado.

---

## 9. Evidência de zero alteração em `src/`

A Sprint ARC-26 foi exclusivamente de certificação. Nenhum arquivo em `src/` ou `scripts/enterprise/tests/` foi alterado. O único artefato novo é este documento.

### 9.1 Verificações executadas

| Comando | Resultado |
|---------|-----------|
| `git status` | Working tree limpo; nenhuma modificação em `src/`. |
| `npm run build` | ✓ `built in 8.14s` |
| `npx tsc --noEmit` | ✓ exit 0 |
| `npm run lint` | ✓ 0 erros (7 warnings preexistentes, nenhum relacionado a TISS/Enterprise) |
| `npm run smoke-check` | ✓ pass |

---

## 10. Conclusão

A arquitetura Enterprise do MedicFlow-AI foi certificada. Existe um único pipeline oficial, um único entrypoint (`getEnterpriseRuntime`), ausência de Dual Path e o ciclo funcional `RECEIVED → COMPLETED` encontra-se integralmente homologado.

---

## 11. Referências

- [`ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`](./ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md)
- [`TISS_RUNTIME_DISCOVERY.md`](./TISS_RUNTIME_DISCOVERY.md)
- [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md)
