# Regra Permanente do BLOCO C — Transport Agnostic (RULE_05)

**Status:** Vigente a partir da Sprint C-03 (2026-08-04)  
**Escopo:** Todos os Runtimes do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)  
**Documento de arquitetura:** [`C03_SOAP_RUNTIME_ARCHITECTURE.md`](./C03_SOAP_RUNTIME_ARCHITECTURE.md)

---

## Regra

Todos os Runtimes do BLOCO C deverão ser **independentes do protocolo de transporte** (*Transport Agnostic*).

Consequentemente:

| Runtime | Conhece SOAP? |
|---------|---------------|
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
| **SOAP Runtime** | **Exclusivamente como encapsulador de transporte** |

O **SOAP Runtime** será exclusivamente um encapsulador de transporte.

No futuro deverão ser possíveis novos Runtimes de transporte como:

- REST Runtime
- gRPC Runtime
- Message Queue Runtime
- Event Runtime
- File Exchange Runtime

**sem alterar qualquer Runtime existente.**

Toda especialização deverá ocorrer por **Adapters**.

---

## Limites explícitos (C-03)

Esta regra registra **somente a arquitetura**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe comunicação SOAP**;
- **não existe HTTP**;
- **não existe WSDL**;
- **não existe TLS**;
- **não existe certificado digital**;
- **não existe autenticação**;
- **não existe MTOM**;
- existe apenas a **preparação arquitetural** (contratos estruturais / Port / Adapters / Store).

Implementação funcional de transporte **não** faz parte desta Sprint e **não** deve ser introduzida silenciosamente em Sprints de Foundation.

---

## Consequências arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| Transport Agnostic | Runtimes de domínio/orquestração não conhecem protocolo de transporte |
| SOAP Runtime = encapsulador | Único ponto estrutural para transporte SOAP futuro |
| Extensibilidade | REST / gRPC / MQ / Event / File Exchange sem alterar Runtimes existentes |
| Especialização por Adapters | Protocolo/vendor/operadora ficam fora dos Ports canônicos |
| Separação de blocos | Transporte ≠ XML ≠ Validação ≠ Mapping ≠ Quality |

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-04 em diante) devem respeitá-la sem exceção silenciosa.
