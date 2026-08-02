# DIP-06 — Document Search Runtime

**Sprint:** DIP-06 — Document Search Runtime  
**Plataforma:** MedicFlow Enterprise — Document Intelligence Platform  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Objetivo

Criar a infraestrutura oficial do Document Search Runtime da plataforma Enterprise.

Toda futura funcionalidade de pesquisa documental deverá obrigatoriamente utilizar esta infraestrutura.
Nenhum Search Provider poderá ser acessado diretamente pelo produto.

---

## 2. Escopo (estrutural apenas)

### Inclui

- Módulo `src/lib/enterprise/document-search-runtime/`
- `DocumentSearchRuntimePort`, adapters default/mock, store in-memory, factory, provider
- Modelos canônicos de pesquisa documental
- Capabilities tecnológicas registradas como FALSE / informativas
- Referências estruturais a Search Providers futuros (Elasticsearch, OpenSearch, PostgreSQL FTS, Vector Database, Azure AI Search, Mock Search)
- Integração com Enterprise Runtime, Capture Engine Runtime, OCR Runtime, Document Classification Runtime, Storage Manager Runtime e Canonical Execution Orchestrator
- Migração estrutural do fluxo oficial de captura para passar pelo Document Search Runtime
- Suite `enterprise:document-search-runtime:test`
- Documentação DIP-06

### Explicitamente fora de escopo

- Busca documental real
- Indexação real
- Integração Elasticsearch / OpenSearch / PostgreSQL Full Text Search
- Vetores / Embeddings / RAG / IA
- Qualquer consulta real / serviço externo / HTTP / credenciais
- Mudança de comportamento de produto, UI, API ou migrations

---

## 3. Fluxo oficial

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Engine Runtime
  ↓
OCR Runtime
  ↓
Document Classification Runtime
  ↓
Storage Manager Runtime
  ↓
DocumentSearchRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
Search Provider Adapter (referência estrutural)
  ↓
Provider futuro (referência apenas)
```

---

## 4. Componentes

| Artefato | Responsabilidade |
|----------|------------------|
| `DocumentSearchRuntimePort` | Contrato único de coordenação de search |
| `DefaultDocumentSearchRuntimeAdapter` | Bridge Orchestrator + Storage Manager Runtime + Provider Adapter reference |
| `MockDocumentSearchRuntimeAdapter` | Homologação / isolamento de contrato |
| `InMemoryDocumentSearchRuntimeStore` | Estado in-process de sessões |
| `DocumentSearchRuntimeFactory` | Materializa o adapter pedido |
| `createDocumentSearchRuntimePort` (Provider) | Entry point de composição |
| Modelos canônicos | Session / Request / Result / Identity / Metadata / Capabilities / Configuration / Reference |

---

## 5. Próximo passo do roadmap

Após DIP-06: **GATE-ARCH-03** — auditoria arquitetural completa da cadeia Document Intelligence Platform (Enterprise → Capture → OCR → Classification → Storage → Search).
