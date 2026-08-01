# EPC-11 — Contract Model

**Sprint:** EPC-11 — Contract Foundation  
**Data:** 31/07/2026  
**Natureza:** Especificação do modelo canônico — sem regras de negócio, TISS ou domínio clínico  
**Documento pai:** [`EPC-11_CONTRACT_FOUNDATION.md`](./EPC-11_CONTRACT_FOUNDATION.md)

---

## 1. Modelo canônico (FASE 6)

O Contrato possui **apenas** os campos abaixo. Nada além disso no núcleo tipado.

| Campo | Tipo | Papel |
|-------|------|-------|
| `contractId` | `ContractId` | Identificador canônico |
| `name` | `ContractName` | Nome lógico |
| `description` | string | Descrição livre |
| `version` | `ContractVersionLabel` | Versão estrutural |
| `status` | `ContractStatus` | Lifecycle estrutural |
| `effectiveDate` | ISO / string | Vigência início (rótulo) |
| `expirationDate` | ISO / string | Vigência fim (rótulo) |
| `metadataReference` | `ContractMetadataReference` | Ref opaca ao Metadata Engine |
| `rulePackReferences` | `ContractRulePackReference[]` | Refs opacas a Rule Packs |
| `workflowReferences` | `ContractWorkflowReference[]` | Refs opacas a Workflows |
| `configurationReference` | `ContractConfigurationReference` | Ref opaca a Configuration |
| `attachmentReferences` | `ContractAttachment[]` | Anexos / Document Identity opacos |
| `tags` | `ContractTag[]` | Classificação livre |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |
| `capabilities` | `ContractDeclaredCapability[]` | Capacidades declaradas pelo contrato |

---

## 2. Status / versionamento (FASE 8)

Valores preparados (sem implementação operacional):

| Status | Papel |
|--------|-------|
| `draft` | Rascunho |
| `published` | Publicado (rótulo) |
| `deprecated` | Depreciado |
| `archived` | Arquivado |
| `rollback` | Prep de rollback (rótulo) |

Helpers: `getVersionInfo`, `withVersionInfo`, `defineContractVersion`, `prepareRollbackTarget`, `isDraft`, `isPublished`, `hasKnownStatus`.

Sem persistência real. Sem política de publicação. Sem execução de rollback.

---

## 3. Modelos auxiliares (FASE 7)

Todos genéricos. Sem lógica. Sem validação.

### 3.1 ContractVersion

```ts
type ContractVersion = {
  version: ContractVersionLabel;
  previousVersion?: ContractVersionLabel;
  nextVersion?: ContractVersionLabel;
  status?: ContractStatus;
  rollbackTarget?: ContractVersionLabel;
  effectiveDate?: string;
  expirationDate?: string;
  notes?: string;
};
```

### 3.2 ContractAttachment

```ts
type ContractAttachment = {
  id?: string;
  name?: string;
  mimeType?: string;
  fileSize?: number;
  documentIdentityReference?: ContractDocumentIdentityReference;
  uri?: string;
  tags?: readonly ContractTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};
```

### 3.3 ContractClause

```ts
type ContractClause = {
  id?: string;
  code?: string;
  title?: string;
  body?: string;
  sequence?: number;
  tags?: readonly ContractTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};
```

### 3.4 ContractSection

```ts
type ContractSection = {
  id?: string;
  code?: string;
  title?: string;
  body?: string;
  sequence?: number;
  clauseIds?: readonly string[];
  tags?: readonly ContractTag[];
  customAttributes?: Readonly<Record<string, unknown>>;
};
```

### 3.5 ContractReference

```ts
type ContractReference = {
  id?: string;
  kind?: string;
  name?: string;
  version?: string;
  uri?: string;
  target?: string;
};
```

Cláusulas / seções / referências genéricas **não** expandem o núcleo tipado do `Contract`.  
Podem ser transportadas via `customAttributes` quando necessário, sem schema clínico.

---

## 4. Referências opacas

### Rule Pack

```ts
type ContractRulePackReference = {
  packId?: string;
  name?: string;
  version?: string;
  kind?: string;
};
```

- Não importa `RulePackPort`
- Não avalia regras
- Não carrega packs

### Workflow

```ts
type ContractWorkflowReference = {
  workflowId?: string;
  name?: string;
  version?: string;
  kind?: string;
};
```

### Metadata / Configuration

Ids / namespaces / kinds são strings opacas — sem acoplamento aos Engines.

### Document Identity

Via `attachmentReferences[].documentIdentityReference.documentId` (opaco).  
Sem import de `DocumentIdentityPort`. Sem I/O.

---

## 5. O que o modelo NÃO contém

Proibido no núcleo tipado e no espírito do componente:

- TISS / guias / pacientes / glosas
- Operadoras / cooperativas específicas (Unimed, Hapvida, Bradesco, …)
- Regras embutidas / expressões / AST
- OCR / IA / prompts
- Validação contratual
- Tabelas / SQL / migrations
- Execução de Workflow ou Rule Engine

---

## 6. Contagem de modelos canônicos

| # | Modelo | Papel |
|---|--------|-------|
| 1 | `Contract` | Núcleo canônico |
| 2 | `ContractVersion` | Auxiliar versionamento |
| 3 | `ContractAttachment` | Auxiliar anexos |
| 4 | `ContractClause` | Auxiliar cláusula |
| 5 | `ContractSection` | Auxiliar seção |
| 6 | `ContractReference` | Auxiliar referência genérica |

**Total: 6 modelos canônicos/auxiliares definidos.**
