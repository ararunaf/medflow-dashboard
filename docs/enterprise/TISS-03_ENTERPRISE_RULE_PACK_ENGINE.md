# TISS-03 — Enterprise Rule Pack Engine

## Objetivo

Criar o **Enterprise Rule Pack Engine** — mecanismo genérico de carga, interpretação e execução de Rule Packs.

## Escopo

Implementado:

- `RulePackEnginePort`
- `DefaultRulePackEngineAdapter` / `MockRulePackEngineAdapter`
- `RulePackEngineFactory`
- `RulePackEngineRegistry`
- `CanonicalRulePack` / `CanonicalRule` / `CanonicalRuleCondition` / `CanonicalRuleAction`
- `CanonicalRuleExecution` / `CanonicalRuleExecutionResult`
- Timeout / Retry / Cancelamento / Tratamento de erros
- Logging estrutural / Telemetria estrutural
- Consumo exclusivo via `TISSCatalogPort`

## Fora de escopo

- XML TISS
- Integração com operadoras
- Validação ANS
- Regras específicas de operadoras / contratos / clínicas
- Base Rule Packs reais (TISS-03A)

## Fluxo oficial

```
Produto
  → Enterprise Runtime
  → TISS Runtime
  → TISSCatalogPort
  → RulePackEnginePort
  → Rule Pack Adapter
  → Rule Pack Store
```

Nenhum acesso direto ao Rule Pack Store é permitido.
Todo conhecimento TISS vem exclusivamente do `TISSCatalogPort`.

## Modelos canônicos

- `CanonicalRulePack`
- `CanonicalRule`
- `CanonicalRuleCondition`
- `CanonicalRuleAction`
- `CanonicalRuleExecution`
- `CanonicalRuleExecutionResult`

## Proibições

- Sem `if (operadora)` / `switch (operadora)`
- Sem `if (versao)` / `switch (versao)`
- Sem lógica específica de contrato / tenant / cooperativa
- Sem acesso a `TUSS_CATALOG` / `tuss_procedures` / templates do produto

## Teste

```bash
npm run enterprise:rule-pack-engine:test
```

## Próximo passo obrigatório

Executar **TISS-RULE-GATE-01** antes de avançar para **TISS-03A — Enterprise Base Rule Packs**.
Não implementar XML TISS nem integrações com operadoras nesta fase.
