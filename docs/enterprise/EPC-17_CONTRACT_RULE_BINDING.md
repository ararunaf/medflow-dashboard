# EPC-17 — Contract Rule Binding Foundation

**Sprint:** EPC-17 — Contract Rule Binding Foundation  
**Data:** 31/07/2026  
**Natureza:** Fundação arquitetural de vinculação Contrato ↔ Rule Pack  
**Padrão:** ECS-01  
**Resultado:** APROVADA (fundação; produto inalterado)

---

## 1. Objetivo

Criar exclusivamente a infraestrutura canônica de vinculação entre:

- Enterprise Contract Foundation (**EPC-11**)
- Enterprise Rule Pack / Rule Engine (**EPC-09 / EPC-06A / EPC-06B**)

O Binding **não executa regras**, **não interpreta cláusulas** e **não conhece** o Rule Engine.

---

## 2. Princípio arquitetural

```
Contract
    ↓
Contract Rule Binding
    ↓
Rule Pack
    ↓
Rule Engine
    ↓
Expression Engine
    ↓
Resultado
```

**Nunca:**

```
Contrato → Executa regra
```

| Camada | Responsabilidade nesta sprint |
|--------|-------------------------------|
| Contract (EPC-11) | Identidade/modelo de contrato — **sem** executar regras |
| Contract Rule Binding (EPC-17) | Associação canônica Contrato ↔ Rule Pack |
| Rule Pack (EPC-09) | Empacotamento de regras — **sem** conhecer contratos |
| Rule Engine (EPC-06A) | Único responsável por executar regras — **fora** desta sprint |
| Expression Engine (EPC-06B) | Avaliação de expressões — **fora** desta sprint |

---

## 3. Escopo

### Incluído

- `ContractRuleBindingPort`
- `DefaultContractRuleBindingAdapter` (in-memory)
- `MockContractRuleBindingAdapter`
- `ContractRuleBindingStore` + `DefaultContractRuleBindingStore`
- `ContractRuleBindingFactory`
- `createContractRuleBindingPort` (Provider)
- Modelo canônico `ContractRuleBinding`
- Enumeração `BindingPolicy` (sem lógica)
- Documentação de extensão futura
- Testes isolados + script npm

### Explicitamente excluído

- IA / AI Auditor
- OCR
- Validação TISS
- Workflow operacional
- Banco / migrations
- UI / APIs
- Validação contratual
- Interpretação de cláusulas
- Criação de regras ou Rule Packs específicos
- Criação de contratos específicos
- Alteração de Document Processing
- Qualquer execução de regra

---

## 4. Operações do Port

| Operação | Descrição |
|----------|-----------|
| `bindRulePack()` | Cria/atualiza Binding canônico |
| `unbindRulePack()` | Remove Binding por `BindingId` |
| `listBindings()` | Lista Bindings (filtros estruturais) |
| `getBinding()` | Obtém Binding por `BindingId` |
| `health()` | Prontidão do adapter |
| `capabilities()` | Capacidades declaradas |

---

## 5. Fluxo ECS-01

```
Application
    ↓
ContractRuleBindingPort
    ↓
ContractRuleBindingAdapter
    ↓
ContractRuleBindingStore
    ↓
ContractRuleBindingFactory
    ↓
ContractRuleBindingProvider
```

---

## 6. Documentos relacionados

| Documento | Conteúdo |
|-----------|----------|
| [`EPC-17_BINDING_MODEL.md`](./EPC-17_BINDING_MODEL.md) | Modelo canônico + BindingPolicy |
| [`EPC-17_ARCHITECTURE.md`](./EPC-17_ARCHITECTURE.md) | Arquitetura, fronteiras, extensão futura |
| [`EPC-17_CERTIFICATION.md`](./EPC-17_CERTIFICATION.md) | Certificação obrigatória |

---

## 7. Localização do código

```
src/lib/enterprise/contract-rule-binding/
```

Script de teste:

```bash
npm run enterprise:contract-rule-binding:test
```
