# TISS-03A — Enterprise Base Rule Packs

## Objetivo

Criar o primeiro conjunto de **Enterprise Base Rule Packs** canônicos, utilizando exclusivamente:

- `RulePackEnginePort`
- `TISSCatalogPort`
- Modelos canônicos

Os packs servem de referência estrutural para todas as próximas implementações.

## Escopo

Implementado:

- Base Rule Packs genéricos (existência, compatibilidade, metadata, consistência, multi-versão)
- Estrutura canônica: Metadata, Version, Priority, Tags, Categories, Conditions, Actions, Expected Result, Canonical Output
- Compatibilidade com múltiplas versões TISS (códigos opacos via `TISSCatalogPort`)
- Versionamento e seed oficial no Rule Pack Store
- Validação estrutural de `expectedResult` na execução
- Ordenação por prioridade (packs e regras)

## Fora de escopo

- XML TISS
- Integração com operadoras
- Validações específicas da ANS
- Regras específicas de operadoras / contratos / tenants
- Chamadas HTTP / banco / Capture

## Fluxo oficial

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → Enterprise Base Rule Packs
  → Canonical Rule Execution
```

Nenhum Rule Pack acessa componentes fora desta cadeia.  
Todo conhecimento TISS vem exclusivamente do `TISSCatalogPort`.

## Base Rule Packs

| Código | Categoria | Propósito estrutural |
|--------|-----------|----------------------|
| `structural-foundation-pack` | foundation | Pack default da Runtime (TISS-03/03A) |
| `base-domain-existence-pack` | existence | Existência de domínios canônicos |
| `base-guide-type-existence-pack` | existence | Existência de tipos de guia |
| `base-category-existence-pack` | existence | Existência de categorias/vocabulário |
| `base-canonical-compatibility-pack` | compatibility | Compatibilidade entre elementos canônicos |
| `base-metadata-presence-pack` | metadata | Presença de metadados de contexto |
| `base-structural-consistency-pack` | consistency | Consistência estrutural perfil/domínio/procedimento |
| `base-multi-version-compatibility-pack` | version | Compatibilidade com múltiplas versões TISS |

## Proibições

- Sem `if (operadora)` / `switch (operadora)`
- Sem `if (versao)` / `switch (versao)` (compatibilidade via códigos opacos do catálogo)
- Sem lógica específica de contrato / tenant / cooperativa
- Sem acesso a `TUSS_CATALOG` / `tuss_procedures` / templates do produto

## Teste

```bash
npm run enterprise:rule-pack-engine:test
```

## Próximo passo obrigatório

Executar **TISS-RULEPACK-GATE-01** para certificar que os Base Rule Packs utilizam exclusivamente `RulePackEnginePort` + `TISSCatalogPort`.

**Não iniciar XML TISS nem regras específicas de operadoras.**
