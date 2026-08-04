# Regra Permanente do BLOCO C — Integração Corporativa

**Status:** Vigente a partir da Sprint C-01A (2026-08-04)  
**Escopo:** Todos os Runtimes do BLOCO C — Integração Corporativa  
**Documento irmão:** [`C01_XML_TISS_RUNTIME_ARCHITECTURE.md`](./C01_XML_TISS_RUNTIME_ARCHITECTURE.md)

---

## Regra

Nenhum Runtime do BLOCO C poderá conhecer diretamente:

- Operadoras;
- SOAP;
- XML específico;
- Namespaces;
- Versões TISS;
- URLs;
- Endpoints;
- Schemas XSD.

Todos os Runtimes deverão trabalhar exclusivamente sobre contratos canônicos.

Toda especialização ficará restrita a Adapters específicos nas Sprints futuras.

---

## Consequências arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| Contratos canônicos | Ports e modelos do Runtime expõem apenas estruturas canônicas |
| Isolamento de especialização | Operadora, SOAP, XML concreto, namespace, versão TISS, URL, endpoint e XSD ficam fora do Runtime |
| Adapters futuros | Especialização de protocolo/vendor/schema ocorre somente em Adapters dedicados |
| Enterprise Runtime | Orquestra Ports; não embute conhecimento de operadora/SOAP/XML/XSD |

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-02 em diante) devem respeitá-la sem exceção silenciosa.
