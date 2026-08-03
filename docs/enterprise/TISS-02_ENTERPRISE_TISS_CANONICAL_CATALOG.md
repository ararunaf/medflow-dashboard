# TISS-02 — Enterprise TISS Canonical Catalog

## Objetivo

Criar o **Enterprise TISS Canonical Catalog** — única fonte oficial de conhecimento TISS da plataforma.

## Escopo

Implementado:

- `TISSCatalogPort`
- `CanonicalTISSCatalog` (+ modelos canônicos)
- `TISSCatalogFactory`
- `TISSCatalogProvider` (`createTISSCatalogPort`)
- `InMemoryTISSCatalog`
- `DefaultTISSCatalogAdapter` / `MockTISSCatalogAdapter`
- `TISSCatalogRegistry`

## Fora de escopo

- XML TISS
- Integração com operadoras
- Validação ANS
- Envio de guias
- Regras específicas / Rule Packs

## Fluxo oficial

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISS Catalog Runtime
  → TISSCatalogPort
  → Catalog Adapter
  → Catalog Store (InMemoryTISSCatalog)
```

Nenhum acesso direto ao Catalog Store é permitido.

## Modelos canônicos

- `CanonicalTISSVersion`
- `CanonicalTISSGuideType`
- `CanonicalTISSProcedureType`
- `CanonicalTISSProcedureGroup`
- `CanonicalTISSDomain`
- `CanonicalTISSProfile`
- `CanonicalTISSMetadata`
- `CanonicalTISSVocabularyEntry`
- `CanonicalTISSReference`
- `CanonicalTISSCatalogStatistics`
- `CanonicalTISSCatalog`

## Vocabulário

Somente estrutura + exemplos mínimos (versões, guias, perfis, domínios, categorias, tipos de procedimento, metadados). Catálogo completo será carregado por configuração.

## Proibições

- Sem `if (operadora)` / `switch (operadora)`
- Sem `if (versao)` / `switch (versao)`
- Comportamento orientado exclusivamente por catálogo

## Teste

```bash
npm run enterprise:tiss-catalog:test
```

## Próximo passo obrigatório

Executar **TISS-CATALOG-GATE-01** antes de avançar para **TISS-03 — Enterprise TISS Rule Packs**.
Não implementar XML TISS nem regras de negócio nesta fase.
