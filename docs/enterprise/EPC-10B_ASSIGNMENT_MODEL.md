# EPC-10B — Assignment Model

**Sprint:** EPC-10B — Tenant Assignment Objects  
**Data:** 31/07/2026  
**Natureza:** Especificação dos modelos canônicos — sem lógica, sem ligações operacionais  
**Documento pai:** [`EPC-10B_TENANT_ASSIGNMENTS.md`](./EPC-10B_TENANT_ASSIGNMENTS.md)

---

## 1. Princípio

Um Assignment é um **relacionamento canônico**.  
Não é configuração. Não é regra. Não é vínculo operacional.

Os modelos **nunca** podem conhecer:

- regras clínicas
- TISS
- contratos
- operadoras
- usuários
- permissões
- lógica de negócio

---

## 2. Cinco Assignment Objects (FASE 6)

| Tipo TypeScript | `assignmentKind` |
|-----------------|------------------|
| `TenantRulePackAssignment` | `RULE_PACK` |
| `TenantStorageAssignment` | `STORAGE` |
| `TenantConfigurationAssignment` | `CONFIGURATION` |
| `TenantAIProviderAssignment` | `AI_PROVIDER` |
| `TenantDocumentAssignment` | `DOCUMENT` |

União tipada: `TenantAssignment`.

`assignmentKind` é **apenas** o discriminador estrutural de qual dos cinco objetos se aplica. Não carrega o alvo e não executa integração.

---

## 3. Campos canônicos exclusivos (FASE 7)

Todos os Assignments possuem **apenas** os campos abaixo (além do discriminador `assignmentKind`):

| Campo | Tipo | Papel |
|-------|------|-------|
| `assignmentId` | `AssignmentId` | Identificador canônico |
| `tenantReference` | `TenantReference` | Ref opaca ao Tenant (EPC-10A) |
| `targetReference` | `TargetReference` | Ref opaca ao componente alvo |
| `status` | `AssignmentStatus` | Ciclo de vida estrutural |
| `version` | `AssignmentVersion` | Versão estrutural |
| `createdAt` | ISO string | Criação |
| `updatedAt` | ISO string | Última atualização |
| `priority` | `AssignmentPriority` | Prioridade estrutural (número opaco) |
| `metadataReference` | `AssignmentMetadataReference` | Ref opaca ao Metadata Engine |
| `tags` | `AssignmentTag[]` | Classificação livre |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |
| `activationDate` | ISO string | Ativação estrutural (sem regra) |
| `expirationDate` | ISO string | Expiração estrutural (sem regra) |

Nenhuma lógica interpreta `activationDate` / `expirationDate` / `priority` nesta sprint.

---

## 4. Referências opacas

### `tenantReference`

| Campo | Papel |
|-------|-------|
| `tenantId` | Id canônico do Tenant |
| `code` | Código opcional |
| `externalId` | Id externo opcional |
| `version` | Versão opcional do Tenant |

Não carrega o objeto Tenant.

### `targetReference`

| Campo | Papel |
|-------|-------|
| `id` | Id opaco do alvo |
| `name` | Nome opcional |
| `namespace` | Namespace opcional |
| `version` | Versão opcional do alvo |
| `kind` | Classificação livre opcional |
| `uri` | URI opaca opcional |

Não carrega Rule Packs, Storage blobs, Configuration values, AI providers nem Documents.

### `metadataReference`

Aponta (opcionalmente) para artefato do Metadata Engine (EPC-04).  
Campos: `id`, `name`, `namespace`, `version`, `kind`.

---

## 5. Ciclo de vida estrutural (FASE 8)

Valores sugeridos (`ASSIGNMENT_STATUSES`):

| Status | Papel estrutural |
|--------|------------------|
| `ACTIVE` | Ativo (estrutural) |
| `INACTIVE` | Inativo (estrutural) |
| `DRAFT` | Rascunho (estrutural) |
| `DEPRECATED` | Depreciado (estrutural) |
| `ARCHIVED` | Arquivado (estrutural) |

O tipo aceita extensão estrutural (`string & {}`) sem impor semântica operacional.

**Nenhuma** regra operacional (ex.: “só ACTIVE pode ser usado”, “expirar automaticamente”) é implementada.

Helpers: `isAssignmentStatus`, `listAssignmentStatuses`.

---

## 6. Versionamento

Campo `version` (`AssignmentVersion`) — rótulo livre estrutural.  
Suportado por todos os cinco objetos. Sem semântica de semver obrigatória e sem migração automática.

---

## 7. O que NÃO pertence ao modelo

| Conceito | Destino |
|----------|---------|
| Conteúdo de Rule Pack / regras | Rule Pack Engine |
| Upload / download / blob | Storage Port |
| Resolução de configuração / flags | Configuration Engine |
| Invocação de modelo / prompt | AI Provider Port |
| Páginas / OCR / conteúdo documental | Document Identity |
| Estados de processo | Workflow Engine |
| Usuários / roles / permissões | Fora do Enterprise Assignment |
| Contratos / TISS / clínica | Domínio de produto (proibido aqui) |

---

## 8. Preparação para componentes (sem integração)

| Componente | Como o Assignment se prepara |
|------------|------------------------------|
| Rule Packs | `TenantRulePackAssignment` + `targetReference` opaca |
| Storage | `TenantStorageAssignment` + `targetReference` opaca |
| Configuration | `TenantConfigurationAssignment` + `targetReference` opaca |
| AI Providers | `TenantAIProviderAssignment` + `targetReference` opaca |
| Document Identity | `TenantDocumentAssignment` + `targetReference` opaca |
| Workflow | Futuro: Workflow referencia `AssignmentId` / `TenantId` como contexto opaco |

Detalhes de integração futura: [`EPC-10B_ARCHITECTURE.md`](./EPC-10B_ARCHITECTURE.md) §3.
