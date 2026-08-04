# Regra Permanente do BLOCO C — Protocol Isolation (RULE_06)

**Status:** Vigente a partir da Sprint C-03A (2026-08-04)  
**Escopo:** Todos os Runtimes do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)  
**Documento de arquitetura:** [`C03_SOAP_RUNTIME_ARCHITECTURE.md`](./C03_SOAP_RUNTIME_ARCHITECTURE.md)  
**Certificação final:** [`C03_SOAP_RUNTIME_FINAL_CERTIFICATION.md`](./C03_SOAP_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

Todo Runtime deverá permanecer **isolado dos protocolos específicos** (*Protocol Isolation*).

Consequentemente:

| Runtime | Conhece protocolo proprietário / operadora? |
|---------|---------------------------------------------|
| XML Runtime | **Não** |
| XML Validation Runtime | **Não** |
| Auto Fill Runtime | **Não** |
| TISS Mapping Runtime | **Não** |
| Quality Runtime | **Não** |
| Audit Runtime | **Não** |
| Validation Runtime | **Não** |
| Document Extraction Runtime | **Não** |
| Document Classification Runtime | **Não** |
| OCR Runtime | **Não** |
| AI Orchestration Runtime | **Não** |
| **SOAP Runtime** | **Somente conceitos SOAP genéricos** |

O **SOAP Runtime** conhece apenas conceitos SOAP genéricos.

O SOAP Runtime **não poderá conhecer**:

- Unimed
- Hapvida
- Bradesco
- SulAmérica
- Amil
- CASSI
- GEAP
- IPM
- qualquer outra operadora

Também **não poderá conhecer**:

- headers proprietários
- namespaces específicos
- endpoints específicos
- políticas de autenticação
- certificados
- tokens
- URLs
- regras particulares de fornecedores

Toda especialização deverá ocorrer **exclusivamente** em **Adapters** especializados (futuros).

O restante da plataforma continua trabalhando apenas com **contratos canônicos**.

---

## Limites explícitos (C-03A)

Esta regra registra **somente a arquitetura**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe** comunicação SOAP;
- **não existe** HTTP / WSDL / TLS / MTOM;
- **não existe** autenticação / certificado / token;
- **não existe** Adapter de operadora;
- **não existe** endpoint, URL ou namespace de fornecedor no SOAP Runtime;
- existe apenas a **preparação arquitetural** (contratos estruturais genéricos / Port / Adapters estruturais / Store).

Implementação funcional de protocolo proprietário ou Adapter de operadora **não** faz parte desta Sprint e **não** deve ser introduzida silenciosamente em Sprints de Foundation.

---

## Consequências arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| Protocol Isolation | Runtime genérico; protocolo/vendor fora do núcleo |
| SOAP Runtime genérico | Apenas envelope/header/body/fault/context canônicos |
| Sem conhecimento de operadora | Nenhuma constante, branch ou namespace de operadora no Runtime |
| Sem endpoints / URLs | Endereçamento fica fora do Port canônico |
| Especialização por Adapters | Operadora / fornecedor / política → Adapter futuro |
| Contratos canônicos | Produto e peers consomem apenas shapes canônicos |

---

## Relação com a Regra nº 5 (Transport Agnostic)

- **RULE_05** — Runtimes de domínio não conhecem transporte; SOAP Runtime é encapsulador de transporte.
- **RULE_06** — O próprio SOAP Runtime permanece genérico; não conhece operadoras nem protocolos proprietários.

As duas regras são complementares e permanentes.

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-04 em diante) devem respeitá-la sem exceção silenciosa.
