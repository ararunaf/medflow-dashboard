# EPC-04 — Metadata Engine Foundation

**Sprint:** EPC-04 — Metadata Engine Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Ports EPC-01/EPC-02/EPC-03  
**Continuidade:** Espelha o padrão Persistence / Storage / Configuration Enterprise

---

## 1. Objetivo

Implantar o Metadata Engine Enterprise como mecanismo **totalmente genérico** para descrever qualquer domínio futuramente:

```
Application
    ↓
MetadataPort
    ↓
MetadataAdapter
    ↓
Metadata Store
    ↓
Metadata Provider
```

O Metadata Engine **jamais conhece**:

- Paciente
- Profissional
- Guia
- Contrato
- Operadora
- TISS
- OCR
- IA
- Workflow
- Storage

Esses conceitos serão descritos futuramente **utilizando** o próprio Metadata Engine.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `MetadataPort` | `src/lib/enterprise/metadata/ports/metadata-port.ts` |
| Tipos + conceitos nativos | `src/lib/enterprise/metadata/ports/types.ts` |
| Herança (prep) | `src/lib/enterprise/metadata/ports/inheritance.ts` |
| Versionamento (prep) | `src/lib/enterprise/metadata/ports/versioning.ts` |
| Constraints (prep) | `src/lib/enterprise/metadata/ports/constraints.ts` |
| `DefaultMetadataStore` | `src/lib/enterprise/metadata/store/default-metadata-store.ts` |
| `DefaultMetadataAdapter` | `src/lib/enterprise/metadata/adapters/default-metadata-adapter.ts` |
| `MockMetadataAdapter` | `src/lib/enterprise/metadata/adapters/mock-metadata-adapter.ts` |
| Provider `createMetadataPort` | `src/lib/enterprise/metadata/providers/create-metadata-port.ts` |
| PoC Application (não ligado a UI/API) | `src/lib/enterprise/metadata/demo/metadata-health-query.ts` |
| Testes | `scripts/enterprise/tests/metadata-engine.test.ts` |
| Script npm | `npm run enterprise:metadata:test` |

---

## 3. Contrato `MetadataPort`

Operações genéricas (sem regra de negócio):

| Operação | Responsabilidade |
|----------|------------------|
| `registerSchema` | Registrar / atualizar Schema |
| `getSchema` | Obter Schema por id / nome / namespace / versão |
| `listSchemas` | Listar Schemas (filtros estruturais) |
| `registerEntity` | Registrar / atualizar Entity |
| `getEntity` | Obter Entity por id / nome / namespace |
| `registerTemplate` | Registrar / atualizar Template (infra) |
| `listTemplates` | Listar Templates |
| `health` | Prontidão sem mutação |
| `capabilities` | Capacidades declaradas do adapter |

**Proibido no Port:** tipos/imports de Paciente, Profissional, Guia, Contrato, Operadora, TISS, OCR, IA, Workflow, Storage, Persistence de produto.

Nenhum módulo de produto foi migrado nesta sprint.

---

## 4. Conceitos nativos (únicos)

O Metadata Engine conhece **apenas**:

| Conceito | Papel |
|----------|-------|
| Entity | Unidade estrutural |
| Attribute | Campo lógico |
| Relationship | Vínculo entre Entities |
| Constraint | Restrição estrutural (sem evaluator) |
| Schema | Container versionado |
| Template | Estrutura reutilizável (infra) |
| Property | Par nome/valor tipado |
| Enumeration | Conjunto fechado de valores |
| Reference | Ponteiro genérico |
| Validation | Descriptor estrutural (sem execução) |
| Version | Metadados de versão |
| Namespace | Isolamento de nomes |
| Tag | Classificação livre |
| Category | Agrupamento estrutural |

---

## 5. Adapter default

`DefaultMetadataAdapter`:

- Implementa `MetadataPort`
- Usa `DefaultMetadataStore` (in-process) — **sem novo banco / migrations**
- Runtime injetável (`store`, `ping`) para testes
- Default de produção: `createMetadataPort()` → `DefaultMetadataAdapter`
- Não altera Persistence, Storage, Configuration, UI, APIs ou Settings

`MockMetadataAdapter` / mecanismos `mock` | `test` existem para testes, homologação, benchmark e desenvolvimento offline.

---

## 6. Herança de esquemas (preparada)

Campo estrutural `extends: MetadataReference` em Schema e Entity.

Helpers: `schemaDeclaresInheritance`, `getSchemaBaseReference`, `getDeclaredInheritanceChain`.

**NÃO** implementado: flatten, merge de attributes, resolução multi-nível.

---

## 7. Versionamento (preparado)

Todo Schema possui `versionInfo`:

| Campo | Tipo |
|-------|------|
| Version | `MetadataVersionLabel` |
| Status | `draft` \| `active` \| `deprecated` \| `retired` \| `experimental` |
| CreatedAt | ISO string |
| UpdatedAt | ISO string |
| Author | string opcional |
| Compatibility | listas estruturais |

Sem banco; sem política de upgrade/semver nesta sprint.

---

## 8. Constraints (preparadas)

Kinds: `required` | `unique` | `regex` | `range` | `collection` | `reference` | `expression`.

Factories estruturais em `ports/constraints.ts`. **Ainda NÃO validam.**

---

## 9. Templates (infraestrutura)

`MetadataTemplate` genérico com slots/properties.  
**Nenhum** template clínico/financeiro/TISS foi criado.

---

## 10. Integração futura (documentada — não implementada)

O Metadata Engine será consumido futuramente por:

| Consumidor | Uso previsto |
|------------|--------------|
| Workflow Engine | Descrever estados/transições como Schemas/Entities |
| Rule Engine | Anexar Constraints/Validations a Attributes |
| OCR | Mapear campos capturados para Attributes genéricos |
| Storage | Descrever blobs/metadados de arquivo via Properties |
| IA | Descrever prompts/features como Templates/Properties |
| Contract Intelligence | Modelar cláusulas como Entities abstratas |
| Tenant | Namespaces / Categories por tenant (estrutural) |

Nenhum desses módulos foi alterado ou acoplado nesta sprint.

---

## 11. O que NÃO foi feito (intencional)

- Entidades clínicas / financeiras / TISS
- Operadoras, contratos, pacientes, guias
- Workflows, regras, validadores
- Migrations / alteração de banco
- Alteração de UI, APIs, Settings, Storage, Persistence

---

## 12. Como usar (somente novos módulos / PoC)

```ts
import { createMetadataPort, createVersionInfo } from "@/lib/enterprise/metadata";

const port = createMetadataPort(); // DefaultMetadataAdapter

await port.registerSchema({
  schema: {
    id: "example",
    name: "Example",
    namespace: "platform.example",
    versionInfo: createVersionInfo({ version: "1.0.0", status: "draft" }),
  },
});
```

Testes / offline:

```ts
const port = createMetadataPort({ provider: "mock" });
```
