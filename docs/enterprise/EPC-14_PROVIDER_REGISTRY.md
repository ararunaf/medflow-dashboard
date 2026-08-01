# EPC-14 — Provider Registry

**Sprint:** EPC-14 — Processing Provider Framework  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/processing-provider/registry/processing-provider-registry.ts`

---

## 1. Objetivo

O `ProcessingProviderRegistry` é o catálogo oficial de Processing Providers.

Responsável **apenas** por registrar / consultar descriptors.  
**Nenhum processamento** é executado.

---

## 2. Campos do registro

Cada entrada é um `ProviderDescriptor` completo (ver `EPC-14_PROVIDER_MODEL.md`).

| Campo | Descrição |
|-------|-----------|
| `providerId` | Id estável |
| `providerName` | Nome legível |
| `providerVersion` | Versão |
| `providerType` | Enum estrutural |
| `capabilities` | Capacidades declaradas |
| `priority` | Ordenação estrutural |
| `enabled` | Flag de habilitação |
| `healthStatus` | Status declarado |
| `configurationReference` | Ref opaca |
| `metadataReference` | Ref opaca |
| `tags` / `customAttributes` | Extensão livre |

---

## 3. Providers registrados na fundação

| # | providerId | status |
|---|------------|--------|
| — | *(nenhum)* | — |

**Total de Providers funcionais na fundação: 0.**

Constante: `BUILTIN_PROCESSING_PROVIDER_COUNT = 0`.

Apenas stubs de **mecanismo** do Framework existem (`default` / `mock` / `test` adapters).  
Nenhum OCR/PDF/XML/… Provider está registrado.

---

## 4. API do Registry

```ts
class ProcessingProviderRegistry {
  register(entry: ProviderDescriptor): void;
  unregister(providerId: ProviderId): boolean;
  get(providerId: ProviderId): ProviderDescriptor | undefined;
  has(providerId: ProviderId): boolean;
  list(): readonly ProviderDescriptor[];
  listByType(providerType: ProviderType): readonly ProviderDescriptor[];
  listByHealthStatus(healthStatus: HealthStatus): readonly ProviderDescriptor[];
  listEnabled(): readonly ProviderDescriptor[];
  listFiltered(input?: ListProvidersInput): readonly ProviderDescriptor[];
  count(): number;
  snapshot(): ProcessingProviderRegistrySnapshot;
  health(): { ok: boolean; message?: string; count: number };
}
```

Factory: `createDefaultProcessingProviderRegistry()`.

O Port (`registerProvider` / `listProviders` / …) delega ao Registry via Adapter.

---

## 5. Relação Adapter ↔ Registry ↔ Factory

```
createProcessingProviderPort({ provider })
    → ProcessingProviderFactory.create()
        → DefaultProcessingProviderAdapter(registry)
            → ProcessingProviderRegistry.register / get / list / unregister
```

| Camada | Papel |
|--------|-------|
| Registry | Metadados / descoberta |
| Adapter | Implementa o Port sobre o Registry |
| Factory | Instanciação do mecanismo |
| Port | Contrato de uso pela Application |

---

## 6. Suporte a múltiplos Providers

Sim. O Registry é um `Map<ProviderId, ProviderDescriptor>` e aceita N registros simultâneos.

Filtros estruturais (`listFiltered`) preparam seleção futura por:

- `providerType`
- `enabled` / `healthStatus` / `tag` / `idPrefix`
- `requiresAsync` / `requiresBatch` / `requiresStreaming`

Sem roteamento e sem execução.

---

## 7. Extensão futura (checklist)

Para adicionar um Provider futuro (ex.: OCR):

1. Criar `ProviderDescriptor` com `providerType` adequado e `capabilities`.  
2. `registry.register(descriptor)` (ou `port.registerProvider`).  
3. Em sprint posterior: implementar adapter de **execução** (fora do Framework).  
4. Bind ao Document Processing Foundation → `ProcessingOutput`.  
5. Providers **não** importam / chamam outros Providers.

---

## 8. O que o Registry **não** faz

- Não executa OCR / IA / parsers  
- Não instancia SDKs  
- Não conhece Document Processing Foundation (sem import)  
- Não conhece Workflow / Rule Engine / contratos clínicos  
- Não persiste em banco (in-memory apenas)  
- Não altera UI / APIs  
