# OCR Real — Discovery de Ativação

| Campo | Valor |
|-------|-------|
| Sprint | A1-01 — OCR Real Discovery |
| Projeto | MedicFlow-AI |
| Natureza | Documentação (sem alteração de `src/`) |
| Baseline | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md` |
| Status | **Discovery concluído** |

---

## 1. Objetivo

Mapear todos os pontos de contato, provedores, adapters, configurações e segredos necessários para ativar o OCR real sem alterar a arquitetura Enterprise certificada.

---

## 2. OCRRuntimePort auditado

### 2.1 Contrato

Arquivo: `src/lib/enterprise/ocr-runtime/ports/ocr-runtime-port.ts`

- Nome: `OCRRuntimePort`
- Responsabilidade: orquestração estrutural de jobs/requests/documentos OCR e coordenação/execução real.
- Entrypoint oficial: `getEnterpriseRuntime().getOcrRuntimePort()`
- Não realiza HTTP diretamente. OCR real ocorre exclusivamente via `OCRProviderPort.process()`.

### 2.2 Operações principais

| Método | Papel |
|--------|-------|
| `openJob` | Abre job estrutural de OCR (não dispara engine). |
| `submitRequest` | Cria request estrutural (não dispara engine). |
| `registerDocument` | Registra documento estrutural (não lê bytes). |
| `getResult` | Obtém resultado estrutural. |
| `process` | **Executa OCR real** via `OCRProviderPort`. |
| `coordinateOcr` | Coordena sessão com Orchestrator + Provider. |
| `health` | Prontidão do runtime e do provider ativo. |
| `capabilities` | Capacidades estáticas. |

### 2.3 Adapters existentes

| Adapter | Arquivo | Papel |
|---------|---------|-------|
| `DefaultOCRRuntimeAdapter` | `src/lib/enterprise/ocr-runtime/adapters/default-ocr-runtime-adapter.ts` | Adapter oficial com coordenação real via Enterprise Ports. |
| `MockOCRRuntimeAdapter` | `src/lib/enterprise/ocr-runtime/adapters/mock-ocr-runtime-adapter.ts` | Mock determinístico para testes. |

---

## 3. OCRProviderPort auditado

### 3.1 Contrato

Arquivo: `src/lib/enterprise/ocr-provider/ports/ocr-provider-port.ts`

- Nome: `OCRProviderPort`
- Responsabilidade: contrato único de integração com provedores OCR.
- Detalhes de vendor (Azure / Google / Tesseract) ficam exclusivamente em adapters.

### 3.2 Operações principais

| Método | Papel |
|--------|-------|
| `process` | Extração documental real. |
| `health` | Prontidão do adapter. |
| `capabilities` | Capacidades do provider. |
| `providerInfo` | Metadados do provider. |
| `validateConfiguration` | Validação estrutural (sem chamadas de rede). |

### 3.3 Adapters existentes

| Adapter | Arquivo | Papel |
|---------|---------|-------|
| `AzureDocumentIntelligenceAdapter` | `src/lib/enterprise/ocr-provider/adapters/azure-document-intelligence-adapter.ts` | **Único provedor real implementado.** HTTP autorizado ao Azure Document Intelligence. |
| `MockOCRProviderAdapter` | `src/lib/enterprise/ocr-provider/adapters/mock-ocr-provider-adapter.ts` | Mock determinístico. |

---

## 4. Providers encontrados

### 4.1 Registro atual (`OCRProviderRegistry`)

Arquivo: `src/lib/enterprise/ocr-provider/registry/ocr-provider-registry.ts`

| providerId | Nome | Status | Adapter |
|------------|------|--------|---------|
| `mock` | Default Mock OCR Provider | `ready` | `MockOCRProviderAdapter` |
| `test` | Test OCR Provider | `ready` | `MockOCRProviderAdapter` |
| `default` | Default OCR Provider (Mock) | `ready` | `MockOCRProviderAdapter` |
| `azure` | Azure Document Intelligence | `ready` | `AzureDocumentIntelligenceAdapter` |

> Google Document AI, AWS Textract e Tesseract estão **mencionados** no Port (`OCRProviderPort`) e no mapeamento de referências (`DefaultOCRRuntimeAdapter.toProviderReferenceId`), mas **não possuem adapters implementados**.

---

## 5. Provider oficial recomendado

**Azure Document Intelligence**

- Adapter já implementado e homologado.
- É o único caminho de HTTP autorizado (OCR-01).
- Faz polling da API `/documentModels/prebuilt-layout:analyze`.
- Configuração 100% via variáveis de ambiente.
- Não exige instalação de SDK adicional (usa `fetch` global).

---

## 6. Provider secundário

**Google Document AI** — **não implementado.**

- Não existe adapter no repositório.
- Não existe provider registrado.
- Para ser ativado no futuro, deve ser adicionado:
  - `src/lib/enterprise/ocr-provider/adapters/google-document-ai-adapter.ts`
  - Registro em `OCRProviderRegistry`
  - `case "google"` em `OCRProviderFactory`
  - Variáveis de ambiente: `MEDFLOW_GOOGLE_DOCUMENT_AI_ENDPOINT` / `MEDFLOW_GOOGLE_DOCUMENT_AI_KEY`

---

## 7. Estratégia de failover

Atualmente não há lógica automática de failover no `OCRProviderFactory` nem no `OCRRuntimeAdapter`. O failover deve ser implementado **sempre atrás do mesmo `OCRProviderPort`**, sem alterar a arquitetura. Opções documentadas:

1. **Provider selecionável por configuração:**
   - `getEnterpriseRuntime()` pode receber `ocrProviderPort` customizado no `EnterpriseRuntimeOptions`.
   - Aplicação pode escolher `azure` como padrão e `mock` como fallback para testes.

2. **Composite / Chain of Responsibility dentro de um adapter único:**
   - Criar `ResilientOCRProviderAdapter` que orquestra Azure → Google (futuro) → Mock.
   - Implementa a mesma interface `OCRProviderPort`.
   - Troca a criação do `ocrProviderPort` no `EnterpriseRuntimeOptions` sem alterar `OCRRuntimePort`.

3. **Retry + DLQ padrão do Worker:**
   - Falhas transitórias da Azure já são cobertas por `Retry` e `DeadLetter` do pipeline Enterprise.

---

## 8. Configuração

### 8.1 Variáveis de ambiente — Azure

```bash
MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://<nome>.cognitiveservices.azure.com
MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY=<api-key>
```

Fallbacks aceitos (ordem de prioridade):

1. `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
2. `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
3. `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY`
4. `AZURE_DOCUMENT_INTELLIGENCE_KEY`

### 8.2 Constantes do adapter

Arquivo: `src/lib/enterprise/ocr-provider/adapters/azure-document-intelligence-adapter.ts`

| Constante | Valor |
|-----------|-------|
| `AZURE_DOCUMENT_INTELLIGENCE_PROVIDER_VERSION` | `prebuilt-layout@2024-11-30` |
| `AZURE_DOCUMENT_INTELLIGENCE_API_VERSION` | `2024-11-30` |
| `DEFAULT_POLL_INTERVAL_MS` | 500 ms |
| `DEFAULT_MAX_POLLS` | 60 |
| `DEFAULT_TIMEOUT_MS` | 30.000 ms |
| `DEFAULT_RETRY_COUNT` | 1 |
| `DEFAULT_RETRY_BACKOFF_MS` | 250 ms |

### 8.3 Formatos suportados

- `application/pdf`
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/tiff`

### 8.4 Resposta canônica

O adapter converte a resposta da Azure em `ProcessingOutput` + `DocumentProcessingResult` (EPC-13), sem campos OCR-específicos na raiz.

---

## 9. Autenticação

A autenticação é feita por **API Key** no header `Ocp-Apim-Subscription-Key`.

- A chave é lida de variável de ambiente.
- Nunca é persistida no repositório.
- O adapter não lê arquivos `.env` diretamente; o runtime fornece as variáveis.

---

## 10. Secrets necessários

| Secret | Finalidade | Onde configurar |
|--------|------------|-----------------|
| Azure Document Intelligence API Key | Autenticar chamadas à API. | Variável de ambiente ou secret store (ex: GitHub Actions, Vercel, Azure Key Vault). |
| Azure Endpoint URL | Roteamento para a instância correta. | Variável de ambiente. |

---

## 11. Pontos onde OCR mock é utilizado

### 11.1 Foundation

- `OCRProviderFactory` default: `provider: "mock"` quando nenhum provider é informado.
- `MockOCRProviderAdapter` retorna conteúdo determinístico `MOCK_OCR_EXTRACTED_CONTENT`.

### 11.2 Enterprise Runtime

- `DefaultEnterpriseRuntime` já instancia `createOCRProviderPort({ provider: "azure" })` no composition root.
- O Runtime é mockável via `EnterpriseRuntimeOptions.ocrProviderPort`.

### 11.3 Testes

- `tiss-runtime-01b-ocr-capability.test.ts` e similares usam `createOCRRuntimePort({ provider: "mock" })` para manter execução determinística.
- `ocr-provider-azure-engine.test.ts` prova o adapter Azure com `fetch` mockado.

### 11.4 Pipeline TISS

- `process-tiss-received-ocr.ts` consome `RECEIVED` e chama `OCRRuntimePort.process()`.
- O resultado do OCR flui para `OCR_COMPLETED` independentemente de mock ou Azure.

---

## 12. Dependências

### 12.1 `package.json`

- Não há dependência específica para Azure Document Intelligence.
- O adapter usa `fetch` global, disponível em Node.js 18+, Bun e Cloudflare Workers.
- Não é necessário adicionar `@azure/ai-form-recognizer` para o funcionamento básico.

### 12.2 Runtime / Types compartilhados

- `DocumentProcessingResult`, `ProcessingOutput` (`src/lib/enterprise/document-processor/ports/types`)
- `OCRProviderPort` e `OCRRuntimePort` (`src/lib/enterprise/ocr-provider/ports`, `src/lib/enterprise/ocr-runtime/ports`)
- `CanonicalExecutionOrchestratorPort`

---

## 13. Estratégia de substituição sem alterar arquitetura

Para ativar OCR real (Azure) no pipeline TISS sem violar o Baseline Enterprise:

1. **Garantir que `getEnterpriseRuntime()` seja usado.**
   - `DefaultEnterpriseRuntime` já monta `ocrProviderPort` com `provider: "azure"`.

2. **Fornecer as secrets no ambiente.**
   - `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
   - `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY`

3. **Não alterar `OCRRuntimePort` nem `OCRProviderPort`.**
   - A ativação ocorre atrás do Port, na troca do adapter/factory ou injetando `EnterpriseRuntimeOptions`.

4. **Validar com health.**
   - `runtime.getOcrRuntimePort().health()` e `runtime.getOcrProviderPort().health()` indicam prontidão.

5. **Manter fallback para testes.**
   - Testes continuam usando `createOCRProviderPort({ provider: "mock" })` ou `createOCRRuntimePort({ provider: "mock" })`.

---

## 14. Impacto

| Área | Impacto |
|------|---------|
| `src/lib/enterprise/ocr-provider/adapters` | Possível melhoria no `AzureDocumentIntelligenceAdapter` (não criação de novos adapters). |
| `src/lib/enterprise/runtime/enterprise-runtime.ts` | Nenhuma — já aponta para `azure` por padrão. |
| `src/lib/enterprise/ocr-runtime` | Nenhuma. |
| Pipeline TISS | 01B passa a chamar Azure real quando secrets estão presentes. |
| Infraestrutura | Necessita de endpoint e chave Azure. |
| Custo | Cobrança por chamada/página do Azure Document Intelligence. |

---

## 15. Riscos

| Risco | Mitigação |
|-------|-----------|
| Ausência de endpoint/key no ambiente | Health retorna `unhealthy`; processamento pode cair em DLQ. |
| Latência da Azure | Polling configurável; timeout de 30s. |
| Formatos de arquivo não suportados | Validar MIME antes do envio. |
| Instabilidade da Azure | Usar Retry e DLQ do Worker; considerar failover para `mock` em staging. |
| Custos inesperados | Rate-limiting e quotas no Azure; monitorar via Observability. |

---

## 16. Plano de ativação

1. Provisionar recurso Azure Document Intelligence.
2. Obter endpoint e API key.
3. Configurar variáveis de ambiente no ambiente de deploy.
4. Executar `ocr-provider-azure-engine.test.ts` com credenciais reais em ambiente controlado.
5. Submeter um documento TISS via pipeline `RECEIVED → OCR_COMPLETED`.
6. Verificar `Observability` por latência, erros e custos.
7. Homologar com 100 documentos reais.

---

## 17. Critérios de homologação

- Taxa de sucesso ≥ 95% em documentos TISS suportados.
- Latência média ≤ 5s por página.
- Zero regressões em `tiss-runtime-01b-ocr-capability.test.ts` (modo `mock`).
- Nenhuma alteração em `OCRRuntimePort`, `OCRProviderPort` ou `getEnterpriseRuntime`.
- Health `ok: true` quando endpoint/key estão configurados.
- Nenhum dado sensível persistido em logs.

---

## 18. Conclusão

O OCR real foi completamente mapeado. Nenhuma alteração arquitetural foi realizada. O Baseline Enterprise permanece preservado.

A ativação depende exclusivamente de: (1) fornecer as variáveis de ambiente Azure e (2) validar o adapter existente em ambiente real. O provedor Azure é o único caminho HTTP homologado; Google Document AI, AWS Textract e Tesseract são futuros **extension points** sem implementação atual.
