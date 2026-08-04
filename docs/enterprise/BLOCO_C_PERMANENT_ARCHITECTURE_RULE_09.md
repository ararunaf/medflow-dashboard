# Regra Permanente do BLOCO C — Authorization Strategy Pattern (RULE_09)

**Status:** Vigente a partir da Sprint C-05 (2026-08-04)  
**Escopo:** Todos os Runtimes, Adapters e pipelines do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_08.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_08.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_10.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_10.md)  
**Documento de arquitetura:** [`C05_AUTHORIZATION_RUNTIME_ARCHITECTURE.md`](./C05_AUTHORIZATION_RUNTIME_ARCHITECTURE.md)  
**Documento de produto:** [`C05_ENTERPRISE_AUTHORIZATION_RUNTIME.md`](./C05_ENTERPRISE_AUTHORIZATION_RUNTIME.md)  
**Certificação final:** [`C05_AUTHORIZATION_RUNTIME_FINAL_CERTIFICATION.md`](./C05_AUTHORIZATION_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

Nenhuma autorização poderá ser implementada **diretamente** no Runtime.

Toda autorização deverá ocorrer por **estratégias**.

O Runtime deverá apenas **selecionar estratégias**.

É **EXPRESSAMENTE PROIBIDO**:

- implementar autorização inline no Authorization Runtime;
- acoplar lógica de autorização a adapters de transporte (SOAP/REST/HTTP);
- misturar autorização com elegibilidade, anexos ou pré-autorização sem strategy dedicada;
- ramificar autorização por `if operadora` / `switch operadora` / `if versão` / `if guia`.

---

## Estratégias previstas (somente contratos)

| StrategyKind | Nome |
|--------------|------|
| `synchronous` | Synchronous Authorization |
| `asynchronous` | Asynchronous Authorization |
| `batch` | Batch Authorization |
| `eligibility` | Eligibility Authorization |
| `attachment` | Attachment Authorization |
| `pre-authorization` | Pre Authorization |
| `hybrid` | Hybrid Authorization |

Nenhuma destas estratégias possui implementação funcional nesta Sprint.

---

## POLICY-DRIVEN AUTHORIZATION

Diretriz arquitetural complementar (registrada oficialmente):

Toda decisão futura de autorização deverá consultar:

```
OperatorCapabilityProfile + AuthorizationPolicy
```

Nunca:

```
if (operadora) ...
switch (operadora) ...
if (versão) ...
if (guia) ...
```

---

## Consequências

| Princípio | Aplicação |
|-----------|-----------|
| Strategy Pattern | Autorização sempre via `AuthorizationStrategy` |
| Runtime seletor | Runtime escolhe strategy; não implementa autorização |
| Policy-driven | Decisão via `AuthorizationPolicy` + Capability Profile |
| Sem ramificação por operadora | Proibido `if/switch` por operadora/versão/guia |
| Evolução por contratos | Novas strategies entram como contratos + adapters futuros |
| Isolamento de protocolo | SOAP/XML/REST permanecem transport/protocol isolation |

---

## Relação com regras anteriores

- **RULE_07** — representação exclusiva via `OperatorCapabilityProfile`
- **RULE_08** — decisão operacional consulta o Capability Profile
- **RULE_09** — autorização ocorre por strategies; Runtime apenas seleciona;
  decisão policy-driven via Profile + `AuthorizationPolicy`
- **RULE_10** — Workflow interno soberano; integrações participam e não controlam o fluxo

Fluxo canônico futuro:

```
Workflow interno soberano (RULE_10)
  → Operadora futura
    → OperatorCapabilityProfile (RULE_07)
      → Capability Negotiation (RULE_08)
        → AuthorizationPolicy (RULE_09)
          → AuthorizationStrategy selecionada (RULE_09)
            → Adapter especializado (futuro)
              → Ports canônicos
```

---

## Limites explícitos (C-05)

Esta regra registra **somente a arquitetura de governança**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe** autorização funcional;
- **não existe** elegibilidade;
- **não existe** integração com operadoras;
- **não existe** SOAP / XML / REST funcional;
- **não existe** comunicação externa;
- existe apenas a **foundation estrutural** do Authorization Runtime
  (C-05) e o **registro oficial** desta regra.

Implementação funcional de strategies **não** faz parte desta Sprint
e **não** deve ser introduzida silenciosamente em Sprints de Foundation.

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-06 em diante)
devem respeitá-la sem exceção silenciosa.
