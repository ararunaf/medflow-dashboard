# Parser Production Certification

| Campo    | Valor                                               |
| -------- | --------------------------------------------------- |
| Sprint   | A2-03 — Parser Production Certification             |
| Projeto  | MedicFlow-AI                                        |
| Baseline | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md` |
| Status   | **CERTIFICADO** — sem alteração arquitetural        |

---

## 1. Objetivo

Certificar o `RealTissDocumentExtractionRuntimeAdapter` para produção, validando desempenho, estabilidade, tolerância a falhas, retry, dead letter, observability e a inexistência de execução da Validation.

---

## 2. Metodologia

- Cenários cobertos: documento simples, multipágina, incompleto, campos ausentes, inválido, timeout/cancelamento, erro interno do parser.
- Carga: 20 execuções consecutivas de `getResult` via `DocumentExtractionRuntimePort`.
- Pipeline end-to-end: `OCR_COMPLETED → Parser REAL → PARSED` com `getEnterpriseRuntime()`.
- Sem alteração em `src/`, `Runtime`, `Ports`, `Gateways`, `Pipeline` ou `Foundations`.

---

## 3. Resultados dos testes

Arquivo de certificação: `scripts/enterprise/tests/parser-production-certification.test.ts`

**11/11 tests passaram.**

| Cenário                    | Status | Observação                                                                               |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Documento simples          | PASS   | `fields` e `summary` produzidos, `status: processed`                                     |
| Documento multipágina      | PASS   | 2 páginas, `fields` e `summary` corretos                                                 |
| Documento incompleto       | PASS   | Campos `partial`/`failed` detectados                                                     |
| Campos ausentes (não TISS) | PASS   | Estrutura canônica gerada sem falha                                                      |
| Documento inválido         | PASS   | `ok: false`, `code: REAL_TISS_PARSER_FAILED`                                             |
| Timeout / cancelamento     | PASS   | `ok: false`, `telemetry.cancelled: true`                                                 |
| Erro interno do parser     | PASS   | `nack` no Worker, `deadLetterRuntime: true`                                              |
| Retry                      | PASS   | `telemetry.attempts` exposto; retry herdado do `DefaultDocumentExtractionRuntimeAdapter` |
| Pipeline PARSED            | PASS   | `correlationId` e `previousJobId` preservados                                            |
| Carga                      | PASS   | 20 execuções                                                                             |
| Observability              | PASS   | `health`, `capabilities`, `info` do provider `real-tiss`                                 |

---

## 4. Desempenho

Resultado da carga (20 execuções consecutivas de `getResult`):

| Métrica        | Valor            |
| -------------- | ---------------- |
| Latência média | **0.089 ms**     |
| Maior latência | **0.279 ms**     |
| Menor latência | **0.051 ms**     |
| Throughput     | **11.206 ops/s** |

> O parser real executa em memória, sem I/O de rede, o que explica o throughput elevado. Em produção, a latência será dominada pelo OCR anterior e pela obtenção do `RawOcrResult` (hoje injetado via `rawOcrResult` no adapter).

---

## 5. Estabilidade

- O `TissParser` não quebra com OCRs parciais, multipágina ou sem padrões TISS: retorna `StructuredGuide` canônica com `fields` e `metadata`.
- OCR inválido / malformed é capturado e convertido em `REAL_TISS_PARSER_FAILED`.
- O adapter real herda a robustez estrutural do `DefaultDocumentExtractionRuntimeAdapter` (timeout, cancelamento via `AbortSignal`, retry configurável, health).

---

## 6. Retry

- O `RealTissDocumentExtractionRuntimeAdapter` delega `openJob`, `submitRequest`, `getResult`, `stats`, etc. ao `DefaultDocumentExtractionRuntimeAdapter`.
- O delegate já implementa `defaultRetryCount = 1` e `defaultRetryBackoffMs = 50`.
- Cada resultado expõe `telemetry.attempts`, `telemetry.latencyMs` e `telemetry.cancelled`.
- O teste `document-extraction-runtime-engine.test.ts` cobre retry de falha transitória no `DefaultDocumentExtractionRuntimeAdapter` (camada herdada).

---

## 7. Dead Letter

- Quando o `TissParser` falha, `RealTissDocumentExtractionRuntimeAdapter.getResult()` retorna `ok: false`, `code: REAL_TISS_PARSER_FAILED`.
- `processTissParserJob` traduz isso para `settle: "nack"`.
- A infraestrutura de Dead Letter do `DefaultQueueRuntimeAdapter`/`DefaultWorkerRuntimeAdapter` é reutilizada sem novo gateway.
- Teste `erro interno do parser` confirmou `processTissOcrParsed.ok === false` e `infrastructure.deadLetterRuntime === true`.

---

## 8. Observability

- `port.health()` retorna `ok: true`, `provider: "real-tiss"`, `runtimeReady: true`.
- `port.capabilities()` expõe `provider: "real-tiss"`, `adapterId: real-tiss-document-extraction-runtime`.
- `port.providerInfo()` retorna metadados do adapter real.
- Cada operação retorna `telemetry: { latencyMs, attempts, cancelled, operation }`.
- `getDocumentExtractionRuntimeHealthSummary` funciona sobre o provider `real-tiss`.

---

## 9. Validation NÃO executada

- Todos os testes de pipeline (`processTissOcrParsed` e `processTissParserJob`) retornam `validationExecuted: false`.
- `ValidationRuntimePort` não é acionado pelo caminho Parser.
- `parserExecuted: true`, `ocrExecuted: true` confirmam que somente Parser e OCR atuam na transição `OCR_COMPLETED → PARSED`.

---

## 10. Limitações

- O `RawOcrResult` precisa ser fornecido ao adapter via `rawOcrResult` (construção) ou `metadata.customAttributes.rawOcrResult` (`submitRequest`).
- O pipeline TISS (`processTissOcrParsed`) ainda não transporta o `RawOcrResult` da etapa OCR para o Parser; isso requer uma evolução futura do `OCR_COMPLETED` message payload (sem alterar arquitetura, apenas conteúdo da mensagem).
- Os campos canônicos `fieldExtractionImplemented` continuam `false` por especificação do Port (`DocumentExtractionResult`/`ExtractionField` são estruturais canônicos), embora os `value` e `confidence` sejam reais.
- O parser é síncrono; latência em produção dependerá do tempo de obtenção do OCR e da complexidade do documento.

---

## 11. Recomendação para produção

- **Pronto para produção controlada** (`soft launch`) com monitoramento de `telemetry.attempts`, `latencyMs` e taxa de `REAL_TISS_PARSER_FAILED`.
- **Próximo passo crítico**: conectar o `OCR_COMPLETED` job ao `RealTissDocumentExtractionRuntimeAdapter` através de um `RawOcrResult` real (storage ref ou mensagem) para que `processTissOcrParsed` não dependa de OCR previamente injetado.
- Manter `provider: "real-tiss"` via `createDocumentExtractionRuntimePort` e injetar via `createEnterpriseRuntime({ documentExtractionRuntimePort: ... })` — sem bypass e sem novo Port.
- Considerar `defaultTimeoutMs` e `defaultRetryCount` ajustados conforme percentis de latência observados em produção.

---

## 12. Verificações de arquitetura

- `RealTissDocumentExtractionRuntimeAdapter` instanciado somente na factory (`document-extraction-runtime-factory.ts`).
- `DocumentExtractionRuntimePort` continua o único acesso ao Parser (`processTissParserJob` e `process-parser-via-enterprise.ts`).
- `getEnterpriseRuntime` permanece o único entrypoint (174 ocorrências em `src/`).
- Nenhuma alteração em `Runtime`, `Ports`, `Gateways`, `Pipeline` ou `Foundations`.

---

## 13. Conclusão

O Parser real foi certificado para produção reutilizando integralmente a arquitetura Enterprise. O Baseline v1.0 permanece preservado.
