# EPC-22 — TISS Profile Architecture

**Sprint:** EPC-22 — TISS Profile Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-22_TISS_PROFILE_FOUNDATION.md`](./EPC-22_TISS_PROFILE_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getTISSProfileHealthSummary)       │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSProfilePort                                      │
│  registerProfile | getProfile | listProfiles         │
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultTISSProfileAdapter                           │
│  MockTISSProfileAdapter                              │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSProfileStore (in-process)                        │
│  profiles / versions / relationships / metadata      │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSProfileFactory → createTISSProfilePort           │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Registrar Profiles estruturais | Implementar parser XML / OCR / AI |
| Persistir em store in-process | Criar banco / migrations |
| Health / capabilities | Alterar UI / APIs |
| Declarar conceitos mandatory/optional | Executar regras ou validações |
| Preparar multi-versão (rótulos) | Implementar TISS 4.x / 5.x / proprietária |
| Documentar integração futura | Integrar Mapping / FHIR / DICOM / Rule Engine |
| Referenciar Vocabulário por código | Alterar EPC-19 / EPC-20 / EPC-21 |

---

## 3. Fluxo canônico obrigatório

```
Origem
  ↓
TISS Mapping                 (EPC-21)
  ↓
TISS Vocabulary              (EPC-20)
  ↓
TISS Profile                 ← EPC-22 (esta sprint)
  ↓
Canonical Healthcare Model   (EPC-19)
  ↓
Rule Engine / AI Auditor
```

O núcleo Enterprise **nunca** aplica regras sobre dados brutos de origem sem passar por Mapping → Vocabulary → Profile → Healthcare Model.

---

## 4. Posição no pipeline Enterprise

```
TISS XML / JSON / OCR / API / CSV / FHIR / DICOM / legado
  ↓
TISS Mapping
  ↓
TISS Vocabulary
  ↓
TISS Profile                 ← estrutura documental esperada
  ↓
Canonical Healthcare Model
  ↓
Rule Engine / Workflow / AI Auditor
```

- Profile conhece **estrutura** esperada; **não** valida.
- Vocabulary permanece semântico; Mapping permanece tradutor.
- Healthcare Model permanece agnóstico à origem e ao layout.
- Rule Engine (futuro) consulta Profile como referência estrutural.

---

## 5. Integração futura (FASE 9 — documentação apenas)

Nenhuma integração é implementada nesta sprint.

| Consumidor | Como usará o Profile (futuro) |
|------------|-------------------------------|
| **TISS Mapping** | Após Field/Concept/Canonical Mapping, o resultado é confrontado com a estrutura do Profile (quais conceitos devem existir no padrão) |
| **Healthcare Model** | Profile indica quais kinds/conceitos o padrão documental organiza antes da materialização canônica |
| **Rule Engine** | Lê Profile como referência estrutural; regras operam sobre Healthcare Model, não sobre XML bruto |
| **AI Auditor** | Usa Profile para explicar o que a estrutura documental espera vs. o que foi observado |
| **OCR** | Campos/tokens do OCR Provider → Mapping → Vocabulary → alinhamento estrutural ao Profile |
| **FHIR** | Recursos FHIR mapeados convergem ao mesmo Profile estrutural |
| **DICOM** | Tags/atributos DICOM mapeados convergem ao mesmo Profile estrutural |

### Contrato conceitual comum

1. Extrator/adaptador de origem (fora do Profile) produz campos estruturados opacos.
2. **Mapping** traduz origem → Vocabulário → Healthcare blueprints.
3. **Profile** declara a estrutura documental esperada (conceitos, cardinalidade, relacionamentos).
4. **Healthcare Model** materializa entidades canônicas.
5. **Rule Engine** decide; **AI Auditor** explica — ambos usando Profile apenas como referência estrutural.

---

## 6. Multi-versão (FASE 8)

Infraestrutura preparada via:

- `ProfileVersionFamily`: `tiss-4.x` | `tiss-5.x` | `proprietary`
- `ProfileVersion` (rótulo + família)
- `TISSProfile.supportedVersionFamilies`

**Sem** implementação de qualquer versão concreta.

---

## 7. Capacidades explícitas (negativas)

O Port declara em `capabilities()`:

- `implementsXmlParser: false`
- `implementsValidation: false`
- `implementsRules: false`
- `implementsRuleEngine: false`
- `implementsWorkflow: false`
- `implementsOcr: false`
- `implementsAi: false`
- `implementsContracts: false`
- `knowsOperatorOrCooperative: false`
- `representsDocumentStructureOnly: true`

---

## 8. Aderência ECS-01

| Requisito ECS-01 | EPC-22 |
|------------------|--------|
| Port único | `TISSProfilePort` |
| Default + Mock adapters | ✅ |
| Store in-process | `DefaultTISSProfileStore` |
| Factory | `TISSProfileFactory` |
| Provider | `createTISSProfilePort` |
| Demo PoC Application | `getTISSProfileHealthSummary` |
| Testes Enterprise | `tiss-profile-engine.test.ts` |
| Docs obrigatórios | Foundation / Model / Architecture / Certification |
