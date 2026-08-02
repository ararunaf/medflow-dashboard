# CLASS-01 — Document Classification Provider

**Sprint:** CLASS-01 — Document Classification Provider  
**Padrão:** ECS-01 (Port / Adapter / Factory / Registry / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## Cadeia obrigatória

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Runtime
  ↓
OCR Runtime
  ↓
Document Classification Runtime
  ↓
DocumentClassificationProviderPort
  ↓
DefaultDocumentClassificationAdapter
  ↓
Classification Provider (rule-based)
```

## Capacidades

- Classification Provider / Port / Default Adapter / Factory / Registry
- Resultado canônico: `CanonicalDocumentClassificationResult`
- Timeout / Retry / Cancelamento
- Logging estrutural / Telemetria estrutural
- Classificação rule-based configurável (sem IA / ML / LLM / embeddings / RAG)

## Tipos documentais

- `guia-tiss`
- `solicitacao`
- `prontuario`
- `laudo`
- `documento-administrativo`
- `documento-financeiro`
- `documento-desconhecido`

## Proibido

- Bypass do `DocumentClassificationProviderPort`
- Chamadas diretas a OpenAI / Azure OpenAI / Gemini / Claude
- IA / ML / embeddings / RAG nesta sprint
- OCR novo (consome apenas resultado do OCR Runtime)
