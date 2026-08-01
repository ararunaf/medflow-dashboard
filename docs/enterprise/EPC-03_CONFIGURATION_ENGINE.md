# EPC-03 — Configuration Engine Foundation

**Sprint:** EPC-03 — Configuration Engine Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Ports EPC-01/EPC-02  
**Continuidade:** Espelha o padrão Persistence/Storage Enterprise

---

## 1. Objetivo

Implantar o Configuration Engine Enterprise como mecanismo **genérico** de configuração:

```
Application
    ↓
ConfigurationPort
    ↓
ConfigurationAdapter
    ↓
ConfigurationProvider / Store
    ↓
Default Configuration Store
```

O Configuration Engine **não conhece**:

- cooperativas
- operadoras
- contratos
- workflows
- OCR
- IA

Ele apenas fornece infraestrutura para armazenar, recuperar e resolver configurações.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `ConfigurationPort` | `src/lib/enterprise/configuration/ports/configuration-port.ts` |
| Tipos + hierarquia + tipagem + feature flags prep | `src/lib/enterprise/configuration/ports/` |
| `DefaultConfigurationStore` | `src/lib/enterprise/configuration/store/default-configuration-store.ts` |
| `DefaultConfigurationAdapter` | `src/lib/enterprise/configuration/adapters/default-configuration-adapter.ts` |
| `MockConfigurationAdapter` | `src/lib/enterprise/configuration/adapters/mock-configuration-adapter.ts` |
| Provider `createConfigurationPort` | `src/lib/enterprise/configuration/providers/create-configuration-port.ts` |
| PoC Application (não ligado a UI/API/Settings) | `src/lib/enterprise/configuration/demo/configuration-health-query.ts` |
| Testes | `scripts/enterprise/tests/configuration-engine.test.ts` |
| Script npm | `npm run enterprise:configuration:test` |

---

## 3. Contrato `ConfigurationPort`

Operações genéricas (sem regra de negócio):

| Operação | Responsabilidade |
|----------|------------------|
| `get` | Recuperar valor por chave lógica |
| `set` | Definir / atualizar valor |
| `exists` | Verificar existência |
| `remove` | Remover chave |
| `list` | Listar entradas (prefixo/escopo opcional) |
| `health` | Prontidão sem mutação |
| `capabilities` | Capacidades declaradas do adapter |

**Proibido no Port:** tipos/imports de Settings de produto, Feature Flags legadas, Environment Manager, Tenant UI, OCR, IA, cooperativas, operadoras, contratos.

Nenhum módulo de produto foi migrado nesta sprint.

---

## 4. Adapter default

`DefaultConfigurationAdapter`:

- Implementa `ConfigurationPort`
- Usa `DefaultConfigurationStore` (in-process) — **sem novo banco / migrations**
- Runtime injetável (`store`, `readLegacy`, `ping`) para testes e bind futuro
- Default de produção: `createConfigurationPort()` → `DefaultConfigurationAdapter`
- Não altera providers existentes, Settings, Auth, Feature Flags atuais, Environment Manager ou Tenant

`MockConfigurationAdapter` / mecanismos `mock` | `test` existem para testes, homologação, benchmark e desenvolvimento offline.

---

## 5. Hierarquia oficial (estrutural)

```
Application
    ↓
Platform
    ↓
Environment
    ↓
Tenant
    ↓
Module
    ↓
Feature
    ↓
User
```

Constantes: `CONFIGURATION_HIERARCHY` / `getOfficialConfigurationHierarchy()`.

Nenhuma regra específica de cooperativa/operadora/contrato é implementada.

---

## 6. Resolução hierárquica (preparada)

Ordem mínima preparada:

```
User
    ↓
Module
    ↓
Tenant
    ↓
Platform
    ↓
Default
```

Constantes: `CONFIGURATION_RESOLUTION_ORDER` / `getConfigurationResolutionOrder()`.

`get({ resolveHierarchy: true, resolutionContext })` realiza walk de **primeiro hit**.  
Merge complexo, overrides condicionais e políticas por contrato **não** são implementados nesta sprint.

---

## 7. Tipagem preparada

O Configuration Engine aceita:

| Kind | Uso |
|------|-----|
| `boolean` | Flags / toggles genéricos |
| `number` | Limites / pesos / contagens |
| `string` | Textos livres |
| `enum` | Valores enumerados (`enumName` opcional) |
| `json` | Objetos estruturados |
| `collection` | Listas / arrays |

Sem alterações arquiteturais futuras necessárias para esses kinds.

---

## 8. Feature Flags (infraestrutura)

Helpers `getFeatureFlagState` / `setFeatureFlagState` existem sobre o Port.

- **Ainda NÃO utilizar em módulos de produto**
- **NÃO** substitui Feature Flags atuais
- Prefixo lógico: `feature-flag.`

---

## 9. Convenções oficiais

### 9.1 Como criar um novo adapter

1. Criar classe em `src/lib/enterprise/configuration/adapters/<nome>-configuration-adapter.ts`
2. Implementar `ConfigurationPort` (sem vazar domínio de produto no Port)
3. Exportar em `adapters/index.ts` e no barrel `configuration/index.ts`
4. Registrar no `createConfigurationPort` switch
5. Adicionar testes em `scripts/enterprise/tests/`
6. Documentar em `docs/enterprise/`

### 9.2 Como adicionar um novo provider

| Mecanismo | Status EPC-03 | Próximo passo |
|-----------|---------------|---------------|
| `default` | **Default implementado** | Migrar módulos gradualmente (ver migration plan) |
| `mock` / `test` | Implementado | Uso em unit/integration / offline |
| `env` | Reservado (erro explícito) | Adapter dedicado futuro |
| `remote` | Reservado (erro explícito) | Adapter dedicado futuro |
| `database` | Reservado (erro explícito) | Adapter dedicado futuro |
| `redis` | Reservado (erro explícito) | Adapter dedicado futuro |

Regra: Domain/Application **nunca** importam o store físico. Só o adapter importa.

---

## 10. O que esta sprint NÃO faz

- Não migra módulos
- Não substitui configurações existentes
- Não altera providers existentes
- Não altera UI / Settings / Auth
- Não altera Feature Flags atuais
- Não altera Environment Manager / Tenant
- Não altera OCR / Storage / IA / TISS / Financeiro / Captura
- Não cria migrations / novo banco
- Não implementa multi-tenant real
- Não implementa operadoras / contratos

---

## 11. Documentos relacionados

- `EPC-03_CONFIGURATION_ARCHITECTURE.md`
- `EPC-03_CONFIGURATION_MIGRATION_PLAN.md`
- `EPC-03_CONFIGURATION_CERTIFICATION.md`
