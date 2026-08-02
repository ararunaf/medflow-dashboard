# DIP-04 — Classification Architecture

**Sprint:** DIP-04 — Document Classification Runtime  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Cadeia obrigatória

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Engine Runtime
  ↓
OCR Runtime
  ↓
DocumentClassificationRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
Classification Provider Adapter (referência estrutural)
  ↓
Provider futuro
```

É proibido:

- acessar Classification Providers diretamente do produto;
- bypassar Enterprise Runtime / Capture Runtime / OCR Runtime / Orchestrator;
- executar classificação real nesta sprint.

---

## 2. Árvore do módulo

```
src/lib/enterprise/document-classification-runtime/
  index.ts
  ports/
    document-classification-runtime-port.ts
    models.ts
    types.ts
    identity.ts
    index.ts
  adapters/
    default-document-classification-runtime-adapter.ts
    mock-document-classification-runtime-adapter.ts
    index.ts
  store/
    document-classification-runtime-store.ts
    in-memory-document-classification-runtime-store.ts
    index.ts
  factory/
    document-classification-runtime-factory.ts
    index.ts
  providers/
    create-document-classification-runtime-port.ts
    index.ts
  demo/
    document-classification-runtime-health-query.ts
    index.ts
```

---

## 3. Dependências Enterprise (DI)

```ts
type DocumentClassificationRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getOCRRuntimePort(): OCRRuntimePort;
};
```

`DefaultDocumentClassificationRuntimeAdapter` exige `enterpriseDeps`.
Implementação paralela é proibida.

---

## 4. Ordem de composição no Enterprise Runtime

1. `DocumentIntakePort`
2. `CanonicalExecutionOrchestratorPort`
3. `DocumentIntakeRuntimePort`
4. `OCRProviderPort`
5. `OCRRuntimePort` (deps: Orchestrator + OCRProvider)
6. `DocumentClassificationRuntimePort` (deps: Orchestrator + OCRRuntime)
7. `CaptureEngineRuntimePort` (deps: Orchestrator + DocumentIntakeRuntime + OCRRuntime + DocumentClassificationRuntime)

---

## 5. Responsabilidades por camada

| Camada | Responsabilidade | Proibido |
|--------|------------------|----------|
| Produto | Chamar Enterprise Runtime bridge | Instanciar adapters / providers |
| Enterprise Runtime | Compor Ports / expor bridge | Regras de negócio / classificação real |
| Capture Engine Runtime | Coordenar intake → OCR → Classification | Classificação real |
| OCR Runtime | Coordenação OCR estrutural | OCR real |
| Document Classification Runtime | Coordenação estrutural de classificação | IA / ML / regras / heurísticas |
| Orchestrator | Criar execução estrutural | Processamento documental |
| Classification Provider Adapter | Referência estrutural apenas | Integração / HTTP / credenciais |

---

## 6. Fronteiras explícitas (fora de escopo)

- Classificação documental real
- IA / LLM / embeddings / Machine Learning
- Rule Engine de classificação
- OCR para classificação
- Storage Manager Runtime (DIP-05)
- Mudança de UI / API / migrations / comportamento de produto
