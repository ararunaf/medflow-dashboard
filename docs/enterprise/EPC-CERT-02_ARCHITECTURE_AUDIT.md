# EPC-CERT-02 — Architecture Audit

**Sprint:** EPC-CERT-02 — Enterprise Organization Certification  
**Data:** 31/07/2026  
**Natureza:** Auditoria arquitetural exclusiva — **nenhum código de produção alterado**  
**Baseline:** `src/lib/enterprise/{rule-pack,tenant,tenant-assignment}/**` + integrações estruturais com Configuration, Storage, Document Identity, AI Providers

---

## 1. Escopo da auditoria

| ID | Componente | Pasta |
|----|------------|-------|
| EPC-09 | Rule Pack Management | `src/lib/enterprise/rule-pack/` |
| EPC-10A | Tenant Foundation | `src/lib/enterprise/tenant/` |
| EPC-10B | Tenant Assignment Objects | `src/lib/enterprise/tenant-assignment/` |

### Integrações estruturais (somente referências / kinds)

| Componente | Pasta (auditada quanto a acoplamento) |
|------------|----------------------------------------|
| Configuration | `src/lib/enterprise/configuration/` |
| Storage | `src/lib/enterprise/storage/` |
| Document Identity | `src/lib/enterprise/document-identity/` |
| AI Providers | `src/lib/enterprise/ai-provider/` |

---

## 2. FASE 1 — Auditoria estrutural (ECS-01)

### 2.1 Matriz de artefatos

| Artefato | Rule Pack | Tenant | Tenant Assignment |
|----------|-----------|--------|-------------------|
| `ports/` | ✅ | ✅ | ✅ |
| `adapters/` | ✅ | ✅ | ✅ |
| `store/` | ✅ | ✅ | ✅ |
| `providers/` | ✅ | ✅ | ✅ |
| `demo/` | ✅ | ✅ | ✅ |
| root `index.ts` | ✅ | ✅ | ✅ |
| `factory/` (raiz) | ⚠️ **presente** | ⚠️ **presente** | ⚠️ **presente** |
| Mock Adapter | ✅ | ✅ | ✅ |
| Default Adapter | ✅ | ✅ | ✅ |
| Vendor Adapter | ❌ (não aplicável — família in-process) | ❌ | ❌ |
| `health()` | ✅ async | ✅ async | ✅ async |
| `capabilities()` | ✅ sync | ✅ sync | ✅ sync |
| `providerId` | ✅ | ✅ | ✅ |
| `createXxxPort()` | ✅ | ✅ | ✅ |
| Suite `{component}-engine.test.ts` | ✅ | ✅ | ✅ |
| Script npm `enterprise:{component}:test` | ✅ | ✅ | ✅ |

### 2.2 Ports

| Componente | Port | Identidade | Factory pública |
|------------|------|------------|-----------------|
| Rule Pack | `RulePackPort` | `providerId: RulePackProviderId` | `createRulePackPort` |
| Tenant | `TenantPort` | `providerId: TenantProviderId` | `createTenantPort` |
| Assignment | `TenantAssignmentPort` | `providerId: TenantAssignmentProviderId` | `createTenantAssignmentPort` |

### 2.3 Hierarquia observada

```
Application (demo health-query)
    ↓
Port
    ↓
Adapter (Default | Mock)
    ↓
Store (DefaultXxxStore in-process)
    ↓
Factory (providers/createXxxPort → factory/*Factory)
```

Nenhuma inversão Port → Adapter foi encontrada.  
Demo Application depende apenas do Port (DIP preservado).

### 2.4 Conformidade ECS-01 — DNA vs cosmético

| Requisito ECS-01 | Status |
|------------------|--------|
| Ports & Adapters | ✅ |
| Mock obrigatório | ✅ |
| Default + Store (família in-process) | ✅ |
| Provider factory | ✅ (entrada canônica em `providers/`) |
| Demo PoC sem UI/API | ✅ |
| Testes `{component}-engine.test.ts` | ✅ |
| Sem pasta `factory/` | ❌ **DEV-ORG-01** |
| Sem vazamento clínico executável | ✅ |
| `capabilities(): Promise<>` | ⚠️ sync (padrão compartilhado com Core) — **DEV-ORG-06** |

---

## 3. FASE 2 — Auditoria dos modelos

### 3.1 Rule Pack (EPC-09)

**Modelo:** `RulePack`  
**Campos-chave:** `packId`, `name`, `version`, `previousVersion?`, `nextVersion?`, `compatibility?`, `lifecycle?`, `status`, `priority?`, `ruleReferences?`, `metadataReference?`, `dependencies?`, `tags?`, `customAttributes?`

| Aspecto | Evidência |
|---------|-----------|
| Status operacional | `draft` \| `enabled` \| `disabled` \| `archived` |
| Lifecycle de versão | `draft` \| `published` \| `deprecated` \| `retired` \| extensível |
| Ref → Rule | `RuleReference` (strings opacas) |
| Ref → Metadata | `RulePackMetadataReference` |
| Deps entre packs | `RulePackDependency` — **sem auto-resolve** (`dependencies.ts`) |
| Domínio clínico | Ausente (comentários de exclusão apenas) |

### 3.2 Tenant (EPC-10A)

**Modelo:** `Tenant`  
**Campos-chave:** `tenantId`, `organizationName`, `organizationType`, `status`, `version?`, `metadataReference?`, `configurationReference?`, `customAttributes?`

| Aspecto | Evidência |
|---------|-----------|
| Status | `draft` \| `active` \| `inactive` \| `archived` \| `suspended` \| `unknown` \| extensível |
| OrganizationType | `COOPERATIVE`, `HOSPITAL`, `CLINIC`, `LABORATORY`, `INSURANCE`, `HEALTH_NETWORK`, `COMPANY`, `OTHER` |
| Ref → Metadata | `TenantMetadataReference` |
| Ref → Configuration | `TenantConfigurationReference` |
| Versionamento | `version?` string estrutural (sem cadeia previous/next) |
| Domínio clínico executável | Ausente; labels org com viés healthcare (**DEV-ORG-02**) |

### 3.3 Assignment Objects (EPC-10B)

**Kinds canônicos (5):**

| Kind | Tipo |
|------|------|
| `RULE_PACK` | `TenantRulePackAssignment` |
| `STORAGE` | `TenantStorageAssignment` |
| `CONFIGURATION` | `TenantConfigurationAssignment` |
| `AI_PROVIDER` | `TenantAIProviderAssignment` |
| `DOCUMENT` | `TenantDocumentAssignment` |

**Campos canônicos:** `assignmentId`, `tenantReference`, `targetReference`, `status`, `version?`, `priority?`, `metadataReference?`, `tags?`, `customAttributes?`, `activationDate?`, `expirationDate?`

| Aspecto | Evidência |
|---------|-----------|
| Lifecycle | `ACTIVE` \| `INACTIVE` \| `DRAFT` \| `DEPRECATED` \| `ARCHIVED` \| extensível |
| Tenant ref | `TenantReference` (tenantId + opcionais) — **sem import de `tenant/`** |
| Target ref | `TargetReference` opaca — **sem import dos engines alvo** |
| WORKFLOW kind | Ausente (**DEV-ORG-04**) |

### 3.4 Consistência cross-modelo

| Referência | Tenant | Rule Pack | Assignment | Consistente? |
|------------|--------|-----------|------------|--------------|
| Metadata | local shape | local shape | local shape | ✅ opaca; shapes locais (mesmo padrão Core CERT-01) |
| Configuration | local shape | — | via kind | ✅ |
| Storage | — | — | via kind | ✅ |
| Document Identity | — | — | via kind `DOCUMENT` | ✅ |
| AI Provider | — | — | via kind | ✅ |
| Rule Engine | — | `RuleReference` | via kind `RULE_PACK` (não Rule) | ✅ |

---

## 4. FASE 6 — Versionamento estrutural

| Componente | Suporte | Detalhe |
|------------|---------|---------|
| Rule Pack | ✅ Completo | `version` + `previousVersion` / `nextVersion` / `compatibility` / `lifecycle` + helpers `versioning.ts` |
| Tenant | ✅ Estrutural mínimo | `version?` string; sem cadeia de versão |
| Assignment | ✅ Estrutural | `version?` + capability `supportsVersioning: true` |

**Conclusão:** os três suportam versionamento estrutural. Tenant é deliberadamente mais fino (suficiente para Org Layer; não é máquina de publicação).

---

## 5. FASE 7 — Ciclo de vida

| Componente | Status / lifecycle | Regras de negócio? |
|------------|--------------------|--------------------|
| Assignment | `ACTIVE` `INACTIVE` `DRAFT` `DEPRECATED` `ARCHIVED` | **Não** — labels + filtros |
| Tenant | `draft` `active` `inactive` `archived` `suspended` `unknown` | **Não** |
| Rule Pack status | `draft` `enabled` `disabled` `archived` | **Não** — `enable`/`disable` só flipam status |
| Rule Pack lifecycle | `draft` `published` `deprecated` `retired` | **Não** — rótulos de versão |

Nenhuma state machine de publicação, billing, contrato ou clínica foi encontrada.

**Inconsistência cosmética:** Assignment usa UPPERCASE; Tenant/RulePack usam lowercase (**DEV-ORG-05**).

---

## 6. FASE 8 — Referências opacas

| De → Para | Mecanismo | Resolve? | Carrega? | Import? |
|-----------|-----------|----------|----------|---------|
| Rule Pack → Rule | `RuleReference` | Não | Não | Não |
| Rule Pack → Metadata | `RulePackMetadataReference` | Não | Não | Não |
| Rule Pack → Pack | `RulePackDependency.packId` | Não* | Não | Não |
| Tenant → Metadata | `TenantMetadataReference` | Não | Não | Não |
| Tenant → Configuration | `TenantConfigurationReference` | Não | Não | Não |
| Assignment → Tenant | `TenantReference` | Não | Não | Não |
| Assignment → Rule Pack / Storage / Config / AI / Document | `assignmentKind` + `TargetReference` | Não | Não | Não |
| Qualquer → Workflow / OCR | — | N/A | N/A | Ausente |

\* `areRequiredDependenciesPresent` apenas compara PackIds em um `Set` fornecido pelo caller — **não** carrega packs.

**Conclusão:** todas as referências permanecem opacas. Nenhuma resolução automática. Nenhum carregamento implícito.

---

## 7. Inventário de desvios (classificação)

| ID | Problema | Severidade | Impede EPC-11? | Tratamento |
|----|----------|------------|----------------|------------|
| DEV-ORG-01 | Pasta `factory/` nos 3 componentes | **ALTO** | Não | Documentar; sprint de adequação ECS-01 futura |
| DEV-ORG-02 | `OrganizationType` healthcare-biased fechado | **ALTO** | Não | Documentar; abertura/`OTHER` já mitiga |
| DEV-ORG-03 | Barrel exporta Factory/Adapters/Stores | **MÉDIO** | Não | Recomendação de superfície pública |
| DEV-ORG-04 | Sem kind `WORKFLOW` | **MÉDIO** | Não | Adicionar kind em sprint se necessário |
| DEV-ORG-05 | Casing lifecycle inconsistente | **BAIXO** | Não | Unificação cosmética futura |
| DEV-ORG-06 | `capabilities()` sync | **BAIXO** | Não | Alinhado ao Core; ajuste opcional |
| DEV-ORG-07 | Tenant versioning fino | **BAIXO** | Não | Aceitável para fundação |

**CRÍTICOS:** nenhum.

---

## 8. Conclusão da auditoria estrutural

A Enterprise Organization Layer está **estruturalmente completa e coerente** com o DNA ECS-01.  
Os desvios são conhecidos, classificados e **não bloqueiam** a certificação nem a EPC-11.
