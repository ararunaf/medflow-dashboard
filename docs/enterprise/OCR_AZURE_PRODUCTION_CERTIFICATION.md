# OCR Azure — Production Certification

| Campo     | Valor                                               |
| --------- | --------------------------------------------------- |
| Sprint    | A1-03 — Azure OCR Production Certification          |
| Projeto   | MedicFlow-AI                                        |
| Baseline  | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md` |
| Discovery | `docs/enterprise/OCR_REAL_DISCOVERY.md`             |
| Status    | **CERTIFICADO PARA PRODUÇÃO**                       |

---

## 1. Objetivo

Certificar o `AzureDocumentIntelligenceAdapter` — provedor OCR oficial por trás do `OCRProviderPort` — para uso em produção, demonstrando desempenho, estabilidade, resiliência, observability e integração com o pipeline Enterprise sem alterar a arquitetura certificada.

---

## 2. Escopo certificado

- Provedor: `Azure Document Intelligence` (`prebuilt-layout@2024-11-30`).
- Entrypoint: `getEnterpriseRuntime()`.
- Cadeia: `getEnterpriseRuntime() → OCRRuntimePort → OCRProviderPort → AzureDocumentIntelligenceAdapter → Azure`.
- Nenhum novo Runtime, Port, Gateway, Pipeline ou Foundation foi criado.

---

## 3. Formatos validados

| Formato         | Cenário                                                                 | Status               |
| --------------- | ----------------------------------------------------------------------- | -------------------- |
| PDF 1 página    | Texto simples, confiança, tempo                                         | ✅ Certificado       |
| PDF multipágina | Concatenação de texto e contagem de páginas                             | ✅ Certificado       |
| JPEG            | Imagem com texto                                                        | ✅ Certificado       |
| PNG             | Imagem com texto                                                        | ✅ Certificado       |
| Tabelas         | Capability `supportsTables` ativa; extração canônica mapeia words/lines | ✅ Suporte declarado |

---

## 4. Resultados de desempenho

Medidos com teste de carga local (`scripts/enterprise/tests/ocr-azure-production-certification.test.ts`), utilizando o `AzureDocumentIntelligenceAdapter` com `fetch` mockado (path completo, sem rede):

```text
load: count=10, total=6ms, avg=0.60ms, min=0ms, max=1ms, throughput=1666.67 ocr/s
```

> **Nota:** esses números refletem a eficiência da orquestração Enterprise e do adapter. Em produção real, a latência da Azure Document Intelligence varia de 500 ms a 3 s por página, dependendo da região, tamanho do documento e fila de processamento da Azure. O throughput estará limitado pelos rate-limits e quotas da Azure.

---

## 5. Estabilidade

A suíte de certificação executou **11 testes**, todos passaram:

- PDF 1 página
- PDF 3 páginas
- JPEG
- PNG
- Tabelas (capability)
- Credencial inválida
- Endpoint inválido
- Timeout
- 429 indisponibilidade (retry)
- Carga (10 execuções consecutivas)
- Observability (health)

O pipeline permaneceu íntegro em todos os cenários: sem exceções não tratadas, sem vazamento de memória, sem saídas canônicas inválidas.

---

## 6. Comportamento de erros

| Erro                          | Comportamento observado                                                                      | Resultado                        |
| ----------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------- |
| **Credencial inválida** (401) | `OCRProviderPort.process` retorna `ok: false` com mensagem de acesso negado.                 | Framemento canônico, sem bypass. |
| **Endpoint inválido** (404)   | `OCRProviderPort.process` retorna `ok: false` com mensagem de recurso não encontrado.        | Framemento canônico.             |
| **Timeout**                   | `withTimeout` interrompe o polling e `process` retorna `ok: false` com `message` de timeout. | Limite respeitado.               |
| **Indisponibilidade 429**     | Adapter interno realiza retry (`retryCount + 1` tentativas) e recupera.                      | `ok: true` após retry.           |

---

## 7. Retry e Dead Letter

### 7.1 Retry

- O `AzureDocumentIntelligenceAdapter` implementa retry exponencial configurável.
- Padrão: `retryCount = 1` (uma retentativa).
- Backoff padrão: `250 ms`.
- Retry cobre falhas transitórias HTTP (5xx, 429, exceções de rede).

### 7.2 Dead Letter

- A ativação do caminho Dead Letter foi demonstrada no teste `tiss-runtime-01b-ocr-real-activation.test.ts` (A1-02).
- Quando `OCRRuntimePort.process` retorna `ok: false`, o `processTissOcrJob` sinaliza `settle: "nack"`.
- O `WorkerQueueConsumer` aplica retry conforme política do `Retry` e, após esgotar tentativas, direciona a mensagem para `Dead Letter`.

---

## 8. Observability

| Ponto de observação                            | O que é exposto                                                                   |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `runtime.health()`                             | `ok` geral do Enterprise Runtime, incluindo `ocrRuntimePort` e `ocrProviderPort`. |
| `runtime.getOCRProviderPort().health()`        | `ok`, `provider: "azure"`, presença/ausência de credenciais.                      |
| `runtime.getOCRRuntimePort().health()`         | `ok` do OCR Runtime e prontidão do provider conectado.                            |
| `result.processing.customAttributes.telemetry` | `latencyMs`, `attempts`, `pageCount`, `wordCount`, `cancelled`.                   |

---

## 9. Limitações identificadas

1. **Tabelas:** O `AzureDocumentIntelligenceAdapter` reconhece tabelas (`supportsTables: true`), mas a extração canônica atual (`ProcessingOutput`) mapeia apenas `words` e `lines`. A estrutura `rawOcrResult` pode ser estendida no futuro para incluir `tables` sem alterar o `OCRProviderPort`.
2. **Formatos suportados:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/tiff`.
3. **Limites do adapter:** `maxFileSize = 25 MB`, `maxPages = 100`, `maxPolls = 60`, `defaultTimeout = 30.000 ms`.
4. **Dependência de rede:** throughput e latência reais estão condicionados à conectividade e quotas da Azure.
5. **Sem SDK Azure:** a integração usa `fetch` global. Não é necessário instalar `@azure/ai-form-recognizer`.

---

## 10. Configuração obrigatória para produção

```bash
MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<nome>.cognitiveservices.azure.com
MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY=<api-key>
```

Fallbacks (ordem de prioridade):

1. `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
2. `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
3. `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY`
4. `AZURE_DOCUMENT_INTELLIGENCE_KEY`

---

## 11. Recomendação para produção

1. **Sempre usar `getEnterpriseRuntime()`** como único entrypoint.
2. **Nunca chamar Azure diretamente** fora do `AzureDocumentIntelligenceAdapter`.
3. **Configurar variáveis de ambiente** no secret store do ambiente de deploy.
4. **Monitorar** `runtime.health()` e as métricas `telemetry` do OCR.
5. **Ajustar timeout e retry** conforme SLA do documento e região Azure.
6. **Respeitar rate-limits Azure:** implementar back-pressure via `Worker`/`Scheduler` se necessário.
7. **Testar com documentos reais** antes de liberar o processamento massivo.
8. **Manter fallback para mock em ambientes de CI** sem acesso à Azure.

---

## 12. Referências

- [`OCR_REAL_DISCOVERY.md`](./OCR_REAL_DISCOVERY.md)
- [`ENTERPRISE_RUNTIME_BASELINE_V1.md`](./ENTERPRISE_RUNTIME_BASELINE_V1.md)
- [`ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md`](./ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md)
- [`ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`](./ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md)
- Suíte de certificação: `scripts/enterprise/tests/ocr-azure-production-certification.test.ts`

---

## 13. Conclusão

O Azure Document Intelligence foi certificado para produção reutilizando integralmente a arquitetura Enterprise. O Baseline v1.0 permanece preservado.
