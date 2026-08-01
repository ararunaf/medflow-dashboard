# EPC-09 — Rule Pack Model

**Sprint:** EPC-09 — Rule Pack Management Foundation  
**Data:** 31/07/2026  
**Natureza:** Especificação do modelo canônico — sem regras de negócio, TISS ou domínio clínico  
**Documento pai:** [`EPC-09_RULE_PACK_MANAGEMENT.md`](./EPC-09_RULE_PACK_MANAGEMENT.md)

---

## 1. Modelo canônico (FASE 6)

O Rule Pack possui **apenas** os campos abaixo. Nada além disso no núcleo tipado.

| Campo | Tipo | Papel |
|-------|------|-------|
| `packId` | `PackId` | Identificador canônico |
| `name` | `RulePackName` | Nome lógico |
| `description` | string | Descrição livre |
| `version` | `RulePackVersion` | Versão estrutural |
| `status` | `RulePackStatus` | Status operacional (`draft` / `enabled` / `disabled` / `archived`) |
| `priority` | `RulePackPriority` | Prioridade estrutural |
| `createdAt` | ISO string | Criação |
| `updatedAt` | ISO string | Última atualização |
| `author` | `RulePackAuthor` | Autor genérico |
| `ruleReferences` | `RuleReference[]` | Refs opacas a Rules |
| `metadataReference` | `RulePackMetadataReference` | Ref opaca ao Metadata Engine |
| `dependencies` | `RulePackDependency[]` | Dependências entre packs |
| `tags` | `RulePackTag[]` | Classificação livre |
| `capabilities` | `RulePackDeclaredCapability[]` | Capacidades declaradas pelo pack |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |

### Campos de versionamento (FASE 7)

| Campo | Papel |
|-------|-------|
| `previousVersion` | Versão anterior (rótulo) |
| `nextVersion` | Próxima versão planejada (rótulo) |
| `compatibility` | Compatibilidade estrutural (rótulo livre) |
| `lifecycle` | Ciclo de vida de versão (`draft` / `published` / `deprecated` / `retired`) |

`status` = operacional (enable/disable).  
`lifecycle` = versionamento. São conceitos distintos.

---

## 2. RuleReference (opaca)

```ts
type RuleReference = {
  ruleId?: string;
  ruleName?: string;
  ruleNamespace?: string;
  ruleVersion?: string;
};
```

- Não importa `RulePort`
- Não avalia regras
- Não carrega definições do Rule Engine
- Ids são strings opacas compatíveis com `RuleId` futuro

---

## 3. Dependências (FASE 8)

```ts
type RulePackDependency = {
  packId: PackId;
  version?: RulePackVersion;
  optional?: boolean;
  kind?: string;
};
```

Exemplo estrutural: Pack A depende do Pack B.

| O que existe | O que NÃO existe |
|--------------|------------------|
| Declaração de dependência | Resolução automática |
| Filtro `listPacks({ dependsOn })` | Carregamento transitivo |
| Helper `areRequiredDependenciesPresent` (ids) | Validação de grafo cíclico |

---

## 4. Versionamento (FASE 7)

Helpers: `getVersionInfo`, `withVersionInfo`, `defineVersionChain`, `hasVersionChain`, `hasLifecycle`.

Sem persistência real. Sem banco. Sem migrations.

---

## 5. O que o modelo NÃO contém

Proibido no núcleo tipado e no espírito do componente:

- TISS / guias / pacientes
- Operadoras / cooperativas
- Contratos / cláusulas
- Regras clínicas
- OCR / IA / Auditoria / Workflow clínico

Extensões de produto devem viver em Application / Domain **fora** deste componente, tipicamente via `customAttributes` opacos ou bindings externos.

---

## 6. Prep para plataformas futuras

| Consumidor futuro | Como usa o modelo |
|-------------------|-------------------|
| Tenant Foundation | Bind externo `tenantId → packId[]` (fora do Core) |
| Contract Intelligence | Bind externo `contractRef → packId` (fora do Core) |
| AI Auditor | Recebe `packId` / `ruleReferences` como payload opaco |
| Workflow / Rule Engine | Resolve refs na Application; este componente só armazena |
