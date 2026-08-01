# EPC-08 — Document Model

**Sprint:** EPC-08 — Document Identity Foundation  
**Data:** 31/07/2026  
**Natureza:** Especificação do modelo canônico — sem OCR, captura, storage real ou domínio clínico  
**Documento pai:** [`EPC-08_DOCUMENT_IDENTITY.md`](./EPC-08_DOCUMENT_IDENTITY.md)

---

## 1. Modelo canônico de documento (FASE 5)

O documento possui **apenas** os campos abaixo. Nada além disso no núcleo tipado.

| Campo | Tipo | Papel |
|-------|------|-------|
| `documentId` | `DocumentId` | Identificador canônico |
| `documentType` | `DocumentType` (string livre) | Tipo genérico — **sem enum de domínio** |
| `source` | `DocumentSource` | Fonte / canal lógico |
| `createdAt` | ISO string | Criação |
| `updatedAt` | ISO string | Última atualização |
| `status` | `DocumentStatus` | Status estrutural genérico |
| `pages` | `DocumentPage[]` | Páginas (FASE 6) |
| `attachments` | `DocumentAttachment[]` | Anexos por referência |
| `images` | `DocumentImage[]` | Imagens por referência |
| `metadataReference` | `DocumentMetadataReference` | Ref opaca ao Metadata Engine |
| `storageReference` | `DocumentStorageReference` | Ref opaca ao Storage Port |
| `checksum` | `DocumentChecksum` | Integridade |
| `version` | `DocumentVersion` | Versão estrutural |
| `mimeType` | string | MIME genérico |
| `fileSize` | number | Tamanho em bytes |
| `language` | string | Idioma (BCP-47 livre) |
| `tags` | `DocumentTag[]` | Classificação livre |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |

### Agregado de identidade (FASE 7)

Campo estrutural `identity?: DocumentCanonicalIdentity` agrega preparação de identidade sem poluir o núcleo com semântica de domínio:

| Campo | Papel |
|-------|-------|
| `uuid` | UUID canônico |
| `hash` | Hash genérico |
| `fingerprint` | Fingerprint derivado |
| `checksum` | Checksum de identidade |
| `sourceId` | Id na fonte de origem |
| `correlationId` | Correlação cross-sistema |
| `externalId` | Id externo / legado |
| `origin` | Origem lógica |

---

## 2. Modelo de páginas (FASE 6)

Cada página possui **apenas**:

| Campo | Papel |
|-------|-------|
| `pageId` | Identificador da página |
| `sequence` | Ordem (inteiro) |
| `width` / `height` | Geometria opcional |
| `rotation` | Rotação em graus |
| `checksum` | Integridade da página |
| `imageReference` | Ref opaca à imagem |
| `thumbnailReference` | Ref opaca ao thumbnail |

**Nenhuma informação clínica** (diagnóstico, procedimento, paciente, guia, etc.).

Helpers: `sortPagesBySequence`, `resequencePages`, `findPageById`, `findPageBySequence`, `getPageCount`.

---

## 3. Anexos e imagens

São **referências estruturais**, não blobs:

- `DocumentAttachment` — nome, mime, size, checksum, `storageReference`
- `DocumentImage` — geometria + `imageReference` / `thumbnailReference`

Conteúdo binário permanece responsabilidade futura do Storage Port.

---

## 4. Status genéricos

Valores conhecidos (não exclusivos): `draft` | `active` | `archived` | `deleted` | `processing` | `unknown`  
O tipo aceita strings adicionais para evolução sem enum de produto.

---

## 5. O que o modelo **não** contém

- Campos TISS / ANS / operadora
- Campos de contrato / cláusula / vigência
- Campos clínicos (CID, procedimento, paciente, profissional)
- Texto OCR / bounding boxes / confiança de IA
- Workflow state machine / rule pack ids de domínio
- Paths físicos de disco ou credentials

---

## 6. Extensibilidade

| Mecanismo | Uso permitido |
|-----------|---------------|
| `documentType` string | Tipagem livre por produto (fora do Core) |
| `tags` | Classificação transversal |
| `customAttributes` | Atributos opacos sem schema clínico no Core |
| `metadataReference` | Ligação futura ao Metadata Engine |
| Especializações externas | Wrappers / schemas de produto **fora** de `document-identity/` |

O Core permanece genérico; o domínio permanece nas camadas de produto.
