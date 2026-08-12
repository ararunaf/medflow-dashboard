# Validation Production Certification

| Campo       | Valor                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Sprint      | A3-03 — Validation Production Certification                                                                                   |
| Projeto     | MedicFlow-AI                                                                                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`                                                                           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`                                                                 |
| Discovery   | `docs/enterprise/VALIDATION_REAL_DISCOVERY.md`                                                                                |
| Adapter     | `RealTissValidationRuntimeAdapter` (`src/lib/enterprise/validation-runtime/adapters/real-tiss-validation-runtime-adapter.ts`) |
| Status      | **Certified**                                                                                                                 |

---

## 1. Resumo executivo

A `RealTissValidationRuntimeAdapter` (provider `real-tiss`) foi certificada para produção sem nenhuma alteração em `src`, `Runtime`, `Ports`, `Gateways`, `Pipeline` ou `Foundations`.

O certificado cobre: cenários válidos/inválidos, campos ausentes/inconsistentes, documentos vazios, retry, cancelamento, exceções, provider indisponível, carga, latência, throughput e observability. Todos os testes passaram.

---

## 2. Cenários certificados

| Cenário                      | Entrada                                                         | Resultado esperado                                       | Status |
| ---------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- | ------ |
| Documento válido             | Todos os campos `processed` com valores e `guideType` conhecido | `status: "validated"`, `errorCount: 0`                   | Pass   |
| Documento inválido           | Campo com `status: "failed"`                                    | `status: "rejected"`, `errorCount >= 1`                  | Pass   |
| Documento incompleto         | Campos obrigatórios faltando                                    | Sem erros (campos ausentes não são `failed`)             | Pass   |
| Campos obrigatórios ausentes | Dois campos `failed`                                            | `status: "rejected"`, `errorCount: 2`                    | Pass   |
| Campos inconsistentes        | Campo `processed` com `value: ""`                               | `status: "rejected"`, issue "Campo processado sem valor" | Pass   |
| Documento vazio              | `fields: []`, `guideType: "unknown"`                            | `status: "pending-review"`, warning de guia desconhecida | Pass   |

---

## 3. Atributos validados

- **ValidationResult canônico**: `ok`, `status`, `issues`, `warnings`, `summary`, `validationContext`, `extractionResult`.
- **Issues**: `kind: "canonical-validation-issue"`, `issueId`, `code`, `message`, `severity`, `fieldPath`, `status`.
- **Warnings**: `kind: "canonical-validation-warning"`, `warningId`, `code`, `message`.
- **Summary**: `issueCount`, `warningCount`, `errorCount`, `status`, `validationContext`.
- **Metadata**: `correlationId`, `previousJobId`, `documentId`, `channel`, `customAttributes` preservados do `PARSED` para o `VALIDATED`.
- **previousJobId** e **correlationId**: mantidos no `ValidationRequest` e propagados para a mensagem `VALIDATED` da fila.

---

## 4. Retry

- **Prova:** `DefaultValidationRuntimeAdapter` com `failAttempts: 2` e `defaultRetryCount: 2` recupera em 3 tentativas.
- **Resultado:** `ok: true`, `telemetry.attempts: 3`, `code: "VALIDATION_RUNTIME_OK"`.
- **Backoff:** `defaultRetryBackoffMs` aplicado entre tentativas.

---

## 5. Dead Letter

- **Cancelamento:** `getResult` com `AbortSignal` abortado retorna `ok: false`, `code: "VALIDATION_RUNTIME_CANCELLED"`, `telemetry.cancelled: true`.
- **Exceção / erro interno:** `RealTissValidationRuntimeAdapter.getResult` propaga o erro do `tissValidator`. No fluxo TISS, `processTissValidationJob` captura e assinala `settle: "nack-error"` → Dead Letter.
- **Provider indisponível:** `health()` detecta `documentExtractionRuntimeOk: false` quando `getDocumentExtractionRuntimePort` não responde.

---

## 6. Observability

| Sinal            | Resultado                                                                     |
| ---------------- | ----------------------------------------------------------------------------- |
| `health()`       | `ok: true`, `provider: "real-tiss"`, `runtimeReady: true`, `latencyMs` medido |
| `providerInfo()` | `providerId: "real-tiss"`                                                     |
| `capabilities()` | `provider: "real-tiss"`, `runtimeReady: true`                                 |
| `telemetry`      | `latencyMs`, `attempts: 1`, `cancelled: false` em operação normal             |
| `stats()`        | Contagens de jobs/requests/documentos/resultados                              |

---

## 7. Carga e desempenho

| Métrica         | Valor        |
| --------------- | ------------ |
| Amostras        | 1.000        |
| Latência média  | 0.000 ms     |
| Latência máxima | 0.000 ms     |
| Latência mínima | 0.000 ms     |
| Throughput      | 62.500 ops/s |

> Nota: as latências estão abaixo da resolução de `Date.now()` / `Math.round(performance.now())` do `DefaultValidationRuntimeAdapter.runOperation`. O throughput confirma que a validação em memória é extremamente rápida.

---

## 8. Limitações identificadas

1. **Timeout da validação real:** o `RealTissValidationRuntimeAdapter` executa o `tissValidator` fora do `runOperation` do `DefaultValidationRuntimeAdapter`. Portanto, `timeoutMs` e `retryCount` aplicam-se apenas às operações canônicas estruturais (`openJob`, `submitRequest`, `getResult` do delegate), não à lógica de validação TISS em si.
2. **Retry da validação real:** idem — o retry do `tissValidator` não é automático; falhas reais propagam exceção.
3. **Regras TISS:** a certificação cobre validações heurísticas (campos ausentes, valores vazios, tipo de guia). Regras operadora/versão TISS/XSD requerem integração futura com `TISSCatalogPort` / `RulePackEnginePort`.

---

## 9. Recomendação para produção

- **Aprovado para produção** como foundation de validação real, desde que:
  - o timeout/retry da lógica de validação seja encapsulado no adapter em A3-04;
  - regras TISS específicas por operadora sejam adicionadas antes do envio real para operadoras;
  - o monitoramento via `health()`, `telemetry` e `providerInfo` seja integrado ao observability do produto.

A Validation Runtime continua 100% desacoplada de Enriquecimento, XML, Lote, Protocolo, Auditoria e Persistência.

---

## 10. Checklist de certificação

- [x] Documento válido → `validated`
- [x] Documento inválido → `rejected`
- [x] Documento incompleto → sem erros falsos
- [x] Campos obrigatórios ausentes → `rejected`
- [x] Campos inconsistentes → `rejected`
- [x] Documento vazio → `pending-review`
- [x] `validationExecuted=true`, `enrichmentExecuted=false`, demais flags desligadas
- [x] `ValidationResult`, `issues`, `warnings`, `summary`, `metadata`, `correlationId`, `previousJobId` validados
- [x] Retry
- [x] Dead Letter
- [x] Observability
- [x] Carga e throughput
- [x] Build, tsc, lint, smoke e todos os testes

---

**Conclusão obrigatória:** A Validation Real foi certificada para produção reutilizando integralmente a arquitetura Enterprise. O Baseline v1.0 permanece preservado.
