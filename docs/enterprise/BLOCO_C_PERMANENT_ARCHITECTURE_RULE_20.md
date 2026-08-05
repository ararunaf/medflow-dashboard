# Regra Permanente — Incremental Functional Evolution (RULE_20)

**Status:** Vigente a partir da Sprint D-01 (2026-08-05)  
**Escopo:** BLOCO D — Funcionalização Progressiva dos Runtimes (e sprints funcionais subsequentes da Enterprise Foundation)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_19.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_19.md)  
**Documento de arquitetura:** [`D01_XML_FUNCTIONAL_PARSER.md`](./D01_XML_FUNCTIONAL_PARSER.md)  
**Certificação:** [`D01_XML_PARSER_CERTIFICATION.md`](./D01_XML_PARSER_CERTIFICATION.md)

---

## Regra

**INCREMENTAL FUNCTIONAL EVOLUTION**

Cada Sprint funcional poderá implementar **apenas UMA** nova capacidade.

Blocos A, B e C permanecem **homologados e congelados**. A arquitetura
Enterprise Foundation deve permanecer intacta; a evolução funcional é
**incremental**, nunca um big-bang de múltiplas capabilities na mesma Sprint.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Uma capacidade por Sprint | Ex.: D-01 = apenas XML Parser |
| Foundation preservada | Ports, Adapters, Registry e contratos existentes não são reescritos fora do necessário |
| Capabilities explícitas | A capacidade nova fica `*Implemented = true`; as demais capacidades funcionais daquela superfície permanecem `false` até suas sprints |
| Gates antes e depois | Antes da implementação funcional: Build, TypeScript, ESLint, Smoke e Enterprise devem estar PASS. Após a implementação: executar novamente todos os Gates |
| Sem atalhos de domínio | Parser XML não conhece TISS/Operadoras; Validation não implementa SOAP; etc. |

---

## Ciclo obrigatório de Gates

**Antes** de iniciar a implementação funcional da Sprint:

1. `npm run build`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run smoke-check`
5. Enterprise (suite de testes enterprise relevantes)

**Após** a implementação:

1. Repetir Build / TypeScript / ESLint / Smoke
2. Repetir Enterprise + testes da capacidade nova
3. Confirmar ausência de regressão nos Runtimes peers

---

## Aplicação na Sprint D-01

| Item | Valor |
|------|-------|
| Capacidade única | XML Parser (`parserImplemented = true`) |
| Explicitamente fora | XSD, Validation, SOAP, HTTP, Operadoras, Authorization, Batch, Workflow, Return, Reconciliation, IA, Banco, APIs, Persistência, Scheduler, Filas, XPath |

---

## O que esta regra NÃO é

- Não autoriza implementar múltiplas capabilities “já que estamos no arquivo”
- Não autoriza quebrar Foundations congeladas dos Blocos A/B/C
- Não substitui as Regras Permanentes 1–19
- Não inicia automaticamente a Sprint seguinte (ex.: D-01A)

---

## Vigência

A partir de **D-01 — Enterprise XML Functional Parser Foundation**, toda Sprint
funcional do BLOCO D (e evoluções funcionais correlatas) deve obedecer
**Incremental Functional Evolution**: exatamente uma capacidade nova por Sprint,
com Gates PASS antes e depois.
