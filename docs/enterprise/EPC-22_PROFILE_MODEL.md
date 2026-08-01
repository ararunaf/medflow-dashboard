# EPC-22 — Profile Model

**Sprint:** EPC-22 — TISS Profile Foundation  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-profile/ports/models.ts`  
**Documento pai:** [`EPC-22_TISS_PROFILE_FOUNDATION.md`](./EPC-22_TISS_PROFILE_FOUNDATION.md)

---

## 1. Princípio

Todos os modelos são **estruturais e declarativos**.

- Sem lógica
- Sem validação
- Sem regras
- Sem parsers
- Sem contratos
- Sem conhecimento de operadoras / cooperativas

O Profile descreve **como um documento é organizado** — não valida nem decide.

---

## 2. Modelos obrigatórios

### 2.1 TISSProfile

**Responsabilidade:** Padrão estrutural reutilizável de documento TISS.

Não é uma guia específica.

| Campo | Papel |
|-------|-------|
| `name` | Nome estável do padrão |
| `profileCode` | Código canônico opaco |
| `concepts` | Conceitos estruturais do padrão |
| `relationships` | Relacionamentos esperados (embutidos) |
| `versionIds` | Ids de `ProfileVersion` |
| `supportedVersionFamilies` | Famílias (`tiss-4.x`, `tiss-5.x`, `proprietary`) |
| `metadata` / `metadataId` | Metadados estruturais |
| `structuralNotes` | Observações estruturais |

---

### 2.2 ProfileConcept

**Responsabilidade:** Conceito esperado dentro do Profile.

| Campo | Papel |
|-------|-------|
| `conceptCode` | Código do Vocabulário TISS |
| `conceptId` / `conceptName` | Referências opcionais |
| `requirement` | `mandatory` \| `optional` |
| `cardinality` | Rótulo (`1`, `0..1`, `0..*`, `1..*`, …) |
| `logicalOrder` | Ordem lógica estrutural |
| `structuralNotes` | Observações estruturais |

**Garantia:** Declara presença esperada. **Não** valida dados.

---

### 2.3 ProfileRelationship

**Responsabilidade:** Relacionamento esperado entre conceitos do Profile.

| Campo | Papel |
|-------|-------|
| `sourceConceptCode` | Conceito de origem |
| `targetConceptCode` | Conceito de destino |
| `relationshipType` | Tipo estrutural livre |
| `expected` | Flag estrutural (sem enforce) |
| `logicalOrder` | Ordem lógica |
| `structuralNotes` | Observações estruturais |

**Garantia:** Representação apenas. Sem motor de grafo / traversal / validação.

---

### 2.4 ProfileVersion

**Responsabilidade:** Versão estrutural associada a um Profile.

| Campo | Papel |
|-------|-------|
| `profileId` | Profile associado |
| `versionLabel` | Rótulo (ex.: `4.01.00`, `5.0`) |
| `versionFamily` | `tiss-4.x` \| `tiss-5.x` \| `proprietary` |
| `isActive` | Flag estrutural (sem promoção) |
| `structuralNotes` | Observações |

**Garantia:** Infraestrutura para múltiplas versões. **Nenhuma** versão TISS é implementada nesta sprint.

---

### 2.5 ProfileMetadata

**Responsabilidade:** Metadados estruturais do Profile.

| Campo | Papel |
|-------|-------|
| `title` | Título estrutural |
| `summary` | Resumo estrutural |
| `authorHint` | Hint opaco de autoria |
| `structuralNotes` | Observações |
| `tags` / `customAttributes` | Extensão estrutural |

---

## 3. Definições estruturais por Profile (FASE 7)

Cada Profile permite definir, exclusivamente de forma estrutural:

| Dimensão | Campo / modelo |
|----------|----------------|
| Conceito obrigatório | `ProfileConcept.requirement = "mandatory"` |
| Conceito opcional | `ProfileConcept.requirement = "optional"` |
| Cardinalidade | `ProfileConcept.cardinality` |
| Relacionamento esperado | `ProfileRelationship.expected` |
| Ordem lógica | `logicalOrder` em concept / relationship |
| Observações estruturais | `structuralNotes` |

Sem qualquer validação.

---

## 4. Múltiplas versões (FASE 8)

Famílias preparadas (constantes):

- `tiss-4.x`
- `tiss-5.x`
- `proprietary`

Apenas infraestrutura. Nenhuma versão concreta implementada.

---

## 5. Separação de responsabilidades

| Camada | Responsabilidade |
|--------|------------------|
| Vocabulary (EPC-20) | Conceitos semânticos permanentes |
| Mapping (EPC-21) | Tradução origem → Vocabulário → Healthcare |
| **Profile (EPC-22)** | Estrutura documental esperada |
| Healthcare Model (EPC-19) | Entidades canônicas |
| Rule Engine | Decisão (futuro — usa Profile como referência) |
| AI Auditor | Explicação (futuro) |
