# TISS-01 — Enterprise TISS Provider

**Sprint:** TISS-01  
**Data:** 02/08/2026  
**Status:** Implementado

## Objetivo

Primeiro TISS Provider oficial da plataforma MedicFlow Enterprise — infraestrutura para qualquer padrão TISS futuro via Providers, Rule Packs, Metadata, Configuração e Profiles.

## Cadeia obrigatória

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISSProviderPort
  → DefaultTISSProviderAdapter
  → Implementação oficial
```

## Componentes

| Componente | Local |
|------------|-------|
| TISSProviderPort | `src/lib/enterprise/tiss-provider/ports/` |
| Default Adapter | `adapters/default-tiss-provider-adapter.ts` |
| Mock Adapter | `adapters/mock-tiss-provider-adapter.ts` |
| Registry | `registry/tiss-provider-registry.ts` |
| Factory | `factory/tiss-provider-factory.ts` |
| Canonical models | `ports/canonical.ts` |
| TISS Runtime | `src/lib/enterprise/tiss-runtime/` |

## Modelos canônicos (únicos)

- `CanonicalTISSRequest`
- `CanonicalTISSResult`
- `CanonicalTISSMetadata`
- `CanonicalTISSProfileReference`
- `CanonicalTISSProviderReference`

## Capacidades (TISS-01)

- Processamento estrutural / resolve profile / resolve provider (referências opacas)
- Timeout / Retry / Cancelamento
- Logging estrutural / Telemetria estrutural
- `realTissExecuted = false` (sem XML real nesta sprint)

## Proibições

- XML real / envio a operadoras
- Validações clínicas / regras ANS específicas
- Lógica `if (operadora)` / `if (tenant)` / `if (cliente)` / `if (contrato)`
- Acesso direto a banco / Storage / OCR
- Bypass ao Enterprise Runtime / TISS Runtime / TISSProviderPort

## Teste

```bash
npm run enterprise:tiss-provider:test
```

## Recomendação pós-sprint

Executar **TISS-GATE-01** antes de iniciar funcionalidades TISS reais.
