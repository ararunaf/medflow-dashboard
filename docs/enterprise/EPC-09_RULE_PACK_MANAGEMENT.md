# EPC-09 — Rule Pack Management Foundation

**Sprint:** EPC-09 — Rule Pack Management Foundation  
**Data:** 31/07/2026  
**Natureza:** Fundação arquitetural — gerenciamento genérico de conjuntos de regras  
**Padrão:** ECS-01 (Ports & Adapters)

---

## 1. Objetivo

Construir um **Rule Pack Management** totalmente genérico.

Um **Rule Pack** representa apenas um **agrupamento versionado de regras**.

Ele **NÃO** representa:

- operadora;
- cooperativa;
- contrato;
- guia;
- paciente;
- domínio clínico ou TISS.

Único objetivo: organizar, versionar, agrupar e disponibilizar conjuntos de regras para o Enterprise Platform Core.

---

## 2. Escopo desta sprint

### Implementado

| Fase | Entrega |
|------|---------|
| 1 | `RulePackPort` — `createPack`, `getPack`, `listPacks`, `enablePack`, `disablePack`, `health`, `capabilities` |
| 2 | `DefaultRulePackAdapter` — in-memory / in-process |
| 3 | `MockRulePackAdapter` — testes / homologação / offline |
| 4 | `RulePackFactory` |
| 5 | `RulePackProvider` (`createRulePackPort`) |
| 6 | Modelo canônico `RulePack` |
| 7 | Versionamento estrutural (sem persistência real) |
| 8 | Dependências entre packs (sem resolução automática) |
| 9 | Prep de integração futura (documentada) |
| 10 | Documentação EPC-09 |

### Explicitamente fora de escopo

- Regras TISS / clínicas
- Contratos / operadoras / cooperativas
- Auditoria / IA / OCR
- Workflow clínico
- Novo Rule Engine
- Banco / migrations
- UI / APIs

---

## 3. Arquitetura (ECS-01)

```
Application
    ↓
RulePackPort
    ↓
RulePackAdapter (Default | Mock)
    ↓
RulePackStore
    ↓
RulePackFactory
    ↓
RulePackProvider (createRulePackPort)
```

- Default de produção: `DefaultRulePackAdapter`
- Testes / offline: `MockRulePackAdapter` (`mock` | `test`)
- Providers futuros (`database` / `remote` / `registry`): erro explícito

---

## 4. Código

```
src/lib/enterprise/rule-pack/
  ports/
  adapters/
  store/
  factory/
  providers/
  demo/
  index.ts
```

Teste: `npm run enterprise:rule-pack:test`

---

## 5. Documentos relacionados

| Documento | Conteúdo |
|-----------|----------|
| [`EPC-09_RULE_PACK_MODEL.md`](./EPC-09_RULE_PACK_MODEL.md) | Modelo canônico, versionamento, dependências |
| [`EPC-09_ARCHITECTURE.md`](./EPC-09_ARCHITECTURE.md) | Arquitetura + integração futura |
| [`EPC-09_CERTIFICATION.md`](./EPC-09_CERTIFICATION.md) | Certificação e evidências |

---

## 6. Princípio inviolável

> Rule Pack é apenas um contêiner versionado de regras.  
> Ele nunca poderá conhecer TISS, Operadoras, Cooperativas, Contratos, Guias ou Pacientes.
