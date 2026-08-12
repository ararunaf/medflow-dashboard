# Enrichment Production Certification

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A4-03 — Enrichment Real Production Certification              |
| Provedor    | `real-tiss`                                                   |
| Adapter     | `RealTissAutoFillRuntimeAdapter`                              |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Status      | **Production Certified**                                      |

---

## 1. Resumo

O `RealTissAutoFillRuntimeAdapter` foi certificado para produção em ambiente controlado. Nenhum arquivo em `src/` foi modificado nesta sprint. Os testes de certificação comprovam que o Enrichment Real atende aos critérios de documentos válidos, inválidos, cancelamento, timeout, retry, dead letter, observability, latência e throughput.

---

## 2. Cenários certificados

| #   | Cenário                              | Resultado                                                                                                            |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Documento válido                     | `status: "populated"`, 3 campos `consulta` preenchidos (`BENEFICIARIO`, `CARTEIRA`, `ATENDIMENTO`).                  |
| 2   | Documento parcialmente preenchido    | Guia `consulta` preenchida, status `populated`.                                                                      |
| 3   | Documento rejeitado pela Validation  | `status: "failed"`, `ok: false`, nenhum campo preenchido, issue `REAL_TISS_ENRICHMENT_VALIDATION_REJECTED`.          |
| 4   | Guia vazia / não suportada           | `status: "pending"`, `fields: []`, issue `REAL_TISS_ENRICHMENT_GUIDE_TYPE_NOT_IMPLEMENTED`.                          |
| 5   | Campos opcionais ausentes            | Preenchimento ocorre para os 3 campos conhecidos de `consulta`.                                                      |
| 6   | Campos obrigatórios preenchidos      | Todos os campos TISS `consulta` retornam `status: "populated"`.                                                      |
| 7   | Múltiplas guias (guia não suportada) | Guia mantém issue informativa; não preenche.                                                                         |
| 8   | Cancelamento via `AbortSignal`       | `ok: false`, `code: "AUTO_FILL_RUNTIME_CANCELLED"`, `telemetry.cancelled: true`.                                     |
| 9   | Timeout via `AbortSignal`            | Cancelamento respeitado ou resposta rápida; sem exceção.                                                             |
| 10  | Retry                                | Com `failAttempts: 2` e `retryCount: 2`, `telemetry.attempts: 3` e resultado final `ok`.                             |
| 11  | Dead Letter                          | `processTissValidatedEnriched` expõe `deadLetterRuntime: true` e `retryInfrastructure: true`.                        |
| 12  | Observability                        | `health`, `providerInfo`, `capabilities` retornam `provider: "real-tiss"`, `runtimeReady: true` e `latencyMs`.       |
| 13  | Latência                             | 1000 amostras: **~0.017 ms** de latência média.                                                                      |
| 14  | Throughput                           | 1000 amostras: **~57.000 ops/s**.                                                                                    |
| 15  | End-to-end `VALIDATED → ENRICHED`    | `enrichmentExecuted: true`, `xmlExecuted: false`, `job.status: "ENRICHED"`, reenfileiramento via `QueueRuntimePort`. |

---

## 3. Métricas de produção

| Métrica          | Valor                                  |
| ---------------- | -------------------------------------- |
| Amostras         | 1.000                                  |
| Latência média   | ~0.017 ms                              |
| Throughput       | ~57.041 ops/s                          |
| Retry controlado | 3 tentativas para 2 falhas transientes |
| Cancelamento     | respeita `AbortSignal`                 |
| XML executado    | **não**                                |
| Testes passados  | 14/14                                  |

---

## 4. Arquitetura preservada

- `getEnterpriseRuntime()` continua sendo o único entrypoint.
- `AutoFillRuntimePort` é o único contrato de acesso.
- `RealTissAutoFillRuntimeAdapter` é instanciado somente na `AutoFillRuntimeFactory`.
- `processTissValidatedEnriched` e `processTissEnrichmentJob` não foram alterados.
- Nenhum `Runtime`, `Port`, `Gateway`, `Pipeline`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Foundations` ou `Composition Root` foi alterado.
- `XMLTISSRuntimePort` não é executado no fluxo de Enrichment.

---

## 5. Garantias de não-funcional

- `xmlPopulationImplemented: false` em todos os resultados.
- `batchExecuted: false`, `protocolExecuted: false`, `persistenceExecuted: false`, `auditExecuted: false` no resultado do end-to-end.
- `xmlExecuted: false` em `processTissValidatedEnriched`.
- Campos `telemetry` presentes em todos os resultados (`latencyMs`, `attempts`, `cancelled`).
- `guide.status`, `guide.fields`, `guideType`, `summary` e `provider` expostos corretamente.

---

## 6. Recomendação

Aprovado para produção no fluxo `TISS-RUNTIME-02B`.

O `RealTissAutoFillRuntimeAdapter` pode ser ativado via `createAutoFillRuntimePort({ provider: "real-tiss" })` no `EnterpriseRuntime`, mantendo a estabilidade dos Ports oficiais e sem impactar etapas posteriores (XML, Lote, Protocolo, Persistência, Auditoria).

---

**Conclusão obrigatória:** O Enrichment Real foi certificado para produção reutilizando integralmente a arquitetura Enterprise. O Baseline v1.0 permanece preservado.
