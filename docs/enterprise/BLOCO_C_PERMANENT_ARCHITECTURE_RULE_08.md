# Regra Permanente do BLOCO C — Capability Negotiation (RULE_08)

**Status:** Vigente a partir da Sprint C-04A (2026-08-04)  
**Escopo:** Todos os Runtimes, Adapters e pipelines do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md)  
**Documento de arquitetura:** [`C04_OPERATOR_RUNTIME_ARCHITECTURE.md`](./C04_OPERATOR_RUNTIME_ARCHITECTURE.md)  
**Certificação final:** [`C04_OPERATOR_RUNTIME_FINAL_CERTIFICATION.md`](./C04_OPERATOR_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

Toda decisão operacional deverá ser baseada **exclusivamente** nas capacidades
declaradas pelo **`OperatorCapabilityProfile`**.

É **EXPRESSAMENTE PROIBIDO**:

- assumir que uma operadora suporta determinado recurso;
- utilizar regras fixas baseadas em operadoras;
- tomar decisões sem consultar o Capability Profile;
- conceder tratamento especial a qualquer operadora por nome, código ou convenção.

Toda futura integração deverá **iniciar** consultando o `OperatorCapabilityProfile`.

---

## Exemplos obrigatórios de consulta

Antes de qualquer operação futura, o pipeline consulta o perfil:

| Capacidade | Pergunta canônica |
|------------|-------------------|
| Autorização | `supportsAuthorization`? |
| Anexos | `supportsAttachments`? |
| Lote | `supportsBatch`? |
| Cancelamento | `supportsCancellation`? |
| Consulta de protocolo | `supportsProtocolQuery`? |
| Processamento assíncrono | `supportsAsyncProcessing`? |
| Polling / status | `supportsStatusPolling`? |
| Versão TISS | `supportedTissVersions`? |
| Elegibilidade | `supportsEligibility`? |
| Transporte | `supportedTransportProtocols`? |
| Autenticação | `supportedAuthenticationMethods`? |

O pipeline **adapta-se** às capacidades declaradas.

**Nunca o contrário** — capacidades não são inventadas, inferidas ou hardcoded.

---

## Consequências

| Princípio | Aplicação |
|-----------|-----------|
| Negociação por contrato | Toda decisão operacional lê o Capability Profile |
| Sem pressupostos | Não se assume suporte a recurso sem declaração no perfil |
| Sem regras fixas | Proibido ramificar por nome/código de operadora |
| Sem tratamento especial | Nenhuma operadora possui branch privilegiada |
| Evolução por contratos | Evolução futura ocorre via contratos canônicos + Adapters |
| Pipeline adaptativo | O fluxo se adapta ao perfil; o perfil não se adapta ao fluxo |

---

## Relação com a Regra nº 7 (Operator Capability Model)

- **RULE_07** — nenhuma operadora é conhecida; representação exclusiva via `OperatorCapabilityProfile`; proibido `if/switch` por operadora.
- **RULE_08** — toda decisão operacional **consulta** o Capability Profile; proibido assumir capacidades ou usar regras fixas.

As duas regras são complementares e permanentes:

```
Operadora futura
  → OperatorCapabilityProfile (RULE_07 — representação)
    → Capability Negotiation (RULE_08 — decisão operacional)
      → Adapter especializado (futuro)
        → Ports canônicos
```

---

## Limites explícitos (C-04A)

Esta regra registra **somente a arquitetura de governança**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe** operadora implementada;
- **não existe** autenticação / autorização funcional;
- **não existe** SOAP / XML / REST funcional;
- **não existe** comunicação externa;
- existe apenas a **foundation estrutural** do Operator Runtime + Capability Profile
  (C-04) e a **certificação oficial** desta regra (C-04A).

Implementação funcional de negociação de capacidades **não** faz parte desta Sprint
e **não** deve ser introduzida silenciosamente em Sprints de Foundation.

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-05 em diante)
devem respeitá-la sem exceção silenciosa.
