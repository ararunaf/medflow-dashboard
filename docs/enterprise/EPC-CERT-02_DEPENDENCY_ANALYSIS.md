# EPC-CERT-02 — Dependency Analysis

**Sprint:** EPC-CERT-02 — Enterprise Organization Certification  
**Data:** 31/07/2026  
**Natureza:** Auditoria de dependências — **sem alteração de código**

---

## 1. Método

1. Varredura de imports em `src/lib/enterprise/{rule-pack,tenant,tenant-assignment}/**/*.ts`
2. Busca de referências cruzadas a `configuration`, `storage`, `document-identity`, `ai-provider`, `metadata`, `rule`, `workflow`, `ocr`
3. Inspeção da direção Port ← Adapter ← Store ← Provider/Factory
4. Validação de desacoplamento de Assignment Objects (FASE 3)

---

## 2. FASE 3 — Auditoria de desacoplamento (Assignment)

### 2.1 Critérios obrigatórios

| Critério | Resultado | Evidência |
|----------|-----------|-----------|
| Nenhum Assignment conhece Rule Engine | ✅ | Zero import de `rule/`; kind `RULE_PACK` + `TargetReference` opaca |
| Nenhum Assignment conhece Workflow | ✅ | Zero import; kind Workflow **inexistente** |
| Nenhum Assignment conhece Storage | ✅ | Zero import de `storage/`; kind `STORAGE` + target opaco |
| Nenhum Assignment conhece AI | ✅ | Zero import de `ai-provider/`; kind `AI_PROVIDER` + target opaco |
| Nenhum Assignment conhece OCR | ✅ | Zero menção / import OCR |

### 2.2 Evidência de adapter

`DefaultTenantAssignmentAdapter` declara explicitamente que **não** carrega Rule Packs, AI Providers, Storage, Configuration ou Documents e **não** implementa ligações operacionais.

Imports sob `tenant-assignment/` são **exclusivamente internos** (`../ports`, `../store`, `../adapters`, `../factory`).

---

## 3. FASE 4 — Grafo de dependências

### 3.1 Entre componentes da Organization Layer

```
rule-pack          ──(isolado)──► apenas self
tenant             ──(isolado)──► apenas self
tenant-assignment  ──(isolado)──► apenas self

(sem arestas entre os três)
```

**Dependências circulares:** **nenhuma.**

### 3.2 Entre Organization Layer e Engines / Providers

```
rule-pack ──X──► configuration | storage | document-identity | ai-provider | metadata | rule | workflow | tenant
tenant    ──X──► configuration | storage | document-identity | ai-provider | metadata | rule | workflow | rule-pack | tenant-assignment
tenant-assignment ──X──► (todos os acima, inclusive tenant e rule-pack)

Legenda: ──X──► = sem import TypeScript (apenas refs opacas tipadas localmente)
```

### 3.3 Matriz de acoplamento de código

| De → Para | Rule Pack | Tenant | Assignment | Config | Storage | DocId | AI | Metadata | Rule | Workflow |
|-----------|-----------|--------|------------|--------|---------|-------|-----|----------|------|----------|
| Rule Pack | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (ref) | ❌ (ref) | ❌ |
| Tenant | ❌ | — | ❌ | ❌ (ref) | ❌ | ❌ | ❌ | ❌ (ref) | ❌ | ❌ |
| Assignment | ❌ (kind) | ❌ (ref) | — | ❌ (kind) | ❌ (kind) | ❌ (kind) | ❌ (kind) | ❌ (ref) | ❌ | ❌ |

`(ref)` / `(kind)` = referência tipada localmente ou discriminador string — **não** import de módulo.

---

## 4. Dependency Inversion

| Camada | Dependências observadas | Conformidade |
|--------|-------------------------|--------------|
| Port | tipos do próprio contrato | ✅ |
| Adapter | Port + Store + helpers locais | ✅ |
| Store | tipos do Port | ✅ |
| Provider | Port + Factory interna | ✅ |
| Factory | Port + Adapters | ✅ |
| Demo Application | apenas Port | ✅ |

**Violações de Dependency Inversion:** **nenhuma.**

---

## 5. Dependências fortes / implícitas / indevidas

### 5.1 Aceitáveis (por design)

| Dependência | Local | Classificação |
|-------------|-------|---------------|
| `providers/` → `factory/` | create-*-port.ts | Helper interno do mesmo componente — **funcionalmente OK**; pasta viola ECS-01 (**DEV-ORG-01**) |
| Adapter → Store | Default adapters | Família in-process — **permitido** |
| Helpers `dependencies.ts` / `versioning.ts` / `organization.ts` / `assignment.ts` | ports auxiliares | Infraestrutura estrutural — **permitido** |

### 5.2 Acoplamentos fortes

| Achado | Severidade | Impede EPC-11? |
|--------|------------|----------------|
| Nenhum acoplamento forte de código entre Org Layer e engines | — | Não |
| Catálogo fechado `OrganizationType` (viés conceitual) | ALTO (reuso) | Não |
| Kinds fechados de Assignment (5) | MÉDIO (extensibilidade) | Não |

**Acoplamentos fortes de código (imports / SDKs no Port):** **não existem.**

### 5.3 Dependências implícitas

| Implícita | Risco | Mitigação atual |
|-----------|-------|-----------------|
| Application futura que resolva `TargetReference` | MÉDIO se feita no Core | Resolução deve ficar na Application / Business Module |
| Assumir que `DOCUMENT` = Document Identity Engine | BAIXO | Kind é string discriminadora; binding é externo |
| Assumir que `RULE_PACK` carrega Rule Engine | BAIXO | Pack e Rule são separados; refs opacas |

---

## 6. Violações ECS-01 relacionadas a dependências

| ID | Violação | Severidade | Impede EPC-11? |
|----|----------|------------|----------------|
| DEV-ORG-01 | Pasta `factory/` paralela | ALTO | Não |
| DEV-ORG-03 | Superfície barrel ampla (Factory/Adapters) | MÉDIO | Não |

Nenhuma violação de hierarquia Application → Port → Adapter.  
Nenhum vendor SDK no Port.  
Nenhum vazamento de OCR / TISS / contrato comercial nos tipos.

---

## 7. Conclusão

A Organization Layer está **isolada**.  
Não há ciclos. Não há acoplamentos fortes de código.  
Assignment Objects cumprem integralmente o desacoplamento exigido pela FASE 3.  
Dependências restantes são **estruturais internas** ou **referências opacas** — adequadas para EPC-11.
