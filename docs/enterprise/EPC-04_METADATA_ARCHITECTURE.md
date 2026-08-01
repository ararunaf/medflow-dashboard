# EPC-04 — Metadata Architecture (ADR)

**Sprint:** EPC-04 — Metadata Engine Foundation  
**Data:** 31/07/2026  
**Status:** Aceito

---

## ADR-EPC-04-001 — Introduzir MetadataPort sem migrar módulos

### Contexto

A plataforma precisará descrever múltiplos domínios (clínico, financeiro, TISS, contratos) de forma dinâmica. Codificar esses domínios no Core do Metadata Engine acoplaria a IAeasy ao MedicFlow.

### Decisão

Criar `MetadataPort` + `DefaultMetadataAdapter` + `MockMetadataAdapter` + provider + store in-process, **sem** migrar módulos de negócio. Apenas PoC Application (demo) + testes provam o fluxo.

### Consequências

- Risco de regressão próximo de zero
- Arquitetura pronta para strangler fig / descrição dinâmica de domínio
- Dívida consciente: domínios continuam hardcoded até sprints futuras usarem o Engine

---

## ADR-EPC-04-002 — Engine genérico sem conhecimento de domínio MedicFlow

### Contexto

O Metadata Engine deve ser reutilizável em qualquer plataforma IAeasy. Se conhecer Paciente/Guia/Operadora agora, deixa de ser Enterprise-core.

### Decisão

O Port/Adapters/Store usam **somente** conceitos nativos abstratos:

Entity · Attribute · Relationship · Constraint · Schema · Template · Property · Enumeration · Reference · Validation · Version · Namespace · Tag · Category

Proibido importar ou modelar Paciente, Profissional, Guia, Contrato, Operadora, TISS, OCR, IA, Workflow, Storage.

### Consequências

- Core estável diante de evolução de domínio
- Domínio específico fica em camadas superiores (descrito via metadata)
- Testes e mock permanecem simples

---

## ADR-EPC-04-003 — Default store in-process (sem banco novo)

### Contexto

Criar tabela/migration de metadata nesta sprint violaría “NÃO alterar banco / NÃO criar migrations”.

### Decisão

`DefaultMetadataStore` é um Map in-process (schemas / entities / templates). O adapter default o utiliza. Providers `database` / `remote` / `registry` ficam reservados com erro explícito.

### Consequências

- Zero impacto em schema/RLS/migrations
- Store default adequado para fundação + testes
- Persistência remota fica para sprint futura quando houver requisito real

---

## ADR-EPC-04-004 — Herança estrutural sem merge complexo

### Contexto

Herança de esquemas será necessária; implementar flatten/merge agora anteciparia regras de domínio.

### Decisão

1. Campo `extends: MetadataReference` em Schema e Entity
2. Helpers de inspeção (`schemaDeclaresInheritance`, `getDeclaredInheritanceChain`)
3. **Não** implementar resolução multi-nível nem merge de attributes

### Consequências

- Assinaturas estáveis para evolução
- Sem políticas de herança prematuras

---

## ADR-EPC-04-005 — Versionamento estrutural no Schema

### Contexto

Schemas precisarão de Version, Status, timestamps, Author e Compatibility. Sem banco nesta sprint.

### Decisão

`MetadataVersionInfo` embutido em todo Schema. Helpers `createVersionInfo` / `touchVersionInfo`. Status enumerados estruturalmente. Compatibility como listas declarativas (sem semver obrigatório).

### Consequências

- Versionamento pronto para store remoto futuro
- Sem política de upgrade nesta fundação

---

## ADR-EPC-04-006 — Constraints como infraestrutura, não validators

### Contexto

Required/Unique/Regex/Range/etc. serão necessários; executá-los agora misturaria Rule Engine com Metadata.

### Decisão

Definir `MetadataConstraintKind` + factories. Adapters armazenam constraints anexadas a Attributes/Entities. **Nenhuma** execução de validação.

### Consequências

- Rule Engine futuro consome descriptors sem refatorar o Port
- Zero risco de mudar comportamento de negócio agora

---

## ADR-EPC-04-007 — Templates genéricos sem conteúdo clínico

### Contexto

Templates clínicos/TISS são tentadores, mas violam o escopo.

### Decisão

`MetadataTemplate` com slots/properties genéricos. Nenhum template de domínio MedicFlow.

### Consequências

- Infraestrutura pronta
- Conteúdo de domínio fica para sprints de produto

---

## ADR-EPC-04-008 — Integração futura por composição (não acoplamento)

### Contexto

Workflow, Rule Engine, OCR, Storage, IA, Contract Intelligence e Tenant precisarão do Metadata Engine.

### Decisão

Documentar contratos de uso futuro. **Nenhum** desses módulos importa ou depende do MetadataPort nesta sprint. A integração ocorrerá via Application use-cases em sprints dedicadas.

### Consequências

- Zero regressão
- Roadmap claro sem big-bang

---

## Diagrama de dependência

```
Application (demo PoC / futuros UC)
        |
        | depende de
        v
 MetadataPort
        ^
        |
   +----+----+
   |         |
Default   Mock
Adapter   Adapter
   |         |
   v         v
Default   Map
Store     in-memory
(in-process)
```

Inversão de dependência: Domain/Application → Port; Adapter → Store/Infrastructure.

---

## Relação com EPC anteriores

| Sprint | Porta | Store default |
|--------|-------|---------------|
| EPC-01 | PersistencePort | Supabase / Mock |
| EPC-02 | StoragePort | Supabase / Mock |
| EPC-03 | ConfigurationPort | In-process / Mock |
| EPC-04 | MetadataPort | In-process / Mock |

Padrão idêntico: Port → Adapter → Store/Provider → factory `create*Port()`.
