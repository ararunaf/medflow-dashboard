# C-04 — Operator Runtime Certification

**Sprint:** C-04 — Enterprise Operator Runtime Foundation  
**Gate alvo:** C-04A — Enterprise Operator Runtime Gate  
**Data:** 2026-08-04

---

## Escopo certificado

Foundation ECS-01 do Enterprise Operator Runtime:

- Port / Provider / Factory / Registry / Adapters / Store / Demo
- Integração estrutural ao Enterprise Runtime (`getOperatorRuntimePort`, `operatorRuntimeOk`)
- Contratos `OperatorCapabilityProfile` + `OperatorContext` (RULE_04)
- Regra Permanente nº 7 documentada
- Teste `enterprise:operator-runtime:test`

## Explicitamente fora de escopo

- Operadoras reais
- Autenticação
- Envio de guias
- Autorização funcional
- XML / SOAP / REST funcionais
- Banco / APIs / HTTP / TLS / Certificados
- Sprint C-04A (não iniciada nesta Sprint)

## Evidências estruturais

| Evidência | Esperado |
|-----------|----------|
| ECS-01 folders | ports / providers / factory / registry / adapters / store / demo |
| Registry builtins | mock, test, default, enterprise |
| Enterprise alias | `EnterpriseOperatorRuntimeAdapter = DefaultOperatorRuntimeAdapter` |
| Store | In-memory apenas |
| Peers | SOAP / XML / XML Validation / Quality / Auto Fill / TISS Mapping / Validation / Audit — shape-check |
| Conditional operator logic | Ausente |
| Real operators | Ausentes |

## Parecer de foundation

A Sprint C-04 entrega **exclusivamente** a foundation estrutural. O gate C-04A deve ser avaliado após execução dos gates obrigatórios (build / tsc / lint / smoke / enterprise suites).
