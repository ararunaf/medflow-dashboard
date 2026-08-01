# EPC-22 — TISS Profile Foundation

**Sprint:** EPC-22 — TISS Profile Foundation  
**Data:** 31/07/2026  
**Padrão:** ECS-01  
**Implementação:** `src/lib/enterprise/tiss-profile/`  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..21) + ECS-01  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — estrutura canônica documental TISS  
**Dependências conceituais:** TISS Vocabulary (EPC-20), TISS Mapping (EPC-21), Canonical Healthcare Model (EPC-19)

---

## 1. Objetivo

Criar exclusivamente a **infraestrutura de Profiles** da TISS.

O Profile **NÃO** representa uma guia específica.

O Profile representa um **padrão estrutural reutilizável**.

Ele informa:

- quais conceitos podem existir;
- quais conceitos são obrigatórios;
- quais são opcionais;
- quais relacionamentos são esperados;
- quais versões da TISS suportam aquele Profile.

**Sem qualquer validação.**

---

## 2. Princípio arquitetural

Toda entrada deverá seguir futuramente:

```
Origem
  ↓
Mapping
  ↓
TISS Vocabulary
  ↓
TISS Profile
  ↓
Healthcare Model
  ↓
Rule Engine
  ↓
AI Auditor
```

Nunca:

```
Origem → Rule Engine
```

---

## 3. Escopo desta sprint

### Inclui

| Item | Status |
|------|--------|
| `TISSProfilePort` | ✅ |
| `DefaultTISSProfileAdapter` (in-memory) | ✅ |
| `MockTISSProfileAdapter` | ✅ |
| `TISSProfileStore` | ✅ |
| `TISSProfileFactory` | ✅ |
| `createTISSProfilePort` (Provider) | ✅ |
| Modelos: TISSProfile / ProfileConcept / ProfileRelationship / ProfileVersion / ProfileMetadata | ✅ |
| Suporte estrutural a múltiplas versões (4.x / 5.x / proprietary) | ✅ |
| Documentação de integração futura | ✅ |
| Testes Enterprise + certificação | ✅ |

### Explicitamente fora (NÃO fazer)

- Parser XML
- OCR / AI / Rule Engine / Workflow
- Contratos / Validações / Regras de negócio
- Banco / APIs / UI / Migrations
- Alteração do Healthcare Model, Vocabulary ou Mapping

---

## 4. Arquitetura (ECS-01)

```
Application
  ↓
TISSProfilePort
  ↓
TISSProfileAdapter
  ↓
TISSProfileStore
  ↓
TISSProfileFactory
  ↓
TISSProfileProvider
```

Ver [`EPC-22_ARCHITECTURE.md`](./EPC-22_ARCHITECTURE.md).  
Ver modelos em [`EPC-22_PROFILE_MODEL.md`](./EPC-22_PROFILE_MODEL.md).

---

## 5. Superfície do Port

| Operação | Papel |
|----------|-------|
| `registerProfile()` | Upsert estrutural de Profile (+ versões / relacionamentos / metadata) |
| `getProfile()` | Leitura por id / código / nome |
| `listProfiles()` | Listagem com filtros estruturais |
| `health()` | Prontidão leve |
| `capabilities()` | Capacidades estáticas (declara o que NÃO faz) |

---

## 6. Providers suportados

| Id | Adapter |
|----|---------|
| `default` | `DefaultTISSProfileAdapter` |
| `mock` | `MockTISSProfileAdapter` |
| `test` | `MockTISSProfileAdapter` (`provider: "test"`) |

---

## 7. Integração futura (documentação apenas)

Os Profiles serão utilizados por (sem implementação nesta sprint):

| Consumidor | Uso futuro |
|------------|------------|
| **TISS Mapping** | Após mapear origem → Vocabulário, o Profile indica a estrutura documental esperada |
| **Healthcare Model** | Profile guia quais entidades canônicas o padrão documental organiza |
| **Rule Engine** | Usa Profile como referência estrutural antes de aplicar regras |
| **AI Auditor** | Explica resultados com base na estrutura do Profile |
| **OCR** | Tokens estruturados podem ser confrontados com conceitos do Profile |
| **FHIR** | Recursos mapeados convergem ao mesmo Profile estrutural |
| **DICOM** | Atributos mapeados convergem ao mesmo Profile estrutural |

Ver detalhes em [`EPC-22_ARCHITECTURE.md`](./EPC-22_ARCHITECTURE.md) § integração futura.

---

## 8. Isolamento de produto

| Área | Impacto EPC-22 |
|------|----------------|
| `src/lib/tiss` / `src/lib/capture` | Nenhum |
| Rotas / UI / APIs | Nenhum |
| Migrations / RLS | Nenhum |
| Healthcare Model / Vocabulary / Mapping | Nenhum (sem alteração) |
| Rule Engine / Workflow / AI | Nenhum |

---

## 9. Documentos relacionados

- [`EPC-22_PROFILE_MODEL.md`](./EPC-22_PROFILE_MODEL.md)
- [`EPC-22_ARCHITECTURE.md`](./EPC-22_ARCHITECTURE.md)
- [`EPC-22_CERTIFICATION.md`](./EPC-22_CERTIFICATION.md)
- [`ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md`](./ECS-01_ENTERPRISE_COMPONENT_SPECIFICATION.md)

---

## 10. Próxima etapa

Na próxima etapa (**TISS Intelligence**), esses Profiles serão utilizados como referência estrutural para que o Rule Engine aplique regras e a AI Auditora explique os resultados, mantendo a separação entre estrutura, decisão e explicação.
