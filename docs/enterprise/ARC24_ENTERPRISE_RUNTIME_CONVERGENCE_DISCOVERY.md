# ARC-24 — Enterprise Runtime Convergence Discovery

| Campo | Valor |
|-------|-------|
| Sprint | ARC-24 — Enterprise Runtime Convergence Discovery |
| Projeto | MedicFlow-AI |
| Data | 2026-08-10 |
| Tipo | Auditoria arquitetural (somente documentação) |
| Escopo de código | **Nenhuma alteração em `src/`**, testes ou engines |
| Status | ✅ Descoberta concluída · trilha EPC-24A–E **cutover concluído** (EPC-24E, 2026-08-11) |

---

## 1. Objetivo

Preparar a convergência entre o **pipeline operacional (produto Capture)** e a **arquitetura Enterprise Runtime**, respondendo:

1. Qual é hoje o pipeline oficial executado?
2. Quais componentes Enterprise nunca entram em execução?
3. Quais componentes operacionais deverão migrar para as Foundations?
4. É possível convergir sem reconstrução do sistema?
5. O que será PRESERVADO / MIGRADO / REMOVIDO?

**Esta sprint não implementa.** Não cria engines. Não altera comportamento.

Documentos irmãos:

- [`ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md`](./ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md)
- [`ENTERPRISE_RUNTIME_MIGRATION_PLAN.md`](./ENTERPRISE_RUNTIME_MIGRATION_PLAN.md)

---

## 2. Respostas obrigatórias (veredito)

### 2.1 Qual é hoje o pipeline oficial executado?

**O pipeline oficial funcional é o pipeline operacional de Captura do produto**, orquestrado em `uploadCaptureFileFn` (`src/lib/capture/api/capture-server.ts`):

```text
Upload → Storage (bound StorageProvider) → OCR (via Enterprise OCR)
→ Parser → Auditoria preventiva → Inteligência contratual
→ Risco de glosa → Assistente de correção
→ (UI) Review → (UI) Processing Center
```

Paralelos **não** encadeados ao Capture:

- Bridge Enterprise Document Intake (side-effect best-effort — AER-GA03-A1)
- CRUD TISS + `xml-export-service` (módulo TISS separado)

O pipeline canônico Enterprise de 11 passos **existe como fundação estrutural**, mas **não executa** o fluxo de negócio ponta a ponta.

### 2.2 Quais componentes Enterprise nunca entram em execução?

Nunca no caminho funcional do produto (hoje):

| Classe | Exemplos |
|--------|----------|
| Pipeline canônico EPC-24 não composto no Runtime | `document-processor`, `processing-provider`, `tiss-mapping`, `tiss-vocabulary`, `tiss-profile`, `healthcare-model`, `contract-rule-binding`, `tiss-rule-runtime`, `ai-auditor` |
| Runtimes Bloco C / F3-CAP / INF estruturais | `xml-tiss-runtime`, `soap-runtime`, `operator-runtime`, `authorization-runtime`, `batch-runtime`, `protocol-runtime`, `return-runtime`, `reconciliation-runtime`, `workflow-runtime`, `document-extraction-runtime`, `validation-runtime`, `audit-runtime`, `auto-fill-runtime`, `quality-runtime`, filas/workers/scheduler |
| Engines de blocos E–J / legado | `business-engine`, `integration-engine`, `tiss-engine`, `tiss-integration-engine`, `tiss-intelligence*`, `workflow`/`workflow-engine`, `master-orchestration` |
| Ports fundacionais não wired | `persistence`, legado `storage`, `tenant*`, `configuration`, `metadata`, `rule`/`rule-pack` (produto usa `rule-pack-engine`) |
| Registries EPC-24 fora do composition root produto | `execution-*` registries (exceto uso interno estrutural do orchestrator) |

### 2.3 Quais componentes operacionais deverão migrar para as Foundations?

| Componente produto | Foundation / Port alvo |
|--------------------|------------------------|
| Parser / classify (`capture/parser`) | Document Extraction Runtime (+ Classification já existente) |
| Auditoria preventiva (`capture/audit`) | Audit Runtime / AI Auditor (ativação real, não mock) |
| Inteligência contratual (`capture/contract`) | Contract + Contract Rule Binding |
| Glosa risk (`capture/risk`) | TISS Rule Runtime / Quality Runtime |
| Correction assistant (`capture/correction`) | Auto-Fill / Quality Runtime |
| Review → handoff TISS | Workflow Runtime + Batch/Protocol (Bloco C) |
| `xml-export-service` proprietário | XML Generation / Serializer / XML-TISS / Validation runtimes |
| Session store / eventos Capture | PersistencePort + Execution Context / Trace |
| Orchestration síncrona em `capture-server` | Canonical Execution Orchestrator (execução real via Ports) |

Já convergidos (não re-migrar): OCR Azure, StorageProvider bound, TISS knowledge (catalog + rule packs), AI Provider OpenAI (ops).

### 2.4 É possível convergir sem reconstrução do sistema?

**Sim.** Convergência por *strangler fig*:

1. Preservar composition root `getEnterpriseRuntime()` e Ports.
2. Migrar estágio a estágio do Capture para Ports/Runtimes já existentes.
3. Manter comportamento funcional estável até cutover por estágio.
4. Remover dual-path (AER-GA03-A1) somente após paridade certificada.
5. Não reescrever UI, auth, RLS, nem o modelo de sessão Capture de uma vez.

Reconstrução completa **não é necessária** e **é proibida** por esta descoberta.

### 2.5 PRESERVAR / MIGRAR / REMOVER

Ver seções 8–10. Resumo:

- **PRESERVAR** — Runtime root, Ports reais (OCR/Storage/AI/TISS knowledge), orquestrador canônico, runtimes DIP/Bloco C/INF como fundações.
- **MIGRAR** — Engines de negócio Capture + XML produto → Foundations/Ports correspondentes.
- **REMOVER** (após cutover) — Dual-path intake paralelo, XML proprietário fora do Runtime, adapters/engines duplicados mortos, imports diretos que bypassam Ports.

---

## 3. Inventário Enterprise

| Métrica | Valor |
|---------|-------|
| Módulos top-level em `src/lib/enterprise` | **99** |
| Módulos wired em `getEnterpriseRuntime` | **~51** |
| Consumo funcional produto hoje | OCR, Storage bound, AI Provider, TISS catalog/rule-pack, intake bridge estrutural |
| Pipeline canônico 11 passos | Documentado; **não executa** negócio real |

---

## 4. Pipeline operacional completo (oficial hoje)

### 4.1 Entry points

| Entry | Arquivo | O que executa |
|-------|---------|---------------|
| UI Captura | `src/modules/capture/**`, `src/routes/captura*.tsx` | `uploadCaptureFileFn` → pipeline completo |
| Server Fn | `src/lib/capture/api/capture-server.ts` | Orquestração funcional |
| HTTP `/capture` | `src/lib/capture/api/capture-http-router.ts` | Upload + bridge; **sem** cadeia OCR→… |
| Worker fetch | `src/server.ts` | Roteia `/capture*` |
| Review | `review-server.ts` | Aprovação humana |
| Processing | `processing-server.ts` | Fila operacional (sem criar lote TISS) |
| TISS XML | `tiss-server.ts` + `xml-export-service.ts` | Export paralelo |

### 4.2 Estágios ordenados

| # | Estágio | Módulo produto | Persistência / status |
|---|---------|----------------|------------------------|
| 0 | Session create | `capture-session-store` | `CREATED` |
| 1 | Upload | session store + `enterprise-storage-bridge` | `UPLOADED` → `OCR_PENDING` |
| 1b | Enterprise intake (paralelo) | `register-capture-intake.ts` | Side-effect; não dirige negócio |
| 2 | OCR | `ocr-service` → Enterprise Capture Engine / OCR Provider | `OCR_COMPLETED` |
| 3 | Parse / classify | `tiss-parser-service` + guide detector | `PARSING` + artefato |
| 4 | Auditoria preventiva | `preventive-audit-service` | metadata `audit_completed` |
| 5 | Contrato | `contract-intelligence-service` | metadata + artefato |
| 6 | Glosa risk | `glosa-risk-service` | metadata + artefato |
| 7 | Correção | `correction-assistant-service` | propostas |
| 8 | Review | `review-workspace-*` | `REVIEW` / `APPROVED` |
| 9 | Processing center | `processing-center-*` | fila UI |
| 10 | Learning | `capture/learning` | sob decisão (não no upload) |
| — | TISS/XML | `xml-export-service` | **fora** do Capture |

Trecho oficial do orquestrador produto:

```118:129:src/lib/capture/api/capture-server.ts
      try {
        await runCaptureOcr(ctx, data.sessionId);
        try {
          await runCaptureParser(ctx, data.sessionId);
          try {
            await runCaptureAudit(ctx, data.sessionId);
            try {
              await runCaptureContractIntelligence(ctx, data.sessionId);
              try {
                await runCaptureGlosaRisk(ctx, data.sessionId);
                try {
                  await runCaptureCorrectionAssistant(ctx, data.sessionId);
```

### 4.3 Bridges Enterprise já usados pelo produto

| Call site | Port / API |
|-----------|------------|
| `register-capture-intake.ts` | `registerCaptureDocumentIntake` |
| `process-ocr-via-enterprise.ts` | `CaptureEngineRuntimePort.processOcr` / OCRProvider |
| `tiss-knowledge-gateway.ts` | TISSRuntime / TISSCatalog / RulePackEngine |
| `enterprise-storage-bridge.ts` | `createBoundStorageProviderPort` |
| `operational-gpt-openai.ts` | AIProviderRuntime (ops, não Capture doc) |

---

## 5. Pipeline Enterprise completo (intenção canônica)

### 5.1 Cadeia canônica EPC-24 (estrutural)

Definida em `canonical-execution-orchestrator/ports/pipeline.ts`:

```text
document-intake
→ document-processing
→ processing-provider
→ ocr-provider
→ tiss-mapping
→ tiss-vocabulary
→ tiss-profile
→ healthcare-model
→ contract-rule-binding
→ tiss-rule-runtime
→ ai-auditor
```

O orquestrador **coordena**; **não** executa OCR/IA/regras de negócio nesta fundação.

### 5.2 Fluxo DIP realmente invocado pelo Runtime hoje

```text
Produto → getEnterpriseRuntime()
  → CaptureEngineRuntime.registerCapture / processOcr
    → CanonicalExecutionOrchestrator.startExecution (coordenação)
    → DocumentIntakeRuntime → DocumentIntakePort (in-memory)
    → OCRRuntime → OCRProviderPort (Azure — real)
    → DocumentClassificationRuntime → ClassificationProvider (rule-based)
    → StorageManagerRuntime → StorageProviderPort
    → DocumentSearchRuntime → SearchProviderPort (catálogo in-memory)
```

Mais o lado TISS knowledge (TISS-CONV-01):

```text
Capture → TISSRuntimePort → TISSCatalogPort + RulePackEnginePort
```

### 5.3 Classificação de módulos

#### RUNTIME-USED (produto)

`runtime`, `ocr-provider`, `ocr-runtime`, `capture-engine-runtime`, `canonical-execution-orchestrator`, `document-intake`, `document-intake-runtime`, `document-classification-provider`, `document-classification-runtime`, `storage-provider`, `storage-manager-runtime`, `document-search-runtime`, `search-provider`, `ai-provider`, `ai-provider-runtime`, `tiss-runtime`, `tiss-catalog`, `rule-pack-engine`, `tiss-provider`

#### ESTRUTURAIS (wired, sem negócio produto)

F3-CAP: extraction, validation, AI orchestration, audit, tiss-mapping-runtime, auto-fill, quality, scanner, watch-folder, upload, intelligent-capture.

Bloco C: xml-tiss, xml-validation, soap, operator, authorization, batch, protocol, return, reconciliation, workflow-runtime.

TISS XML stack: xml-runtime, xml-generation, xml-serializer, xml-schema, xsd, namespace.

INF: queue, worker, scheduler, persistent-queue, observability-runtime, scalability-runtime.

#### MORTOS / ILHA (não wired no composition root produto)

`document-processor`, `processing-provider`, `ai-auditor`, `ai-orchestrator`, `business-engine`, `configuration`, `contract`, `contract-rule-binding`, `document-identity`, `healthcare-model`, `tiss-mapping`, `tiss-vocabulary`, `tiss-profile`, `tiss-rule-runtime`, `tiss-intelligence*`, `tiss-engine`, `tiss-integration-engine`, `rule`, `rule-pack`, `workflow`, `workflow-engine`, `integration-engine`, `master-orchestration`, `message-queue`, `worker-foundation`, `scheduler-foundation`, `observability-foundation`, `health-center-foundation`, `metadata`, `tenant`, `tenant-assignment`, `persistence`, legado `storage`, registries `execution-*` (exceto composição interna de testes/orquestrador).

---

## 6. Pontos de divergência

| # | Dimensão | Operacional | Enterprise | Estado |
|---|----------|-------------|------------|--------|
| D1 | Orquestração E2E | `capture-server` sync | Canonical Orchestrator 11 passos | Dual — AER-GA03-A1 **Aceita** |
| D2 | OCR | Via Enterprise | OCR Runtime/Provider | **Convergido** (OCR-01) |
| D3 | Parse/extração | `capture/parser` | DocumentExtractionRuntime | Divergente |
| D4 | Auditoria | Preventive audit produto | AuditRuntime / AI Auditor mock | Divergente |
| D5 | Contrato/glosa/correção | Engines Capture | Contract/Rule/Quality/Auto-fill | Divergente |
| D6 | TISS knowledge | Gateway Enterprise | Catalog + RulePack | **Convergido** (TISS-CONV-01) |
| D7 | XML | `xml-export-service` MVP | XML* runtimes estruturais | Divergente |
| D8 | Storage | Bound StorageProvider + session store | StorageManager + Persistence unwired | Parcial (AER-GA03-A3) |
| D9 | Capture → TISS lote | Inexistente | Batch/Protocol/Operator | Gap funcional |
| D10 | HTTP `/capture` vs UI | REST sem pipeline | — | Inconsistência operacional |
| D11 | Escala | Request sync Worker | Queues/workers in-memory | Ambos insuficientes para 35M |

---

## 7. Componentes duplicados

| Par duplicado | Decisão de convergência |
|---------------|-------------------------|
| Product OCR providers vs Enterprise OCRProvider | Manter Enterprise Port; produto só facade |
| Product parser vs DocumentExtractionRuntime | Migrar lógica → Extraction Runtime |
| Product audit vs AuditRuntime / AI Auditor | Migrar regras → Audit Runtime; ativar Auditor |
| Product contract/risk vs Contract/Rule runtimes | Migrar → Contract Rule Binding + TISS Rule Runtime |
| `xml-export-service` vs XML* Enterprise | Migrar export → XML stack Enterprise; remover builder proprietário após paridade |
| Legacy `storage`/`persistence` vs `storage-provider` | Preservar `storage-provider`; wire PersistencePort; congelar legado |
| `tiss-mapping` vs `tiss-mapping-runtime` | Unificar sob Runtime + Port canônico |
| `workflow`/`workflow-engine` vs `workflow-runtime` | Preservar `workflow-runtime` |
| INF foundations vs INF `*-runtime` | Preservar `*-runtime`; foundations viram histórico/compat |

---

## 8. Componentes PRESERVAR

| Componente | Motivo |
|------------|--------|
| `getEnterpriseRuntime` / `DefaultEnterpriseRuntime` | Único composition root |
| Canonical Execution Orchestrator + PipelineResolver | Modelo de pipeline oficial pós-convergência |
| OCR Provider/Runtime (Azure) | Já funcional |
| Storage Provider (+ bridge bound) | I/O real |
| AI Provider/Runtime (OpenAI) | Já funcional (ops) |
| TISS Runtime + Catalog + RulePackEngine | Conhecimento oficial |
| Capture Engine + Document Intake + Classification + Storage Manager + Document Search | DIP spine |
| Runtimes Bloco C / F3-CAP / INF | Placeholders oficiais para ativação |
| ECS-01 (Port → Provider → Factory → Adapter → Store) | Padrão permanente |
| Capture UI / state machine de sessão / RLS tenant | Experiência e isolamento produto |
| Exceções resolvidas OCR-01 e TISS-CONV-01 | Não reabrir dual-path |

---

## 9. Componentes MIGRAR

| Origem operacional | Destino Foundation | Sprint alvo (plano) |
|--------------------|--------------------|---------------------|
| Orquestração `uploadCaptureFileFn` | Canonical Orchestrator (execução real por Port) | EPC-24A |
| Parser / field extraction | Document Extraction Runtime | EPC-24B |
| Preventive audit + contract + glosa + correction | Audit / Contract Rule Binding / TISS Rule / Quality / Auto-fill | EPC-24C |
| Review approval → criação guia/lote | Workflow + Batch/Protocol runtimes | EPC-24D |
| `xml-export-service` | XML Generation / Serializer / Validation / XML-TISS | EPC-24D |
| Session metadata/events críticos | PersistencePort + Execution Trace | EPC-24E |
| Dual-path intake bridge | Intake como estágio canônico único | EPC-24E (cutover) |

---

## 10. Componentes REMOVER (após certificação de paridade)

| Item | Quando remover |
|------|----------------|
| Dual-path `registerCaptureDocumentIntakeBridge` como side-effect paralelo | Após intake canônico ser o único caminho |
| Cadeia imperativa aninhada em `capture-server` como orquestrador de negócio | Após Orchestrator dirigir estágios |
| `xml-export-service` builder proprietário `medflowTissExport` | Após XML Enterprise com paridade |
| Providers OCR produto não-Enterprise (GPT/Tesseract stubs no caminho crítico) | Após cutover OCR-only-Port |
| Engines ilha sem consumers e sem plano de wire (após inventário EPC-24E) | Freeze → delete controlado |
| Imports diretos que bypassam Ports no caminho documental | Por estágio migrado |

**Não remover agora** (ARC-24): nenhum código. Remoções só em sprints EPC-24* com gate.

---

## 11. Componentes estruturais vs runtime-used

| Tipo | Definição ARC-24 | Ação |
|------|------------------|------|
| **Runtime-used** | Invocado pelo produto fora de testes | PRESERVAR; expandir uso |
| **Estrutural** | Wired ou fundado; mock/in-memory; sem negócio | PRESERVAR como Foundation; ativar sob EPC |
| **Morto / ilha** | Não wired e sem consumidor produto | Congelar; wire ou REMOVER em EPC-24E |
| **Duplicado** | Dois caminhos para mesma responsabilidade | PRESERVAR canônico Enterprise; migrar produto; remover legado |

---

## 12. O que deverá ser preservado na convergência (canônico)

O sistema convergido terá **um único pipeline oficial**:

```text
Produto (Captura UI/API)
  → getEnterpriseRuntime()
    → CanonicalExecutionOrchestrator
      → Document Intake
      → Document Processing / Extraction
      → OCR Provider (já real)
      → Classification / Validation / Quality
      → Contract Rule Binding + TISS Rule Runtime
      → Audit / AI Auditor
      → Workflow → Batch / XML-TISS / Operator (Bloco C)
```

Toda regra de negócio documental passa a viver atrás de Ports Enterprise. O produto deixa de orquestrar engines locais como plano de execução.

---

## 13. Conclusões da descoberta

1. Na descoberta ARC-24, o **pipeline oficial executado** era o **operacional Capture** em `uploadCaptureFileFn`.
2. A Enterprise Foundation é **ampla (99 módulos)** e **parcialmente wired (~51)**.
3. Convergência foi **viável sem rebuild** via strangler fig estágio a estágio (EPC-24A–E).
4. Dual-path AER-GA03-A1 foi a dívida central — **Resolvida em EPC-24E**.
5. Sprints EPC-24A→EPC-24E implementaram a convergência (ver Migration Plan).
6. **Pós-cutover EPC-24E:** o **único pipeline oficial** é o **Enterprise Canonical Runtime Pipeline** mediado por `getEnterpriseRuntime()`.

> **O MedicFlow-AI possui agora um único pipeline oficial coordenado pelo Enterprise Runtime.**

---

## 14. Referências

- `EPC24E_ENTERPRISE_RUNTIME_FINAL_CUTOVER.md`
- `ARCH-01_ENTERPRISE_RUNTIME_INTEGRATION.md`
- `ARCH23_RUNTIME_FOUNDATION_DISCOVERY.md`
- `ARCHITECTURAL_EXCEPTION_REGISTER.md` (AER-GA03-A1 **Resolvida**, A3, OCR-01, TISS-CONV-01)
- `TISS-CONV-01_CAPTURE_ENTERPRISE_CONVERGENCE.md`
- `BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`
- `canonical-execution-orchestrator/ports/pipeline.ts`
- `src/lib/capture/api/capture-server.ts`
