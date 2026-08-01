# EPC-04 — Metadata Migration Plan (Strangler Fig)

**Sprint:** EPC-04 — Metadata Engine Foundation  
**Data:** 31/07/2026  
**Princípio:** migrar pouco, provar sempre, nunca big-bang

---

## 1. Estado atual (após EPC-04)

| Item | Estado |
|------|--------|
| `MetadataPort` | Existe |
| `DefaultMetadataAdapter` | Existe (default) |
| `MockMetadataAdapter` | Existe (test/mock/offline) |
| `DefaultMetadataStore` | Existe (in-process) |
| Provider `createMetadataPort` | Existe |
| Conceitos nativos abstratos | Declarados |
| Herança de esquemas | Preparada (sem merge) |
| Versionamento de Schema | Preparado (sem banco) |
| Constraints | Preparadas (sem validação) |
| Templates | Infraestrutura (sem clínicos) |
| Módulos de negócio no Port | **0** (intencional) |
| PoC Application | 1 (demo health summary — só testes) |
| UI / APIs / Settings / Storage / Persistence | **Inalterados** |

---

## 2. Estratégia

```
Fase A (EPC-04)   Fundar Port + Adapter + Store + conceitos + herança/versão/constraints/templates prep  ← FEITO
Fase B            Descrever 1 domínio abstrato de baixo risco (não clínico) via Schema/Entity
Fase C            Consumir MetadataPort em 1 use-case Application (paridade com hardcode atual)
Fase D            Introduzir herança/resolução mínima com testes de paridade
Fase E            Provider database/registry quando houver requisito real de persistência
Fase F            Ligar Rule Engine / Workflow a Constraints/Schemas (sprints dedicadas)
Fase G            Descrever domínios MedicFlow (Paciente/Guia/…) como metadata — nunca no Core
```

Cada fase exige: build + TypeScript + ESLint + testes + smoke = PASS, e zero mudança perceptível ao usuário (exceto quando a sprint for explicitamente funcional).

---

## 3. Ordem sugerida de uso futuro

Prioridade por **baixo risco / baixo acoplamento**:

1. **Schemas de infraestrutura** (catálogos internos, enums de plataforma)
2. **Templates genéricos** de formulário/config (não clínicos)
3. **Constraints** consumidas pelo Rule Engine futuro
4. **Workflow** lendo Entity/Relationship como definição de processo
5. **OCR / IA** mapeando campos capturados → Attributes genéricos
6. **Contract Intelligence / Tenant** via Namespace/Category
7. **Domínios MedicFlow** descritos como metadata — **acima** do Engine, nunca dentro

**Nunca** iniciar por: hardcode de Paciente/Guia/Operadora dentro de `src/lib/enterprise/metadata/`.

---

## 4. Receita por domínio futuro (checklist)

Para cada domínio candidato a ser descrito:

1. [ ] Modelar como `MetadataSchema` + `MetadataEntity` (conceitos abstratos)
2. [ ] Attributes com `MetadataPropertyKind` adequado
3. [ ] Constraints estruturais (sem evaluator até Rule Engine)
4. [ ] VersionInfo completo (Version/Status/timestamps/Author/Compatibility)
5. [ ] Herança via `extends` somente quando necessário
6. [ ] Template infra se houver reuso estrutural
7. [ ] Consumir via `MetadataPort` em Application — nunca importar Adapter no Domain
8. [ ] Testes de paridade com comportamento legado
9. [ ] Remover hardcode somente após certificação

---

## 5. Preparação para consumidores futuros

| Consumidor | Preparado em EPC-04? | Implementado? |
|------------|----------------------|---------------|
| Workflow Engine | Sim (doc + Schema/Entity/Relationship) | Não |
| Rule Engine | Sim (Constraints/Validation descriptors) | Não |
| OCR | Sim (Attributes/Properties genéricos) | Não |
| Storage | Sim (Properties/Reference — sem acoplar StoragePort) | Não |
| IA | Sim (Templates/Properties) | Não |
| Contract Intelligence | Sim (Entity abstrata) | Não |
| Tenant | Sim (Namespace/Category) | Não |
| Persistência remota de metadata | Sim (provider ids reservados) | Não |

---

## 6. Critérios para considerar migração concluída (futuro)

Uma migração de domínio só está concluída quando:

- Domínio é descrito 100% via MetadataPort (sem tipos clínicos no Engine)
- Paridade de comportamento comprovada
- Zero regressão em smoke + suites relevantes
- Adapter/store pode trocar sem alterar Application

---

## 7. Fora de escopo permanente do Metadata Engine Core

Mesmo em sprints futuras, o Core do Engine **não** deve importar:

- Paciente · Profissional · Guia · Contrato · Operadora · TISS · OCR · IA · Workflow · Storage

Esses nomes podem existir apenas como **dados** registrados via Port (nome de Entity/Schema), nunca como tipos TypeScript do módulo `enterprise/metadata`.
