# ECS-01 — Decisão oficial: Camada Application

**Sprint de origem da observação:** GATE-ARCH-02 (blocker B3)  
**Sprint de decisão:** ARCH-01 — Enterprise Runtime Integration  
**Data:** 01/08/2026  
**Natureza:** Decisão arquitetural oficial — **sem criação massiva de classes**

---

## 1. Observação do GATE-ARCH-02

> 43 módulos em `src/lib/enterprise` seguem majoritariamente Port → Adapter → Store → Factory → Provider.  
> A camada **Application não existe em nenhum módulo (0/43)**, embora ECS-01 a documente.  
> Lógica de composição vive em adapters (`orchestrator-helpers`).

ECS-01 §3.1 listava:

```
Application → Port → Adapter → Store → Factory → Provider → Infrastructure
```

e §3.2 definia Application como *“demo / futuros consumers”*.

---

## 2. Pergunta técnica

A camada Application realmente precisa existir como pasta/`classes` por componente?

**OU**

A responsabilidade foi absorvida legitimamente pelo Runtime / Orchestrator?

---

## 3. Decisão oficial

**A pasta `application/` por componente Enterprise NÃO é obrigatória.**

A responsabilidade de Application foi **absorvida legitimamente** por:

| Papel Application | Onde vive oficialmente |
|-------------------|------------------------|
| Composition root / resolução de Ports | **Enterprise Runtime** (`src/lib/enterprise/runtime/`) |
| Consumers de produto | Módulos de produto que dependem só de Runtime/Ports (ex.: Captura bridge ARCH-01) |
| PoC de fundação (sem UI/API) | `demo/` por componente (já existente) |

### O que isso NÃO autoriza

- Application/produto importar Adapter/Store/Vendor concretos
- Criar dezenas de classes `*ApplicationService` só para satisfazer nomenclatura
- Mover regras clínicas para o Runtime ou Orchestrator

### O que permanece obrigatório (ECS-01)

- `ports/`, `adapters/`, `providers/`, `demo/`, root `index.ts`
- Dependency Inversion: consumers dependem de `XxxPort` (via Runtime)
- Orchestrator apenas coordena — não executa Engines de negócio

---

## 4. Hierarquia atualizada (canônica)

```
Produto / Consumer
        ↓
Enterprise Runtime          ← Application composition root
        ↓
Port
        ↓
Adapter
        ↓
Store (quando aplicável)
        ↓
Factory / Provider
        ↓
Infrastructure
```

O Canonical Execution Orchestrator é um Port Enterprise resolvido pelo Runtime;  
ele coordena outros Ports e **não substitui** Application — complementa a orquestração estrutural.

---

## 5. Emenda implícita à ECS-01

Esta decisão emenda a interpretação de §2.1 / §3.1 / §3.2:

- `demo/` = Application PoC de fundação (obrigatório na criação do Engine)
- Application de produto = Runtime + consumers (não pasta `application/` por módulo)
- Contagem “0/43 pastas application” **deixa de ser blocker** quando existir Runtime oficial com ≥1 consumer de produto via Ports

Documento pai: [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)  
Sprint de integração: [`ARCH-01_ENTERPRISE_RUNTIME_INTEGRATION.md`](./ARCH-01_ENTERPRISE_RUNTIME_INTEGRATION.md)

---

## 6. Assinatura da decisão

| Campo | Valor |
|-------|-------|
| Status | **APROVADA** (com ARCH-01) |
| Alternativa rejeitada | Criar `application/` em 43 módulos sem consumer real |
| Motivo | Evitar cerimônia vazia; Runtime é o composition root correto |
