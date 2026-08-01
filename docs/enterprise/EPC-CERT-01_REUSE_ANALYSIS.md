# EPC-CERT-01 — Reuse Analysis

**Sprint:** EPC-CERT-01 — Enterprise Platform Core Certification  
**Data:** 31/07/2026  
**Pergunta central:** O Enterprise Platform Core pode ser reutilizado em outro produto IAeasy?

---

## 1. Resposta

**Sim.** O Enterprise Platform Core é reutilizável em outro produto IAeasy, desde que o produto consuma os Ports (e o módulo Expression) sem acoplar regras/entidades específicas do MedicFlow aos adapters do Core.

---

## 2. Justificativa técnica

### 2.1 Contratos genéricos

| Engine | Por que é reutilizável |
|--------|------------------------|
| Persistence | Port de saúde/capacidades de persistência; vendor atrás de adapter |
| Storage | put/get/delete/signedUrl genéricos + contexto de documento opaco |
| Configuration | key/value + hierarquia + feature flags estruturais |
| Metadata | schemas/entities/templates abstratos, sem entidades clínicas |
| Workflow | máquina de estados genérica (stages/transitions/events) |
| Rule | catálogo estrutural de conditions/operators/actions — sem packs de negócio |
| Expression | linguagem genérica (comparações, booleanos, funções de string/data) |

Nenhum Port importa tipos de paciente, guia, TISS, operadora, contrato, OCR ou IA.

### 2.2 Isolamento e pluggability

- **Zero imports cruzados** entre Engines → um produto pode adotar um subconjunto (ex.: só Configuration + Rule + Expression).
- **Factories com ids reservados** permitem novos providers sem reescrever o Core.
- **Mock adapters** permitem testes e bootstrap em qualquer produto.
- **Vendor lock-in ausente na superfície do Port** (Supabase só em adapters Persistence/Storage).

### 2.3 Separation of concerns

```
Produto IAeasy (domínio)
        ↓ depende de
Enterprise Ports (genéricos)
        ↓ implementados por
Adapters (in-process / vendor)
```

Regras de negócio, packs clínicos, workflows de faturamento e AI prompts **não** estão no Core; nascem em módulos de produto ou sprints futuras (EF/DIP/COPILOT), o que preserva reuso.

### 2.4 Expression como commodity

O Expression Engine (13 operadores, 7 funções) é uma mini-linguagem de avaliação sem vocabulário MedicFlow. Qualquer produto que precise avaliar expressões sobre um contexto opaco (`data` + `now`) pode reutilizá-lo sem fork conceitual.

---

## 3. Limitações conscientes (não impedem reuso)

| Limitação | Impacto no reuso |
|-----------|------------------|
| Persistence ainda usa `mechanismId` | Cosmético; produto novo deve usar `providerId` em novos Engines |
| `MetadataReference` inconsistente entre Engines | Integração cross-engine exige mapeamento até unificação futura |
| Action kinds com labels approve/reject | Catálogo genérico; produto pode ignorar ou estender via `custom` |
| Expression aninhado em `rule/expression` | Path de import acoplado ao pacote Rule — aceitável para IAeasy Core compartilhado |
| Persistence/Storage default Supabase | Produto sem Supabase usa Mock ou novo Vendor Adapter |

Nenhuma limitação exige conhecimento MedicFlow para reutilizar o Core.

---

## 4. Cenários de reuso IAeasy

| Cenário | Engines mínimos | Viável? |
|---------|-----------------|--------|
| SaaS multi-tenant genérico | Configuration + Persistence + Storage | ✅ |
| Orquestração de processos | Workflow (+ Metadata refs opacas) | ✅ |
| Motor de políticas | Rule + Expression | ✅ |
| Plataforma documental | Storage + Metadata + Workflow | ✅ |
| Copilot / AI (futuro) | AI Port (EPC-07) sobre Core atual | ✅ (Core pronto como base) |

---

## 5. O que NÃO deve ser reutilizado como “Core”

- Seeds/regras hardcoded de captura, glosa, TISS (permanecem em módulos de produto)
- Rotas/UI MedicFlow
- Services de domínio em `src/modules/capture/**` etc.
- Adapters vendor devem ser trocáveis; não virar contrato

---

## 6. Conclusão

O Core certificado nesta sprint é **infraestrutura de plataforma**, não um framework clínico.  
Portanto: **reutilizável em outro produto IAeasy**, com pluggability via Ports & Adapters e sem dívida estrutural de domínio MedicFlow no contrato público.
