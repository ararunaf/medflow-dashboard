# EPC-20 — TISS Vocabulary Architecture

**Sprint:** EPC-20 — TISS Vocabulary Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-20_TISS_VOCABULARY_FOUNDATION.md`](./EPC-20_TISS_VOCABULARY_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getTISSVocabularyHealthSummary)    │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSVocabularyPort                                   │
│  registerConcept | getConcept | listConcepts         │
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultTISSVocabularyAdapter                        │
│  MockTISSVocabularyAdapter                           │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSVocabularyStore (in-process)                     │
│  concepts + structural relationships                 │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ TISSVocabularyFactory → createTISSVocabularyPort     │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Representar conceitos semânticos permanentes | Implementar parser XML |
| Persistir em store in-process | Criar banco / migrations |
| Health / capabilities | Alterar UI / APIs |
| Relacionamentos estruturais | Executar motor de grafo |
| Preparar hooks futuros | Integrar OCR / IA / Workflow / Rules |
| Documentar integração futura | Validar guias / interpretar ANS |
| Permanecer agnóstico a versão XML | Embutir layout TISS ou operadora |

---

## 3. Fluxo canônico obrigatório

```
TISS XML / artefato de mercado
  ↓
TISS Mapping                 (futuro — adapta layout → conceitos)
  ↓
TISS Vocabulary              ← EPC-20 (esta sprint)
  ↓
Canonical Healthcare Model   (EPC-19)
  ↓
Rule Engine / Workflow / AI Auditor
```

O núcleo Enterprise **nunca** lê XML TISS bruto para decidir regras ou auditar.

---

## 4. Integração futura (FASE 9 — documentação apenas)

Nenhuma integração é implementada nesta sprint. Abaixo, o contrato conceitual.

### 4.1 TISS Mapping

- Responsável por converter elementos/layouts de **qualquer versão** TISS em `conceptCode` / `TISSConcept`.
- Mapping conhece versões XML; Vocabulary **não**.
- Saída do Mapping referencia conceitos do Vocabulário (ids/códigos), nunca o contrário.

### 4.2 Healthcare Model (EPC-19)

- Vocabulário fornece a semântica estável (`TISSConcept`).
- Healthcare Model materializa entidades de runtime (`HealthcareEntity`).
- Bind futuro: conceito do vocabulário → kind/atributos do Healthcare Model via projeção.
- EPC-20 **não** altera o Healthcare Model.

### 4.3 Rule Engine (EPC-06)

- Regras futuras avaliam fatos já projetados no Healthcare Model / atributos tipados.
- Regras **nunca** avaliam XML TISS bruto.
- Vocabulário pode ser usado para tipar fatos semânticos (prep — sem bind).

### 4.4 Workflow (EPC-05)

- Workflow orquestra estados sobre entidades canônicas.
- Conceitos do Vocabulário podem rotular gatilhos/fatos (prep — sem bind).

### 4.5 AI Auditor (EPC-18)

- Auditora consome evidências e entidades canônicas.
- Vocabulário ancora a linguagem semântica das explicações (prep — sem prompts / invoke).

### 4.6 OCR (EPC-15)

- OCR produz texto/tokens opacos.
- Um mapeador futuro pode projetar tokens → conceitos do Vocabulário → Healthcare Model.
- OCR **não** embute o Vocabulário; o bind fica em camada de projeção.

---

## 5. Multi-versão TISS

| Camada | Responsabilidade |
|--------|------------------|
| TISS XML vN | Layout / schema de mercado |
| TISS Mapping | Adaptar vN → conceitos |
| TISS Vocabulary | Conceitos permanentes (EPC-20) |
| Healthcare Model | Entidades de runtime |

Mudanças de versão TISS impactam **apenas** Mapping — nunca o Vocabulário nem o núcleo Enterprise.

---

## 6. Isolamento de produto

| Área de produto | Impacto EPC-20 |
|-----------------|----------------|
| `src/lib/tiss` | Nenhum |
| `src/lib/capture` (parser) | Nenhum |
| Rotas / UI | Nenhum |
| Server Functions / APIs | Nenhum |
| Migrations / RLS | Nenhum |
| Healthcare Model | Nenhum (sem alteração) |

---

## 7. Capabilities (exclusões explícitas)

```ts
implementsXmlParser: false
implementsTissValidation: false
implementsRules: false
knowsOperatorOrCooperative: false
independentOfXmlLayout: true
independentOfXmlVersion: true
supportsFutureMultiVersionTiss: true
```
