# SEARCH-01 — Enterprise Search Provider

**Sprint:** SEARCH-01  
**Data:** 02/08/2026  
**Status:** Implementado

## Objetivo

Primeiro Search Provider oficial da plataforma MedicFlow Enterprise.

## Cadeia obrigatória

```
Produto
  → Enterprise Runtime
  → Capture Runtime
  → Document Search Runtime
  → SearchProviderPort
  → DefaultSearchProviderAdapter
  → StorageProviderPort
  → Backend oficial
```

## Componentes

| Componente | Local |
|------------|-------|
| SearchProviderPort | `src/lib/enterprise/search-provider/ports/` |
| Default Adapter | `adapters/default-search-provider-adapter.ts` |
| Mock Adapter | `adapters/mock-search-provider-adapter.ts` |
| Registry | `registry/search-provider-registry.ts` |
| Factory | `factory/search-provider-factory.ts` |
| Canonical models | `ports/canonical.ts` |

## Modelos canônicos (únicos)

- `CanonicalSearchRequest`
- `CanonicalSearchResult`
- `CanonicalSearchDocument`
- `CanonicalSearchMetadata`

## Capacidades

- Busca por ID, documento, paciente, metadata, tenant, competência
- Timeout / Retry / Cancelamento
- Logging estrutural / Telemetria estrutural
- Backend documental exclusivamente via StorageProviderPort

## Proibições

- Acesso direto a Supabase / Azure / S3 / banco / filesystem
- Bypass do Search Runtime / Storage Runtime / SearchProviderPort
- Alteração de OCR / Classification / Storage / TISS / IA

## Teste

```bash
npm run enterprise:search-provider:test
```

## Recomendação pós-sprint

Executar **SEARCH-GATE-01** antes de iniciar TISS-01.
