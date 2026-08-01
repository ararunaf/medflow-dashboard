# EPC-08 — Document Identity Foundation

**Sprint:** EPC-08 — Document Identity Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..07) + ECS-01  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — camada Document Identity (fundação)

---

## 1. Objetivo

Construir o modelo Enterprise de **identidade documental canônica**, reutilizável por qualquer produto da IAeasy.

```
Application
    ↓
DocumentIdentityPort
    ↓
DocumentIdentityAdapter
    ↓
DocumentIdentityStore
    ↓
DocumentIdentityFactory
    ↓
DocumentIdentityProvider
```

Esta sprint **não** implementa OCR, captura, armazenamento real, auditoria, TISS ou contratos.

---

## 2. Princípio arquitetural

**Document Identity representa um documento.**

Ele **não** representa:

| Especialização futura | Nesta sprint |
|-----------------------|--------------|
| Guia TISS | ❌ fora de escopo |
| Contrato | ❌ fora de escopo |
| Nota Fiscal | ❌ fora de escopo |
| Prontuário | ❌ fora de escopo |
| Exame | ❌ fora de escopo |
| Receita | ❌ fora de escopo |
| Laudo | ❌ fora de escopo |

Todas serão especializações futuras **fora** deste componente.

---

## 3. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `DocumentIdentityPort` | `src/lib/enterprise/document-identity/ports/document-identity-port.ts` |
| Modelo canônico + páginas + identidade | `src/lib/enterprise/document-identity/ports/types.ts` |
| Helpers de identidade / páginas | `ports/identity.ts`, `ports/pages.ts` |
| `DefaultDocumentIdentityAdapter` | `adapters/default-document-identity-adapter.ts` |
| `MockDocumentIdentityAdapter` | `adapters/mock-document-identity-adapter.ts` |
| `DocumentIdentityStore` + Default | `store/` |
| `DocumentIdentityFactory` | `factory/document-identity-factory.ts` |
| `createDocumentIdentityPort` | `providers/create-document-identity-port.ts` |
| PoC Application | `demo/document-identity-health-query.ts` |
| Testes | `scripts/enterprise/tests/document-identity-engine.test.ts` |
| Script npm | `npm run enterprise:document-identity:test` |

Documentação satélite:

| Documento | Função |
|-----------|--------|
| [`EPC-08_DOCUMENT_MODEL.md`](./EPC-08_DOCUMENT_MODEL.md) | Modelo canônico, páginas, identidade |
| [`EPC-08_ARCHITECTURE.md`](./EPC-08_ARCHITECTURE.md) | Arquitetura, integrações futuras, especializações |
| [`EPC-08_CERTIFICATION.md`](./EPC-08_CERTIFICATION.md) | Certificação da sprint |

---

## 4. Superfície do Port

```ts
interface DocumentIdentityPort {
  readonly providerId: DocumentIdentityProviderId;
  createDocument(input: CreateDocumentInput): Promise<CreateDocumentResult>;
  getDocument(input: GetDocumentInput): Promise<GetDocumentResult>;
  listDocuments(input?: ListDocumentsInput): Promise<ListDocumentsResult>;
  health(): Promise<DocumentIdentityHealth>;
  capabilities(): DocumentIdentityCapabilities;
}
```

### Providers

| Id | Adapter | Status EPC-08 |
|----|---------|---------------|
| `default` | `DefaultDocumentIdentityAdapter` | ✅ in-process |
| `mock` / `test` | `MockDocumentIdentityAdapter` | ✅ testes / offline |
| `database` / `remote` / `registry` | — | ❌ erro explícito (prep) |

---

## 5. O que o componente **jamais** conhece

- TISS / operadoras / guias / pacientes / profissionais
- Contratos / notas fiscais / prontuário / exames / receitas / laudos
- OCR / captura / auditoria / Rule Packs / Workflow de produto
- Storage físico / banco / migrations / UI / APIs

Seu único objetivo é **representar, identificar, versionar e relacionar documentos** de forma canônica.

---

## 6. Integração futura (somente documentação)

Document Identity será consumido (futuro) por OCR, Storage, Workflow, Rule Engine, AI Providers, Contract Intelligence e Capture — ver [`EPC-08_ARCHITECTURE.md`](./EPC-08_ARCHITECTURE.md).  
**Nenhum** desses módulos foi acoplado nesta sprint.

---

## 7. Como usar (fundação)

```ts
import { createDocumentIdentityPort } from "@/lib/enterprise/document-identity";

const port = createDocumentIdentityPort(); // default in-process

const created = await port.createDocument({
  document: {
    documentType: "generic",
    source: "upload",
    mimeType: "application/pdf",
    tags: ["foundation"],
  },
});

const found = await port.getDocument({ documentId: created.documentId });
const list = await port.listDocuments({ documentType: "generic" });
```

Para testes:

```ts
const port = createDocumentIdentityPort({ provider: "mock" });
```
