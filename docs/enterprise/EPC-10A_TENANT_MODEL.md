# EPC-10A — Tenant Model

**Sprint:** EPC-10A — Tenant Foundation  
**Data:** 31/07/2026  
**Natureza:** Especificação do modelo canônico — sem usuários, RBAC, contratos ou associações  
**Documento pai:** [`EPC-10A_TENANT_FOUNDATION.md`](./EPC-10A_TENANT_FOUNDATION.md)

---

## 1. Modelo canônico de Tenant (FASE 6)

O Tenant possui **apenas** os campos abaixo. Nada além disso no núcleo tipado.

| Campo | Tipo | Papel |
|-------|------|-------|
| `tenantId` | `TenantId` | Identificador canônico |
| `organizationName` | `OrganizationName` | Nome organizacional |
| `organizationType` | `OrganizationType` | Tipo enumerado (FASE 7) |
| `status` | `TenantStatus` | Status estrutural genérico |
| `version` | `TenantVersion` | Versão estrutural |
| `createdAt` | ISO string | Criação |
| `updatedAt` | ISO string | Última atualização |
| `displayName` | `TenantDisplayName` | Nome de exibição |
| `code` | `TenantCode` | Código curto / mnemônico |
| `externalId` | `TenantExternalId` | Id externo / legado |
| `metadataReference` | `TenantMetadataReference` | Ref opaca ao Metadata Engine |
| `configurationReference` | `TenantConfigurationReference` | Ref opaca ao Configuration Engine |
| `tags` | `TenantTag[]` | Classificação livre |
| `customAttributes` | `Record<string, unknown>` | Extensão opaca |
| `capabilities` | `TenantDeclaredCapability[]` | Capacidades declaradas do Tenant |

### Distinção importante: `capabilities`

| Superfície | Significado |
|------------|-------------|
| `TenantPort.capabilities()` | Capacidades do **adapter** (`TenantCapabilities`) |
| `Tenant.capabilities` | Capacidades **declaradas** pelo Tenant (`TenantDeclaredCapability[]`) |

Não confundir. O Port nunca interpreta capacidades clínicas ou de negócio.

---

## 2. OrganizationType (FASE 7)

Enumeração pura — **sem lógica**.

| Valor | Significado estrutural |
|-------|------------------------|
| `COOPERATIVE` | Tipo organizacional genérico |
| `HOSPITAL` | Tipo organizacional genérico |
| `CLINIC` | Tipo organizacional genérico |
| `LABORATORY` | Tipo organizacional genérico |
| `INSURANCE` | Tipo organizacional genérico |
| `HEALTH_NETWORK` | Tipo organizacional genérico |
| `COMPANY` | Tipo organizacional genérico |
| `OTHER` | Tipo organizacional genérico |

Helpers: `isOrganizationType`, `listOrganizationTypes`, constante `ORGANIZATION_TYPES`.

**Nenhuma** validação de domínio, regra de negócio, contrato ou operadora está ligada a esses valores.

---

## 3. Status estrutural

Valores sugeridos (`TENANT_STATUSES`): `draft` | `active` | `inactive` | `archived` | `suspended` | `unknown`.

O tipo aceita extensão estrutural (`string & {}`) sem impor semântica de autenticação ou assinatura.

---

## 4. Referências opacas (prep — sem associação)

### `metadataReference`

Aponta (opcionalmente) para artefato do Metadata Engine (EPC-04).  
Campos: `id`, `name`, `namespace`, `version`, `kind`.

### `configurationReference`

Aponta (opcionalmente) para artefato do Configuration Engine (EPC-03).  
Campos: `id`, `name`, `namespace`, `version`, `scope`.

Estas referências **não** implementam binding, resolução, sync ou assignments.  
Associações operacionais (Rule Packs, Storage, AI Providers, Document Identity, Workflow, Configuration) ficam na **EPC-10B**.

---

## 5. Campos proibidos no núcleo

O modelo tipado **não** inclui:

| Campo / conceito | Motivo |
|------------------|--------|
| `userId` / usuários | EPC futura (auth) |
| `role` / `permission` | RBAC fora de escopo |
| `contractId` | Domínio contratual |
| `operatorId` / operadora | Domínio de negócio |
| `rulePackId` / assignments | EPC-10B |
| `storageAssignments` | EPC-10B |
| `aiProviderAssignments` | EPC-10B |
| `documentId` / documentos | Fora do Tenant |
| `workflowId` | Fora do Tenant |
| Campos clínicos / TISS | Domínio de produto |

---

## 6. Princípio de extensão

- Extensão opaca: `customAttributes` + `tags` + `capabilities` declaradas.
- Extensão tipada de domínio: **fora** deste componente.
- Extensão operacional (assignments): **EPC-10B**.

O Tenant é apenas a **identidade organizacional**.
