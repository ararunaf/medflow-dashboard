# EPC-11 — Contract Foundation

**Sprint:** EPC-11 — Contract Foundation  
**Data:** 31/07/2026  
**Natureza:** Fundação arquitetural genérica — **sem alteração de comportamento do produto**  
**Padrão:** ECS-01 (Ports & Adapters)

---

## 1. Objetivo

Construir o **Enterprise Contract Foundation**: o modelo canônico de Contrato e a camada Ports & Adapters correspondente.

Nenhum comportamento do MedicFlow muda nesta sprint.

Esta sprint inicia a camada Business Intelligence **apenas** no nível de fundação estrutural.  
Não implementa validação de contratos, auditoria TISS, OCR, IA, Rule Engine, Workflow, integrações, banco, migrations ou UI.

---

## 2. Princípio arquitetural (obrigatório)

```
Contract
  ↓
Metadata
  ↓
Rule Pack References
  ↓
Workflow References
  ↓
Configuration References
  ↓
Resultado (futuro)
```

**Nunca:**

```
Contrato → Regras → Execução
```

| O Contrato NÃO | O Contrato SIM |
|----------------|----------------|
| Contém regras | Representa estrutura canônica |
| Executa regras | Referencia Rule Packs (opaco) |
| Conhece TISS | Referencia Workflow (opaco) |
| Conhece OCR | Referencia Metadata (opaco) |
| Conhece IA | Referencia Configuration (opaco) |
| Valida cláusulas | Suporta anexos / versionamento estrutural |

---

## 3. Escopo

### Inclui

- `ContractPort` (`createContract`, `getContract`, `listContracts`, `health`, `capabilities`)
- `DefaultContractAdapter` (in-memory)
- `MockContractAdapter` (testes / homologação / offline)
- `ContractStore` + `DefaultContractStore`
- `ContractFactory` + `createContractPort` (Provider)
- Modelo canônico `Contract`
- Modelos auxiliares: `ContractVersion`, `ContractAttachment`, `ContractClause`, `ContractSection`, `ContractReference`
- Prep de versionamento: Draft / Published / Deprecated / Archived / Rollback
- Documentação de integração futura
- Testes isolados (`enterprise:contract:test`)

### Não inclui

- Contratos específicos (Unimed, Hapvida, Bradesco, …)
- Tabelas / migrations / banco
- Regras / parser / OCR / IA
- Validação contratual
- Auditoria TISS (futura EPC-14)
- UI / APIs / Server Functions
- Ligação a fluxos de produto existentes

---

## 4. Arquitetura (ECS-01)

```
Application
    ↓
ContractPort
    ↓
ContractAdapter (Default | Mock)
    ↓
ContractStore
    ↓
ContractFactory
    ↓
ContractProvider (createContractPort)
```

Detalhes: [`EPC-11_ARCHITECTURE.md`](./EPC-11_ARCHITECTURE.md)  
Modelo: [`EPC-11_CONTRACT_MODEL.md`](./EPC-11_CONTRACT_MODEL.md)  
Certificação: [`EPC-11_CERTIFICATION.md`](./EPC-11_CERTIFICATION.md)

---

## 5. Universalidade

O contrato representa **qualquer tipo de contrato**, não apenas saúde.

Deverá servir futuramente para:

- cooperativas
- hospitais
- clínicas
- laboratórios
- operadoras
- empresas

O modelo **nunca** depende de TISS. TISS será tratado apenas na futura EPC-14.

---

## 6. Inventário de código

```
src/lib/enterprise/contract/
  ports/          ContractPort, types, versioning, references, identity
  adapters/       DefaultContractAdapter, MockContractAdapter
  store/          ContractStore, DefaultContractStore
  factory/        ContractFactory
  providers/      createContractPort
  demo/           getContractHealthSummary (PoC Application)
  index.ts
```

Script: `npm run enterprise:contract:test`
