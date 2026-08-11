# TISS-RUNTIME-01D — Discovery da Arquitetura Funcional do TISS Runtime

| Campo | Valor |
|-------|-------|
| Sprint | **TISS-RUNTIME-01D** |
| Projeto | MedicFlow-AI |
| Data | 2026-08-11 |
| Natureza | **Discovery documental apenas** (sem alteração de código) |
| Status | **CONCLUÍDA — referência obrigatória para sprints TISS-RUNTIME** |
| Arquitetura base | [`ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`](./ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md) (**CONGELADA**) |
| Entrypoint único | `getEnterpriseRuntime()` |
| Pipeline operacional imutável | Enterprise Canonical Runtime Pipeline |

---

## 1. Declaração

Este documento define exclusivamente o **pipeline funcional oficial** do processamento TISS sobre a arquitetura Enterprise já congelada (ARC-25) e a infraestrutura operacional homologada (OPER-INF-Q/W/S/D/O/R).

**TISS-RUNTIME-01D não implementa código.** Não altera `src/`, Runtime, Ports, Gateways nem a arquitetura. Não cria pipeline paralelo.

Toda implementação futura (a partir de **TISS-RUNTIME-01A**) **deve** reutilizar exclusivamente:

1. `getEnterpriseRuntime()` como composition root
2. Ports já existentes
3. Cadeia operacional oficial Scheduler → Retry → Worker → Queue → Dead Letter (+ Observability)
4. Gateways ViaEnterprise já autorizados pelo cutover EPC-24E

Qualquer desvio exige entrada no [`ARCHITECTURAL_EXCEPTION_REGISTER.md`](./ARCHITECTURAL_EXCEPTION_REGISTER.md).

---

## 2. Integração com Enterprise Runtime (imutável)

### 2.1 Pipeline operacional oficial (infraestrutura)

```text
getEnterpriseRuntime()
  ↓
SchedulerRuntimePort
  ↓
Retry (DefaultRetryInfrastructure — OPER-INF-R; NÃO é Port)
  ↓
WorkerRuntimePort
  ↓
QueueRuntimePort
  ↓
DeadLetterRuntimePort → QueueRuntimePort (isolamento enterprise-dead-letter)
  ↓
ObservabilityRuntimePort (somente leitura)
```

Esta cadeia é **imutável**. O TISS Runtime **não** substitui, duplica ou contorna nenhuma etapa.

### 2.2 Papel do TISS no composition root

```text
Produto (Capture / TISS Server Fns / Gateways ViaEnterprise)
  ↓
resolveCaptureEnterpriseRuntime() ≡ getEnterpriseRuntime()
  ↓
Ports oficiais (OCR / Extraction / Validation / Audit / TISS / XML / Batch / Protocol / INF…)
  ↓
Adapters (implementação atrás dos Ports)
```

O domínio TISS é **capacidade funcional** ativada sobre Ports existentes. O Enterprise Runtime permanece o único composition root; não embute regra de negócio especializada.

### 2.3 Infraestrutura homologada (pré-requisito)

| Sprint | Status |
|--------|--------|
| OPER-INF-Q | ✓ Queue persistente |
| OPER-INF-W | ✓ Worker operacional |
| OPER-INF-S | ✓ Scheduler operacional |
| OPER-INF-D | ✓ Dead Letter operacional |
| OPER-INF-O | ✓ Observability (leitura) |
| OPER-INF-R | ✓ Retry operacional |
| ARC-25 | ✓ Arquitetura oficial congelada |

---

## 3. Pipeline funcional oficial do processamento TISS

O pipeline funcional descreve **o que** ocorre com o boletim. A execução assíncrona / reprocessamento / falha definitiva ocorre **sempre** via a cadeia operacional da §2.1.

```text
[ENTRADA] Boletim TISS (upload / sessão Capture)
    ↓
getEnterpriseRuntime()
    ↓
① Intake / Document Intake (DocumentIntake* / CaptureEngineRuntimePort)
    ↓
② OCR (OCRRuntimePort → OCRProviderPort)
    ↓
③ Parser / Extraction (DocumentExtractionRuntimePort [+ Classification])
    ↓
④ Validação de domínio (ValidationRuntimePort + RulePackEnginePort + TISSCatalogPort)
    ↓
⑤ Enriquecimento (AutoFillRuntimePort + TISSMappingRuntimePort [+ Contract ViaEnterprise])
    ↓
⑥ XML TISS (TISSRuntimePort / XMLTISSRuntimePort
              → XMLRuntimePort → Generation → Serializer → Schema
              → XMLValidation → XSD → Namespace)
    ↓
⑦ Lote (BatchRuntimePort)
    ↓
⑧ Protocolo (ProtocolRuntimePort [+ SOAPRuntimePort quando autorizado])
    ↓
⑨ Persistência (Storage* / stores Enterprise / persistência de produto via Ports)
    ↓
⑩ Auditoria (AuditRuntimePort)
    ↓
[SAÍDA] Artefatos TISS (XML / lote / protocolo / findings) + métricas (Observability)

Falhas transitórias → Retry (OPER-INF-R) → reagenda via Scheduler → Worker reexecuta
Falhas definitivas  → Dead Letter (OPER-INF-D)
```

### 3.1 Diagrama oficial (pipeline funcional + operacional)

```text
                         ┌─────────────────────────────────────────┐
                         │           PRODUTO / GATEWAYS            │
                         │  Capture Server Fns · TISS Server Fns   │
                         │         ViaEnterprise (EPC-24E)         │
                         └───────────────────┬─────────────────────┘
                                             │
                                             ▼
                               getEnterpriseRuntime()
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
     SchedulerRuntimePort          ObservabilityRuntimePort        Ports funcionais TISS
              │                     (somente leitura)               (①…⑩ acima)
              ▼                              │                              │
     Retry (OPER-INF-R)                      │                              │
              │                              │                              │
              ▼                              │                              │
     WorkerRuntimePort ◄─────────────────────┴────── consome mensagens ─────┘
              │
              ▼
     QueueRuntimePort ──► Backend persistente
              │
              ▼ (maxAttempts excedido)
     DeadLetterRuntimePort → QueueRuntimePort (DLQ)
```

**Leitura canônica:** o Worker é o **único executor** operacional; os estágios ①–⑩ são capacidades acionadas sob Ports obtidos do Runtime; Retry **nunca executa** — apenas agenda; Dead Letter **nunca decide retry** — apenas armazena; Observability **nunca altera o fluxo**.

---

## 4. Ciclo completo do boletim TISS

| Fase | Nome | Descrição | Port(s) oficiais |
|------|------|-----------|------------------|
| E0 | Entrada | Upload / criação de sessão / registro de intake | `DocumentIntakePort` / `DocumentIntakeRuntimePort` / `CaptureEngineRuntimePort` |
| E1 | OCR | Extração óptica do documento | `OCRRuntimePort` → `OCRProviderPort` |
| E2 | Parser | Estruturação / extração de campos do boletim | `DocumentExtractionRuntimePort` (+ `DocumentClassificationRuntimePort`) |
| E3 | Validação | Regras de domínio / packs / catálogo | `ValidationRuntimePort`, `RulePackEnginePort`, `TISSCatalogPort` |
| E4 | Enriquecimento | Preenchimento / mapeamento / contrato | `AutoFillRuntimePort`, `TISSMappingRuntimePort` |
| E5 | XML TISS | Materialização e cadeia XML oficial | `TISSRuntimePort`, `XMLTISSRuntimePort`, `XMLRuntimePort`…`NamespaceRuntimePort` |
| E6 | Lote | Agrupamento em lote TISS | `BatchRuntimePort` |
| E7 | Protocolo | Resolução / encapsulamento de protocolo | `ProtocolRuntimePort` |
| E8 | Persistência | Retenção de artefatos e estado | Storage Ports / stores atrás dos Ports |
| E9 | Auditoria | Findings / trilha preventiva | `AuditRuntimePort` |
| R | Retry | Reagendamento de tentativa | DefaultRetryInfrastructure + Scheduler/Worker/Queue |
| DLQ | Dead Letter | Destino definitivo de falha | `DeadLetterRuntimePort` → `QueueRuntimePort` |
| O | Observabilidade | Métricas / health / diagnostics | `ObservabilityRuntimePort` |

Estados lógicos do boletim (discovery): `RECEIVED` → `OCR` → `PARSED` → `VALIDATED` → `ENRICHED` → `XML_READY` → `BATCHED` → `PROTOCOL_RESOLVED` → `PERSISTED` / `AUDITED` → `COMPLETED` | `RETRYING` | `DEAD_LETTER`.

---

## 5. Pontos de entrada e saída

### 5.1 Entradas oficiais

| Entrada | Caminho autorizado | Proibido |
|---------|--------------------|----------|
| Upload / retry de captura | Server Fns Capture → `resolveCaptureEnterpriseRuntime()` → Intake + pipeline bound | Instanciar Adapters; engines diretas |
| Estágios Capture (OCR/Parser/Audit/…) | Gateways `*-via-enterprise.ts` sob `src/lib/capture/enterprise/` | Dual Path / segundo composition root |
| Operações TISS produto | `tiss-server` / Gateways ViaEnterprise → Runtime | Importar stores/adapters Enterprise |
| Processamento TISS estrutural | `getEnterpriseRuntime()` → `TISSRuntimePort.process()` | Bypass do Orchestrator / Provider |

Composition root único: **`getEnterpriseRuntime()`** (alias Capture: `resolveCaptureEnterpriseRuntime()`).

### 5.2 Saídas oficiais

| Saída | Destino |
|-------|---------|
| Texto OCR / campos parseados | Sessão Capture / metadata via Ports |
| Findings de validação / auditoria | `AuditRuntimePort` / Quality (quando aplicável) |
| XML TISS | Cadeia XML Ports / artefato de exportação via gateway autorizado |
| Lote | `BatchRuntimePort` |
| Protocolo | `ProtocolRuntimePort` |
| Falha transitória | Retry → nova mensagem/agendamento |
| Falha definitiva | Dead Letter |
| Telemetria | `ObservabilityRuntimePort` (somente leitura) |

---

## 6. Respostas obrigatórias (Discovery)

### 1. Como um boletim TISS entra no sistema?

Entra pelo **produto Capture** (upload / `retry-upload`) via Server Functions autorizadas, que resolvem o composition root `resolveCaptureEnterpriseRuntime()` ≡ **`getEnterpriseRuntime()`**, registram o documento no **Document Intake** (`registerCaptureDocumentIntakeBridge` / Ports de Intake) e disparam a cadeia operacional bound. Futuras ativações assíncronas **enfileiram** o trabalho via `QueueRuntimePort` (nunca fila crua). Não há segunda porta de entrada oficial.

### 2. Onde ocorre OCR?

Em **`OCRRuntimePort`** (→ `OCRProviderPort`), acionado pelo gateway oficial `process-ocr-via-enterprise`. É o estágio ② do pipeline funcional. Execução operacional assíncrona futura: Worker consome mensagem e invoca o mesmo Port — sem OCR paralelo fora do Runtime.

### 3. Onde ocorre Parser?

Em **`DocumentExtractionRuntimePort`** (com classificação via `DocumentClassificationRuntimePort` quando aplicável), acionado por `process-parser-via-enterprise`. É o estágio ③. `XMLRuntimePort.parse` é parser XML genérico — **não** substitui o parser de boletim.

### 4. Onde ocorre Validação?

Em três camadas **complementares**, todas via Ports do Runtime:

| Camada | Port |
|--------|------|
| Validação Capture / estrutural | `ValidationRuntimePort` |
| Regras TISS / packs | `RulePackEnginePort` + `TISSCatalogPort` |
| Validação XML / XSD / Namespace | `XMLValidationRuntimePort`, `XSDRuntimePort`, `NamespaceRuntimePort` |

Não criar ValidationPort paralelo.

### 5. Onde ocorre Enriquecimento?

**Não existe `EnrichmentPort` dedicado** (e é **proibido** criá-lo nesta trilha). Enriquecimento oficial reutiliza:

- `AutoFillRuntimePort`
- `TISSMappingRuntimePort`
- Gateways Contract / Risk ViaEnterprise (coordenação sob o mesmo Runtime)

Estágio ⑤ do pipeline funcional.

### 6. Onde ocorre XML TISS?

Na cadeia oficial TISS-01…10 / Bloco C:

```text
TISSRuntimePort / XMLTISSRuntimePort
  → XMLRuntimePort
    → XMLGenerationRuntimePort
    → XMLSerializerRuntimePort
    → XMLSchemaRuntimePort
    → XMLValidationRuntimePort
    → XSDRuntimePort
    → NamespaceRuntimePort
```

Estágio ⑥. Superfícies legado de exportação produto devem convergir para estes Ports (sem Dual Path permanente).

### 7. Onde ocorre Lote?

Em **`BatchRuntimePort`** (estágio ⑦). Agrupamento, preparação e fechamento de lote TISS ocorrem exclusivamente por este Port — sem Batch engine paralela no produto como composition root.

### 8. Onde ocorre Protocolo?

Em **`ProtocolRuntimePort`** (estágio ⑧). Transporte SOAP, quando autorizado por Sprint futura, permanece atrás de Ports já existentes (`SOAPRuntimePort`) — sem Gateway/Runtime novos.

### 9. Onde ocorre Persistência?

- **Mensagens / jobs:** `QueueRuntimePort` (+ backend persistente OPER-INF-Q)
- **Artefatos de documento:** Storage Ports (`StorageManagerRuntimePort` / `StorageProviderPort`) atrás do Runtime
- **Estado de sessões TISS estruturais:** stores internos dos Adapters (atrás dos Ports)
- **`PersistencePort`:** foundation existente; **não** é superfície nova a criar; não autoriza DB direto pelo domínio TISS

Persistência de domínio TISS **nunca** acessa banco fora dos Ports/adapters autorizados.

### 10. Onde ocorre Auditoria?

Em **`AuditRuntimePort`**, acionado por `process-audit-via-enterprise` (estágio ⑩). Findings preventivos e trilha de auditoria do boletim passam por este Port — sem auditoria paralela fora do Runtime.

### 11. Onde ocorre Retry?

Na **Retry Infrastructure operacional (OPER-INF-R)** — `DefaultRetryInfrastructure` — reutilizando exclusivamente:

- `SchedulerRuntimePort` (tempo / backoff)
- `WorkerRuntimePort` (execução)
- `QueueRuntimePort` (transporte)

Retry **nunca executa** processamento TISS; apenas decide e agenda. Após `maxAttempts`, destino = Dead Letter.

### 12. Onde ocorre Dead Letter?

Em **`DeadLetterRuntimePort`** → `QueueRuntimePort` (isolamento `enterprise-dead-letter`), homologado em OPER-INF-D. Dead Letter **não** decide reenvio e **não** contém regra TISS — apenas armazenamento definitivo de falhas.

---

## 7. Reutilização dos Ports existentes

### 7.1 Componentes existentes reutilizados (obrigatório)

| Domínio | Ports / contratos |
|---------|-------------------|
| Composition root | `getEnterpriseRuntime()` |
| Intake / Capture | `DocumentIntakePort`, `DocumentIntakeRuntimePort`, `CaptureEngineRuntimePort` |
| OCR | `OCRRuntimePort`, `OCRProviderPort` |
| Parser / Classification | `DocumentExtractionRuntimePort`, `DocumentClassificationRuntimePort` |
| Validação / Regras / Catálogo | `ValidationRuntimePort`, `RulePackEnginePort`, `TISSCatalogPort`, `TISSProviderPort` |
| Enriquecimento | `AutoFillRuntimePort`, `TISSMappingRuntimePort` |
| TISS / XML | `TISSRuntimePort`, `XMLTISSRuntimePort`, `XMLRuntimePort`, `XMLGenerationRuntimePort`, `XMLSerializerRuntimePort`, `XMLSchemaRuntimePort`, `XMLValidationRuntimePort`, `XSDRuntimePort`, `NamespaceRuntimePort` |
| Lote / Protocolo | `BatchRuntimePort`, `ProtocolRuntimePort` |
| Auditoria / Qualidade | `AuditRuntimePort`, `QualityRuntimePort` |
| Operacional INF | `SchedulerRuntimePort`, `WorkerRuntimePort`, `QueueRuntimePort`, `PersistentQueueRuntimePort`, `DeadLetterRuntimePort`, Retry Infrastructure, `ObservabilityRuntimePort` |
| Gateways | ViaEnterprise existentes (EPC-24E) — sem novos Gateways |

### 7.2 Componentes que ainda serão implementados (ativação funcional)

| Capacidade | Situação atual | Sprint futura (sequência oficial) |
|------------|----------------|-------------------------------------|
| Discovery documental | ✅ Este documento | **TISS-RUNTIME-01D** |
| Entrada operacional do boletim na cadeia Q/W/S | ✅ Job TISS RECEIVED via `QueueRuntimePort` | **TISS-RUNTIME-01A** |
| OCR no Worker (consumo de fila) | ✅ Job RECEIVED → Worker → OCR → OCR_COMPLETED | **TISS-RUNTIME-01B** |
| Parser operacional TISS | ✅ Job OCR_COMPLETED → Worker → Parser → PARSED | **TISS-RUNTIME-01C** |
| Validação operacional TISS (packs/XML) | ✅ Job PARSED → Worker → Validation → VALIDATED | pós-01C (Sprint dedicada) |
| Enriquecimento operacional | ✅ Job VALIDATED → Worker → Enrichment → ENRICHED | **TISS-RUNTIME-02B** |
| XML TISS ANS real via Ports | ✅ Job ENRICHED → Worker → XML TISS → XML_GENERATED | **TISS-RUNTIME-03A** |
| Lote operacional via `BatchRuntimePort` | ✅ Job XML_GENERATED → Worker → Batch → BATCH_CREATED | **TISS-RUNTIME-03B** |
| Protocolo operacional | ✅ Job BATCH_CREATED → Worker → Protocol → PROTOCOL_SENT | **TISS-RUNTIME-04A** |
| Persistência operacional unificada | ✅ Job PROTOCOL_SENT → Worker → Persistence → PERSISTED | **TISS-RUNTIME-04B** |
| Auditoria operacional TISS na fila | ✅ Job PERSISTED → Worker → Audit → AUDITED | **TISS-RUNTIME-05A** |

> **RULE-20 / RULE-26:** cada Sprint ativa **exatamente uma** capability. A sequência abaixo é a ordem oficial; detalhes de escopo finito em cada Sprint.

### 7.3 Componentes proibidos

| Proibido | Motivo |
|----------|--------|
| Novo pipeline / Dual Path | Viola pipeline único (ARC-25 / EPC-24E) |
| Novo Runtime / composition root | Viola entrypoint único |
| Novos Ports paralelos (ex.: `EnrichmentPort`, `TISSRetryPort`) | Viola RULE-25; Ports já cobrem o domínio |
| Novos Gateways paralelos | Duplica superfície ViaEnterprise |
| Bypass de Ports / import de Adapters pelo produto | Viola Port/Adapter + DIP |
| OCR / Parser / XML / Lote / Protocolo fora do Runtime | Reintroduz Dual Path |
| Retry embutido em lógica TISS | Retry é OPER-INF-R exclusivamente |
| Dead Letter com regra de negócio TISS | DLQ só armazena |
| Observability executando estágios | Somente leitura |
| Alterar Foundations 4–7 / arquitetura congelada | ARC-25 |
| Acesso direto a fila / DB / Cron | Viola Ports INF |

---

## 8. Sequência oficial das futuras sprints

| Ordem | Sprint | Escopo (uma capability) | Status |
|-------|--------|-------------------------|--------|
| 0 | **TISS-RUNTIME-01D** | Discovery da arquitetura funcional TISS | ✅ Concluída |
| 1 | **TISS-RUNTIME-01A** | Ativar entrada operacional do boletim no pipeline oficial (Intake → Queue via Ports existentes) | ✅ Concluída |
| 2 | **TISS-RUNTIME-01B** | Ativar OCR operacional no Worker (consumo via `QueueRuntimePort`) | ✅ Concluída |
| 3 | **TISS-RUNTIME-01C** | Ativar Parser / Extraction operacional no mesmo pipeline | ✅ Concluída |
| 4 | **TISS-RUNTIME-02A** | Ativar Validação operacional no Worker (consumo de `PARSED`) | ✅ Concluída |
| 5 | **TISS-RUNTIME-02B** | Ativar Enriquecimento operacional no Worker (consumo de `VALIDATED`) | ✅ Concluída |
| 6 | **TISS-RUNTIME-03A** | Ativar XML TISS operacional no Worker (consumo de `ENRICHED`) | ✅ Concluída |
| 7 | **TISS-RUNTIME-03B** | Ativar Lote operacional no Worker (consumo de `XML_GENERATED`) | ✅ Concluída |
| 8 | **TISS-RUNTIME-04A** | Ativar Protocolo operacional no Worker (consumo de `BATCH_CREATED`) | ✅ Concluída |
| 9 | **TISS-RUNTIME-04B** | Ativar Persistência operacional no Worker (consumo de `PROTOCOL_SENT`) | ✅ Concluída |
| 10 | **TISS-RUNTIME-05A** | Ativar Auditoria operacional no Worker (consumo de `PERSISTED`) | ✅ Concluída |
| 11 | **TISS-RUNTIME-05B** | Ativar Completed operacional no Worker (consumo de `AUDITED`) | ⏳ Próxima |
| 12 | TISS-RUNTIME-02+ | Encerramento / convergência | ⏳ Planejada |

Roadmap vivo: [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md).

---

## 9. Relação Capture bound pipeline × pipeline funcional TISS

O bound Capture atual (EPC-24E) já coordena, de forma síncrona via Gateways:

`Intake → OCR → Parser → Audit → Contract → Risk → Correction`

O pipeline funcional TISS deste Discovery **não substitui** esse binding: ele **formaliza** o ciclo completo do boletim (incluindo XML / Lote / Protocolo / Retry / DLQ) como ativação incremental **sobre** a arquitetura congelada, deslocando execução pesada para Worker/Queue conforme sprints oficiais — sem segundo caminho.

---

## 10. Evidência de escopo (01D)

| Item | Resultado |
|------|-----------|
| Arquivo criado | `docs/enterprise/TISS_RUNTIME_DISCOVERY.md` |
| Alteração em `src/` | **Nenhuma** |
| Alteração Runtime / Ports / Gateways | **Nenhuma** |
| Novo pipeline | **Não criado** |
| Implementação de código | **Não realizada** |

---

## 11. Conclusão

O pipeline funcional oficial do TISS Runtime foi definido sem alterar a arquitetura Enterprise. Toda implementação futura deverá reutilizar exclusivamente a arquitetura oficial congelada.
