# ARCH-01 — Enterprise Runtime Integration

**Sprint:** ARCH-01 — Enterprise Runtime Integration  
**Data:** 01/08/2026  
**Natureza:** Sprint corretiva arquitetural — **sem mudança de comportamento funcional**  
**Baseline:** EPC-24 + INF-01…INF-05 (Foundation estrutural) · GATE-ARCH-02 (NO-GO por ausência de consumidores)  
**Continuidade:** Autoriza DIP-01 apenas após aprovação desta sprint

---

## 1. Objetivo

Integrar a Enterprise Foundation ao runtime do produto MedicFlow.

Ao final desta sprint, pelo menos um fluxo do produto utiliza oficialmente Ports Enterprise através do Enterprise Runtime e do Canonical Execution Orchestrator.

---

## 2. O que NÃO foi feito

- OCR novo / alteração de OCR
- IA nova
- Parser XML
- Rule Engine novo
- Workflow novo
- TISS novo
- Filas / Workers / Scheduler reais
- Mudança de regras de negócio, telas, APIs ou migrations

---

## 3. Fluxos analisados (FASE 1)

| Fluxo | Entrada atual | Acesso pré-ARCH-01 |
|-------|---------------|--------------------|
| Capture upload | `uploadCaptureFileFn` / HTTP `/capture` | `uploadCaptureDocument` → Supabase + storage direto |
| OCR | `runCaptureOcr` | `OcrOrchestrator` produto → Azure/GPT/Tesseract (fora do Port) |
| Document Intake (Enterprise) | — | Isolado em `lib/enterprise/document-intake` (0 consumidores produto) |
| Canonical Orchestrator | — | Isolado em testes/demo |
| TISS / Operations | módulos de produto | Implementações concretas |

**Decisão de integração:** Document Intake no upload de Captura (side-effect estrutural).

---

## 4. Diagrama ANTES / DEPOIS (FASE 6)

### ANTES

```
Produto (Captura upload)
        ↓
Implementação direta
(capture-session-store → Supabase / Storage)
```

Enterprise Foundation existia como ilha estrutural (0 consumidores de produto).

### DEPOIS

```
Produto (Captura upload)
        ↓
Enterprise Runtime          ← ponto único de acesso
        ↓
Canonical Execution Orchestrator Port   ← coordena (não executa Engines)
        ↓
DocumentIntakePort
        ↓
DefaultDocumentIntakeAdapter
        ↓
DefaultDocumentIntakeStore (in-process)
```

O caminho funcional de Captura (upload → OCR → parser → …) **permanece inalterado**.  
O bridge Enterprise é side-effect best-effort e não afeta o resultado da Captura.

---

## 5. Runtime criado (FASE 2)

| Artefato | Caminho |
|----------|---------|
| Runtime | `src/lib/enterprise/runtime/` |
| Interface | `EnterpriseRuntime` |
| Factory / singleton | `createEnterpriseRuntime` / `getEnterpriseRuntime` |
| Bridge Captura | `registerCaptureDocumentIntake` |
| Consumer produto | `src/lib/capture/enterprise/register-capture-intake.ts` |
| Wiring | `capture-server.ts`, `capture-http-router.ts` |
| Testes | `scripts/enterprise/tests/enterprise-runtime.test.ts` |

Responsabilidades do Runtime:

1. Resolver Providers / Ports
2. Disponibilizar Adapters via factories oficiais
3. Inicializar Canonical Execution Orchestrator
4. Expor o Runtime ao produto

**Nenhuma regra de negócio.**

---

## 6. Integração (FASE 3 + 4)

Fluxo integrado: **Document Intake no upload de Captura**.

1. Upload de Captura conclui como antes.
2. Produto chama `registerCaptureDocumentIntakeBridge` (best-effort).
3. Runtime chama `CanonicalExecutionOrchestratorPort.startExecution` (somente coordenação).
4. Runtime chama `DocumentIntakePort.createIntake` com `sourceType: UPLOAD` e refs opacas.
5. Adapter default persiste intake in-process.

Ports utilizados:

- `DocumentIntakePort` (EPC-12)
- `CanonicalExecutionOrchestratorPort` (EPC-24)

Adapters utilizados:

- `DefaultDocumentIntakeAdapter`
- `DefaultCanonicalExecutionOrchestratorAdapter`

---

## 7. ECS-01 — Camada Application (FASE 5)

Ver decisão oficial: [`ECS-01_APPLICATION_LAYER_DECISION.md`](./ECS-01_APPLICATION_LAYER_DECISION.md).

Resumo: a pasta `application/` por componente **não é obrigatória**.  
A responsabilidade de Application foi absorvida legitimamente pelo **Enterprise Runtime** (composition root) + consumers de produto que dependem apenas de Ports/Runtime.  
`demo/` permanece PoC de fundação.

---

## 8. Critério de aprovação

| Critério | Status |
|----------|--------|
| Produto usa ≥1 fluxo via Ports Enterprise | ✅ Document Intake no upload |
| Canonical Execution Orchestrator no runtime | ✅ `startExecution` no bridge |
| Nenhuma funcionalidade mudou | ✅ side-effect best-effort |
| Nenhuma regra de negócio mudou | ✅ |
| Sem regressão / Gates PASS | ver relatório de sprint |

---

## 9. O que vem depois

Somente após aprovação de ARCH-01:

- DIP-01 (Document Intelligence Platform) pode ser autorizada
- Integrações adicionais (OCR Provider Port com Azure adapter, etc.) em sprints dedicadas
