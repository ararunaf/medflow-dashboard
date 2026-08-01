# EPC-CERT-02 — Reuse Analysis

**Sprint:** EPC-CERT-02 — Enterprise Organization Certification  
**Data:** 31/07/2026  
**Pergunta central:** A Enterprise Organization Layer pode ser utilizada por qualquer produto IAeasy?

---

## 1. Resposta (FASE 5)

**Sim.** A Enterprise Organization Layer pode ser reutilizada por qualquer produto IAeasy, desde que o produto consuma os Ports (`TenantPort`, `TenantAssignmentPort`, `RulePackPort`) sem embutir regras de negócio do MedicFlow nos adapters do Core.

---

## 2. Justificativa técnica

### 2.1 Contratos genéricos

| Componente | Por que é reutilizável |
|------------|------------------------|
| Rule Pack | Contêiner versionado de regras com refs opacas; sem TISS, contrato, cooperativa ou IA |
| Tenant | Organização com id/nome/tipo/status/versão; sem Auth, RBAC, usuários ou domínio clínico executável |
| Assignment | Associação canônica Tenant ↔ componente Enterprise via kinds + `TargetReference`; sem ligação operacional |

Nenhum Port importa tipos de paciente, guia, TISS, operadora comercial, OCR ou Contract Intelligence.

### 2.2 Isolamento e pluggability

- **Zero imports cruzados** entre Rule Pack, Tenant e Assignment → um produto pode adotar um subconjunto (ex.: só Tenant + Assignment).
- **Zero imports** para Configuration / Storage / Document Identity / AI / Rule / Workflow → o produto resolve bindings na Application.
- **Factories com ids reservados** (`default`, `mock`, `test`, futuros `database`/`remote`/`registry`) permitem novos providers sem reescrever o Core.
- **Mock adapters** permitem testes e bootstrap em qualquer produto IAeasy.

### 2.3 Separation of concerns

```
Produto IAeasy (domínio / Contract Intelligence / Auth / RBAC)
        ↓ depende de
Organization Ports (genéricos)
        ↓ implementados por
Adapters (in-process Default / Mock / futuros vendor)
```

Associações operacionais, autenticação multi-tenant e inteligência contratual **não** estão nesta camada; nascem em sprints de produto (EPC-11+) ou Business Modules.

---

## 3. FASE 9 — Multi-organização sem alteração do Core

### 3.1 Pergunta

A arquitetura suporta múltiplas cooperativas, hospitais, clínicas, laboratórios e operadoras **sem alteração do Core**?

### 3.2 Resposta

**Sim.**

### 3.3 Justificativa

`OrganizationType` já enumera:

| Tipo organizacional | Valor canônico |
|---------------------|----------------|
| Cooperativa | `COOPERATIVE` |
| Hospital | `HOSPITAL` |
| Clínica | `CLINIC` |
| Laboratório | `LABORATORY` |
| Operadora | `INSURANCE` |
| Rede de saúde | `HEALTH_NETWORK` |
| Empresa genérica | `COMPANY` |
| Outro | `OTHER` |

Criar N tenants de qualquer um desses tipos é operação de dados via `TenantPort.createTenant` — **sem mudança de código no Core**.

Assignments por tenant (`RULE_PACK`, `STORAGE`, `CONFIGURATION`, `AI_PROVIDER`, `DOCUMENT`) permitem configurações distintas por organização sem hardcode.

### 3.4 Limite consciente

Incluir um **novo** tipo organizacional fora do catálogo fechado (ex.: `UNIVERSITY`) exigiria alteração do union `OrganizationType` — débito **DEV-ORG-02**. Mitigação imediata: usar `OTHER` + `customAttributes`.

---

## 4. Limitações conscientes (não impedem reuso)

| Limitação | Impacto no reuso |
|-----------|------------------|
| `OrganizationType` com labels healthcare | Produtos fora da saúde usam `COMPANY` / `OTHER`; catálogo fechado é débito de genericity |
| Assignment kinds fechados (5) | Produto que precise Tenant↔Workflow via Assignment requer novo kind (sprint dedicada) |
| Pasta `factory/` | Cosmético ECS-01; não impede consumo via `createXxxPort` |
| Casing de lifecycle misto | Cosmético; Application normaliza se necessário |
| Versionamento Tenant fino | Suficiente para multi-tenant estrutural; packs têm versionamento completo |

Nenhuma limitação exige conhecimento MedicFlow (TISS, glosa, guia) para reutilizar a camada.

---

## 5. Cenários de reuso IAeasy

| Cenário | Componentes mínimos | Viável? |
|---------|---------------------|---------|
| SaaS multi-tenant genérico | Tenant + Configuration (ref) | ✅ |
| Políticas por organização | Tenant + Assignment(`RULE_PACK`) + Rule Pack | ✅ |
| Multi-provider AI por tenant | Tenant + Assignment(`AI_PROVIDER`) | ✅ |
| Storage isolado por org | Tenant + Assignment(`STORAGE`) | ✅ |
| Document pipeline multi-org | Tenant + Assignment(`DOCUMENT`) + Document Identity | ✅ |
| Contract Intelligence (EPC-11) | Tenant + Assignment + Rule Pack (refs opacas) | ✅ (prep) |

---

## 6. Conclusão

A Organization Layer é **mecanicamente genérica**, **desacoplada** e **pronta para multi-organização**.  
Pode ser adotada por outro produto IAeasy sem fork conceitual do MedicFlow.  
O único débito material de genericity é o catálogo fechado `OrganizationType` (ALTO para indústria não-saúde; **não bloqueia** MedicFlow nem EPC-11).
