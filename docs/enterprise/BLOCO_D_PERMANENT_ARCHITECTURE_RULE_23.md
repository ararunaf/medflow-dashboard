# Regra Permanente nº 23 — Release Baseline Certification (RULE_23)

**Status:** Vigente a partir da Sprint D-01A (2026-08-05)  
**Escopo:** Todas as Sprints Enterprise (BLOCO D e subsequentes); qualquer Sprint que pretenda servir de base para a seguinte  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md)  
**Certificação:** [`D01_XML_FUNCTIONAL_PARSER_FINAL_CERTIFICATION.md`](./D01_XML_FUNCTIONAL_PARSER_FINAL_CERTIFICATION.md)

---

## Regra

**RELEASE BASELINE CERTIFICATION**

Toda Sprint somente poderá servir de base para a Sprint seguinte quando possuir:

| Critério | Obrigatório |
|----------|-------------|
| GO Técnico | ✓ |
| GO Administrativo | ✓ |
| Working Tree limpa | ✓ |
| Push realizado | ✓ |
| Hash local = remoto | ✓ |
| Ahead = 0 | ✓ |
| Behind = 0 | ✓ |

A Sprint certificada passa a ser denominada:

**OFFICIAL RELEASE BASELINE**

Nenhuma implementação funcional é realizada por esta regra — apenas governança
de baseline.

---

## Definições oficiais

| Termo | Significado |
|-------|-------------|
| **GO Técnico** | Build, TypeScript, ESLint, Smoke e suítes Enterprise/peers relevantes em **PASS**, sem regressão |
| **GO Administrativo** | Auditoria de escopo concluída; documentação oficial publicada; commit de entrega confirmado; Working Tree limpa; push sincronizado (ahead/behind = 0; hash local = remoto) |
| **OFFICIAL RELEASE BASELINE** | Sprint que cumpriu GO Técnico + GO Administrativo e está publicada como base autorizada para a Sprint seguinte |
| **Baseline Funcional Oficial** | Primeira baseline do BLOCO D com capacidade funcional certificada (D-01 / D-01A = XML Functional Parser) |

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Base só após certificação | A Sprint N+1 só inicia sobre uma OFFICIAL RELEASE BASELINE |
| Duplo GO | Técnico e Administrativo são independentes e ambos obrigatórios |
| Sincronização Git | Local e remoto idênticos; ahead = 0; behind = 0 |
| Working Tree limpa | Nenhum arquivo da Sprint fora do Git; sem untracked da Sprint |
| Sem implementação nesta regra | RULE_23 não autoriza código funcional — só publicação/governança |

---

## Relação com RULE_20

| Regra | Foco |
|-------|------|
| RULE_20 — Incremental Functional Evolution | Uma capacidade funcional por Sprint |
| RULE_23 — Release Baseline Certification | A Sprint só vira base da seguinte após GO Técnico + GO Administrativo + sync Git |

RULE_23 complementa RULE_20: além de evoluir uma capacidade por vez, cada
entrega funcional (e seu gate) deve ser publicada como **OFFICIAL RELEASE
BASELINE** antes de autorizar a próxima Sprint.

---

## Aplicação na Sprint D-01A

| Item | Valor |
|------|-------|
| Sprint de entrega | D-01 — Enterprise XML Functional Parser Foundation |
| Sprint de gate | D-01A — Enterprise XML Functional Parser Gate |
| Capacidade certificada | XML Parser genérico (`parserImplemented = true`) |
| Resultado | D-01 torna-se a **primeira Baseline Funcional Oficial** do BLOCO D |
| Próxima Sprint autorizada (não iniciada) | D-02 — Enterprise XML Validation Runtime Functional Foundation |

---

## O que esta regra NÃO é

- Não implementa XSD / XML Validation / SOAP / Operadoras / Workflow / Authorization
- Não altera XML Parser, XML Runtime, Enterprise Runtime ou Contratos Canônicos
- Não autoriza iniciar a Sprint seguinte dentro da Sprint de certificação
- Não substitui as Regras Permanentes 1–22

---

## Vigência

A partir de **D-01A — Enterprise XML Functional Parser Gate**, toda Sprint
somente poderá servir de base para a Sprint seguinte quando cumprir
**RELEASE BASELINE CERTIFICATION** e for publicada como
**OFFICIAL RELEASE BASELINE**.
