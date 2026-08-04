# Regra Permanente do BLOCO C — Workflow Before Integration (RULE_10)

**Status:** Vigente a partir da Sprint C-05A (2026-08-04)  
**Escopo:** Todos os Runtimes, Adapters, pipelines e integrações do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_08.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_08.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_09.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_09.md)  
**Documento de arquitetura:** [`C05_AUTHORIZATION_RUNTIME_ARCHITECTURE.md`](./C05_AUTHORIZATION_RUNTIME_ARCHITECTURE.md)  
**Certificação final:** [`C05_AUTHORIZATION_RUNTIME_FINAL_CERTIFICATION.md`](./C05_AUTHORIZATION_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

**WORKFLOW BEFORE INTEGRATION**

O fluxo interno do MedicFlow-AI é **soberano**.

Nenhuma integração externa poderá controlar o fluxo da aplicação.

As integrações deverão adaptar-se ao Workflow interno.

**Nunca o contrário.**

---

## Sequência lógica obrigatória

Toda integração futura deverá obedecer à seguinte sequência lógica:

```
Documento
  ↓
OCR
  ↓
Classification
  ↓
Extraction
  ↓
Validation
  ↓
Mapping
  ↓
Auto Fill
  ↓
Quality
  ↓
XML
  ↓
XML Validation
  ↓
SOAP
  ↓
Operator
  ↓
Authorization
  ↓
Workflow
  ↓
Integração Externa
```

Operadoras **nunca** poderão alterar essa sequência.

Somente **participar** dela.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Workflow soberano | O núcleo interno orquestra; integrações não ditam o pipeline |
| Integrações como etapas | Cada integração externa executa uma etapa — não redefine o fluxo |
| Sem controle externo | Protocolos, operadoras e vendors nunca controlam a ordem das etapas |
| Operadoras participantes | Operadoras participam da sequência; não a alteram |
| Núcleo orquestrador | Enterprise Runtime / Workflow interno permanece o orquestrador |
| Adaptação unidirecional | Integrações adaptam-se ao Workflow; o Workflow não se adapta a vendors |

---

## É EXPRESSAMENTE PROIBIDO

- permitir que uma operadora altere a ordem do pipeline;
- permitir que SOAP / XML / REST / HTTP controlem o fluxo da aplicação;
- inverter a soberania (integração → Workflow);
- criar atalhos que pulem etapas canônicas do pipeline interno;
- acoplar o orquestrador a um vendor, protocolo ou operadora específica;
- tratar integração externa como dona do fluxo.

---

## Relação com regras anteriores

- **RULE_05** — Transport Agnostic: transporte não define o domínio
- **RULE_06** — Protocol Isolation: protocolo isolado do núcleo
- **RULE_07** — Operator Capability Model: operadora só via Capability Profile
- **RULE_08** — Capability Negotiation: decisão consulta o perfil
- **RULE_09** — Authorization Strategy Pattern: autorização por strategies
- **RULE_10** — Workflow Before Integration: o Workflow interno é soberano;
  integrações executam etapas e nunca controlam o fluxo

Fluxo de soberania:

```
Workflow interno (soberano — RULE_10)
  → etapas canônicas (Documento → … → Authorization → Workflow)
    → Integração Externa (participa; não controla)
      → OperatorCapabilityProfile (RULE_07)
        → Capability Negotiation (RULE_08)
          → AuthorizationStrategy / AuthorizationPolicy (RULE_09)
            → Adapter / transporte isolado (RULE_05 / RULE_06)
```

---

## Limites explícitos (C-05A)

Esta regra registra **somente a arquitetura de governança**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe** autorização funcional;
- **não existe** integração SOAP / XML / REST funcional;
- **não existe** integração com operadoras;
- **não existe** Batch Runtime funcional;
- existe a **foundation estrutural** do Authorization Runtime (C-05)
  e o **registro oficial** desta regra (C-05A).

Implementação funcional de etapas do pipeline **não** faz parte desta Sprint
de certificação e **não** deve ser introduzida silenciosamente.

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-06 em diante)
devem respeitá-la sem exceção silenciosa.
